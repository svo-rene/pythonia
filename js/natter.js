// Anbindung an Natter (Python-Interpreter in JavaScript, https://github.com/wi-wissen/Natter).
// Führt Karten-, Gegner- und Schmiede-Code Schritt für Schritt aus und liefert eine Spur
// (Zeile + Variablen je Schritt) für die Animation.

const NATTER_URL = 'https://cdn.jsdelivr.net/npm/@natterjs/core@0.2.0/src/browser.js';
let N = null;

export async function loadNatter() {
  if (!N) N = await import(NATTER_URL);
  return N;
}

const MAX_STEPS = 400;

function toPy(v) {
  if (Array.isArray(v)) return new N.PyList(v.map(toPy));
  return v;
}

function fromPy(v) {
  if (v instanceof N.PyList || v instanceof N.PyTuple) return v.items.map(fromPy);
  if (v instanceof N.PyFloat) return v.v;
  if (typeof v === 'bigint') return Number(v);
  if (v instanceof N.PyBuiltin || v instanceof N.PyFunction || v instanceof N.PyModule) return undefined;
  if (v === null || typeof v === 'number' || typeof v === 'string' || typeof v === 'boolean') return v;
  return undefined;
}

function errorInfo(errJson) {
  const t = N.scriptErrorText(errJson, { lang: 'de' });
  return { title: t.title, text: t.text, line: errJson.line ?? null };
}

/**
 * Führt Python aus.
 * @param {string} code
 * @param {Record<string, any>} vars  Startwerte (JS: Zahlen, Strings, Arrays)
 * @param {{ trace?: boolean, natives?: Record<string, Function> }} [opts]
 * @returns {{ ok: boolean, vars: Record<string, any>, steps: {line:number, vars:Record<string, any>}[], error: any, tooLong: boolean }}
 */
export function runPy(code, vars, opts = {}) {
  let prog;
  try {
    prog = N.compile(code);
  } catch (e) {
    if (e instanceof N.ScriptError) return { ok: false, vars: { ...vars }, steps: [], error: errorInfo(e.toJSON()), tooLong: false };
    throw e;
  }
  const globals = {};
  for (const [k, v] of Object.entries(vars)) globals[k] = toPy(v);
  const natives = {};
  for (const [name, fn] of Object.entries(opts.natives ?? {})) {
    globals[name] = new N.PyBuiltin(name);
    natives[name] = (ctx, args) => { fn(...args.map(fromPy)); return null; };
  }
  const vm = new N.VM(prog, { globals, natives, seed: 1 });
  const snapshot = () => {
    const out = {};
    for (const k of Object.keys(vars)) out[k] = fromPy(vm.globals.get(k) ?? vm.predef.get(k));
    for (const [k, v] of vm.globals) {
      if (k.startsWith('_') || k.startsWith('.') || k in out) continue;
      const c = fromPy(v);
      if (c !== undefined) out[k] = c;
    }
    return out;
  };
  const task = vm.start(null, { mode: 'step', kind: 'into' });
  const steps = [];
  let tooLong = false;
  for (let n = 0; ; n++) {
    if (n > MAX_STEPS) { tooLong = true; break; }
    const r = vm.run(task, 20000);
    if (r.status === 'paused') {
      if (opts.trace !== false) steps.push({ line: vm.lineOf(task), vars: snapshot() });
      vm.debugCommand(task, 'into');
      continue;
    }
    if (r.status === 'budget') continue;
    break;
  }
  const final = snapshot();
  if (tooLong) {
    return { ok: false, vars: final, steps, tooLong: true,
      error: { title: 'Endlosschleife', text: 'Der Code hört nicht auf. Ändert sich die Bedingung der Schleife jemals?', line: null } };
  }
  if (task.state === 'error') return { ok: false, vars: final, steps, error: errorInfo(task.error), tooLong: false };
  return { ok: true, vars: final, steps, error: null, tooLong: false };
}

// Entfernt Strings und Kommentare, damit Wortsuchen nur echten Code treffen.
function codeOnly(code) {
  return code.replace(/#.*$/gm, '').replace(/"[^"\n]*"|'[^'\n]*'/g, '""');
}

const KEYWORD_CONCEPT = { elif: 'elif', for: 'for', while: 'while' };

/**
 * Prüft vor dem Lauf: versiegelte Funktionen und noch nicht freigeschaltete Konzepte.
 * @returns {string|null} Meldung oder null
 */
export function checkCode(code, { sealed = [], unlocked = null, conceptNames = {} } = {}) {
  const c = codeOnly(code);
  for (const fn of sealed) {
    if (new RegExp(`\\b${fn}\\s*\\(`).test(c)) return `In dieser Schmiede ist ${fn}() versiegelt. Baue es mit einer Schleife selbst.`;
  }
  if (unlocked) {
    for (const [kw, concept] of Object.entries(KEYWORD_CONCEPT)) {
      if (new RegExp(`\\b${kw}\\b`).test(c) && !unlocked.includes(concept)) {
        return `Das Konzept „${conceptNames[concept] ?? kw}“ ist noch nicht freigeschaltet. Du kannst es beim Händler lernen.`;
      }
    }
  }
  return null;
}

const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

/**
 * Prüft Code gegen Testfälle: Ergebnis muss bei allen Variablen in `pruefe` mit der Musterlösung übereinstimmen.
 * @returns {{ passed: boolean, rows: {input:any, expected:any, got:any, ok:boolean, error?:any}[] }}
 */
export function runTests(code, loesung, tests, pruefe) {
  const rows = [];
  for (const t of tests) {
    const ref = runPy(loesung, t, { trace: false });
    const got = runPy(code, t, { trace: false });
    const pick = (r) => Object.fromEntries(pruefe.map((k) => [k, r.vars[k]]));
    const expected = pick(ref);
    const mine = pick(got);
    rows.push({ input: t, expected, got: mine, ok: got.ok && same(expected, mine), error: got.ok ? null : got.error });
  }
  return { passed: rows.every((r) => r.ok), rows };
}
