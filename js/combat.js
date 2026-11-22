// Kartenkampf: Karten sind Python, Gegnerabsichten sind Python, beides läuft sichtbar Zeile für Zeile.
import { ENEMIES, ENCOUNTERS, BUGS, BUG_BY_NAME, HEROES, RELICS, RULES, ZEIT_PRO_ZUG } from './data.js';
import { relicCode, showRelics, unlockAchievement } from './relics.js';
import { explainCode } from './explain.js';
import { tutorialSeen, tutorialCombat, tutorialAct2, tutorialBuilds, tutorialAct3 } from './tutorial.js';
import { heroSprite, enemySprite } from './sprites.js';
import { cardFx, enemyFx } from './fx.js';
import { game, save, shuffle, rng, cardDef, hasTalent, hasSkill, makeCard } from './state.js';
import { runPy } from './natter.js';
import { app, esc, codeView, varsView, sleep, toast, modal, cardView } from './ui.js';

let C = null;          // laufender Kampf
let onEnd = null;      // Rückruf: ({ won }) => …

const HIDE_VARS = ['max_leben'];
const STATUS_KEYS = ['wunden', 'begleiter', 'dornen', 'kombo', 'ziel_brand', 'ziel_schwach', 'ziel_verwundbar', 'ziel_frost', 'gegner_brand', 'gegner_schwach', 'gegner_frost'];

export function startCombat(encId, kind, done) {
  onEnd = done;
  const run = game.run;
  C = {
    kind,
    enemies: ENCOUNTERS[encId].map((id) => {
      const e = ENEMIES[id];
      const stufe = run.stufe ?? 0;
      const hp = Math.round(e.hp * (stufe >= 1 ? 1.15 : 1) * (e.boss && stufe >= 5 ? 1.25 : 1));
      return { id, name: e.name, hp, maxHp: hp, code: e.code, mem: JSON.parse(JSON.stringify(e.mem ?? {})), st: { brand: 0, schwach: 0, verwundbar: 0, frost: 0 }, intent: null, boss: e.boss, elite: e.elite, teilt: e.teilt };
    }),
    rule: null,       // Sonderregel (Boss immer, Elite ab Stufe 2)
    hpStart: run.hp,
    draw: shuffle(run.deck.map((c) => c.uid)),
    hand: [],
    discard: [],
    energie: 3,
    block: 0,
    staerke: 0,
    turn: 0,
    target: 0,
    inspired: null,   // Karte mit Eingebung: nur sie darf vorhergesagt werden
    selected: null,
    busy: false,
    view: null,       // Anzeige während der Animation
    message: '',
    maxEnergie: 3,
    shown: { player: null, enemies: [] },   // zuletzt gezeigte Lebenswerte (für Treffer-Effekte)
  };
  if (kind === 'boss' || (kind === 'elite' && (run.stufe ?? 0) >= 2)) {
    const keys = Object.keys(RULES);
    C.rule = keys[Math.floor(rng() * keys.length)];
  }
  C.kristalle = [];    // Akt 2: Kristall-Liste, bleibt während des Kampfs erhalten
  C.dornen = 0;        // Spielweisen: Dornen-Schaden an Angreifer
  C.combo = 0;         // Karten, die in diesem Zug schon gespielt wurden
  C.begleiter = [];    // Akt 2, Beschwörer: Begleiter greifen am Zugende mit ihrem Wert an
  C.relicMem = {};     // merk-Variable je Relikt, bleibt im Kampf erhalten
  C.relicLog = [];
  C.fired = {};
  if (hasTalent('glut2')) C.staerke += 1;
  if (hasSkill('kraftreserve')) C.staerke += 1;
  if (hasTalent('frost1')) C.block += 4;
  // Einführung: die gezeigten Karten sicher auf die Starthand legen (gezogen wird von hinten)
  const tutCards = !tutorialSeen('kampf') ? ['funke', 'schutz'] : (run.act ?? 1) >= 2 && !tutorialSeen('akt2') ? ['kristall'] : [];
  for (const id of tutCards) {
    const i = C.draw.findIndex((u) => cardByUid(u)?.id === id);
    if (i >= 0) C.draw.push(...C.draw.splice(i, 1));
  }
  runRelics('kampf_start');
  startTurn();
  if (!tutorialSeen('kampf')) setTimeout(tutorialCombat, 400);
  else if ((run.act ?? 1) >= 3 && !tutorialSeen('akt3')) setTimeout(tutorialAct3, 400);
  else if ((run.act ?? 1) >= 2 && !tutorialSeen('akt2')) setTimeout(tutorialAct2, 400);
  else if (builds() && !tutorialSeen('builds')) setTimeout(tutorialBuilds, 400);
}

/** Ruft alle Relikte eines Zeitpunkts auf, in der Reihenfolge des Spielers. Jedes sieht die Werte nach dem vorigen. */
function runRelics(hook, extra = {}) {
  const run = game.run;
  const notes = [];
  for (const id of run.relics) {
    const r = RELICS[id];
    if (!r || r.hook !== hook) continue;
    const start = { ...baseVars(), runde: C.turn, gold: run.gold, merk: C.relicMem[id] ?? 0, ...extra };
    const res = runPy(r.code, start, { trace: false });
    if (!res.ok) continue;
    const v = res.vars;
    const before = { leben: run.hp, block: C.block, energie: C.energie, staerke: C.staerke, gold: run.gold };
    const dmg = enemyDeltas(start, v).reduce((t, x) => t + Math.max(0, x.d), 0);
    applyCardResult(start, v, 1);
    run.gold = Math.max(0, num(v.gold, start.gold));
    C.relicMem[id] = num(v.merk, start.merk);
    const after = { leben: run.hp, block: C.block, energie: C.energie, staerke: C.staerke, gold: run.gold };
    const ch = Object.keys(before).filter((k) => before[k] !== after[k]).map((k) => `${k} ${before[k]} → ${after[k]}`);
    if (dmg > 0) ch.push(`${dmg} Schaden`);
    if (ch.length) {
      notes.push(`${r.icon} <b>${esc(r.name)}</b>: ${ch.join(', ')}`);
      C.fired[id] = Date.now();
      run.stats.relicFires[id] = (run.stats.relicFires[id] ?? 0) + 1;
    }
  }
  if (notes.length) C.relicLog = notes;
  return notes.length;
}

const cardByUid = (uid) => game.run.deck.find((c) => c.uid === uid);

/** Kosten einer Karte, mit Sonderregel. 'X'-Karten kosten vorab nichts. */
function cardCost(def) {
  if (def.cost === 'X') return 0;
  let c = def.cost;
  const lines = def.code.split('\n').filter((l) => l.trim()).length;
  if (C?.rule === 'if_teuer' && /\bif\b/.test(def.code)) c += 1;
  if (C?.rule === 'lang_teuer' && lines > 2) c += 1;
  return c;
}
const alive = () => C.enemies.filter((e) => e.hp > 0);
const builds = () => !!game.meta.builds;

/** Akt 3: Gefallene Spiegelschleime teilen sich in zwei halb so große, bis sie zu klein sind (wie eine Rekursion mit Abbruch). */
function splitDead() {
  let spawned = 0;
  for (const e of [...C.enemies]) {
    if (!e.teilt || e.hp > 0 || e.gespalten) continue;
    e.gespalten = true;
    const half = Math.floor(e.maxHp / 2);
    if (half < 6 || C.enemies.filter((x) => !x.gespalten).length > 5) continue;
    for (let k = 0; k < 2; k++) {
      C.enemies.push({ ...e, hp: half, maxHp: half, gespalten: false, intent: null,
        mem: JSON.parse(JSON.stringify(e.mem)), st: { brand: 0, schwach: 0, verwundbar: 0, frost: 0 } });
      spawned++;
    }
  }
  if (spawned) {
    C.message = `${C.message ? `${C.message}<br>` : ''}🪞 Ein Spiegelschleim teilt sich in zwei kleinere!`;
    fixTarget();
    updateIntents();
  }
}
/** Sind alle Gegner besiegt? Teilt vorher gefallene Spiegelschleime. */
function allDead() {
  splitDead();
  return alive().length === 0;
}   // Spielweisen (nach dem ersten Sieg über Akt 1)
const speed = () => ({ schnell: 0.35, turbo: 0.02 }[game.meta.settings.tempo] ?? 1);   // turbo: nur für den Testbot

function drawCards(n) {
  for (let i = 0; i < n; i++) {
    if (C.draw.length === 0) {
      if (C.discard.length === 0) return;
      C.draw = shuffle(C.discard);
      C.discard = [];
    }
    C.hand.push(C.draw.pop());
  }
}

function startTurn() {
  C.turn++;
  C.combo = 0;
  if ((game.run.act ?? 1) >= 2) C.zeit = ZEIT_PRO_ZUG + 10 * ((game.run.act ?? 2) - 2);   // Komplexität: Rechenschritte pro Zug, später etwas mehr
  C.energie = 3 + (C.turn === 1 && hasSkill('fruehstart') ? 1 : 0);
  C.maxEnergie = Math.max(3, C.energie);
  if (C.turn > 1) C.block = hasTalent('frost2') ? Math.floor(C.block / 2) : 0;
  if (hasSkill('panzerhaut')) C.block += 3;
  drawCards(5 + (C.turn === 1 && hasTalent('takt2') ? 1 : 0));
  fixTarget();
  updateIntents();
  if (C.turn > 1) C.relicLog = [];
  if (runRelics('zug_start')) updateIntents();
  C.inspired = null;
  const predictable = C.hand.filter((u) => !/\brandom\b/.test(cardDef(cardByUid(u)).code));
  if (predictable.length && rng() < eingebungChance()) {
    C.inspired = predictable[Math.floor(rng() * predictable.length)];
    C.message = `${C.message ? `${C.message}<br>` : ""}🔮 <b>Eingebung!</b> ${esc(cardDef(cardByUid(C.inspired)).name)} leuchtet. Sag vorher, was sie bewirkt: Stimmt es, wirkt sie doppelt.`;
  }
  render();
}

/** Chance auf eine Eingebung pro Zug: steigt mit Level, Orakel, Talent und Run-Skill. */
export function eingebungChance() {
  const run = game.run;
  let c = 0.25 + 0.05 * (run.level - 1);
  if (run.hero === 'orakel') c += 0.25;
  if (hasTalent('gel2')) c += 0.15;
  if (hasSkill('klarsicht')) c += 0.15;
  return Math.min(0.9, c);
}

function fixTarget() {
  if (!C.enemies[C.target] || C.enemies[C.target].hp <= 0) C.target = C.enemies.findIndex((e) => e.hp > 0);
}

// ---------- Gegner ----------
function enemyVars(e) {
  return { mein_leben: e.hp, leben: game.run.hp, block: C.block, ...(game.run.act >= 2 ? { kristalle: [...C.kristalle] } : {}), ...e.mem };
}

// Gleicher Startwert für Absicht und echten Zug: Würfelt ein Gegner, zeigt die Absicht den echten Wurf.
const enemySeed = (e) => C.turn * 97 + C.enemies.indexOf(e) + 1;
const fmtVal = (v) => (Array.isArray(v) ? `[${v.join(', ')}]` : String(v));

/** Absicht vorab berechnen (Probelauf mit dem aktuellen Zustand). */
function updateIntents() {
  for (const e of C.enemies) {
    if (e.hp <= 0) { e.intent = null; continue; }
    if (e.st.frost >= 5) { e.intent = { dmg: 0, summary: '❄ erstarrt: setzt diesen Zug aus' }; continue; }
    const start = enemyVars(e);
    const r = runPy(e.code, start, { trace: false, seed: enemySeed(e) });
    const v = r.vars;
    const parts = [];
    let dmg = Math.max(0, start.leben - (v.leben ?? start.leben));
    if (dmg > 0 && e.st.schwach > 0) dmg = Math.floor(dmg * 0.75);
    if (dmg > 0) parts.push(`⚔ ${dmg} Schaden${e.st.schwach > 0 ? ' (geschwächt)' : ''}`);
    if ((v.block ?? start.block) < start.block) parts.push('⛨ zerstört deinen Block');
    if ((v.mein_leben ?? e.hp) > e.hp) parts.push(`✚ heilt ${v.mein_leben - e.hp}`);
    for (const k of Object.keys(e.mem)) {
      if (k === 'fluch') { if (v.fluch) parts.push(`🐞 legt „${v.fluch}“ in dein Deck`); continue; }
      if (k !== 'runde' && JSON.stringify(v[k]) !== JSON.stringify(start[k])) parts.push(`▲ ${k} wird ${fmtVal(v[k])}`);
    }
    if (start.kristalle && JSON.stringify(v.kristalle) !== JSON.stringify(start.kristalle)) parts.push('💎 verändert deine Kristalle');
    e.intent = { dmg, summary: parts.join(' · ') || 'nichts' };
  }
}

// ---------- Karten ----------
function baseVars() {
  const t = C.enemies[C.target];
  const live = alive();
  return {
    leben: game.run.hp,
    max_leben: game.run.maxHp,
    block: C.block,
    energie: C.energie,
    staerke: C.staerke,
    ziel_leben: t ? t.hp : 0,
    ziel_angriff: t?.intent ? t.intent.dmg : 0,
    gegner_leben: live.map((e) => e.hp),
    gegner_angriff: live.map((e) => e.intent?.dmg ?? 0),
    ...(game.run.act >= 2 ? { kristalle: [...C.kristalle], begleiter: [...C.begleiter], zeit: C.zeit ?? ZEIT_PRO_ZUG } : {}),
    wunden: game.run.maxHp - game.run.hp,
    ...(builds() ? {
      dornen: C.dornen,
      ziel_brand: t ? t.st.brand : 0,
      ziel_schwach: t ? t.st.schwach : 0,
      ziel_verwundbar: t ? t.st.verwundbar : 0,
      gegner_brand: live.map((e) => e.st.brand),
      gegner_schwach: live.map((e) => e.st.schwach),
    } : {}),
    ...(game.meta.advanced ? {
      ziel_frost: t ? t.st.frost : 0,
      gegner_frost: live.map((e) => e.st.frost),
      kombo: C.combo,
    } : {}),
    hand: [],
  };
}

const num = (v, fallback) => (typeof v === 'number' && Number.isFinite(v) ? Math.round(v) : fallback);

/** Schaden je lebendem Gegner aus Start- und Endwerten (gegner_leben-Liste und ziel_leben). */
function enemyDeltas(start, vars) {
  const live = alive();
  const t = C.enemies[C.target];
  return live.map((e, i) => {
    const after = Array.isArray(vars.gegner_leben) ? num(vars.gegner_leben[i], start.gegner_leben[i]) : start.gegner_leben[i];
    let d = start.gegner_leben[i] - after;
    if (e === t) d += start.ziel_leben - num(vars.ziel_leben, start.ziel_leben);
    return { e, d };
  });
}

function metricFor(def) {
  if (def.type === 'angriff') return { key: 'schaden', frage: 'Wie viel Schaden richtet die Karte insgesamt an?' };
  if (/staerke\s*\+=/.test(def.code)) return { key: 'staerke', frage: 'Wie viel Stärke hast du danach?' };
  if (/dornen\s*\+=/.test(def.code) && !/block/.test(def.code)) return { key: 'dornen', frage: 'Wie viele Dornen hast du danach?' };
  if (/ziel_brand/.test(def.code)) return { key: 'brand', frage: 'Wie viel Brand hat das Ziel danach?' };
  if (/ziel_frost\s*\+=/.test(def.code) && def.type !== 'angriff') return { key: 'frost', frage: 'Wie viel Frost hat das Ziel danach?' };
  if (/ziel_verwundbar\s*\+=/.test(def.code)) return { key: 'verwundbar', frage: 'Wie viele Züge ist das Ziel danach verwundbar?' };
  if (/energie\s*\+=/.test(def.code)) return { key: 'energie', frage: 'Wie viel Energie hast du danach?' };
  return { key: 'block', frage: 'Wie viel Block bekommst du dazu?' };
}

function metricValue(key, start, vars) {
  if (key === 'schaden') return enemyDeltas(start, vars).reduce((s, x) => s + Math.max(0, x.d), 0);
  if (key === 'block') return num(vars.block, start.block) - start.block;
  if (key === 'staerke') return num(vars.staerke, start.staerke);
  if (key === 'dornen') return num(vars.dornen, start.dornen);
  if (key === 'brand' || key === 'verwundbar' || key === 'frost') return num(vars[`ziel_${key}`], start[`ziel_${key}`]);
  return num(vars.energie, start.energie);
}

/** Eingabe-Karten: Die input()-Zeile wird vor dem Lauf durch die gewählte Zahl ersetzt. */
const INPUT_LINE = /^(\s*)(\w+) = int\(input\(.*\)\)\s*$/m;
function withInput(code, value) {
  return code.replace(INPUT_LINE, (_, ind, name) => `${ind}${name} = ${value}`);
}

function inputRange(def) {
  const e = def.eingabe;
  const max = e.max === 'energie' ? C.energie - cardCost(def) : e.max === 'gegner' ? alive().length : e.max;
  return { min: e.min, max: Math.max(e.min, max) };
}

/** Fragt die Zahl für eine Eingabe-Karte ab. */
function askInput(uid, then) {
  const def = cardDef(cardByUid(uid));
  const { min, max } = inputRange(def);
  const frage = def.code.match(/input\("([^"]*)"\)/)?.[1] ?? 'Welche Zahl?';
  const nums = [];
  for (let n = min; n <= max; n++) nums.push(n);
  const { el, close } = modal(`
    <h3>⌨ ${esc(def.name)}</h3>
    ${codeView(def.code, { active: 1 })}
    <p><b>${esc(frage)}</b> <span class="hint small">(${min} bis ${max})</span></p>
    <div class="num-buttons">${nums.map((n) => `<button class="btn num" data-n="${n}">${n}</button>`).join('')}</div>
    <p class="hint small">Deine Zahl landet in der Variable <code>${esc(def.eingabe.var)}</code>. Danach läuft der Rest des Codes.</p>
    <div class="row"><button class="btn secondary cancel">Abbrechen</button></div>`, { onClose: () => {} });
  el.querySelectorAll('[data-n]').forEach((b) => b.addEventListener('click', () => { close(); then(Number(b.dataset.n)); }));
  el.querySelector('.cancel').addEventListener('click', close);
}

async function playCard(uid, prediction = null, eingabe = null) {
  if (C.busy) return;
  const card = cardByUid(uid);
  const def = cardDef(card);
  const cost = cardCost(def);
  if (cost > C.energie) { toast('Nicht genug Energie.', 'bad'); return; }
  if (def.eingabe && eingabe === null) { askInput(uid, (v) => playCard(uid, prediction, v)); return; }
  fixTarget();
  C.busy = true;
  C.selected = null;
  if (C.inspired === uid) C.inspired = null;
  C.energie -= cost;
  C.hand = C.hand.filter((u) => u !== uid);
  const start = baseVars();
  start.hand = C.hand.map((u) => cardDef(cardByUid(u)).name);
  const realStaerke = C.staerke;
  if (C.rule === 'staerke_null') start.staerke = 0;
  if (/\b(ablage|ziehstapel)\b/.test(def.code)) {
    start.ablage = C.discard.map((u) => cardDef(cardByUid(u)).name);
    start.ziehstapel = C.draw.map((u) => cardDef(cardByUid(u)).name);
  }
  const discardBefore = [...C.discard];
  let drawn = 0;
  const runCode = def.eingabe ? withInput(def.code, eingabe) : def.code;
  const res = runPy(runCode, start, { seed: Math.floor(rng() * 1e9) + 1, natives: { ziehe: (n) => { drawn += Math.max(0, Math.min(5, Number(n) || 0)); } } });

  // Komplexität: Reicht die Rechenzeit dieses Zugs?
  const steps = res.steps.length;
  if ((game.run.act ?? 1) >= 2 && steps > C.zeit) {
    C.energie += cost;
    C.hand.push(uid);
    C.busy = false;
    C.message = `⏱ <b>Zu wenig Rechenzeit!</b> ${esc(def.name)} bräuchte ${steps} Schritte, du hast in diesem Zug nur noch ${C.zeit}. Die Karte bleibt auf der Hand.`;
    render();
    return;
  }

  // Vorhersage auswerten, bevor die Animation läuft
  let mult = 1;
  let predictionNote = '';
  if (prediction && res.ok) {
    const m = metricFor(def);
    const actual = metricValue(m.key, start, res.vars);
    if (Number(prediction.value) === actual) {
      mult = 2;
      predictionNote = `<b>Volltreffer!</b> Vorhersage ${actual} stimmt, Wirkung ×2.`;
    } else {
      predictionNote = `Vorhersage ${esc(prediction.value)}, richtig war ${actual}. Schau dir die Schritte an.`;
    }
  }

  await animate(def, start, res);
  if (def.einmalig) (C.exhausted ??= []).push(uid);   // Einmal-Karten sind für den Rest des Kampfs weg
  else C.discard.push(uid);

  if (!res.ok) {
    C.view = null;
    if (res.tooLong) {
      C.message = '<b>Der Zauber verheddert sich!</b> Die Schleife hört nicht auf. Dein Zug endet.';
      toast('🌀 <b>Der Zauber verheddert sich!</b> Die Schleife hört nie auf, dein Zug endet.', 'bad');
      C.busy = false;
      render();
      await sleep(900);
      await endTurn();
      return;
    }
    C.message = `<b>${esc(res.error.title)}:</b> ${esc(res.error.text)} Die Karte verpufft.`;
    C.busy = false;
    render();
    return;
  }
  await cardFx(cardEffect(start, res), speed());
  trackStats(def, start, res.vars, mult, prediction);
  applyCardResult(start, res.vars, mult);
  takeFromPiles(start, res.vars, discardBefore);
  if ((game.run.act ?? 1) >= 2) C.zeit = Math.max(0, C.zeit - steps);
  C.combo++;
  if (C.rule === 'staerke_null') C.staerke = realStaerke + num(res.vars.staerke, 0);
  fixTarget();
  runRelics('karte_gespielt', { typ: def.type ?? 'skill', kosten: cost });
  drawCards(drawn);
  C.view = null;
  C.message = predictionNote;
  C.busy = false;
  updateIntents();
  if (checkEnd()) return;
  render();
}

/** Was die Karte sichtbar bewirkt: Treffer in Reihenfolge (aus der Spur), Block, Heilung, Stärkung. */
function cardEffect(start, res) {
  const live = alive();
  const hits = [];
  let prev = start;
  for (const s of [...res.steps, { vars: res.vars }]) {
    const v = s.vars;
    if (num(v.ziel_leben, 0) < num(prev.ziel_leben, 0)) hits.push(C.target);
    if (Array.isArray(v.gegner_leben) && Array.isArray(prev.gegner_leben)) {
      v.gegner_leben.forEach((x, i) => { if (x < prev.gegner_leben[i] && live[i]) hits.push(C.enemies.indexOf(live[i])); });
    }
    prev = v;
  }
  if (!hits.length) for (const { e, d } of enemyDeltas(start, res.vars)) if (d > 0) hits.push(C.enemies.indexOf(e));
  const v = res.vars;
  const dLeben = num(v.leben, start.leben) - start.leben;
  return {
    hero: game.run.hero,
    hits,
    blockGain: num(v.block, start.block) - start.block,
    heal: Math.max(0, dLeben),
    selfDamage: Math.max(0, -dLeben),
    buff: num(v.staerke, start.staerke) > start.staerke || num(v.energie, start.energie) > start.energie,
  };
}

function trackStats(def, start, v, mult, prediction) {
  const st = game.run.stats;
  st.cardsPlayed++;
  const dmg = enemyDeltas(start, v).reduce((t, x) => t + Math.max(0, Math.ceil(x.d * mult)), 0);
  st.damage += dmg;
  if (dmg > 0 && (!st.bestHit || dmg > st.bestHit.dmg)) st.bestHit = { name: def.name, code: def.code, dmg };
  if (prediction) (mult > 1 ? st.predRight++ : st.predWrong++);
  if (st.predRight >= 3) unlockAchievement('hellseher');
}

/** Archivar: pop() aus ablage oder ziehstapel holt diese Karten auf die Hand (nur Entnehmen vom Ende zählt). */
function takeFromPiles(start, v, discardBefore) {
  const popped = (before, after) => (Array.isArray(before) && Array.isArray(after) && after.length < before.length
    && after.every((x, i) => x === before[i]) ? before.length - after.length : 0);
  const fromDiscard = popped(start.ablage, v.ablage);
  if (fromDiscard) {
    const uids = discardBefore.slice(-fromDiscard);
    C.discard = C.discard.filter((u) => !uids.includes(u));
    C.hand.push(...uids.reverse());
  }
  const fromDraw = popped(start.ziehstapel, v.ziehstapel);
  for (let i = 0; i < fromDraw && C.draw.length; i++) C.hand.push(C.draw.pop());
}

/** Wie viele Schritte würde diese Karte gerade brauchen? (Schätzung mit den aktuellen Werten) */
function estimateSteps(uid) {
  const def = cardDef(cardByUid(uid));
  const start = baseVars();
  start.hand = C.hand.filter((u) => u !== uid).map((u) => cardDef(cardByUid(u)).name);
  if (/\b(ablage|ziehstapel)\b/.test(def.code)) {
    start.ablage = C.discard.map((u) => cardDef(cardByUid(u)).name);
    start.ziehstapel = C.draw.map((u) => cardDef(cardByUid(u)).name);
  }
  const code = def.eingabe ? withInput(def.code, inputRange(def).min) : def.code;
  return runPy(code, start, { seed: 1, natives: { ziehe: () => {} } }).steps.length;
}

function setKristalle(list) {
  if (Array.isArray(list)) C.kristalle = list.map((x) => num(x, 0)).slice(0, 12);
}

function applyCardResult(start, v, mult) {
  const run = game.run;
  run.hp = Math.max(0, Math.min(run.maxHp, num(v.leben, start.leben)));
  let blockGain = num(v.block, start.block) - start.block;
  if (blockGain > 0) blockGain = Math.ceil(blockGain * mult);
  C.block = Math.max(0, start.block + blockGain);
  C.energie = Math.max(0, num(v.energie, start.energie));
  C.staerke = num(v.staerke, start.staerke);
  setKristalle(v.kristalle);
  if (typeof v.zeit === 'number' && C.zeit !== undefined) C.zeit = Math.max(0, num(v.zeit, C.zeit));
  if (Array.isArray(v.begleiter)) C.begleiter = v.begleiter.map((x) => Math.max(0, num(x, 0))).slice(0, 6);
  if (builds()) {
    C.dornen = Math.max(0, num(v.dornen, start.dornen ?? 0));
    for (const [key, list] of [['brand', 'gegner_brand'], ['schwach', 'gegner_schwach'], ['verwundbar', null], ['frost', 'gegner_frost']]) {
      for (const { e, d } of statusDeltas(start, v, key, list)) e.st[key] = Math.max(0, e.st[key] + d);
    }
  }
  for (const { e, d } of enemyDeltas(start, v)) {
    const dd = d > 0 ? Math.ceil(d * mult * (e.st.verwundbar > 0 ? 1.5 : 1)) : d;
    e.hp = Math.max(0, Math.min(e.maxHp, e.hp - dd));
  }
}

/** Änderung eines Status (brand, schwach, verwundbar) je lebendem Gegner: aus der Liste und aus ziel_… */
function statusDeltas(start, v, key, listKey) {
  const live = alive();
  const t = C.enemies[C.target];
  return live.map((e, i) => {
    let d = 0;
    if (listKey && Array.isArray(v[listKey]) && Array.isArray(start[listKey])) d += num(v[listKey][i], start[listKey][i]) - start[listKey][i];
    if (e === t) d += num(v[`ziel_${key}`], start[`ziel_${key}`]) - start[`ziel_${key}`];
    return { e, d };
  });
}

/** Zeigt die Spur Schritt für Schritt: aktive Zeile, Variablen, Lebensbalken. */
async function animate(def, start, res) {
  const steps = res.steps.length ? res.steps : [{ line: 1, vars: start }];
  let prev = start;
  const shown = Math.min(steps.length, res.tooLong ? 14 : 60);
  for (let i = 0; i < shown; i++) {
    const s = steps[i];
    C.view = { kind: 'card', name: def.name, code: def.code, line: s.line, vars: s.vars, prev, start };
    render();
    prev = s.vars;
    await sleep(380 * speed());
  }
  C.view = { kind: 'card', name: def.name, code: def.code, line: null, vars: res.vars, prev, start,
    errorLine: res.ok ? null : res.error?.line };
  render();
  await sleep(450 * speed());
}

// ---------- Zugende und Gegnerzug ----------
async function endTurn() {
  if (C.busy && C.view) return;
  C.busy = true;
  C.selected = null;
  C.inspired = null;
  C.message = '';
  C.relicLog = [];
  game.run.stats.turnsTaken++;
  if (runRelics('zug_ende')) {
    updateIntents();
    if (allDead()) { C.busy = false; checkEnd(); return; }
  }
  C.discard.push(...C.hand);
  C.hand = [];
  if (C.begleiter.length) {
    let total = 0;
    for (const b of C.begleiter) {
      fixTarget();
      const t = C.enemies[C.target];
      if (!t || t.hp <= 0) break;
      const d = Math.ceil(b * (t.st.verwundbar > 0 ? 1.5 : 1));
      t.hp = Math.max(0, t.hp - d);
      total += d;
    }
    C.message = `🐺 Deine Begleiter greifen an: ${total} Schaden.`;
    render();
    await sleep(700 * speed());
    if (allDead()) { C.busy = false; checkEnd(); return; }
  }
  if (builds()) {
    const burns = [];
    for (const e of alive()) {
      if (e.st.brand <= 0) continue;
      e.hp = Math.max(0, e.hp - e.st.brand);
      burns.push(`🔥 ${esc(e.name)} brennt: −${e.st.brand}`);
      e.st.brand--;
    }
    if (burns.length) {
      C.message = burns.join(' · ');
      render();
      await sleep(700 * speed());
      if (allDead()) { C.busy = false; checkEnd(); return; }
    }
  }
  for (const e of C.enemies) {
    if (e.hp <= 0) continue;
    if (e.st.frost >= 5) {
      // Eis: erstarrt, setzt diesen Zug aus
      e.st.frost -= 5;
      C.message = `❄ ${esc(e.name)} ist erstarrt und setzt aus!`;
      render();
      await sleep(600 * speed());
      continue;
    }
    const start = enemyVars(e);
    const res = runPy(e.code, start, { seed: enemySeed(e) });
    let prev = start;
    for (const s of res.steps.slice(0, 40)) {
      C.view = { kind: 'enemy', enemy: e, name: e.name, code: e.code, line: s.line, vars: s.vars, prev, start };
      render();
      prev = s.vars;
      await sleep(260 * speed());
    }
    const ev = res.vars;
    await enemyFx(C.enemies.indexOf(e), {
      dmg: start.leben - num(ev.leben, start.leben),
      breaksBlock: C.block > 0 && num(ev.block, start.block) < start.block,
      heal: num(ev.mein_leben, e.hp) - e.hp,
      buff: Object.keys(e.mem).some((k) => k !== 'fluch' && k !== 'runde' && typeof ev[k] === 'number' && ev[k] > e.mem[k]),
    }, speed());
    applyEnemyResult(e, start, res.vars);
    C.view = null;
    render();
    await sleep(250 * speed());
    if (game.run.hp <= 0) break;
  }
  for (const e of C.enemies) {
    e.st.schwach = Math.max(0, e.st.schwach - 1);
    e.st.verwundbar = Math.max(0, e.st.verwundbar - 1);
  }
  C.busy = false;
  if (checkEnd()) return;
  startTurn();
}

function applyEnemyResult(e, start, v) {
  const run = game.run;
  const newBlock = num(v.block, start.block);
  if (newBlock < C.block) C.block = Math.max(0, newBlock);
  let dmg = start.leben - num(v.leben, start.leben);
  if (dmg > 0 && e.st.schwach > 0) dmg = Math.floor(dmg * 0.75);
  if (dmg > 0) {
    const absorbed = Math.min(C.block, dmg);
    C.block -= absorbed;
    run.hp = Math.max(0, run.hp - (dmg - absorbed));
    C.message = `${esc(e.name)} trifft dich: ${dmg} Schaden${absorbed ? `, ${absorbed} davon geblockt` : ''}${e.st.schwach > 0 ? ' (geschwächt)' : ''}.`;
  }
  e.hp = Math.max(0, Math.min(e.maxHp, num(v.mein_leben, e.hp)));
  if (dmg > 0 && C.dornen > 0 && e.hp > 0) {
    e.hp = Math.max(0, e.hp - C.dornen);
    C.message += ` 🌵 Dornen: ${C.dornen} Schaden zurück!`;
  }
  for (const k of Object.keys(e.mem)) {
    if (k === 'fluch') continue;
    if (v[k] !== undefined) e.mem[k] = v[k];
  }
  setKristalle(v.kristalle);
  if (v.fluch && !C.bugGiven) {
    C.bugGiven = true;   // höchstens eine Bug-Karte pro Kampf
    const bugId = BUG_BY_NAME[v.fluch];
    if (bugId) {
      const card = makeCard(bugId);
      run.deck.push(card);
      C.discard.push(card.uid);
      toast(`🐞 ${esc(e.name)} hat die Bug-Karte <b>${esc(BUGS[bugId].name)}</b> in dein Deck gelegt.`, 'bad');
    }
  }
}

function checkEnd() {
  if (game.run.hp <= 0) {
    C.busy = true;
    render();
    setTimeout(() => onEnd({ won: false }), 900);
    return true;
  }
  if (allDead()) {
    C.busy = true;
    runRelics('kampf_ende');
    if (game.run.hp >= C.hpStart) unlockAchievement('unverwundbar');
    if (game.run.deck.length <= 8) unlockAchievement('minimalist');
    render();
    setTimeout(() => onEnd({ won: true }), 700);
    return true;
  }
  return false;
}

// ---------- Darstellung ----------
/** Treffer erkennen: Ist das Leben seit der letzten Anzeige gesunken, wackelt die Figur. */
function hitInfo(prev, now) {
  if (prev === null || prev === undefined || now >= prev) return { cls: '', pop: '' };
  return { cls: now <= 0 ? 'hit dying' : 'hit', pop: `<span class="pop">-${prev - now}</span>` };
}

// Die Figuren wippen; die negative Verzögerung hält die Bewegung beim Neuzeichnen gleichmäßig.
const bob = () => `animation-delay:-${Math.floor(performance.now() % 2400)}ms`;

function render() {
  const run = game.run;
  const lese = game.meta.settings.lesehilfe;
  const v = C.view;
  // Die Balken zeigen den echten Zustand. Was der Code gerade rechnet, steht in der Variablentabelle;
  // wirksam wird es erst, wenn der Zauber (oder Angriff) sichtbar trifft.
  const playerHp = run.hp;
  const playerBlock = C.block;
  const energieNow = C.energie;
  const staerkeNow = C.staerke;

  const pHit = hitInfo(C.shown.player, playerHp);
  C.shown.player = playerHp;

  const enemies = C.enemies.map((e, i) => {
    if (e.gespalten) return '';   // geteilter Schleim: seine beiden Hälften stehen dahinter
    const hp = e.hp;
    const dead = hp <= 0;
    const acting = v?.kind === 'enemy' && v.enemy === e;
    const targeted = i === C.target && !dead;
    const hit = hitInfo(C.shown.enemies[i], hp);
    C.shown.enemies[i] = hp;
    const mem = Object.keys(e.mem).filter((k) => k !== 'fluch')
      .map((k) => `<span class="mem">${esc(k)} = ${esc(fmtVal(e.mem[k]))}</span>`).join('')
      + (e.st.brand ? `<span class="stat brand" title="Brand: verliert am Ende deines Zugs so viel Leben, dann −1">🔥 ${e.st.brand}</span>` : '')
      + (e.st.schwach ? `<span class="stat schwach" title="Schwach: macht 25 % weniger Schaden (noch ${e.st.schwach} Züge)">💧 ${e.st.schwach}</span>` : '')
      + (e.st.frost ? `<span class="stat frost" title="Frost: ab 5 erstarrt der Gegner und setzt einen Zug aus">❄ ${e.st.frost}/5</span>` : '')
      + (e.st.verwundbar ? `<span class="stat verwundbar" title="Verwundbar: nimmt 50 % mehr Schaden (noch ${e.st.verwundbar} Züge)">🎯 ${e.st.verwundbar}</span>` : '');
    return `<div class="fighter foe ${targeted ? 'targeted' : ''} ${dead ? 'dead' : ''} ${acting ? 'acting' : ''} ${e.boss ? 'boss' : ''} ${hit.cls}" data-target="${i}">
      <div class="over">
        ${dead ? '' : `<div class="intent">
          <div class="intent-label">Absicht${lese && e.intent ? ` · <span class="intent-sum">${esc(e.intent.summary)}</span>` : ''}<button class="ex-btn" data-explain="${i}" title="Code erklären">❓</button></div>
          ${codeView(e.code, { small: true, active: acting ? v.line : null })}</div>`}
        <div class="bar"><div class="fill hp" style="width:${(100 * hp) / e.maxHp}%"></div><span>${hp} / ${e.maxHp}</span></div>
        ${mem ? `<div class="badges">${mem}</div>` : ''}
      </div>
      <div class="fig" style="${bob()}">${enemySprite(e.id)}${hit.pop}</div>
      <div class="fname">${targeted ? '<span class="target-mark">▲</span> ' : ''}${esc(e.name)}${e.elite ? ' <small>Elite</small>' : ''}${e.boss ? ' <small>Boss</small>' : ''}${dead ? ' <small>besiegt</small>' : ''}</div>
    </div>`;
  }).join('');

  const { left, right } = sidePanels(v);

  const hand = C.hand.map((uid) => {
    const def = cardDef(cardByUid(uid));
    const cost = def.cost === 'X' ? 'X' : cardCost(def);
    const cant = def.cost !== 'X' && cost > C.energie;
    const st = (game.run.act ?? 1) >= 2 ? estimateSteps(uid) : null;
    const slow = st !== null && st > C.zeit;
    return cardView(def, { lesehilfe: lese, cls: `${cant || slow ? 'cant' : ''} ${slow ? 'slow' : ''} ${C.selected === uid ? 'selected' : ''} ${C.inspired === uid ? 'inspired' : ''}`, extra: `data-card="${uid}"${st !== null ? ` data-steps="${st}"` : ''}`, cost });
  }).join('');

  const heroName = HEROES[run.hero]?.name ?? 'Held';
  const casting = v?.kind === 'card';
  app().innerHTML = `
  <div class="combat">
    ${C.rule ? `<div class="rule-banner" title="${esc(RULES[C.rule].code)}">⚠ <b>${esc(RULES[C.rule].name)}</b> · ${esc(RULES[C.rule].text)}</div>` : ''}
    <div class="stage ${C.kind} foes-${Math.min(4, C.enemies.filter((e) => !e.gespalten).length)}">
      <div class="relic-strip">${run.relics.map((id) => `<button class="ricon ${Date.now() - (C.fired[id] ?? 0) < 1500 ? 'fired' : ''}" title="${esc(RELICS[id].name)}: ${esc(relicCode(id))}">${RELICS[id].icon}</button>`).join('')}</div>
      <div class="side-panel left">${left}</div>
      <div class="fighter hero ${casting ? 'casting' : ''} ${pHit.cls}">
        <div class="over">
          <div class="hero-top">
            <div class="energy-orb" title="Energie"><b>${energieNow}</b><small>/${C.maxEnergie}</small></div>
            <div class="badges">
              <span class="badge" title="Stärke">💪 ${staerkeNow}</span>
              ${(run.act ?? 1) >= 2 ? `<span class="badge zeit-badge" title="Rechenzeit: so viele Schritte darf dein Code in diesem Zug noch machen">⏱ ${C.zeit}</span>` : ''}
              ${builds() && C.dornen ? `<span class="badge" title="Dornen: Wer dich angreift, bekommt so viel Schaden zurück">🌵 ${C.dornen}</span>` : ''}
              <span class="badge" title="Chance auf eine Eingebung pro Zug">🔮 ${Math.round(eingebungChance() * 100)} %</span>
            </div>
          </div>
          <div class="hpline">
            ${playerBlock > 0 ? `<span class="block-badge" title="Block">⛨ ${playerBlock}</span>` : ''}
            <div class="bar"><div class="fill php" style="width:${(100 * playerHp) / run.maxHp}%"></div><span>${playerHp} / ${run.maxHp}</span></div>
          </div>
          ${C.begleiter.length ? `<div class="kristalle begleiter-row" title="Deine Liste begleiter: greifen am Ende deines Zugs an"><code>begleiter</code>${C.begleiter.map((b, i) => `<span class="kr bg"><b>🐺${b}</b><small>[${i}]</small></span>`).join('')}</div>` : ''}
          ${run.act >= 2 ? `<div class="kristalle" title="Deine Liste kristalle"><code>kristalle</code>${C.kristalle.map((k, i) => `<span class="kr"><b>${k}</b><small>[${i}]</small></span>`).join('') || '<span class="kr-empty">= [ ]</span>'}</div>` : ''}
        </div>
        <div class="fig" style="${bob()}">${heroSprite(run.hero)}${pHit.pop}</div>
        <div class="fname">${esc(heroName)}</div>
      </div>
      <div class="foes">${enemies}</div>
      <div class="side-panel right">${right}</div>
    </div>
    <div class="msg">${!C.busy && C.selected ? selectedBar() : (C.message || (C.busy ? '' : 'Tippe auf einen Gegner, um ihn als Ziel zu wählen, und auf eine Karte, um sie auszuwählen.'))}
      ${C.relicLog.length ? `<div class="relic-log">${C.relicLog.join(' · ')}</div>` : ''}</div>
    <div class="hand-row">
      <div class="pile" title="Ziehstapel"><b>${C.draw.length}</b><small>Ziehstapel</small></div>
      <div class="hand">${hand || '<div class="empty-hand">Keine Karten auf der Hand.</div>'}</div>
      <div class="hand-right">
        <button class="btn end-turn" ${C.busy ? 'disabled' : ''}>Zug beenden</button>
        <div class="pile" title="Ablagestapel"><b>${C.discard.length}</b><small>Ablage · Zug ${C.turn}</small></div>
      </div>
    </div>
  </div>`;

  if (C.busy) return;
  app().querySelectorAll('[data-target]').forEach((el) => el.addEventListener('click', () => {
    const i = Number(el.dataset.target);
    if (C.enemies[i].hp > 0) { C.target = i; render(); }
  }));
  app().querySelectorAll('[data-card]').forEach((el) => el.addEventListener('click', () => {
    C.selected = C.selected === el.dataset.card ? null : el.dataset.card;
    render();
  }));
  app().querySelector('.end-turn')?.addEventListener('click', () => endTurn());
  app().querySelectorAll('.ricon').forEach((b) => b.addEventListener('click', () => showRelics(render)));
  app().querySelector('.play')?.addEventListener('click', () => playCard(C.selected));
  app().querySelector('.predict')?.addEventListener('click', () => {
    const uid = C.selected;
    if (cardDef(cardByUid(uid)).eingabe) askInput(uid, (v) => askPrediction(uid, v));
    else askPrediction(uid);
  });
  app().querySelector('.explain')?.addEventListener('click', () => {
    const def = cardDef(cardByUid(C.selected));
    explainCode(def.name, def.code, { ...baseVars(), hand: C.hand.filter((u) => u !== C.selected).map((u) => cardDef(cardByUid(u)).name) });
  });
  app().querySelectorAll('[data-explain]').forEach((b) => b.addEventListener('click', (ev) => {
    ev.stopPropagation();
    const e = C.enemies[Number(b.dataset.explain)];
    explainCode(e.name, e.code, enemyVars(e));
  }));
}

// Variablen der Gegnerseite: Sie stehen rechts neben den Gegnern, alles andere links neben dem Helden.
const isFoeKey = (k) => k.startsWith('ziel_') || k.startsWith('gegner_');
const HERO_KEYS_IN_ENEMY_CODE = ['leben', 'block'];

function splitVars(vars, foeSide) {
  const l = {}, r = {};
  for (const [k, val] of Object.entries(vars ?? {})) (foeSide(k) ? r : l)[k] = val;
  return [l, r];
}

/** Linke Tafel: deine Werte (und der Zauber, der gerade läuft). Rechte Tafel: die Werte der Gegner. */
function sidePanels(v) {
  if (v?.kind === 'card') {
    const [l, r] = splitVars(v.vars, isFoeKey);
    const [pl, pr] = splitVars(v.prev, isFoeKey);
    return {
      left: `<div class="run-panel"><div class="panel-title">Zauber: ${esc(v.name)}</div>
        ${codeView(v.code, { small: true, active: v.line, error: v.errorLine })}
        <div class="panel-title">Deine Werte</div>${varsView(l, v.prev ? pl : null, HIDE_VARS)}</div>`,
      right: `<div class="run-panel"><div class="panel-title">Gegner-Werte</div>${varsView(r, v.prev ? pr : null, HIDE_VARS)}</div>`,
    };
  }
  if (v?.kind === 'enemy') {
    const foeSide = (k) => !HERO_KEYS_IN_ENEMY_CODE.includes(k);
    const [l, r] = splitVars(v.vars, foeSide);
    const [pl, pr] = splitVars(v.prev, foeSide);
    return {
      left: `<div class="run-panel"><div class="panel-title">Deine Werte</div>${varsView(l, v.prev ? pl : null, HIDE_VARS)}</div>`,
      right: `<div class="run-panel"><div class="panel-title">${esc(v.name)} rechnet</div>${varsView(r, v.prev ? pr : null, HIDE_VARS)}</div>`,
    };
  }
  // In der Ruhe-Ansicht nur Statuswerte zeigen, die gerade etwas bedeuten (nicht 0)
  const idle = { ...baseVars() };
  delete idle.hand;
  for (const k of STATUS_KEYS) {
    const val = idle[k];
    if (val === 0 || (Array.isArray(val) && val.every((x) => x === 0))) delete idle[k];
  }
  const [l, r] = splitVars(idle, isFoeKey);
  const t = C.enemies[C.target];
  return {
    left: `<div class="run-panel"><div class="panel-title">Deine Werte</div>${varsView(l, null, HIDE_VARS)}</div>`,
    right: `<div class="run-panel"><div class="panel-title">Gegner-Werte</div>${varsView(r, null, HIDE_VARS)}
      <p class="hint small">ziel = <b>${esc(t?.name ?? '–')}</b></p></div>`,
  };
}

/** Leiste unter der Bühne, wenn eine Karte ausgewählt ist. */
function selectedBar() {
  const def = cardDef(cardByUid(C.selected));
  const cost = cardCost(def);
  const can = cost <= C.energie;
  const m = metricFor(def);
  return `<div class="sel-bar"><b>${esc(def.name)}</b>
    <button class="btn play" ${can ? '' : 'disabled'}>Ausspielen${def.eingabe ? ' ⌨' : ''}</button>
    ${C.inspired === C.selected ? `<button class="btn predict" ${can ? '' : 'disabled'}>🔮 Vorhersagen</button>` : ''}
    <button class="btn secondary explain" title="Code Zeile für Zeile erklären">❓ Erklären</button>
    <span class="hint small">${!can ? 'Zu wenig Energie.' : C.inspired === C.selected ? `Eingebung: ${esc(m.frage)} Richtig = ×2.` : def.eingabe ? 'Beim Ausspielen tippst du eine Zahl ein.' : ''}</span></div>`;
}

function askPrediction(uid, eingabe = null) {
  const def = cardDef(cardByUid(uid));
  const m = metricFor(def);
  const t = C.enemies[C.target];
  const { el, close } = modal(`
    <h3>🔮 Vorhersage: ${esc(def.name)}</h3>
    ${codeView(def.code)}
    ${eingabe !== null ? `<p>Deine Eingabe: <code>${esc(def.eingabe.var)} = ${eingabe}</code></p>` : ''}
    <p>${esc(m.frage)}</p>
    <p class="hint small">Ziel: ${esc(t?.name ?? '–')} · Stärke ${C.staerke} · Block ${C.block} · Energie nach dem Bezahlen ${C.energie - cardCost(def)}</p>
    <input type="number" class="pred-input" autofocus>
    <div class="row"><button class="btn ok">Festlegen und ausspielen</button><button class="btn secondary cancel">Abbrechen</button></div>
  `, { onClose: () => {} });
  const input = el.querySelector('.pred-input');
  input.focus();
  const go = () => {
    if (input.value === '') return;
    C.inspired = null;
    close();
    playCard(uid, { value: input.value }, eingabe);
  };
  el.querySelector('.ok').addEventListener('click', go);
  input.addEventListener('keydown', (e) => { if (e.key === 'Enter') go(); });
  el.querySelector('.cancel').addEventListener('click', close);
}

export function rerenderCombat() { if (C) render(); }

/** Nur für Tests (tools/spielbot.js): Einblick in den laufenden Kampf. */
export function _debugCombat() {
  return { C, baseVars, cardDef, cardByUid, cardCost, metricFor, metricValue, withInput, inputRange, enemyDeltas, alive, estimateSteps };
}
