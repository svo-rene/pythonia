// ?-Räume: kurze Code-Rätsel (Code im Kopf verfolgen) und kleine Entscheidungen wie bei Slay the Spire.
import { CARDS, RIDDLES, CHOICE_EVENTS } from './data.js';
import { game, save, rng, pick, makeCard, conceptUnlocked } from './state.js';
import { runPy } from './natter.js';
import { app, esc, codeView, varsView, toast } from './ui.js';
import { chooseCard, cardPool } from './rooms.js';
import { offerRelic, unlockAchievement } from './relics.js';
import { tutorialRiddle } from './tutorial.js';

const FRAMES = [
  { icon: '👻', titel: 'Der Höhlengeist', text: 'Ein Geist schwebt aus der Wand. „Rechne mit mir, Lehrling, dann helfe ich dir.“' },
  { icon: '🚪', titel: 'Die Zahlentür', text: 'Eine Steintür mit Zahlenschloss. In den Stein ist Code geritzt.' },
  { icon: '🪞', titel: 'Der sprechende Spiegel', text: 'Ein Spiegel flüstert: „Sag mir, was am Ende herauskommt.“' },
  { icon: '📜', titel: 'Die alte Schriftrolle', text: 'Auf dem Boden liegt eine Schriftrolle mit einem Zauber und einer Frage.' },
];

export function eventRoom(done) {
  if (rng() < 0.7) riddleRoom(done);
  else choiceRoom(done);
}

// ---------- Rätsel ----------
function riddleRoom(done) {
  const meta = game.meta;
  meta.riddles ??= [];
  const ok = Object.keys(RIDDLES).filter((k) => conceptUnlocked(RIDDLES[k].concept));
  const fresh = ok.filter((k) => !meta.riddles.includes(k));
  const key = pick(fresh.length ? fresh : ok);
  const r = RIDDLES[key];
  const frame = pick(FRAMES);
  const res = runPy(r.code, {}, { trace: true });
  const answer = res.vars[r.var];

  app().innerHTML = `<div class="room event">
    <h2>${frame.icon} ${esc(frame.titel)}</h2>
    <p>${esc(frame.text)}</p>
    <div class="event-box">
      ${codeView(r.code)}
      <p><b>Welchen Wert hat <code>${esc(r.var)}</code> am Ende?</b></p>
      <input type="number" class="riddle-input" autofocus>
      <div class="row"><button class="btn ok">Antworten</button><button class="btn secondary leave">Weitergehen</button></div>
      <p class="hint small">Du hast nur einen Versuch. Richtig = eine Belohnung nach Wahl.</p>
    </div></div>`;
  const input = app().querySelector('.riddle-input');
  input.focus();
  const go = () => {
    if (input.value === '') return;
    const right = Number(input.value) === answer;
    if (right && !meta.riddles.includes(key)) meta.riddles.push(key);
    if (meta.riddles.length >= 5) unlockAchievement('raetselmeister');
    game.run.stats && (right ? game.run.stats.riddlesRight++ : game.run.stats.riddlesWrong++);
    save();
    showSolution(r, res, answer, right, done);
  };
  app().querySelector('.ok').addEventListener('click', go);
  input.addEventListener('keydown', (e) => { if (e.key === 'Enter') go(); });
  app().querySelector('.leave').addEventListener('click', () => done());
  tutorialRiddle();
}

/** Auflösung: die Spur Zeile für Zeile, damit man sieht, wo man sich verrechnet hat. */
function showSolution(r, res, answer, right, done) {
  const lines = r.code.split('\n');
  let prev = null;
  const rows = res.steps.slice(0, 30).map((s) => {
    const row = `<tr><td><code>${esc(lines[s.line - 1]?.trim() ?? '')}</code></td><td>${varsView(s.vars, prev)}</td></tr>`;
    prev = s.vars;
    return row;
  }).join('') + `<tr><td><b>Ende</b></td><td>${varsView(res.vars, prev)}</td></tr>`;
  app().innerHTML = `<div class="room event">
    <h2>${right ? '✔ Richtig!' : '✘ Nicht ganz'}</h2>
    <p>${right ? `<code>${esc(r.var)}</code> ist am Ende <b>${answer}</b>.` : `Richtig war <b>${answer}</b>. So läuft der Code Schritt für Schritt (vor jeder Zeile):`}</p>
    ${right ? '' : `<table class="trace">${rows}</table><p>${esc(r.erklaerung)}</p>`}
    <div class="row"><button class="btn ok">${right ? 'Belohnung wählen' : 'Weitergehen'}</button></div></div>`;
  app().querySelector('.ok').addEventListener('click', () => (right ? riddleReward(done) : done()));
}

function riddleReward(done) {
  const run = game.run;
  const upgradable = run.deck.filter((c) => !c.up && CARDS[c.id]?.up);
  app().innerHTML = `<div class="room event"><h2>Belohnung</h2><div class="choices">
    <div class="choice" data-c="gold"><div class="choice-title">💰 30 Gold</div></div>
    <div class="choice ${upgradable.length ? '' : 'disabled'}" data-c="up"><div class="choice-title">⬆ Karte verbessern</div><p>Wie am Rastplatz.</p></div>
    <div class="choice" data-c="relic"><div class="choice-title">🧿 Relikt</div><p>Wähle aus zwei Relikten.</p></div>
  </div></div>`;
  app().querySelector('[data-c="gold"]').addEventListener('click', () => { run.gold += 30; save(); done(); });
  app().querySelector('[data-c="up"]').addEventListener('click', () => {
    if (!upgradable.length) return;
    chooseCard('Welche Karte verbessern? Links vorher, rechts nachher.', upgradable, (card) => { card.up = true; save(); done(); }, { showUp: true });
  });
  app().querySelector('[data-c="relic"]').addEventListener('click', () => offerRelic(2, done));
}

// ---------- Entscheidungen ----------
function choiceRoom(done) {
  const ev = CHOICE_EVENTS[pick(Object.keys(CHOICE_EVENTS))];
  const run = game.run;
  app().innerHTML = `<div class="room event">
    <h2>${ev.icon} ${esc(ev.titel)}</h2><p>${esc(ev.text)}</p>
    <div class="choices">${ev.optionen.map((o, i) => `<div class="choice ${o.kosten?.gold > run.gold ? 'disabled' : ''}" data-o="${i}">
      <div class="choice-title">${esc(o.name)}</div><p>${esc(o.text)}</p></div>`).join('')}</div></div>`;
  app().querySelectorAll('[data-o]').forEach((b) => b.addEventListener('click', () => {
    const o = ev.optionen[Number(b.dataset.o)];
    if (o.kosten?.gold > run.gold) return;
    applyOption(o, done);
  }));
}

function applyOption(o, done) {
  const run = game.run;
  const w = o.wirkung ?? {};
  if (o.kosten?.gold) run.gold -= o.kosten.gold;
  if (o.kosten?.leben) run.hp = Math.max(1, run.hp - o.kosten.leben);
  if (w.maxLeben) { run.maxHp += w.maxLeben; run.hp += w.maxLeben; }
  if (w.heilen) run.hp = Math.min(run.maxHp, run.hp + w.heilen);
  if (w.gold) run.gold += w.gold;
  if (w.bug) { run.deck.push(makeCard(w.bug)); toast(`🐞 Eine Bug-Karte ist in dein Deck gekrochen.`, 'bad'); }
  if (w.karte) {
    const id = pick(cardPool());
    run.deck.push(makeCard(id));
    toast(`Neue Karte: <b>${esc(CARDS[id].name)}</b>`, 'good');
  }
  save();
  if (w.entfernen) {
    chooseCard('Welche Karte soll weg?', run.deck, (card) => { run.deck = run.deck.filter((c) => c !== card); save(); done(); });
    return;
  }
  if (w.relikt) { offerRelic(w.relikt, done); return; }
  done();
}

