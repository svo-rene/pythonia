// Kleine Helfer für die Oberfläche.

export const app = () => document.getElementById('app');

export function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

const TOKEN = /(#.*$|"[^"\n]*"|'[^'\n]*'|\b\d+\b|\b(?:if|elif|else|for|in|while|and|or|not|True|False|None|def|return|import|global)\b|\b(?:range|len|ziehe|print|int|input)\b)/g;

/** Eine Zeile Python mit einfacher Syntaxfärbung. */
export function hl(line) {
  let out = '';
  let last = 0;
  for (const m of line.matchAll(TOKEN)) {
    out += esc(line.slice(last, m.index));
    const t = m[0];
    const cls = t.startsWith('#') ? 'c' : /^["']/.test(t) ? 's' : /^\d/.test(t) ? 'n' : /^(range|len|ziehe|print|int|input)$/.test(t) ? 'f' : 'k';
    out += `<span class="py-${cls}">${esc(t)}</span>`;
    last = m.index + t.length;
  }
  return out + esc(line.slice(last));
}

/** Codeblock mit Zeilennummern; aktive Zeile und Fehlerzeile werden markiert. */
export function codeView(code, { active = null, error = null, small = false } = {}) {
  const lines = code.split('\n');
  return `<pre class="code${small ? ' small' : ''}">${lines.map((l, i) => {
    const n = i + 1;
    const cls = n === error ? ' err' : n === active ? ' active' : '';
    return `<span class="ln${cls}"><i>${n}</i>${hl(l) || ' '}</span>`;
  }).join('')}</pre>`;
}

/** Variablen als Tabelle; geänderte Werte blinken. */
export function varsView(vars, prev = null, hide = []) {
  const fmt = (v) => Array.isArray(v) ? `[${v.map(fmt).join(', ')}]` : typeof v === 'string' ? `"${v}"` : String(v);
  const rows = Object.entries(vars).filter(([k]) => !hide.includes(k)).map(([k, v]) => {
    const changed = prev && fmt(prev[k]) !== fmt(v);
    return `<tr class="${changed ? 'changed' : ''}"><td>${esc(k)}</td><td>${esc(fmt(v))}</td></tr>`;
  }).join('');
  return `<table class="vars">${rows}</table>`;
}

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export function toast(msg, kind = '') {
  const t = document.createElement('div');
  t.className = `toast ${kind}`;
  t.innerHTML = msg;
  document.body.appendChild(t);
  setTimeout(() => t.classList.add('out'), 2600);
  setTimeout(() => t.remove(), 3200);
}

/** Modal-Dialog; gibt eine Funktion zum Schließen zurück. */
export function modal(html, { onClose = null, wide = false } = {}) {
  const wrap = document.createElement('div');
  wrap.className = 'modal-wrap';
  wrap.innerHTML = `<div class="modal${wide ? ' wide' : ''}">${html}</div>`;
  document.body.appendChild(wrap);
  const close = () => { wrap.remove(); onClose?.(); };
  wrap.addEventListener('click', (e) => { if (e.target === wrap && onClose) close(); });
  return { el: wrap.querySelector('.modal'), close };
}

/** Kartenansicht (Hand, Belohnung, Deck). */
export function cardView(def, { extra = '', lesehilfe = true, cls = '', cost = null } = {}) {
  const c = cost ?? def.cost;
  return `<div class="card ${def.type ?? ''} ${def.bug ? 'bug' : ''} ${def.forged ? 'forged' : ''} ${cls}" ${extra}>
    <div class="card-head"><span class="cost">${esc(c)}</span><span class="name">${esc(def.name)}</span></div>
    ${codeView(def.code, { small: true })}
    ${lesehilfe ? `<div class="card-text">${esc(def.text)}</div>` : ''}
  </div>`;
}
