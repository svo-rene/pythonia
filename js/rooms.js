// Räume außerhalb des Kampfs: Schmiede, Debug-Raum, Händler, Rastplatz, Belohnung, Level-up.
import { CARDS, BUGS, FORGES, CONCEPTS, RUN_SKILLS, EXP_PER_LEVEL, EVOLUTIONS } from './data.js';
import { game, save, shuffle, pick, rng, cardDef, hasTalent, makeCard, conceptUnlocked, noteBook } from './state.js';
import { relicPool, relicView, gainRelic, offerRelic, unlockAchievement } from './relics.js';
import { tutorialForge, tutorialDebug, tutorialShop, tutorialRest, tutorialReward } from './tutorial.js';
import { runTests, checkCode, runPy } from './natter.js';
import { app, esc, codeView, toast, modal, cardView } from './ui.js';

const lese = () => game.meta.settings.lesehilfe;

// ---------- gemeinsame Teile ----------
export function cardPool() {
  return Object.keys(CARDS).filter((id) => conceptUnlocked(CARDS[id].concept) && id !== 'funke' && id !== 'schutz');
}

function fmtVal(v) {
  return Array.isArray(v) ? `[${v.map(fmtVal).join(', ')}]` : v === undefined ? '–' : String(v);
}
const fmtObj = (o) => Object.entries(o).map(([k, v]) => `${k} = ${fmtVal(v)}`).join('<br>');

function testsTable(tests, result = null) {
  const rows = (result ? result.rows : tests.map((t) => ({ input: t }))).map((r) => `
    <tr class="${result ? (r.ok ? 'pass' : 'fail') : ''}">
      <td>${fmtObj(r.input)}</td>
      ${result ? `<td>${fmtObj(r.expected)}</td><td>${r.error ? `<b>${esc(r.error.title)}</b><br>${esc(r.error.text)}` : fmtObj(r.got)}</td><td>${r.ok ? '✔' : '✘'}</td>` : ''}
    </tr>`).join('');
  return `<table class="tests"><tr><th>Startwerte</th>${result ? '<th>Erwartet</th><th>Dein Ergebnis</th><th></th>' : ''}</tr>${rows}</table>`;
}

/** Hinweise: kosten 5 EXP von der Belohnung oder 20 Gold. Der erste ist mit dem Talent „Gute Frage“ frei. */
function hintBox(state, hints) {
  const shown = hints.slice(0, state.hintsShown).map((h, i) => `<div class="hint-item"><b>Hinweis ${i + 1}:</b> ${h.includes('\n') ? codeView(h, { small: true }) : esc(h)}</div>`).join('');
  const more = state.hintsShown < hints.length;
  const free = hasTalent('gel1') && !game.run.freeHintUsed;
  const canAsk = state.attempts > 0;
  return `<div class="hints">${shown}
    ${more ? (canAsk
      ? `<div class="row">${free ? '<button class="btn secondary hint-free">Hinweis (kostenlos)</button>'
        : `<button class="btn secondary hint-exp">Hinweis (−5 EXP)</button><button class="btn secondary hint-gold" ${game.run.gold >= 20 ? '' : 'disabled'}>Hinweis (20 Gold)</button>`}</div>`
      : '<p class="hint small">Hinweise gibt es nach deinem ersten Prüfen.</p>') : ''}</div>`;
}

function wireHints(el, state, rerender) {
  el.querySelector('.hint-free')?.addEventListener('click', () => { game.run.freeHintUsed = true; state.hintsShown++; rerender(); });
  el.querySelector('.hint-exp')?.addEventListener('click', () => { state.hintsShown++; state.expPenalty += 5; state.hintsPaid++; rerender(); });
  el.querySelector('.hint-gold')?.addEventListener('click', () => { game.run.gold -= 20; state.hintsShown++; state.hintsPaid++; rerender(); });
}

/** Denkpause nach drei schnellen Fehlversuchen. */
function cooldown(state) {
  const now = Date.now();
  state.fails = state.fails.filter((t) => now - t < 30000);
  if (state.fails.length >= 3) {
    state.pauseUntil = now + 10000;
    state.fails = [];
  }
}

function editorWire(ta) {
  ta.addEventListener('keydown', (e) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const s = ta.selectionStart;
      ta.value = ta.value.slice(0, s) + '    ' + ta.value.slice(ta.selectionEnd);
      ta.selectionStart = ta.selectionEnd = s + 4;
    }
  });
}

function addExp(amount, done) {
  const run = game.run;
  run.exp += amount;
  levelUps(done);
}

function levelUps(done) {
  const run = game.run;
  if (run.exp < EXP_PER_LEVEL) { save(); done(); return; }
  run.exp -= EXP_PER_LEVEL;
  run.level++;
  const cardId = pick(cardPool());
  const skills = Object.keys(RUN_SKILLS).filter((s) => !run.skills.includes(s));
  const skill = skills.length ? pick(skills) : null;
  const { el, close } = modal(`
    <h2>Level ${run.level}!</h2><p>Wähle eine Belohnung:</p>
    <div class="choices">
      <div class="choice" data-c="card"><div class="choice-title">Neue Karte</div>${cardView(CARDS[cardId], { lesehilfe: true })}</div>
      ${skill ? `<div class="choice" data-c="skill"><div class="choice-title">Run-Skill: ${esc(RUN_SKILLS[skill].name)}</div><p>${esc(RUN_SKILLS[skill].text)}</p></div>` : ''}
      <div class="choice" data-c="hp"><div class="choice-title">Zähigkeit</div><p>+8 maximales Leben, und du heilst um 8.</p></div>
    </div>`, { wide: true });
  el.querySelectorAll('[data-c]').forEach((c) => c.addEventListener('click', () => {
    const k = c.dataset.c;
    if (k === 'card') { run.deck.push(makeCard(cardId)); noteBook('cards', cardId); }
    if (k === 'skill') run.skills.push(skill);
    if (k === 'hp') { run.maxHp += 8; run.hp += 8; }
    close();
    levelUps(done);
  }));
}

function awardStars(key, stars) {
  const meta = game.meta;
  meta.stars[key] = Math.max(meta.stars[key] ?? 0, stars);
  const total = Object.values(meta.stars).reduce((s, n) => s + n, 0);
  const earned = Math.floor(total / 5) - Math.floor(meta.starsCounted / 5);
  if (earned > 0) {
    meta.talentPoints += earned;
    toast(`+${earned} Talentpunkt durch Schmiede-Sterne!`, 'good');
  }
  meta.starsCounted = Math.max(meta.starsCounted, total);
}

// ---------- Schmiede ----------
export function forgeRoom(key, done) {
  const f = FORGES[key];
  const missing = (f.konzepte ?? []).filter((c) => !conceptUnlocked(c));
  const st = {
    mode: f.modus === 'frei' && missing.length === 0 ? 'frei' : 'parsons',
    code: f.vorlage ?? '',
    pool: shuffle([...f.zeilen, ...(f.falsch ?? [])]),
    placed: [],
    attempts: 0, hintsShown: 0, hintsPaid: 0, expPenalty: 0, fails: [], pauseUntil: 0,
    result: null, error: null,
  };
  const loesung = f.loesung ?? f.zeilen.join('\n');
  const render = () => {
    const paused = Date.now() < st.pauseUntil;
    const vars = Object.keys(f.tests[0]);
    app().innerHTML = `<div class="room forge">
      <h2>⚒ Schmiede: ${esc(f.titel)} <small class="tag">${f.stufe}</small></h2>
      <div class="cols">
        <div class="col">
          <div class="auftrag"><b>Auftrag:</b> ${esc(f.auftrag)}</div>
          <p class="hint">Variablen, die dein Code bekommt: ${vars.map((v) => `<code>${esc(v)}</code>`).join(', ')}.
          Wenn alle Tests stimmen, wird dein Code zur Karte <b>${esc(f.karte.name)}</b> und läuft im Kampf genau so.</p>
          ${f.modus === 'frei' && missing.length ? `<p class="warn">Für das freie Schreiben fehlt dir: ${missing.map((c) => esc(CONCEPTS[c].name)).join(', ')} (beim Händler). Du kannst die Zeilen ordnen, das gibt weniger EXP.</p>` : ''}
          ${st.mode === 'parsons' ? parsonsView(st) : `
            <textarea class="editor" spellcheck="false" rows="8">${esc(st.code)}</textarea>
            ${f.maxZeilen ? `<p class="hint small">3. Stern: höchstens ${f.maxZeilen} Zeilen Code.</p>` : ''}`}
          <div class="row">
            <button class="btn check" ${paused ? 'disabled' : ''}>${paused ? 'Kurze Denkpause …' : 'Prüfen'}</button>
            ${f.modus === 'frei' && st.mode === 'frei' ? '<button class="btn secondary to-parsons">Zu schwer? Zeilen ordnen (weniger EXP)</button>' : ''}
            <button class="btn secondary leave">Schmiede verlassen</button>
          </div>
          ${paused ? '<p class="warn">Drei Fehlversuche kurz hintereinander. Lies in Ruhe den ersten fehlgeschlagenen Test: Was hast du erwartet, was kam heraus?</p>' : ''}
          ${st.error ? `<p class="warn">${esc(st.error)}</p>` : ''}
          ${hintBox(st, f.hinweise)}
        </div>
        <div class="col">
          <div class="panel-title">Tests</div>
          ${testsTable(f.tests, st.result)}
        </div>
      </div></div>`;
    const el = app();
    const ta = el.querySelector('.editor');
    if (ta) { editorWire(ta); ta.addEventListener('input', () => { st.code = ta.value; }); }
    wireParsons(el, st, render);
    wireHints(el, st, render);
    el.querySelector('.to-parsons')?.addEventListener('click', () => { st.mode = 'parsons'; st.result = null; render(); });
    el.querySelector('.leave').addEventListener('click', () => {
      if (confirm('Schmiede ohne Karte verlassen?')) done();
    });
    el.querySelector('.check').addEventListener('click', () => {
      const code = st.mode === 'parsons' ? st.placed.join('\n') : st.code;
      st.error = null;
      if (!code.trim() || code.replace(/#.*$/gm, '').trim() === '') { st.error = 'Noch kein Code.'; render(); return; }
      const problem = checkCode(code, {
        sealed: f.versiegelt ?? [],
        unlocked: st.mode === 'frei' ? game.meta.concepts : null,
        conceptNames: Object.fromEntries(Object.entries(CONCEPTS).map(([k, c]) => [k, c.name])),
      });
      st.attempts++;
      if (problem) { st.error = problem; st.result = null; render(); return; }
      st.result = runTests(code, loesung, f.tests, f.pruefe);
      if (!st.result.passed) {
        st.fails.push(Date.now());
        cooldown(st);
        render();
        if (st.pauseUntil > Date.now()) setTimeout(render, st.pauseUntil - Date.now() + 50);
        return;
      }
      finishForge(key, f, st, code, done);
    });
  };
  render();
  tutorialForge(st.mode);
}

function parsonsView(st) {
  return `<div class="parsons">
    <div><div class="panel-title">Zeilen (antippen zum Einfügen)</div>
      ${st.pool.map((l, i) => `<div class="pline" data-pool="${i}">${codeView(l, { small: true })}</div>`).join('') || '<p class="hint small">Alle Zeilen verwendet.</p>'}</div>
    <div><div class="panel-title">Dein Programm</div>
      ${st.placed.map((l, i) => `<div class="pline placed">${codeView(l, { small: true })}
        <span class="pbtns"><button data-up="${i}" title="nach oben">▲</button><button data-down="${i}" title="nach unten">▼</button><button data-out="${i}" title="entfernen">✕</button></span></div>`).join('') || '<p class="hint small">Noch leer.</p>'}</div>
  </div>
  <p class="hint small">Eine Zeile ist zu viel und gehört nicht ins Programm.</p>`;
}

function wireParsons(el, st, render) {
  el.querySelectorAll('[data-pool]').forEach((b) => b.addEventListener('click', () => {
    const i = Number(b.dataset.pool);
    st.placed.push(st.pool[i]);
    st.pool.splice(i, 1);
    render();
  }));
  el.querySelectorAll('[data-out]').forEach((b) => b.addEventListener('click', () => {
    const i = Number(b.dataset.out);
    st.pool.push(st.placed[i]);
    st.placed.splice(i, 1);
    render();
  }));
  el.querySelectorAll('[data-up]').forEach((b) => b.addEventListener('click', () => {
    const i = Number(b.dataset.up);
    if (i > 0) [st.placed[i - 1], st.placed[i]] = [st.placed[i], st.placed[i - 1]];
    render();
  }));
  el.querySelectorAll('[data-down]').forEach((b) => b.addEventListener('click', () => {
    const i = Number(b.dataset.down);
    if (i < st.placed.length - 1) [st.placed[i + 1], st.placed[i]] = [st.placed[i], st.placed[i + 1]];
    render();
  }));
}

function codeLines(code) {
  return code.split('\n').filter((l) => l.trim() && !l.trim().startsWith('#')).length;
}

function finishForge(key, f, st, code, done) {
  const run = game.run;
  const cleanCode = code.split('\n').filter((l) => l.trim() && !l.trim().startsWith('#')).join('\n');
  const noHints = st.hintsShown === 0;
  const third = st.mode === 'frei' ? codeLines(code) <= (f.maxZeilen ?? 99) : st.attempts === 1;
  const stars = 1 + (noHints ? 1 : 0) + (third ? 1 : 0);
  const schwer = f.stufe === 'schwer' && st.mode === 'frei';
  let exp = (schwer ? 40 : 20) + (stars - 1) * (schwer ? 10 : 5) - st.expPenalty;
  if (hasTalent('gel3')) exp += 10;
  exp = Math.max(5, exp);
  if (f.stufe === 'schwer' && st.mode === 'frei' && stars === 3) unlockAchievement('meisterschmied');
  if (f.evo) {
    // Evolution: die beiden Zutaten verschwinden, die neue Karte kommt dazu
    for (const z of EVOLUTIONS[f.evo].zutaten) {
      const up = run.deck.findIndex((c) => c.id === z && c.up);
      const i = up >= 0 ? up : run.deck.findIndex((c) => c.id === z);
      if (i >= 0) run.deck.splice(i, 1);
    }
    noteBook('evos', f.evo);
    unlockAchievement('alchemist');
  }
  const id = `forge_${key}_${run.deck.length}`;
  run.custom[id] = { ...f.karte, code: cleanCode, forged: true, evolved: !!f.evo, concept: (f.konzepte ?? ['basis'])[0] };
  run.deck.push(makeCard(id));
  run.forgesDone.push(key);
  awardStars(key, stars);
  const { el, close } = modal(`
    <h2>${f.evo ? '✨ Evolution!' : 'Geschmiedet!'}</h2>
    <div class="stars">${'★'.repeat(stars)}${'☆'.repeat(3 - stars)}</div>
    <p class="hint small">★ alle Tests bestanden · ★ ohne Hinweis · ★ ${st.mode === 'frei' ? `höchstens ${f.maxZeilen} Zeilen` : 'beim ersten Prüfen richtig'}</p>
    ${cardView(run.custom[id], { lesehilfe: true })}
    <p>Diese Karte führt <b>deinen</b> Code aus. +${exp} EXP</p>
    <button class="btn ok">Weiter</button>`);
  el.querySelector('.ok').addEventListener('click', () => { close(); addExp(exp, done); });
}

// ---------- Debug-Raum ----------
export function debugRoom(done) {
  const run = game.run;
  let card = run.deck.find((c) => BUGS[c.id]);
  let intro = '';
  if (!card) {
    card = makeCard('zaunpfahl');
    run.deck.push(card);
    intro = '<p class="warn">Ein Bug ist in dein Deck gekrochen: <b>Zaunpfahl</b>. Repariere ihn gleich hier!</p>';
  }
  const bug = BUGS[card.id];
  const st = { code: bug.code, attempts: 0, hintsShown: 0, hintsPaid: 0, expPenalty: 0, fails: [], pauseUntil: 0, result: null, error: null };
  const render = () => {
    const paused = Date.now() < st.pauseUntil;
    app().innerHTML = `<div class="room debug">
      <h2>🐞 Debug-Raum: ${esc(bug.name)}</h2>
      ${intro}
      <div class="cols">
        <div class="col">
          <div class="auftrag"><b>So soll die Karte wirken:</b> ${esc(bug.ziel)}</div>
          <p class="hint">Der Code unten hat einen typischen Fehler. Finde und behebe ihn. Repariert wird die Karte stärker als vorher: <b>${esc(bug.repariert.name)}</b>, ${esc(bug.repariert.text)}</p>
          <textarea class="editor" spellcheck="false" rows="6">${esc(st.code)}</textarea>
          <div class="row">
            <button class="btn check" ${paused ? 'disabled' : ''}>${paused ? 'Kurze Denkpause …' : 'Prüfen'}</button>
            <button class="btn secondary leave">Später reparieren</button>
          </div>
          ${paused ? '<p class="warn">Drei Fehlversuche kurz hintereinander. Vergleiche Erwartet und Dein Ergebnis im ersten roten Test.</p>' : ''}
          ${st.error ? `<p class="warn">${esc(st.error)}</p>` : ''}
          ${hintBox(st, bug.hinweise)}
        </div>
        <div class="col"><div class="panel-title">Tests</div>${testsTable(bug.tests, st.result)}</div>
      </div></div>`;
    const el = app();
    const ta = el.querySelector('.editor');
    editorWire(ta);
    ta.addEventListener('input', () => { st.code = ta.value; });
    wireHints(el, st, render);
    el.querySelector('.leave').addEventListener('click', () => done());
    el.querySelector('.check').addEventListener('click', () => {
      st.attempts++;
      st.error = null;
      st.result = runTests(st.code, bug.loesung, bug.tests, bug.pruefe);
      if (!st.result.passed) {
        st.fails.push(Date.now());
        cooldown(st);
        render();
        if (st.pauseUntil > Date.now()) setTimeout(render, st.pauseUntil - Date.now() + 50);
        return;
      }
      const id = `fix_${card.id}_${run.deck.length}`;
      run.custom[id] = { ...bug.repariert, code: st.code.trim(), type: bug.type, concept: bug.concept, forged: true, target: false };
      card.id = id;
      const exp = Math.max(5, 25 - st.expPenalty);
      const { el: m, close } = modal(`<h2>Bug behoben!</h2>${cardView(run.custom[id], { lesehilfe: true })}<p>+${exp} EXP</p><button class="btn ok">Weiter</button>`);
      m.querySelector('.ok').addEventListener('click', () => { close(); addExp(exp, done); });
    });
  };
  render();
  tutorialDebug();
}

// ---------- Händler ----------
export function shopRoom(done) {
  const run = game.run;
  const offers = shuffle(cardPool()).slice(0, 3).map((id) => ({ id, price: 40 + Math.floor(rng() * 4) * 10, sold: false }));
  const relic = shuffle(relicPool())[0];
  let relicSold = !relic;
  const relicPrice = 70 + Math.floor(rng() * 3) * 10;
  let healed = false;
  const render = () => {
    const removePrice = 50 + 25 * run.removeCount;
    const locked = Object.entries(CONCEPTS).filter(([k, c]) => !c.start && c.price > 0 && (c.act ?? 1) <= (run.act ?? 1) && !conceptUnlocked(k));
    app().innerHTML = `<div class="room shop">
      <h2>⚖ Händler <small class="tag">💰 ${run.gold} Gold</small></h2>
      <div class="panel-title">Python-Konzepte (dauerhaft)</div>
      <div class="offers">${locked.map(([k, c]) => `<div class="offer">
        <b>${esc(c.name)}</b><p class="hint small">Schaltet neue Karten frei und erlaubt ${esc(c.name)} beim freien Schreiben in der Schmiede.</p>
        <button class="btn" data-concept="${k}" ${run.gold >= c.price ? '' : 'disabled'}>${c.price} Gold</button></div>`).join('') || '<p class="hint">Alle Konzepte dieses Akts gelernt.</p>'}</div>
      <div class="panel-title">Karten</div>
      <div class="offers cards">${offers.map((o, i) => o.sold ? '<div class="offer sold">verkauft</div>' : `<div class="offer">${cardView(CARDS[o.id], { lesehilfe: lese() })}
        <button class="btn" data-buy="${i}" ${run.gold >= o.price ? '' : 'disabled'}>${o.price} Gold</button></div>`).join('')}</div>
      ${relic ? `<div class="panel-title">Relikt</div>
      <div class="offers">${relicSold ? '<div class="offer sold">verkauft</div>' : `<div class="offer">${relicView(relic)}
        <button class="btn buy-relic" ${run.gold >= relicPrice ? '' : 'disabled'}>${relicPrice} Gold</button></div>`}</div>` : ''}
      <div class="panel-title">Dienste</div>
      <div class="row">
        <button class="btn secondary remove" ${run.gold >= removePrice ? '' : 'disabled'}>Karte entfernen (${removePrice} Gold)</button>
        <button class="btn secondary heal" ${run.gold >= 30 && !healed ? '' : 'disabled'}>15 Leben heilen (30 Gold)</button>
      </div>
      <div class="row"><button class="btn leave">Weiter</button></div></div>`;
    const el = app();
    el.querySelectorAll('[data-concept]').forEach((b) => b.addEventListener('click', () => conceptQuiz(b.dataset.concept, render)));
    el.querySelectorAll('[data-buy]').forEach((b) => b.addEventListener('click', () => {
      const o = offers[Number(b.dataset.buy)];
      run.gold -= o.price;
      run.deck.push(makeCard(o.id));
      noteBook('cards', o.id);
      o.sold = true;
      save();
      render();
    }));
    el.querySelector('.buy-relic')?.addEventListener('click', () => {
      run.gold -= relicPrice;
      relicSold = true;
      gainRelic(relic);
      render();
    });
    el.querySelector('.remove').addEventListener('click', () => chooseCard('Welche Karte soll weg?', run.deck, (card) => {
      run.gold -= removePrice;
      run.removeCount++;
      run.deck = run.deck.filter((c) => c !== card);
      save();
      render();
    }));
    el.querySelector('.heal').addEventListener('click', () => {
      run.gold -= 30;
      run.hp = Math.min(run.maxHp, run.hp + 15);
      healed = true;
      save();
      render();
    });
    el.querySelector('.leave').addEventListener('click', () => done());
  };
  render();
  tutorialShop();
}

/** Ein Konzept wird erst nach einer kurzen Nachverfolgungsaufgabe freigeschaltet; bezahlt wird nur bei Erfolg. */
function conceptQuiz(key, rerender) {
  const c = CONCEPTS[key];
  const q = c.quiz;
  const { el, close } = modal(`
    <h3>Konzept lernen: ${esc(c.name)}</h3>
    <p>Bevor du ${esc(c.name)} benutzen darfst, verfolge diesen Code im Kopf:</p>
    ${codeView(q.code)}
    <p><b>${esc(q.frage)}</b></p>
    <input type="number" class="quiz-input">
    <div class="quiz-msg"></div>
    <div class="row"><button class="btn ok">Antworten</button><button class="btn secondary cancel">Abbrechen</button></div>`, { onClose: () => {} });
  const input = el.querySelector('.quiz-input');
  input.focus();
  const answer = () => {
    if (input.value === '') return;
    // Zur Sicherheit mit Natter nachrechnen statt nur der hinterlegten Zahl zu trauen.
    const r = runPy(q.code, {}, { trace: false });
    const varName = q.frage.match(/hat (\w+)/)?.[1];
    const right = varName && r.vars[varName] !== undefined ? r.vars[varName] : q.antwort;
    if (Number(input.value) === right) {
      game.run.gold -= c.price;
      game.meta.concepts.push(key);
      save();
      close();
      toast(`Konzept <b>${esc(c.name)}</b> gelernt! Neue Karten sind jetzt im Pool.`, 'good');
      rerender();
    } else {
      el.querySelector('.quiz-msg').innerHTML = `<p class="warn">Nicht ganz. ${esc(q.erklaerung)} Versuch es noch einmal, es kostet nichts.</p>`;
    }
  };
  el.querySelector('.ok').addEventListener('click', answer);
  input.addEventListener('keydown', (e) => { if (e.key === 'Enter') answer(); });
  el.querySelector('.cancel').addEventListener('click', close);
}

export function chooseCard(title, cards, onPick, { showUp = false } = {}) {
  const { el, close } = modal(`<h3>${esc(title)}</h3>
    <div class="card-grid">${cards.map((c, i) => {
      const def = cardDef(c);
      if (!showUp) return `<div data-i="${i}">${cardView(def, { lesehilfe: lese() })}</div>`;
      const upDef = cardDef({ ...c, up: true });
      return `<div data-i="${i}" class="up-pair">${cardView(def, { lesehilfe: lese() })}<span class="arrow">→</span>${cardView(upDef, { lesehilfe: lese(), cls: 'upgraded' })}</div>`;
    }).join('')}</div>
    <div class="row"><button class="btn secondary cancel">Abbrechen</button></div>`, { wide: true, onClose: () => {} });
  el.querySelectorAll('[data-i]').forEach((d) => d.addEventListener('click', () => { close(); onPick(cards[Number(d.dataset.i)]); }));
  el.querySelector('.cancel').addEventListener('click', close);
}

// ---------- Rastplatz ----------
/** Rezepte, für die beide Zutaten im Deck liegen und die Konzepte gelernt sind. */
export function availableEvolutions() {
  const deck = game.run.deck;
  const ids = deck.map((c) => c.id);
  return Object.keys(EVOLUTIONS).filter((k) => EVOLUTIONS[k].zutaten.every((z) => ids.includes(z))
    && deck.some((c) => c.up && EVOLUTIONS[k].zutaten.includes(c.id))
    && (FORGES[EVOLUTIONS[k].forge].konzepte ?? []).every((c) => conceptUnlocked(c)));
}

export function restRoom(done) {
  const run = game.run;
  const upgradable = run.deck.filter((c) => !c.up && (CARDS[c.id]?.up));
  const heal = (run.stufe ?? 0) >= 4 ? 10 : 15;
  const evos = availableEvolutions();
  app().innerHTML = `<div class="room rest">
    <h2>🔥 Rastplatz</h2><p>Du hast ❤ ${run.hp} / ${run.maxHp}. Wähle eins:</p>
    <div class="choices">
      <div class="choice" data-c="heal"><div class="choice-title">Ausruhen</div><p>${heal} Leben heilen.</p></div>
      ${evos.length ? `<div class="choice evo" data-c="evo"><div class="choice-title">✨ Verschmelzen</div><p>${evos.map((k) => EVOLUTIONS[k].zutaten.map((z) => esc(CARDS[z].name)).join(' + ')).join('<br>')}<br>Zwei Karten werden zu einer stärkeren. Den Code baust du selbst.</p></div>` : ''}
      <div class="choice ${upgradable.length ? '' : 'disabled'}" data-c="up"><div class="choice-title">Karte verbessern</div><p>Ändert den Code einer Karte: aus range(3) wird range(4), aus -= 6 wird -= 9.</p></div>
    </div></div>`;
  app().querySelector('[data-c="heal"]').addEventListener('click', () => {
    run.hp = Math.min(run.maxHp, run.hp + heal);
    done();
  });
  app().querySelector('[data-c="evo"]')?.addEventListener('click', () => {
    if (evos.length === 1) { forgeRoom(EVOLUTIONS[evos[0]].forge, done); return; }
    const { el, close } = modal(`<h3>Was verschmelzen?</h3><div class="choices">${evos.map((k) => `<div class="choice" data-e="${k}"><div class="choice-title">${EVOLUTIONS[k].zutaten.map((z) => esc(CARDS[z].name)).join(' + ')}</div></div>`).join('')}</div>`, { wide: true });
    el.querySelectorAll('[data-e]').forEach((d) => d.addEventListener('click', () => { close(); forgeRoom(EVOLUTIONS[d.dataset.e].forge, done); }));
  });
  app().querySelector('[data-c="up"]').addEventListener('click', () => {
    if (!upgradable.length) return;
    chooseCard('Welche Karte verbessern? Links vorher, rechts nachher.', upgradable, (card) => { card.up = true; done(); }, { showUp: true });
  });
  tutorialRest();
}

// ---------- Belohnung nach dem Kampf ----------
export function rewardScreen(kind, done) {
  const run = game.run;
  const gold = kind === 'boss' ? 50 : kind === 'elite' ? 30 : 12 + Math.floor(rng() * 7);
  run.gold += gold;
  if (kind === 'elite') run.elitesWon++;
  const n = kind === 'elite' && hasTalent('takt1') ? 4 : 3;
  const choices = shuffle(cardPool()).slice(0, n);
  save();
  app().innerHTML = `<div class="room reward">
    <h2>Sieg!</h2><p>+${gold} Gold (jetzt 💰 ${run.gold})${kind === 'elite' ? ' · Danach wählst du ein Relikt.' : ''}</p>
    <p>Wähle eine Karte für dein Deck, oder überspringe. Ein schlankes Deck ist oft stärker.</p>
    <div class="card-grid">${choices.map((id) => `<div data-id="${id}">${cardView(CARDS[id], { lesehilfe: lese() })}</div>`).join('')}</div>
    <div class="row"><button class="btn secondary skip">Überspringen</button></div></div>`;
  const next = () => (kind === 'elite' ? offerRelic(2, done) : done());
  app().querySelectorAll('[data-id]').forEach((d) => d.addEventListener('click', () => {
    run.deck.push(makeCard(d.dataset.id));
    noteBook('cards', d.dataset.id);
    next();
  }));
  app().querySelector('.skip').addEventListener('click', () => next());
  tutorialReward();
}
