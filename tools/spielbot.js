// Testbot: spielt Pythonia über die echte Oberfläche (Klicks), als guter oder schlechter Spieler.
// Start in der Browser-Konsole:  const b = await import('/tools/spielbot.js'); b.start('gut', 'magierin');
// Ergebnis: window.BOT.log (Ereignisse) und window.BOT.summary (Zusammenfassung).
import { game, save } from '../js/state.js';
import { FORGES, BUGS, CARDS } from '../js/data.js';
import { runPy } from '../js/natter.js';
import { _debugCombat } from '../js/combat.js';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
// Spielstärke: gut ≈ 7–8 von 10, schwach ≈ 3 von 10 (liest Code unsicher), schlecht = rein zufällig
const SKILL = { gut: 0.75, schwach: 0.3 };
const sk = () => SKILL[B.mode] ?? 0;
const smart = () => B.mode in SKILL;
const chance = (p) => Math.random() < p;
const gauss = () => Math.sqrt(-2 * Math.log(1 - Math.random())) * Math.cos(2 * Math.PI * Math.random());
const $ = (s) => document.querySelector(s);
const $$ = (s) => [...document.querySelectorAll(s)];
const rand = (a) => a[Math.floor(Math.random() * a.length)];

const B = (window.BOT = { log: [], summary: null, running: false, mode: 'gut', fights: [], rooms: [], room: null, fight: null, done: {} });

function log(type, msg, extra = {}) {
  const r = game.run;
  B.log.push({ type, msg, act: r?.act, hp: r ? `${r.hp}/${r.maxHp}` : '', gold: r?.gold, deck: r?.deck.length, lvl: r?.level, ...extra });
}

// Fehler und Meldungen mitschreiben
window.addEventListener('error', (e) => log('FEHLER', String(e.message)));
window.addEventListener('unhandledrejection', (e) => log('FEHLER', String(e.reason?.message ?? e.reason)));
new MutationObserver((ms) => {
  for (const m of ms) for (const n of m.addedNodes) if (n.classList?.contains('toast')) log('toast', n.innerText);
}).observe(document.body, { childList: true });

const codeOf = (pre) => [...pre.querySelectorAll('.ln')].map((l) => l.innerText.replace(/^\d+/, '').replace(/ /g, ' ')).join('\n');

// ---------- Kampf ----------
function simulate(dbg, uid, value = null) {
  const def = dbg.cardDef(dbg.cardByUid(uid));
  const start = dbg.baseVars();
  start.hand = dbg.C.hand.filter((u) => u !== uid).map((u) => dbg.cardDef(dbg.cardByUid(u)).name);
  const code = def.eingabe ? dbg.withInput(def.code, value) : def.code;
  const res = runPy(code, start, { natives: { ziehe: () => {} } });
  return { def, start, res };
}

function score(dbg, sim) {
  const { start, res } = sim;
  if (!res.ok) return -99;
  const v = res.vars;
  const C = dbg.C;
  const deltas = dbg.enemyDeltas(start, v);
  let dmg = 0;
  let kills = 0;
  for (const { e, d } of deltas) { dmg += Math.max(0, Math.min(d, e.hp)); if (d >= e.hp) kills++; }
  const incoming = dbg.alive().reduce((s, e) => s + (e.intent?.dmg ?? 0), 0);
  const needBlock = Math.max(0, incoming - C.block);
  const blockGain = (v.block ?? start.block) - start.block;
  const usefulBlock = Math.min(Math.max(0, blockGain), needBlock);
  const lifeDelta = (v.leben ?? start.leben) - start.leben;
  const strength = (v.staerke ?? start.staerke) - start.staerke;
  const energy = (v.energie ?? start.energie) - start.energie;
  const crystals = Array.isArray(v.kristalle) && Array.isArray(start.kristalle) ? v.kristalle.reduce((a, b) => a + b, 0) - start.kristalle.reduce((a, b) => a + b, 0) : 0;
  const d = (k) => (typeof v[k] === 'number' && typeof start[k] === 'number' ? v[k] - start[k] : 0);
  const listGain = (k) => (Array.isArray(v[k]) && Array.isArray(start[k]) ? v[k].reduce((a, b) => a + b, 0) - start[k].reduce((a, b) => a + b, 0) : 0);
  const status = (d('ziel_brand') + listGain('gegner_brand')) * 1.6 + (d('ziel_schwach') + listGain('gegner_schwach')) * 1.5 + d('ziel_verwundbar') * 2 + d('dornen') * 2.5 + (d('ziel_frost') + listGain('gegner_frost')) * 1.4 + listGain('begleiter') * 2;
  return dmg + kills * 12 + usefulBlock * 1.2 + lifeDelta * 1.1 + strength * 4 + energy * 3 + Math.max(0, crystals) * 0.7 + status;
}

async function combatTurn() {
  const dbg = _debugCombat();
  const C = dbg.C;
  if (!C || C.busy || $('.end-turn')?.disabled) return;
  const hand = [...C.hand];
  const affordable = hand.filter((u) => dbg.cardCost(dbg.cardDef(dbg.cardByUid(u))) <= C.energie && (C.zeit === undefined || dbg.estimateSteps(u) <= C.zeit));
  if (!B.fight) return;
  if (smart()) {
    const k = sk();
    // Ziel: meist der schwächste Gegner, ein unsicherer Spieler wählt öfter irgendeinen
    const live = C.enemies.map((e, i) => ({ e, i })).filter((x) => x.e.hp > 0 && !x.e.gespalten).sort((a, b) => a.e.hp - b.e.hp);
    const tgt = live.length ? (chance(0.5 + k / 2) ? live[0] : rand(live)) : null;
    if (tgt && C.target !== tgt.i) { $(`.foe[data-target="${tgt.i}"]`)?.click(); await sleep(30); }
    let best = null;
    for (const uid of affordable) {
      const def = dbg.cardDef(dbg.cardByUid(uid));
      const values = def.eingabe ? (() => { const r = dbg.inputRange(def); const a = []; for (let n = r.min; n <= r.max; n++) a.push(n); return a; })() : [null];
      for (const val of values) {
        const sim = simulate(dbg, uid, val);
        let s = score(dbg, sim) - (dbg.cardCost(def) === 0 ? 0 : 0.5);
        // Code falsch gelesen: Die Wirkung wird deutlich über- oder unterschätzt
        if (chance((1 - k) * 0.35)) s *= 0.3 + Math.random() * 1.4;
        s += gauss() * (1 - k) * 6;
        if (!best || s > best.s) best = { uid, val, s, sim };
      }
    }
    if (!best || best.s <= 0.5) { B.fight.endTurns++; $('.end-turn').click(); return; }
    const predict = C.inspired === best.uid && chance(0.4 + k * 0.6) ? best.sim : null;
    await playCard(dbg, best.uid, best.val, predict);
  } else {
    if (!affordable.length || Math.random() < 0.18) { B.fight.endTurns++; $('.end-turn').click(); return; }
    const live = C.enemies.map((e, i) => ({ e, i })).filter((x) => x.e.hp > 0 && !x.e.gespalten);
    if (live.length > 1) { $(`.foe[data-target="${rand(live).i}"]`)?.click(); await sleep(30); }
    const uid = rand(affordable);
    const def = dbg.cardDef(dbg.cardByUid(uid));
    let val = null;
    if (def.eingabe) { const r = dbg.inputRange(def); val = r.min + Math.floor(Math.random() * (r.max - r.min + 1)); }
    await playCard(dbg, uid, val, C.inspired === uid && Math.random() < 0.6 ? 'raten' : null);
  }
}

async function playCard(dbg, uid, val, predictSim) {
  B.inputValue = val;
  $(`.hand [data-card="${uid}"]`)?.click();
  await sleep(40);
  const def = dbg.cardDef(dbg.cardByUid(uid));
  B.fight.cards.push(def.name + (val !== null ? `(${val})` : ''));
  if (predictSim && $('.sel-bar .predict')) {
    if (predictSim === 'raten') B.predValue = Math.floor(Math.random() * 15);
    else {
      const right = dbg.metricValue(dbg.metricFor(def).key, predictSim.start, predictSim.res.vars);
      // Richtig vorhergesagt: gut meistens, schwach seltener (verrechnet sich um 1 bis 3)
      B.predValue = chance(sk() + 0.15) ? right : right + rand([-3, -2, -1, 1, 2, 3]);
    }
    B.fight.predictions++;
    $('.sel-bar .predict').click();
  } else {
    $('.sel-bar .play')?.click();
  }
}

// ---------- Dialoge ----------
async function handleModal(m) {
  const txt = m.innerText;
  if (m.querySelector('.quiz-input')) {
    const code = codeOf(m.querySelector('pre'));
    const name = txt.match(/Welchen Wert hat (\w+)/)?.[1];
    const right = runPy(code, {}, { trace: false }).vars[name];
    const wrongFirst = !m.dataset.tried && (B.mode === 'schlecht' || !chance(0.4 + sk() * 0.7));
    m.dataset.tried = '1';
    m.querySelector('.quiz-input').value = String(wrongFirst ? right + 1 : right);
    log('konzept', `Konzept-Quiz ${wrongFirst ? 'falsch' : 'richtig'} beantwortet`);
    m.querySelector('.ok').click();
    return;
  }
  if (m.querySelector('.pred-input')) {
    m.querySelector('.pred-input').value = String(B.predValue ?? 0);
    log('vorhersage', `Vorhersage ${B.predValue}`);
    m.querySelector('.ok').click();
    return;
  }
  if (m.querySelector('[data-n]')) {
    const btns = [...m.querySelectorAll('[data-n]')];
    const b = btns.find((x) => Number(x.dataset.n) === B.inputValue) ?? rand(btns);
    b.click();
    return;
  }
  if (m.querySelector('[data-r]')) {
    const opts = [...m.querySelectorAll('[data-r]')];
    const pick = chance(sk()) ? opts[0] : rand(opts);
    log('relikt', `Relikt gewählt: ${pick.querySelector('b')?.innerText}`);
    pick.click();
    return;
  }
  if (m.querySelector('[data-e]')) { m.querySelector('[data-e]').click(); return; }
  if (m.querySelector('[data-i]')) {
    const cards = [...m.querySelectorAll('[data-i]')];
    const names = cards.map((c) => c.querySelector('.name')?.innerText ?? '');
    let i = 0;
    if (chance(sk() + 0.1)) {
      if (/weg\?/.test(txt)) { i = names.findIndex((n) => /Zaunpfahl|Ewige|Funke$/.test(n)); if (i < 0) i = names.findIndex((n) => n === 'Schutz'); }
      else { i = names.findIndex((n) => /Salve|Kettenblitz|Streustrahl|Kristallwurf|Funke/.test(n)); }
      if (i < 0) i = 0;
    } else i = Math.floor(Math.random() * cards.length);
    log('karte', `${/weg\?/.test(txt) ? 'Entfernt' : 'Gewählt'}: ${names[i]}`);
    cards[i].click();
    return;
  }
  if (m.querySelector('[data-c]')) {
    // Level-up
    const choices = [...m.querySelectorAll('[data-c]')];
    const pick = chance(sk()) ? (choices.find((c) => c.dataset.c === 'skill') ?? choices.find((c) => c.dataset.c === 'card') ?? choices[0]) : rand(choices);
    log('levelup', `Level-up: ${pick.querySelector('.choice-title')?.innerText}`);
    pick.click();
    return;
  }
  if (m.querySelector('.ok')) { m.querySelector('.ok').click(); return; }
  if (m.querySelector('.skip')) { m.querySelector('.skip').click(); return; }
  if (m.querySelector('.cancel')) { log('auffaellig', `Unbekannter Dialog geschlossen: ${txt.slice(0, 80)}`); m.querySelector('.cancel').click(); }
}

// ---------- Räume ----------
function forgeByTitle(t) {
  return Object.entries(FORGES).find(([, f]) => f.titel === t);
}

async function forge() {
  const title = $('.forge h2')?.innerText.replace(/^⚒ Schmiede: /, '').replace(/\s*(leicht|schwer|Evolution)$/, '').trim();
  const [key, f] = forgeByTitle(title) ?? [];
  if (!f) { log('auffaellig', `Schmiede nicht erkannt: ${title}`); $('.forge .leave')?.click(); return; }
  const st = (B.done[`forge-${B.roomId}`] ??= { tries: 0 });
  st.tries++;
  window.confirm = () => true;
  if (st.tries > 6) { log('schmiede', `${title} nach ${st.tries - 1} Versuchen aufgegeben`); $('.forge .leave').click(); return; }
  if (B.mode === 'schlecht' && st.tries >= 3) { log('schmiede', `${title} aufgegeben`); $('.forge .leave').click(); return; }
  const k = sk();
  let editor = $('.forge .editor');
  // Freies Schreiben zu schwer? Ein unsicherer Spieler wechselt zum Zeilen-Ordnen
  if (editor && smart() && st.tries >= 3 && $('.forge .to-parsons')) { $('.forge .to-parsons').click(); await sleep(50); log('schmiede', `${title}: wechselt zum Zeilen-Ordnen`); editor = null; }
  // Nach Fehlversuchen manchmal einen Hinweis holen
  if (smart() && st.tries >= 2 && chance(1 - k) && $('.forge .hint-exp')) { $('.forge .hint-exp').click(); await sleep(30); st.hint = (st.hint ?? 0) + 1; }
  const p = B.mode === 'schlecht' ? 0 : Math.min(0.97, (editor ? k - 0.1 : k) + 0.18 * (st.tries - 1) + 0.15 * (st.hint ?? 0));
  const right = chance(p);
  if (editor) {
    const sol = f.loesung ?? f.zeilen.join('\n');
    const lines = sol.split('\n');
    editor.value = right ? sol : (f.falsch?.[0] && chance(0.5) ? [...lines.slice(0, -1), f.falsch[0]].join('\n') : lines.slice(0, -1).join('\n'));
    editor.dispatchEvent(new Event('input'));
  } else {
    while ($('.forge [data-out]')) { $('.forge [data-out]').click(); await sleep(20); }
    let want = [...f.zeilen];
    if (!right) {
      if (f.falsch?.length && chance(0.5)) want[want.length - 1] = f.falsch[0];
      else if (want.length > 1) { const i = Math.floor(Math.random() * (want.length - 1)); [want[i], want[i + 1]] = [want[i + 1], want[i]]; }
    }
    for (const line of want) {
      const pool = $$('.forge [data-pool]');
      const el = pool.find((q) => codeOf(q.querySelector('pre')) === line) ?? pool.find((q) => codeOf(q.querySelector('pre')).trim() === line.trim());
      if (!el) { log('auffaellig', `Schmiede ${title}: Zeile nicht gefunden: ${line}`); break; }
      el.click();
      await sleep(20);
    }
  }
  if ($('.forge .check')?.disabled) return;
  $('.forge .check').click();
  log('schmiede', `${title} (${key}) Versuch ${st.tries}: ${editor ? 'frei' : 'Zeilen'}, ${right ? 'richtig' : 'falsch'}`);
}

async function debugRoom() {
  const name = $('.debug h2')?.innerText.replace(/^🐞 Debug-Raum: /, '').trim();
  const bug = Object.values(BUGS).find((b) => b.name === name);
  const st = (B.done[`debug-${B.roomId}`] ??= { tries: 0 });
  if (B.mode === 'schlecht' || !bug || ++st.tries > 3) { log('debug', `${name}: später reparieren`); $('.debug .leave').click(); return; }
  const right = chance(sk() + 0.1 + 0.2 * (st.tries - 1));
  const ed = $('.debug .editor');
  ed.value = right ? bug.loesung : bug.code;
  ed.dispatchEvent(new Event('input'));
  $('.debug .check').click();
  log('debug', `${name}: Versuch ${st.tries} ${right ? 'repariert' : 'falsch'}`);
}

async function shop() {
  const st = (B.done[`shop-${B.roomId}`] ??= { steps: 0 });
  st.steps++;
  const run = game.run;
  if (st.steps > 8) { $('.shop .leave').click(); return; }
  if (B.mode === 'gut' || (B.mode === 'schwach' && chance(0.5))) {
    const concept = $$('.shop [data-concept]').find((b) => !b.disabled);
    if (concept && !st.concept) { st.concept = true; log('haendler', `Konzept kaufen: ${concept.closest('.offer').querySelector('b').innerText}`); concept.click(); return; }
    const relic = $('.shop .buy-relic:not([disabled])');
    if (relic && run.gold >= 90 && !st.relic) { st.relic = true; log('haendler', 'Relikt gekauft'); relic.click(); return; }
    const hasBug = run.deck.some((c) => BUGS[c.id]);
    const rem = $('.shop .remove:not([disabled])');
    if (rem && !st.removed && (hasBug || run.deck.length > 12)) { st.removed = true; rem.click(); return; }
    const heal = $('.shop .heal:not([disabled])');
    if (heal && run.hp < run.maxHp * 0.5 && !st.healed) { st.healed = true; log('haendler', 'geheilt'); heal.click(); return; }
  } else {
    const buy = $$('.shop [data-buy]').find((b) => !b.disabled);
    if (buy && !st.bought) { st.bought = true; log('haendler', `Karte gekauft: ${buy.closest('.offer').querySelector('.name')?.innerText}`); buy.click(); return; }
  }
  $('.shop .leave').click();
}

function rest() {
  const run = game.run;
  const evo = $('.rest [data-c="evo"]');
  const up = $('.rest [data-c="up"]:not(.disabled)');
  let pick;
  if (B.mode === 'schlecht') pick = $('.rest [data-c="heal"]');
  else if (run.hp < run.maxHp * (B.mode === 'schwach' ? 0.75 : 0.6)) pick = $('.rest [data-c="heal"]');
  else pick = evo ?? up ?? $('.rest [data-c="heal"]');
  log('rast', `Rastplatz: ${pick.querySelector('.choice-title').innerText}`);
  pick.click();
}

function reward() {
  const cards = $$('.reward [data-id]');
  const run = game.run;
  if (B.mode === 'gut' || (B.mode === 'schwach' && chance(0.4))) {
    const pref = ['salve', 'kettenblitz', 'streustrahl', 'kristallwurf', 'kristall', 'abwaegen', 'konter', 'wut', 'hinrichtung', 'ordnen', 'spitzenstein', 'kraftschub', 'kristallregen', 'schildwall', 'scheibe', 'doppelschlag', 'ueberladung', 'kettenschlag', 'aufladen', 'blutpakt'];
    const sorted = cards.sort((a, b) => pref.indexOf(a.dataset.id) - pref.indexOf(b.dataset.id));
    if (run.deck.length > 18 || !sorted.length) { log('belohnung', 'übersprungen'); $('.reward .skip').click(); return; }
    log('belohnung', `Karte: ${CARDS[sorted[0].dataset.id].name}`);
    sorted[0].click();
  } else {
    const c = B.mode === 'schwach' ? rand(cards) : cards[0];
    log('belohnung', `Karte: ${CARDS[c.dataset.id].name}`);
    c.click();
  }
}

function event() {
  if ($('.riddle-input')) {
    const code = codeOf($('.event-box pre'));
    const name = $('.event-box p b code').innerText;
    const right = runPy(code, {}, { trace: false }).vars[name];
    const ok = smart() && chance(B.mode === 'gut' ? 0.85 : 0.4);
    const val = ok ? right : right + rand([-2, -1, 1, 2]);
    $('.riddle-input').value = String(val);
    log('raetsel', `Rätsel (${name}): ${ok ? 'richtig' : 'falsch'}`);
    $('.event-box .ok').click();
    return;
  }
  if ($('.event [data-c="relic"]')) { (chance(sk()) ? $('.event [data-c="relic"]') : $('.event [data-c="gold"]')).click(); return; }
  const opts = $$('.event [data-o]').filter((o) => !o.classList.contains('disabled'));
  if (opts.length) {
    const pick = chance(sk()) ? (opts.find((o) => /verfüttern|Opfern|Trinken/.test(o.innerText) && game.run.hp > 25) ?? opts[0]) : rand(opts);
    log('ereignis', `${$('.event h2').innerText}: ${pick.querySelector('.choice-title').innerText}`);
    pick.click();
    return;
  }
  if ($('.event .ok')) { $('.event .ok').click(); return; }
  log('auffaellig', 'Ereignis-Bildschirm unklar');
}

function mapStep() {
  const run = game.run;
  const open = $$('.mnode.open');
  if (!open.length) { log('auffaellig', 'Karte ohne offenen Raum'); return; }
  const typ = (b) => ['kampf', 'elite', 'schmiede', 'debug', 'haendler', 'rast', 'raetsel', 'boss'].find((t) => b.classList.contains(t));
  let pick;
  if (B.mode === 'schwach') {
    // vorsichtig, wenig Planung: meidet Eliten meistens, sonst eher zufällig
    const hp = run.hp / run.maxHp;
    const safe = open.filter((b) => typ(b) !== 'elite' || hp > 0.85);
    pick = hp < 0.4 && safe.find((b) => typ(b) === 'rast') ? safe.find((b) => typ(b) === 'rast') : rand(safe.length ? safe : open);
  } else if (B.mode === 'gut') {
    const hp = run.hp / run.maxHp;
    const order = hp < 0.45 ? ['rast', 'raetsel', 'haendler', 'kampf', 'schmiede', 'debug', 'elite']
      : hp > 0.75 ? ['elite', 'schmiede', 'raetsel', 'kampf', 'haendler', 'debug', 'rast']
        : ['schmiede', 'raetsel', 'kampf', 'haendler', 'rast', 'debug', 'elite'];
    pick = open.sort((a, b) => order.indexOf(typ(a)) - order.indexOf(typ(b)))[0];
  } else pick = rand(open);
  B.roomId = pick.dataset.node;
  B.room = { typ: typ(pick), node: pick.dataset.node, act: run.act, hpVorher: run.hp };
  B.rooms.push(B.room);
  log('raum', `→ ${typ(pick)}`);
  pick.click();
}

// ---------- Hauptschleife ----------
export async function start(mode = 'gut', hero = 'magierin', { builds = null, act = 1, world = null } = {}) {
  Object.assign(B, { log: [], summary: null, running: true, mode, fights: [], rooms: [], fight: null, done: {} });
  game.meta.settings.tempo = 'turbo';
  if (builds !== null) game.meta.advanced = builds;
  game.meta.tut = { karte: true, kampf: true, schmiede: true, debug: true, raetsel: true, haendler: true, rast: true, belohnung: true, akt2: true, akt3: true, builds: true };
  game.run = null;
  save();
  window.confirm = () => true;
  location.hash = '';
  document.querySelector('#topbar .brand')?.click();
  await sleep(300);
  $('[data-a="new"]').click();
  await sleep(300);
  (world ? $(`[data-world="${world}"]`) : $(`[data-act="${act}"]`)).click();
  await sleep(300);
  $(`[data-hero="${hero}"]`).click();
  log('start', `${mode} mit ${hero}`);
  let lastSig = '';
  let same = 0;
  const t0 = Date.now();
  while (B.running) {
    await sleep(60);
    try {
      if ($('#coach')) { $('.coach-skip').click(); log('auffaellig', 'Einführung erschien trotz „gesehen“'); continue; }
      const modalEl = $('.modal-wrap .modal');
      const inCombat = !!$('.combat');
      if (inCombat && !B.fight) {
        const dbg = _debugCombat();
        B.fight = { act: game.run.act, typ: dbg.C.kind, gegner: dbg.C.enemies.map((e) => e.name).join(' + '), hpVorher: game.run.hp, cards: [], endTurns: 0, predictions: 0, regel: dbg.C.rule, t: Date.now() };
      }
      if (!inCombat && B.fight) {
        const dbg = _debugCombat();
        Object.assign(B.fight, { hpNachher: game.run?.hp ?? 0, zuege: dbg.C.turn, sieg: (game.run?.hp ?? 0) > 0, dauer: Math.round((Date.now() - B.fight.t) / 1000) });
        B.fights.push(B.fight);
        log('kampf', `${B.fight.typ}: ${B.fight.gegner} in ${B.fight.zuege} Zügen, ${B.fight.hpVorher} → ${B.fight.hpNachher} Leben`);
        B.fight = null;
      }
      if (modalEl) await handleModal(modalEl);
      else if (inCombat) await combatTurn();
      else if ($('.mnode.open')) mapStep();
      else if ($('.room.forge')) await forge();
      else if ($('.room.debug')) await debugRoom();
      else if ($('.room.shop')) await shop();
      else if ($('.room.rest')) rest();
      else if ($('.room.reward')) reward();
      else if ($('.room.event')) event();
      else if ($('.act-done')) { log('akt', $('.act-done h1').innerText); $('[data-a="go"]').click(); }
      else if ($('.title-screen h1') && /vorbei|bezwungen/.test($('.title-screen h1').innerText)) {
        B.summary = { mode, hero, ergebnis: $('.title-screen h1').innerText, text: $('.title-screen').innerText.slice(0, 900), minuten: Math.round((Date.now() - t0) / 600) / 100, kaempfe: B.fights.length, raeume: B.rooms.length };
        log('ende', B.summary.ergebnis);
        B.running = false;
        break;
      }
      const sig = document.getElementById('app').innerText.length + '|' + (modalEl?.innerText.length ?? 0) + '|' + (game.run?.hp ?? '') + '|' + (_debugCombat().C?.turn ?? '') + '|' + (_debugCombat().C?.hand.length ?? '');
      if (sig === lastSig) same++; else { same = 0; lastSig = sig; }
      if (same === 300) log('auffaellig', `Bildschirm ändert sich seit ~20 s nicht: ${document.getElementById('app').innerText.slice(0, 120).replace(/\n/g, ' ')}`);
      if (same > 900) { log('auffaellig', 'Abbruch: hängt fest'); B.running = false; }
    } catch (e) {
      log('FEHLER', `Bot: ${e.message}`);
      await sleep(300);
    }
  }
  game.meta.settings.tempo = 'normal';
  save();
  return B.summary;
}
