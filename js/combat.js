// Kartenkampf: Karten sind Python, Gegnerabsichten sind Python, beides läuft sichtbar Zeile für Zeile.
import { ENEMIES, ENCOUNTERS, BUGS, BUG_BY_NAME, HEROES } from './data.js';
import { heroSprite, enemySprite } from './sprites.js';
import { cardFx, enemyFx } from './fx.js';
import { game, save, shuffle, cardDef, hasTalent, hasSkill, makeCard } from './state.js';
import { runPy } from './natter.js';
import { app, esc, codeView, varsView, sleep, toast, modal, cardView } from './ui.js';

let C = null;          // laufender Kampf
let onEnd = null;      // Rückruf: ({ won }) => …

const HIDE_VARS = ['max_leben'];

export function startCombat(encId, kind, done) {
  onEnd = done;
  const run = game.run;
  C = {
    kind,
    enemies: ENCOUNTERS[encId].map((id) => {
      const e = ENEMIES[id];
      return { id, name: e.name, hp: e.hp, maxHp: e.hp, code: e.code, mem: { ...(e.mem ?? {}) }, intent: null, boss: e.boss, elite: e.elite };
    }),
    draw: shuffle(run.deck.map((c) => c.uid)),
    hand: [],
    discard: [],
    energie: 3,
    block: 0,
    staerke: 0,
    turn: 0,
    target: 0,
    predictionsLeft: 0,
    selected: null,
    busy: false,
    view: null,       // Anzeige während der Animation
    message: '',
    maxEnergie: 3,
    shown: { player: null, enemies: [] },   // zuletzt gezeigte Lebenswerte (für Treffer-Effekte)
  };
  if (run.hero === 'magierin') C.staerke += 1;
  if (run.hero === 'waechter') C.block += 5;
  if (hasTalent('glut2')) C.staerke += 1;
  if (hasSkill('kraftreserve')) C.staerke += 1;
  if (hasTalent('frost1')) C.block += 4;
  startTurn();
}

const cardByUid = (uid) => game.run.deck.find((c) => c.uid === uid);
const alive = () => C.enemies.filter((e) => e.hp > 0);
const speed = () => (game.meta.settings.tempo === 'schnell' ? 0.35 : 1);

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
  C.energie = 3 + (C.turn === 1 && hasSkill('fruehstart') ? 1 : 0);
  C.maxEnergie = Math.max(3, C.energie);
  if (C.turn > 1) C.block = hasTalent('frost2') ? Math.floor(C.block / 2) : 0;
  if (hasSkill('panzerhaut')) C.block += 3;
  C.predictionsLeft = 1 + (hasTalent('gel2') ? 1 : 0) + (game.run.hero === 'orakel' ? 1 : 0);
  drawCards(5 + (C.turn === 1 && hasTalent('takt2') ? 1 : 0));
  fixTarget();
  updateIntents();
  render();
}

function fixTarget() {
  if (!C.enemies[C.target] || C.enemies[C.target].hp <= 0) C.target = C.enemies.findIndex((e) => e.hp > 0);
}

// ---------- Gegner ----------
function enemyVars(e) {
  return { mein_leben: e.hp, leben: game.run.hp, block: C.block, ...e.mem };
}

/** Absicht vorab berechnen (Probelauf mit dem aktuellen Zustand). */
function updateIntents() {
  for (const e of C.enemies) {
    if (e.hp <= 0) { e.intent = null; continue; }
    const start = enemyVars(e);
    const r = runPy(e.code, start, { trace: false });
    const v = r.vars;
    const parts = [];
    const dmg = Math.max(0, start.leben - (v.leben ?? start.leben));
    if (dmg > 0) parts.push(`⚔ ${dmg} Schaden`);
    if ((v.block ?? start.block) < start.block) parts.push('⛨ zerstört deinen Block');
    if ((v.mein_leben ?? e.hp) > e.hp) parts.push(`✚ heilt ${v.mein_leben - e.hp}`);
    for (const k of Object.keys(e.mem)) {
      if (k === 'fluch') { if (v.fluch) parts.push(`🐞 legt „${v.fluch}“ in dein Deck`); continue; }
      if (k !== 'runde' && v[k] !== start[k]) parts.push(`▲ ${k} wird ${v[k]}`);
    }
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
  if (/energie\s*\+=/.test(def.code)) return { key: 'energie', frage: 'Wie viel Energie hast du danach?' };
  return { key: 'block', frage: 'Wie viel Block bekommst du dazu?' };
}

function metricValue(key, start, vars) {
  if (key === 'schaden') return enemyDeltas(start, vars).reduce((s, x) => s + Math.max(0, x.d), 0);
  if (key === 'block') return num(vars.block, start.block) - start.block;
  if (key === 'staerke') return num(vars.staerke, start.staerke);
  return num(vars.energie, start.energie);
}

async function playCard(uid, prediction = null) {
  if (C.busy) return;
  const card = cardByUid(uid);
  const def = cardDef(card);
  const cost = def.cost === 'X' ? 0 : def.cost;
  if (cost > C.energie) { toast('Nicht genug Energie.', 'bad'); return; }
  fixTarget();
  C.busy = true;
  C.selected = null;
  C.energie -= cost;
  C.hand = C.hand.filter((u) => u !== uid);
  const start = baseVars();
  start.hand = C.hand.map((u) => cardDef(cardByUid(u)).name);
  let drawn = 0;
  const res = runPy(def.code, start, { natives: { ziehe: (n) => { drawn += Math.max(0, Math.min(5, Number(n) || 0)); } } });

  // Vorhersage auswerten, bevor die Animation läuft
  let mult = 1;
  let predictionNote = '';
  if (prediction && res.ok) {
    const m = metricFor(def);
    const actual = metricValue(m.key, start, res.vars);
    if (Number(prediction.value) === actual) {
      mult = 1.5;
      predictionNote = `<b>Volltreffer!</b> Vorhersage ${actual} stimmt, Wirkung ×1,5.`;
    } else {
      predictionNote = `Vorhersage ${esc(prediction.value)}, richtig war ${actual}. Schau dir die Schritte an.`;
    }
  }

  await animate(def, start, res);
  C.discard.push(uid);

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
  applyCardResult(start, res.vars, mult);
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

function applyCardResult(start, v, mult) {
  const run = game.run;
  run.hp = Math.max(0, Math.min(run.maxHp, num(v.leben, start.leben)));
  let blockGain = num(v.block, start.block) - start.block;
  if (blockGain > 0) blockGain = Math.ceil(blockGain * mult);
  C.block = Math.max(0, start.block + blockGain);
  C.energie = Math.max(0, num(v.energie, start.energie));
  C.staerke = num(v.staerke, start.staerke);
  for (const { e, d } of enemyDeltas(start, v)) {
    const dd = d > 0 ? Math.ceil(d * mult) : d;
    e.hp = Math.max(0, Math.min(e.maxHp, e.hp - dd));
  }
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
  C.message = '';
  C.discard.push(...C.hand);
  C.hand = [];
  for (const e of C.enemies) {
    if (e.hp <= 0) continue;
    const start = enemyVars(e);
    const res = runPy(e.code, start);
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
  C.busy = false;
  if (checkEnd()) return;
  startTurn();
}

function applyEnemyResult(e, start, v) {
  const run = game.run;
  const newBlock = num(v.block, start.block);
  if (newBlock < C.block) C.block = Math.max(0, newBlock);
  const dmg = start.leben - num(v.leben, start.leben);
  if (dmg > 0) {
    const absorbed = Math.min(C.block, dmg);
    C.block -= absorbed;
    run.hp = Math.max(0, run.hp - (dmg - absorbed));
    C.message = `${esc(e.name)} trifft dich: ${dmg} Schaden${absorbed ? `, ${absorbed} davon geblockt` : ''}.`;
  }
  e.hp = Math.max(0, Math.min(e.maxHp, num(v.mein_leben, e.hp)));
  for (const k of Object.keys(e.mem)) {
    if (k === 'fluch') continue;
    if (v[k] !== undefined) e.mem[k] = v[k];
  }
  if (v.fluch) {
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
  if (alive().length === 0) {
    C.busy = true;
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
    const hp = e.hp;
    const dead = hp <= 0;
    const acting = v?.kind === 'enemy' && v.enemy === e;
    const targeted = i === C.target && !dead;
    const hit = hitInfo(C.shown.enemies[i], hp);
    C.shown.enemies[i] = hp;
    const mem = Object.keys(e.mem).filter((k) => k !== 'fluch')
      .map((k) => `<span class="mem">${esc(k)} = ${esc(e.mem[k])}</span>`).join('');
    return `<div class="fighter foe ${targeted ? 'targeted' : ''} ${dead ? 'dead' : ''} ${acting ? 'acting' : ''} ${e.boss ? 'boss' : ''} ${hit.cls}" data-target="${i}">
      <div class="over">
        ${dead ? '' : `<div class="intent">
          <div class="intent-label">Absicht${lese && e.intent ? ` · <span class="intent-sum">${esc(e.intent.summary)}</span>` : ''}</div>
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
    const cost = def.cost === 'X' ? 'X' : def.cost;
    const cant = def.cost !== 'X' && def.cost > C.energie;
    return cardView(def, { lesehilfe: lese, cls: `${cant ? 'cant' : ''} ${C.selected === uid ? 'selected' : ''}`, extra: `data-card="${uid}"`, cost });
  }).join('');

  const heroName = HEROES[run.hero]?.name ?? 'Held';
  const casting = v?.kind === 'card';
  app().innerHTML = `
  <div class="combat">
    <div class="stage ${C.kind} foes-${C.enemies.length}">
      <div class="side-panel left">${left}</div>
      <div class="fighter hero ${casting ? 'casting' : ''} ${pHit.cls}">
        <div class="over">
          <div class="hero-top">
            <div class="energy-orb" title="Energie"><b>${energieNow}</b><small>/${C.maxEnergie}</small></div>
            <div class="badges">
              <span class="badge" title="Stärke">💪 ${staerkeNow}</span>
              <span class="badge" title="Vorhersagen übrig">🔮 ${C.predictionsLeft}</span>
            </div>
          </div>
          <div class="hpline">
            ${playerBlock > 0 ? `<span class="block-badge" title="Block">⛨ ${playerBlock}</span>` : ''}
            <div class="bar"><div class="fill php" style="width:${(100 * playerHp) / run.maxHp}%"></div><span>${playerHp} / ${run.maxHp}</span></div>
          </div>
        </div>
        <div class="fig" style="${bob()}">${heroSprite(run.hero)}${pHit.pop}</div>
        <div class="fname">${esc(heroName)}</div>
      </div>
      <div class="foes">${enemies}</div>
      <div class="side-panel right">${right}</div>
    </div>
    <div class="msg">${!C.busy && C.selected ? selectedBar() : (C.message || (C.busy ? '' : 'Tippe auf einen Gegner, um ihn als Ziel zu wählen, und auf eine Karte, um sie auszuwählen.'))}</div>
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
  app().querySelector('.play')?.addEventListener('click', () => playCard(C.selected));
  app().querySelector('.predict')?.addEventListener('click', () => askPrediction(C.selected));
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
  const [l, r] = splitVars({ ...baseVars(), hand: undefined }, isFoeKey);
  delete l.hand;
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
  const cost = def.cost === 'X' ? 0 : def.cost;
  const can = cost <= C.energie;
  const m = metricFor(def);
  return `<div class="sel-bar"><b>${esc(def.name)}</b>
    <button class="btn play" ${can ? '' : 'disabled'}>Ausspielen</button>
    <button class="btn predict secondary" ${can && C.predictionsLeft > 0 ? '' : 'disabled'}>🔮 Vorhersagen</button>
    <span class="hint small">${can ? `Vorhersage: ${esc(m.frage)} Richtig = ×1,5.` : 'Zu wenig Energie.'}</span></div>`;
}

function askPrediction(uid) {
  const def = cardDef(cardByUid(uid));
  const m = metricFor(def);
  const t = C.enemies[C.target];
  const { el, close } = modal(`
    <h3>🔮 Vorhersage: ${esc(def.name)}</h3>
    ${codeView(def.code)}
    <p>${esc(m.frage)}</p>
    <p class="hint small">Ziel: ${esc(t?.name ?? '–')} · Stärke ${C.staerke} · Block ${C.block} · Energie nach dem Bezahlen ${C.energie - (def.cost === 'X' ? 0 : def.cost)}</p>
    <input type="number" class="pred-input" autofocus>
    <div class="row"><button class="btn ok">Festlegen und ausspielen</button><button class="btn secondary cancel">Abbrechen</button></div>
  `, { onClose: () => {} });
  const input = el.querySelector('.pred-input');
  input.focus();
  const go = () => {
    if (input.value === '') return;
    C.predictionsLeft--;
    close();
    playCard(uid, { value: input.value });
  };
  el.querySelector('.ok').addEventListener('click', go);
  input.addEventListener('keydown', (e) => { if (e.key === 'Enter') go(); });
  el.querySelector('.cancel').addEventListener('click', close);
}

export function rerenderCombat() { if (C) render(); }
