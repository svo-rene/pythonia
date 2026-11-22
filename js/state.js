// Spielstand: dauerhafte Daten (meta) und der laufende Run (run). Gespeichert im Browser.
import { CARDS, BUGS, HEROES, CONCEPTS, TALENTS, MAP_PLAN, MAP_COLS, RELICS } from './data.js';

const KEY = 'zauberlehrling-v1';

export function newMeta() {
  return {
    talentPoints: 0,
    talents: [],
    concepts: Object.keys(CONCEPTS).filter((k) => CONCEPTS[k].start),
    stars: {},          // bester Stern-Stand je Schmiede
    starsCounted: 0,    // Sterne, die schon in Talentpunkte umgerechnet wurden
    runs: 0,
    wins: 0,
    settings: { lesehilfe: true, tempo: 'normal' },
    riddles: [],        // gelöste Rätsel
    book: { cards: [], relics: [], evos: [] },   // Zauberbuch: schon gesehene Dinge
    achievements: [],
    stufeMax: 0,        // höchste freigeschaltete Prüfungsstufe
  };
}

export const game = { meta: newMeta(), run: null };

export function save() {
  try { localStorage.setItem(KEY, JSON.stringify(game)); } catch { /* privat oder blockiert: Spiel läuft trotzdem */ }
}

export function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return;
    const data = JSON.parse(raw);
    game.meta = { ...newMeta(), ...data.meta, settings: { ...newMeta().settings, ...(data.meta?.settings ?? {}) } };
    game.meta.book = { ...newMeta().book, ...(data.meta?.book ?? {}) };
    game.run = data.run?.map ? data.run : null;   // Runs aus der alten Kartenversion verwerfen
    if (game.run) { game.run.relics ??= Object.keys(RELICS).filter((k) => RELICS[k].start === game.run.hero); game.run.stats ??= newStats(); game.run.stufe ??= 0; }
  } catch { /* kaputter Spielstand: neu anfangen */ }
}

export function exportCode() {
  return btoa(unescape(encodeURIComponent(JSON.stringify(game))));
}

export function importCode(code) {
  const data = JSON.parse(decodeURIComponent(escape(atob(code.trim()))));
  if (!data.meta) throw new Error('Kein Spielstand');
  game.meta = { ...newMeta(), ...data.meta };
  game.run = data.run ?? null;
  save();
}

export function resetAll() {
  game.meta = newMeta();
  game.run = null;
  save();
}

// ---------- Zufall mit Startwert (Runs sind reproduzierbar) ----------
/** Klassen-Code → Startwert. Gleicher Code = gleiche Höhle und gleiche Angebote. */
export function hashSeed(text) {
  let h = 2166136261;
  for (const ch of text.trim().toUpperCase()) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  return h | 0;
}

export function rng() {
  const r = game.run;
  r.seed = (r.seed + 0x6d2b79f5) | 0;
  let t = r.seed;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
export const pick = (arr) => arr[Math.floor(rng() * arr.length)];
export function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export const hasTalent = (id) => game.meta.talents.includes(id);
export const hasSkill = (id) => game.run?.skills.includes(id);

// ---------- Run ----------
let uidCounter = 1;
export function makeCard(id, extra = {}) {
  return { uid: `${Date.now().toString(36)}-${uidCounter++}`, id, up: false, ...extra };
}

export function newStats() {
  return { damage: 0, cardsPlayed: 0, bestHit: null, predRight: 0, predWrong: 0, riddlesRight: 0, riddlesWrong: 0, relicFires: {}, turnsTaken: 0 };
}

/** Merkt sich im Zauberbuch, dass man etwas gesehen hat. */
export function noteBook(kind, id) {
  const b = game.meta.book;
  if (!b[kind].includes(id)) b[kind].push(id);
}

export function newRun(heroId = 'magierin', { seedCode = '', stufe = 0 } = {}) {
  const hero = HEROES[heroId];
  const maxHp = hero.hp + (hasTalent('vit') ? 6 : 0);
  game.run = {
    seed: seedCode ? hashSeed(seedCode) : Math.floor(Math.random() * 2 ** 31),
    seedCode,
    stufe,
    relics: Object.keys(RELICS).filter((k) => RELICS[k].start === heroId),
    stats: newStats(),
    hero: heroId,
    map: null,
    pos: null,        // aktueller Knoten (null = Höhleneingang)
    path: [],         // besuchte Knoten
    hp: maxHp,
    maxHp,
    gold: 20,
    exp: 0,
    level: 1,
    deck: [],
    custom: {},       // geschmiedete und reparierte Karten: id → Definition
    skills: [],
    removeCount: 0,
    freeHintUsed: false,
    elitesWon: 0,
    forgesDone: [],
    pending: null,    // betretener, noch nicht abgeschlossener Knoten
    log: [],
  };
  const deck = hero.deck.map((id) => makeCard(id));
  if (hasTalent('glut1')) {
    const i = deck.findIndex((c) => c.id === 'funke');
    if (i >= 0) deck[i] = makeCard('salve');
  }
  if (stufe >= 3) deck.push(makeCard('zaunpfahl'));
  game.run.deck = deck;
  for (const c of deck) noteBook('cards', c.id);
  for (const r of game.run.relics) noteBook('relics', r);
  game.run.map = generateMap();
  game.meta.runs++;
  save();
}

/** Höhlenkarte wie bei Slay the Spire: 4 Pfade laufen von unten nach oben, ohne sich zu kreuzen. */
function generateMap() {
  const rows = MAP_PLAN.length;
  const edges = new Set();
  const used = new Set();
  for (let p = 0; p < 4; p++) {
    let c = p === 0 ? Math.floor(rng() * 2) : p === 1 ? MAP_COLS - 1 - Math.floor(rng() * 2) : Math.floor(rng() * MAP_COLS);
    used.add(`${0}-${c}`);
    for (let r = 0; r < rows - 1; r++) {
      const opts = [c - 1, c, c + 1].filter((n) => n >= 0 && n < MAP_COLS
        && !(n === c + 1 && edges.has(`${r}-${c + 1}>${r + 1}-${c}`))
        && !(n === c - 1 && edges.has(`${r}-${c - 1}>${r + 1}-${c}`)));
      const n = pick(opts);
      edges.add(`${r}-${c}>${r + 1}-${n}`);
      used.add(`${r + 1}-${n}`);
      c = n;
    }
  }
  const nodes = {};
  for (let r = 0; r < rows; r++) {
    const plan = MAP_PLAN[r];
    const ids = [...used].filter((id) => id.startsWith(`${r}-`)).sort((a, b) => Number(a.split('-')[1]) - Number(b.split('-')[1]));
    ids.forEach((id, i) => {
      const c = Number(id.split('-')[1]);
      let typ = plan.typ;
      if (plan.zufall) {
        const entries = Object.entries(plan.zufall);
        let x = rng() * entries.reduce((s, [, w]) => s + w, 0);
        typ = entries.find(([, w]) => (x -= w) < 0)?.[0] ?? entries[0][0];
      }
      const node = { id, r, c, typ, x: ((c + 0.5) / MAP_COLS) * 100 + (rng() * 8 - 4), y: rng() * 16 - 8 };
      if (typ === 'kampf') node.enc = pick(plan.pool);
      if (typ === 'elite') node.enc = 'schlange';
      nodes[id] = node;
    });
    // Schmiede-Reihen: mindestens eine Schmiede, damit man sie ansteuern kann, aber keine Pflicht
    if (plan.forges) {
      const row = ids.map((id) => nodes[id]);
      if (!row.some((n) => n.typ === 'schmiede')) {
        const n = row[Math.floor(rng() * row.length)];
        n.typ = 'schmiede';
        delete n.enc;
      }
      row.filter((n) => n.typ === 'schmiede').forEach((n, k) => { n.forge = plan.forges[k % plan.forges.length]; });
    }
  }
  nodes.boss = { id: 'boss', r: rows, c: 2, typ: 'boss', enc: 'boss', x: 50, y: 0 };
  const edgeList = [...edges].map((e) => e.split('>'));
  for (const id of Object.keys(nodes)) if (nodes[id].r === rows - 1) edgeList.push([id, 'boss']);
  return { rows: rows + 1, nodes, edges: edgeList };
}

/** Knoten, die man vom aktuellen Standort aus betreten kann. */
export function reachable() {
  const run = game.run;
  if (!run.pos) return Object.values(run.map.nodes).filter((n) => n.r === 0).map((n) => n.id);
  return run.map.edges.filter(([a]) => a === run.pos).map(([, b]) => b);
}

/** Definition einer Karte im Deck: Basiskarte, Bug oder eigene Karte, mit Upgrade. */
export function cardDef(card) {
  const base = game.run?.custom[card.id] ?? CARDS[card.id] ?? BUGS[card.id];
  if (!base) return { name: '???', cost: 0, code: 'pass', text: '' };
  if (card.up && base.up) return { ...base, ...base.up, name: base.name + '+' };
  return base;
}

export function conceptUnlocked(c) {
  return game.meta.concepts.includes(c);
}
