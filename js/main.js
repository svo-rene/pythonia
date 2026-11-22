// Einstieg: Titel, Karte des Akts, Talentbaum, Run-Ende, Einstellungen.
import { ROOM_INFO, TALENTS, CONCEPTS, EXP_PER_LEVEL, RUN_SKILLS, HEROES, CARDS, FORGE_LEVEL, RELICS, EVOLUTIONS, FORGES, ACHIEVEMENTS, RIDDLES, STUFEN, ACTS, BUILDS, CARD_SETS, WORLDS } from './data.js';
import { eventRoom } from './events.js';
import { showRelics, relicCode, relicView } from './relics.js';
import { explainCode } from './explain.js';
import { tutorialMap, resetTutorials } from './tutorial.js';
import { game, save, load, newRun, cardDef, exportCode, importCode, resetAll, reachable, startNextAct, worldDef } from './state.js';
import { heroSprite } from './sprites.js';
import { loadNatter } from './natter.js';
import { startCombat, rerenderCombat } from './combat.js';
import { forgeRoom, debugRoom, shopRoom, restRoom, rewardScreen } from './rooms.js';
import { app, esc, modal, toast, cardView, codeView } from './ui.js';

// ---------- Kopfleiste ----------
function topbar() {
  const run = game.run;
  const s = game.meta.settings;
  const el = document.getElementById('topbar');
  el.innerHTML = `
    <button class="brand" data-go="title"><img class="logo-small" src="assets/logo.svg" alt=""> Pythonia</button>
    ${run ? `<span class="pill">❤ ${run.hp}/${run.maxHp}</span><span class="pill">💰 ${run.gold}</span>
      <span class="pill" title="Erfahrung">Lv ${run.level} · ${run.exp}/${EXP_PER_LEVEL} EXP</span>
      <button class="pill btnlike" data-go="deck">🂠 Deck ${run.deck.length}</button>
      ${run.seedCode ? `<span class="pill" title="Klassen-Code: alle mit diesem Code spielen dieselbe Höhle">🏫 ${esc(run.seedCode)}</span>` : ''}
      ${run.stufe ? `<span class="pill" title="Prüfungsstufe">⚔ Stufe ${run.stufe}</span>` : ''}
      <button class="pill btnlike" data-go="relics" title="Relikte und ihre Reihenfolge">🧿 ${run.relics.map((id) => RELICS[id].icon).join('') || 'Relikte'}</button>` : ''}
    <span class="spacer"></span>
    <label class="toggle"><input type="checkbox" data-set="lesehilfe" ${s.lesehilfe ? 'checked' : ''}> Lesehilfe</label>
    <label class="toggle"><input type="checkbox" data-set="tempo" ${s.tempo === 'schnell' ? 'checked' : ''}> Schnell</label>`;
  el.querySelector('[data-go="title"]').onclick = () => { if (!document.querySelector('.combat') || confirm('Zum Titel? Der Kampf startet beim Fortsetzen neu.')) showTitle(); };
  el.querySelector('[data-go="deck"]')?.addEventListener('click', showDeck);
  el.querySelector('[data-go="relics"]')?.addEventListener('click', () => showRelics(() => { topbar(); rerenderCombat(); }));
  el.querySelectorAll('[data-set]').forEach((i) => i.addEventListener('change', () => {
    if (i.dataset.set === 'lesehilfe') s.lesehilfe = i.checked;
    if (i.dataset.set === 'tempo') s.tempo = i.checked ? 'schnell' : 'normal';
    save();
    rerenderCombat();
  }));
}

function showDeck() {
  const run = game.run;
  const conc = game.meta.concepts.map((c) => CONCEPTS[c].name).join(', ');
  const skills = run.skills.map((k) => RUN_SKILLS[k].name).join(', ') || 'keine';
  const { el, close } = modal(`<h3>Dein Deck (${run.deck.length} Karten)</h3>
    <p class="hint small">Gelernte Konzepte: ${esc(conc)} · Run-Skills: ${esc(skills)}</p>
    <p class="hint small">Tippe eine Karte an, um dir ihren Code erklären zu lassen.</p>
    <div class="card-grid">${run.deck.map((c, i) => cardView(cardDef(c), { lesehilfe: game.meta.settings.lesehilfe, extra: `data-ex="${i}"` })).join('')}</div>
    <div class="row"><button class="btn ok">Schließen</button></div>`, { wide: true, onClose: () => {} });
  el.querySelector('.ok').addEventListener('click', close);
  el.querySelectorAll('[data-ex]').forEach((d) => d.addEventListener('click', () => {
    const def = cardDef(run.deck[Number(d.dataset.ex)]);
    explainCode(def.name, def.code);
  }));
}

// Mail-Link erst beim Antippen zusammensetzen (Adresse steht so nicht lesbar im Quelltext)
document.addEventListener('click', (e) => { const a = e.target.closest('[data-m]'); if (!a) return; e.preventDefault(); const [u, d] = a.dataset.m.split('|'); location.href = `mailto:${u}@${d}?subject=${encodeURIComponent('Pythonia')}`; });

// ---------- Titel ----------
function showTitle() {
  topbar();
  const run = game.run;
  const m = game.meta;
  app().innerHTML = `<div class="title-screen">
    <img class="logo-big" src="assets/logo.svg" alt="">
    <h1>Pythonia</h1>
    <p class="subtitle">Die Höhle der Verzweigungen</p>
    <p class="sub">Ein Deckbuilder, in dem deine Zauber Python sind.<br>Lies Code im Kampf, schreibe Code in der Schmiede, repariere Bugs.</p>
    <div class="menu">
      ${run ? '<button class="btn big" data-a="continue">Run fortsetzen</button>' : ''}
      <button class="btn big ${run ? 'secondary' : ''}" data-a="new">🗺 Neuer Run</button>
      <button class="btn secondary" data-a="talents">Talentbaum ${m.talentPoints ? `(${m.talentPoints} ${m.talentPoints === 1 ? "Punkt" : "Punkte"} frei)` : ''}</button>
      <button class="btn secondary" data-a="book">📖 Zauberbuch</button>
      <button class="btn secondary" data-a="howto">So funktioniert's</button>
      <button class="btn secondary" data-a="saves">Spielstand</button>
    </div>
    <p class="hint small">Runs: ${m.runs} · Siege: ${m.wins} · Akte geschafft: ${m.actsDone.length} von ${Object.keys(ACTS).length}</p>
    <p class="hint small about">Entstanden für meine Schülerinnen und Schüler am Gymnasium Dresden-Pieschen. Über Feedback und Hinweise freue ich mich sehr. – René Richter, <a href="#" data-m="richter|gdpie.lernsax.de">✉️ E-Mail</a><br>© 2026 René Richter · Code: MIT · Inhalte: CC BY 4.0 · Python im Browser: <a href="https://github.com/wi-wissen/Natter" target="_blank" rel="noopener">Natter</a> von Julian Dorn (MIT) · <a href="https://github.com/svo-rene/pythonia/blob/main/LIZENZEN.md" target="_blank" rel="noopener">Lizenzen</a></p></div>`;
  app().querySelector('[data-a="continue"]')?.addEventListener('click', () => { enterPendingOrMap(); });
  app().querySelector('[data-a="new"]').addEventListener('click', () => {
    if (run && !confirm('Den laufenden Run abbrechen und neu beginnen?')) return;
    showWorldMap();
  });
  app().querySelector('[data-a="talents"]').addEventListener('click', showTalents);
  app().querySelector('[data-a="howto"]').addEventListener('click', showHowto);
  app().querySelector('[data-a="book"]').addEventListener('click', showBook);
  app().querySelector('[data-a="saves"]').addEventListener('click', showSaves);
}

function showHowto() {
  const { el, close } = modal(`<h3>So funktioniert's</h3>
    <ul class="howto">
      <li><b>Karten sind Python.</b> Beim Ausspielen läuft der Code Zeile für Zeile. Links stehen deine Werte, rechts die der Gegner.</li>
      <li><b>Gegner zeigen ihre Absicht als Code.</b> Lies ihn, bevor du entscheidest. Er läuft mit den Werten nach deinem Zug.</li>
      <li><b>❓ Erklären:</b> Verstehst du einen Code nicht? Tippe auf ❓ und lass ihn dir Zeile für Zeile erklären.</li>
      <li><b>⌨ Eingabe-Karten</b> fragen beim Ausspielen nach einer Zahl, wie <code>input()</code> in Python. Du entscheidest: viele kleine Treffer oder wenige große?</li>
      <li><b>Eingebung 🔮:</b> Manchmal leuchtet eine Karte auf der Hand. Sag vorher, was sie bewirkt: Stimmt es, wirkt sie doppelt. Die Chance steigt mit deinem Level.</li>
      <li><b>Relikte 🧿</b> sind Funktionen wie <code>def zug_start():</code>. Das Spiel ruft sie selbst auf. Die Reihenfolge legst du fest, und sie zählt!</li>
      <li><b>?-Räume:</b> Code im Kopf verfolgen oder eine Entscheidung treffen. Richtig gerechnet gibt es eine Belohnung.</li>
      <li><b>Schmiede:</b> Schreibe oder ordne Code. Bestehen alle Tests, wird dein Code zu einer neuen Karte.</li>
      <li><b>Rastplatz:</b> Heilen, eine Karte verbessern oder zwei Karten zu einer <b>Evolution</b> verschmelzen (eine muss verbessert sein).</li>
      <li><b>Debug-Raum:</b> Bug-Karten haben typische Fehler. Repariert werden sie stärker.</li>
      <li><b>Händler:</b> Neue Python-Konzepte (elif, for, while), Karten, Relikte und Karten entfernen.</li>
      <li><b>Zauberbuch 📖:</b> Alles, was du entdeckt hast, und Erfolge, die neue Relikte freischalten.</li>
      <li><b>Klassen-Code 🏫:</b> Gleicher Code = gleiche Höhle für alle. Nach einem Sieg wird die nächste Prüfungsstufe frei.</li>
      <li><b>Kämpfe</b> geben Gold, <b>Schmieden</b> geben EXP. Ab 50 EXP steigst du ein Level auf.</li>
      <li><b>Talentbaum:</b> Auch verlorene Runs geben Punkte.</li>
    </ul><div class="row"><button class="btn ok">Los geht's</button><button class="btn secondary tut-reset">Einführung noch einmal zeigen</button></div>`, { onClose: () => {} });
  el.querySelector('.ok').addEventListener('click', close);
  el.querySelector('.tut-reset').addEventListener('click', () => { resetTutorials(); toast('Die Einführung startet wieder beim nächsten Kampf, in der Schmiede usw.', 'good'); close(); });
}

function showSaves() {
  const { el, close } = modal(`<h3>Spielstand</h3>
    <p>Der Spielstand wird automatisch in diesem Browser gespeichert. Mit dem Code kannst du ihn auf ein anderes Gerät mitnehmen.</p>
    <textarea class="savecode" rows="4" readonly>${esc(exportCode())}</textarea>
    <div class="row"><button class="btn secondary copy">Code kopieren</button></div>
    <p>Code eines anderen Geräts einfügen:</p>
    <textarea class="importcode" rows="3"></textarea>
    <div class="row"><button class="btn secondary import">Laden</button><button class="btn secondary danger reset">Alles zurücksetzen</button><button class="btn ok">Schließen</button></div>`, { onClose: () => {} });
  el.querySelector('.copy').addEventListener('click', () => { navigator.clipboard?.writeText(exportCode()); toast('Kopiert.'); });
  el.querySelector('.import').addEventListener('click', () => {
    try { importCode(el.querySelector('.importcode').value); close(); toast('Spielstand geladen.', 'good'); showTitle(); } catch { toast('Der Code ist ungültig.', 'bad'); }
  });
  el.querySelector('.reset').addEventListener('click', () => { if (confirm('Wirklich alles löschen, auch den Talentbaum?')) { resetAll(); close(); showTitle(); } });
  el.querySelector('.ok').addEventListener('click', close);
}

// ---------- Heldenauswahl ----------
function showHeroSelect(start = { act: 1, world: 'haupt' }) {
  topbar();
  const ziel = start.world === 'haupt' ? `Akt ${start.act}: ${ACTS[start.act].name}` : `${WORLDS[start.world].icon} ${WORLDS[start.world].name}`;
  const heroes = Object.entries(HEROES).map(([id, h]) => {
    const counts = {};
    for (const c of h.deck) counts[c] = (counts[c] ?? 0) + 1;
    const deck = Object.entries(counts).map(([c, n]) => `${n}× ${esc(CARDS[c].name)}`).join(', ');
    if (h.advanced && !game.meta.advanced) {
      return `<div class="hero-pick locked"><div class="hero-pick-fig">${heroSprite(id)}</div><b>${esc(h.name)}</b>
        <span class="hint small">🔒 Wird frei, sobald du Akt 1 zum ersten Mal geschafft hast.</span></div>`;
    }
    return `<button class="hero-pick" data-hero="${id}">
      <div class="hero-pick-fig">${heroSprite(id)}</div>
      <b>${esc(h.name)}</b>
      <span class="hint small">${esc(h.text)}</span>
      <span class="hero-stat">❤ ${h.hp} Leben</span>
      <span class="hero-gabe"><b>${RELICS[h.trait].icon} Grundeigenschaft ${esc(RELICS[h.trait].name)}:</b><code class="relic-mini">${esc(relicCode(h.trait))}</code>
        <br><small>Spielweise: ${BUILDS[h.build].icon} ${esc(BUILDS[h.build].name)}</small>${h.extra ? `<br>${esc(h.extra)}` : ''}</span>
      <span class="hero-deck">${deck}</span></button>`;
  }).join('');
  app().innerHTML = `<div class="hero-select">
    <h2>Wähle deine Figur</h2>
    <p class="hint">Ziel: <b>${esc(ziel)}</b>${start.world === 'haupt' && start.act > 1 ? ' · Du startest mit Ausgleich für die übersprungenen Akte (Karten, Gold, Leben, Level).' : ''}</p>
    <div class="run-options">
      <label>🏫 Klassen-Code <input class="seed-input" maxlength="20" placeholder="leer = zufällig"></label>
      <button class="btn secondary small day-code">Tages-Code</button>
      ${game.meta.stufeMax > 0 ? `<label>⚔ Prüfungsstufe <select class="stufe-select">${STUFEN.slice(0, game.meta.stufeMax + 1).map((t, i) => `<option value="${i}">${i}: ${esc(t)}</option>`).join('')}</select></label>` : ''}
      <p class="hint small">Gleicher Klassen-Code = gleiche Höhle und gleiche Angebote für alle. So könnt ihr vergleichen, wer am weitesten kommt.</p>
    </div>
    <div class="hero-list">${heroes}</div>
    <div class="row center"><button class="btn secondary back">Zurück</button></div></div>`;
  app().querySelector('.day-code').addEventListener('click', () => {
    const d = new Date();
    app().querySelector('.seed-input').value = `TAG-${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  });
  app().querySelectorAll('[data-hero]').forEach((b) => b.addEventListener('click', () => {
    const seedCode = app().querySelector('.seed-input').value.trim().toUpperCase();
    const stufe = Number(app().querySelector('.stufe-select')?.value ?? 0);
    newRun(b.dataset.hero, { seedCode, stufe, ...start });
    showMap();
  }));
  app().querySelector('.back').addEventListener('click', showWorldMap);
}

// ---------- Weltkarte: Hauptpfad und Nebenwelten ----------
function showWorldMap() {
  topbar();
  const m = game.meta;
  const acts = Object.entries(ACTS).map(([n, a]) => {
    const num = Number(n);
    const done = m.actsDone.includes(num);
    const open = !a.bald && (num === 1 || m.actsDone.includes(num - 1));
    const state = a.bald ? 'bald' : done ? 'done' : open ? 'open' : 'locked';
    const sides = Object.entries(WORLDS).filter(([, w]) => w.nach === num).map(([id, w]) => {
      const wopen = m.actsDone.includes(w.nach);
      const wdone = m.worldsDone.includes(id);
      return `<button class="world-node side ${wdone ? 'done' : wopen ? 'open' : 'locked'}" ${wopen ? `data-world="${id}"` : 'disabled'}>
        <span class="wn-icon">${w.icon}</span><b>${esc(w.name)}${wdone ? ' ✔' : ''}</b>
        <small>${wopen ? esc(w.text) : `🔒 nach Akt ${w.nach}`}</small></button>`;
    }).join('');
    return `<div class="world-row">
      <button class="world-node main ${state}" ${open ? `data-act="${num}"` : 'disabled'}>
        <span class="wn-icon">${num}</span><b>Akt ${num}: ${esc(a.name)}${done ? ' ✔' : ''}</b>
        <small>${esc(a.thema)}${a.bald ? ' · kommt bald' : !open ? ` · 🔒 nach Akt ${num - 1}` : ''}</small></button>
      ${sides ? `<div class="world-sides">${sides}</div>` : ''}</div>`;
  }).join('<div class="world-link"></div>');
  app().innerHTML = `<div class="worldmap">
    <h2>🗺 Weltkarte</h2>
    <p class="hint">Links der <b>Lernweg</b>: Jeder geschaffte Akt öffnet den nächsten. Rechts zweigen <b>freie Welten</b> ab, in denen du spielen kannst, wie du willst.</p>
    <div class="world-list">${acts}</div>
    <div class="row center"><button class="btn secondary back">Zurück</button></div></div>`;
  app().querySelectorAll('[data-act]').forEach((b) => b.addEventListener('click', () => showHeroSelect({ act: Number(b.dataset.act), world: 'haupt' })));
  app().querySelectorAll('[data-world]').forEach((b) => b.addEventListener('click', () => showHeroSelect({ act: WORLDS[b.dataset.world].level, world: b.dataset.world })));
  app().querySelector('.back').addEventListener('click', showTitle);
}

// ---------- Höhlenkarte ----------
const ROW_H = 92;

function showMap() {
  topbar();
  const run = game.run;
  const { nodes, edges, rows } = run.map;
  const open = new Set(reachable());
  const visited = new Set(run.path);
  const height = rows * ROW_H + 80;
  const yOf = (n) => height - 60 - n.r * ROW_H + (n.y ?? 0);
  const walked = (a, b) => visited.has(a) && visited.has(b) && run.path.indexOf(b) === run.path.indexOf(a) + 1;
  const lines = edges.map(([a, b]) => {
    const A = nodes[a];
    const B = nodes[b];
    const cls = walked(a, b) ? 'walked' : (a === run.pos && open.has(b)) ? 'next' : '';
    return `<line x1="${A.x}%" y1="${yOf(A)}" x2="${B.x}%" y2="${yOf(B)}" class="${cls}"/>`;
  }).join('');
  const entry = !run.pos ? Object.values(nodes).filter((n) => n.r === 0)
    .map((n) => `<line x1="50%" y1="${height - 22}" x2="${n.x}%" y2="${yOf(n)}" class="next"/>`).join('') : '';
  const buttons = Object.values(nodes).map((n) => {
    const info = ROOM_INFO[n.typ];
    const isOpen = open.has(n.id);
    const label = info.name + (n.forge ? ` (${FORGE_LEVEL[n.forge]})` : '');
    return `<button class="mnode ${n.typ} ${visited.has(n.id) ? 'done' : ''} ${n.id === run.pos ? 'here' : ''} ${isOpen ? 'open' : ''}"
      style="left:${n.x}%;top:${yOf(n)}px" title="${esc(label)}" aria-label="${esc(label)}"
      ${isOpen ? `data-node="${n.id}"` : 'disabled'}><span>${info.icon}</span>${n.forge ? `<i>${FORGE_LEVEL[n.forge] === 'schwer' ? '★★' : '★'}</i>` : ''}</button>`;
  }).join('');
  const legend = Object.entries(ROOM_INFO).map(([k, i]) => `<li><span class="mnode mini ${k}"><span>${i.icon}</span></span>${i.name}</li>`).join('');
  app().innerHTML = `<div class="map">
    <div class="map-head"><h2>${run.world && run.world !== 'haupt' ? `${WORLDS[run.world].icon} ${esc(WORLDS[run.world].name)}` : `Akt ${run.act ?? 1}: ${esc(ACTS[run.act ?? 1].name)}`}</h2>
      <p class="hint">Wähle einen leuchtenden Raum. Du kannst nur den Linien nach oben folgen.</p></div>
    <div class="map-wrap">
      <div class="cave" style="height:${height}px">
        <svg class="cave-walls" viewBox="0 0 100 100" preserveAspectRatio="none">
          <path d="M0 0 L9 0 Q4 8 8 15 Q12 24 5 32 Q2 42 8 50 Q12 60 4 68 Q1 78 7 86 Q11 94 6 100 L0 100 Z"/>
          <path d="M100 0 L91 0 Q96 9 92 17 Q88 27 95 35 Q99 45 92 53 Q88 62 96 71 Q99 80 93 88 Q89 95 94 100 L100 100 Z"/>
        </svg>
        <svg class="cave-lines" width="100%" height="${height}">${lines}${entry}</svg>
        ${buttons}
        <div class="cave-entry">Höhleneingang</div>
      </div>
      <ul class="legend">${legend}</ul>
    </div></div>`;
  app().querySelectorAll('.mnode.open').forEach((b) => b.addEventListener('click', () => {
    const id = b.dataset.node;
    run.pos = id;
    run.path.push(id);
    run.stats.rooms = (run.stats.rooms ?? 0) + 1;
    run.pending = id;
    save();
    enterRoom(nodes[id]);
  }));
  // zur aktuellen Ebene scrollen
  const target = app().querySelector('.mnode.open') ?? app().querySelector('.mnode.here');
  target?.scrollIntoView({ block: 'center' });
  if (!run.pos) tutorialMap();
}

function enterPendingOrMap() {
  const run = game.run;
  if (run.pending) enterRoom(run.map.nodes[run.pending]);
  else showMap();
}

function roomDone() {
  const run = game.run;
  run.pending = null;
  save();
  if (run.pos === 'boss') {
    const m = game.meta;
    if (run.world && run.world !== 'haupt') {
      if (!m.worldsDone.includes(run.world)) m.worldsDone.push(run.world);
      save();
      runOver(true);
      return;
    }
    if (!m.actsDone.includes(run.act)) m.actsDone.push(run.act);
    save();
    const next = ACTS[(run.act ?? 1) + 1];
    if (next && !next.bald) actDone(); else runOver(true);
    return;
  }
  showMap();
}

function enterRoom(node) {
  topbar();
  const t = node.typ;
  if (t === 'kampf' || t === 'elite' || t === 'boss') {
    startCombat(node.enc, t, ({ won }) => {
      topbar();
      if (!won) { runOver(false); return; }
      if (t === 'boss') { game.run.elitesWon += 0; roomDone(); return; }
      rewardScreen(t, roomDone);
    });
  } else if (t === 'schmiede') forgeRoom(node.forge, roomDone);
  else if (t === 'debug') debugRoom(roomDone);
  else if (t === 'haendler') shopRoom(roomDone);
  else if (t === 'rast') restRoom(roomDone);
  else if (t === 'raetsel') eventRoom(roomDone);
  topbar();
}

// ---------- Akt geschafft ----------
function actDone() {
  const run = game.run;
  const next = ACTS[run.act + 1];
  const newAdvanced = run.act === 1 && !game.meta.advanced;
  if (newAdvanced) { game.meta.advanced = true; save(); }
  topbar();
  app().innerHTML = `<div class="title-screen act-done">
    ${newAdvanced ? `<div class="unlock-box"><h2>✨ Neu freigeschaltet!</h2>
      <p>Zwei neue Spielweisen, ihre Karten tauchen ab sofort als Belohnung auf:</p>
      <div class="build-list">${Object.values(BUILDS).filter((b) => b.advanced).map((b) => `<div class="build"><b>${b.icon} ${esc(b.name)}</b><p>${esc(b.text)}</p></div>`).join('')}</div>
      <p>Und zwei neue Figuren für deinen nächsten Run: ${Object.values(HEROES).filter((h) => h.advanced).map((h) => `<b>${esc(h.name)}</b>`).join(' und ')}.</p></div>` : ''}
    <img class="logo-big" src="assets/logo.svg" alt="">
    <h1>Akt ${run.act} geschafft!</h1>
    <p class="sub">Der Boss ist besiegt. Ein Gang führt tiefer hinab …</p>
    <h2>Akt ${run.act + 1}: ${esc(next.name)}</h2>
    <p class="act-intro">${esc(next.intro ?? '')}</p>
    <p class="hint">Thema: <b>${esc(next.thema)}</b> · Du wirst vollständig geheilt.</p>
    ${Object.values(CARD_SETS).some((s) => s.act === run.act + 1) ? `<div class="unlock-box"><h3>Neue Kartensets in diesem Akt</h3><div class="build-list">${Object.values(CARD_SETS).filter((s) => s.act === run.act + 1).map((s) => `<div class="build"><b>${s.icon} ${esc(s.name)}</b><p>${esc(s.text)}</p></div>`).join('')}</div><p class="hint small">Ihre Karten tauchen als Belohnung und beim Händler auf, für jede Figur.</p></div>` : ''}
    ${next.geschenk ? `<p>Als Geschenk bekommst du:</p><div class="card-grid">${next.geschenk.map((id) => cardView(CARDS[id], { lesehilfe: true })).join('')}</div>` : ''}
    <div class="menu"><button class="btn big" data-a="go">Hinab in ${esc(next.name)}</button></div></div>`;
  app().querySelector('[data-a="go"]').addEventListener('click', () => { startNextAct(); showMap(); });
}

// ---------- Run-Ende ----------
function runOver(won) {
  const run = game.run;
  const meta = game.meta;
  const points = won ? 3 : 1 + run.elitesWon;
  meta.talentPoints += points;
  if (won) meta.wins++;
  const newStufe = won && (run.stufe ?? 0) + 1 > meta.stufeMax && (run.stufe ?? 0) + 1 < STUFEN.length;
  if (newStufe) meta.stufeMax = (run.stufe ?? 0) + 1;
  game.run = null;
  save();
  topbar();
  app().innerHTML = `<div class="title-screen">
    <h1>${won ? '♛ Pythonia ist bezwungen!' : 'Der Run ist vorbei'}</h1>
    <p class="sub">${won ? (run.world && run.world !== 'haupt' ? `${esc(WORLDS[run.world].name)} ist geschafft!` : `Du hast Akt ${run.act} geschafft! Auf der Weltkarte geht es weiter, sobald der nächste Akt fertig ist.`) : `Du bist in Akt ${run.act ?? 1} gefallen. Kein Run ist verschwendet: Du bekommst trotzdem Talentpunkte.`}</p>
    <p>+${points} Talentpunkt${points === 1 ? '' : 'e'}${!won && run.elitesWon ? ` (1 + ${run.elitesWon} für Elite-Siege)` : ''}</p>
    <p class="hint">${run.stats?.rooms ?? run.path.length} ${(run.stats?.rooms ?? run.path.length) === 1 ? 'Raum' : 'Räume'} geschafft · Level ${run.level} · ${run.forgesDone.length} Schmieden gelöst${run.seedCode ? ` · Klassen-Code <b>${esc(run.seedCode)}</b>` : ''}${run.stufe ? ` · Stufe ${run.stufe}` : ''}</p>
    ${newStufe ? `<p class="good-note">⚔ Prüfungsstufe ${meta.stufeMax} freigeschaltet: ${esc(STUFEN[meta.stufeMax])}</p>` : ''}
    ${runReview(run, won)}
    <div class="menu"><button class="btn big" data-a="talents">Zum Talentbaum</button><button class="btn secondary" data-a="new">Neuer Run</button></div></div>`;
  app().querySelector('[data-a="talents"]').addEventListener('click', showTalents);
  app().querySelector('[data-a="new"]').addEventListener('click', showWorldMap);
}

/** Rückblick wie bei Hades: Was war dein bester Zauber, was sagt der Meister dazu? */
function runReview(run, won) {
  const s = run.stats ?? {};
  const fav = Object.entries(s.relicFires ?? {}).sort((a, b) => b[1] - a[1])[0];
  const preds = (s.predRight ?? 0) + (s.predWrong ?? 0);
  let says;
  if (!won) says = s.bestHit && s.bestHit.dmg >= 15
    ? `„Dein ${s.bestHit.name} mit ${s.bestHit.dmg} Schaden war stark. Nächstes Mal kommst du weiter!“`
    : '„Jeder Fehler ist ein Test, der dir etwas verrät. Versuch es noch einmal.“';
  else if (s.bestHit && s.bestHit.dmg >= 20) says = `„${s.bestHit.dmg} Schaden mit einer einzigen Karte! Genau so rechnet ein Meister.“`;
  else if (preds && s.predRight / preds >= 0.6) says = '„Du liest Code, bevor er läuft. Das ist die halbe Zauberkunst.“';
  else if ((s.riddlesRight ?? 0) >= 2) says = '„Die Rätselgeister reden schon über dich.“';
  else says = '„Sauber gezaubert. Der Verzweiger hat keine Verzweigung mehr übrig.“';
  return `<div class="review">
    <h3>📜 Rückblick</h3>
    <div class="review-grid">
      <div><b>${s.damage ?? 0}</b><small>Schaden insgesamt</small></div>
      <div><b>${s.cardsPlayed ?? 0}</b><small>Karten gespielt</small></div>
      <div><b>${s.predRight ?? 0}/${preds}</b><small>Eingebungen richtig</small></div>
      <div><b>${s.riddlesRight ?? 0}</b><small>Rätsel gelöst</small></div>
    </div>
    ${s.bestHit ? `<p>Dein stärkster Zauber: <b>${esc(s.bestHit.name)}</b> mit ${s.bestHit.dmg} Schaden</p>${codeView(s.bestHit.code, { small: true })}` : ''}
    ${fav ? `<p>Fleißigstes Relikt: ${RELICS[fav[0]].icon} <b>${esc(RELICS[fav[0]].name)}</b> (${fav[1]}-mal ausgelöst)</p>` : ''}
    <p class="mentor">🧙 Der Meister sagt: ${esc(says)}</p></div>`;
}

// ---------- Zauberbuch ----------
function showBook() {
  topbar();
  const b = game.meta.book;
  const cards = Object.entries(CARDS).map(([id, c]) => b.cards.includes(id)
    ? cardView(c, { lesehilfe: false }) : '<div class="card unknown"><b>???</b></div>').join('');
  const relics = Object.keys(RELICS).map((id) => b.relics.includes(id) ? relicView(id)
    : `<div class="relic unknown"><b>???</b><p class="hint small">${RELICS[id].unlock ? `Erfolg: ${esc(ACHIEVEMENTS[RELICS[id].unlock].text)}` : 'Noch nicht gefunden.'}</p></div>`).join('');
  const evos = Object.entries(EVOLUTIONS).map(([id, e]) => {
    const known = b.evos.includes(id);
    const f = FORGES[e.forge];
    return `<div class="evo-entry ${known ? '' : 'unknown'}">
      <span>${e.zutaten.map((z) => b.cards.includes(z) ? esc(CARDS[z].name) : '???').join(' + ')} = <b>${known ? esc(f.karte.name) : '???'}</b></span>
      ${known ? codeView(f.zeilen.join('\n'), { small: true }) : '<p class="hint small">Liegen beide Karten im Deck und ist eine davon verbessert (+), kannst du sie am Rastplatz verschmelzen.</p>'}</div>`;
  }).join('');
  const ach = Object.entries(ACHIEVEMENTS).map(([id, a]) => {
    const done = game.meta.achievements.includes(id);
    return `<li class="${done ? 'done' : ''}">${done ? '🏆' : '🔒'} <b>${esc(a.name)}</b>: ${esc(a.text)} → ${RELICS[a.relic].icon} ${esc(RELICS[a.relic].name)}</li>`;
  }).join('');
  const nCards = b.cards.filter((id) => CARDS[id]).length;
  app().innerHTML = `<div class="book">
    <h2>📖 Zauberbuch</h2>
    <p class="hint">Alles, was du schon entdeckt hast. Rätsel gelöst: ${game.meta.riddles.length} von ${Object.keys(RIDDLES).length}.</p>
    <h3>Karten <small class="tag">${nCards}/${Object.keys(CARDS).length}</small></h3><div class="card-grid">${cards}</div>
    <h3>Evolutionen <small class="tag">${b.evos.length}/${Object.keys(EVOLUTIONS).length}</small></h3><div class="evo-list">${evos}</div>
    <h3>Relikte <small class="tag">${b.relics.length}/${Object.keys(RELICS).length}</small></h3><div class="relic-grid">${relics}</div>
    <h3>Erfolge <small class="tag">${game.meta.achievements.length}/${Object.keys(ACHIEVEMENTS).length}</small></h3><ul class="achievements">${ach}</ul>
    <div class="row"><button class="btn back">Zurück</button></div></div>`;
  app().querySelector('.back').addEventListener('click', showTitle);
}

// ---------- Talentbaum ----------
function showTalents() {
  topbar();
  const meta = game.meta;
  const canRespec = !game.run;
  const lines = Object.entries(TALENTS).map(([id, t]) => {
    const from = t.req ? TALENTS[t.req] : TALENTS.vit;
    if (id === 'vit') return '';
    const on = meta.talents.includes(id);
    return `<line x1="${from.x}" y1="${from.y}" x2="${t.x}" y2="${t.y}" class="${on ? 'on' : ''}"/>`;
  }).join('');
  const nodes = Object.entries(TALENTS).map(([id, t]) => {
    const owned = meta.talents.includes(id);
    const reqOk = !t.req || meta.talents.includes(t.req);
    const buyable = !owned && reqOk && meta.talentPoints > 0;
    return `<button class="tnode ${owned ? 'owned' : ''} ${buyable ? 'buyable' : ''} ${t.cluster}" style="left:${t.x}%;top:${t.y}%" data-t="${id}" ${buyable ? '' : 'aria-disabled="true"'}>
      <b>${esc(t.name)}</b><small>${esc(t.text)}</small></button>`;
  }).join('');
  app().innerHTML = `<div class="talents">
    <h2>Talentbaum <small class="tag">${meta.talentPoints} Punkte frei</small></h2>
    <p class="hint">Talente gelten für alle künftigen Runs. Punkte: Boss-Sieg 3, verlorener Run 1 plus 1 je Elite-Sieg, je 5 Schmiede-Sterne 1.</p>
    <div class="tree"><svg viewBox="0 0 100 100" preserveAspectRatio="none">${lines}</svg>${nodes}
      <span class="cluster-label" style="left:14%;top:0">Glut</span><span class="cluster-label" style="left:86%;top:0">Frost</span>
      <span class="cluster-label" style="left:14%;top:100%">Takt</span><span class="cluster-label" style="left:86%;top:100%">Gelehrte</span></div>
    <div class="row">
      <button class="btn secondary respec" ${canRespec && meta.talents.length ? '' : 'disabled'}>Alle Punkte zurückholen</button>
      <button class="btn back">${game.run ? 'Zurück zum Run' : 'Zurück'}</button>
    </div>
    ${canRespec ? '' : '<p class="hint small">Umverteilen geht zwischen zwei Runs.</p>'}</div>`;
  app().querySelectorAll('.tnode.buyable').forEach((b) => b.addEventListener('click', () => {
    meta.talents.push(b.dataset.t);
    meta.talentPoints--;
    save();
    showTalents();
  }));
  app().querySelector('.respec').addEventListener('click', () => {
    meta.talentPoints += meta.talents.length;
    meta.talents = [];
    save();
    showTalents();
  });
  app().querySelector('.back').addEventListener('click', () => (game.run ? enterPendingOrMap() : showTitle()));
}

// ---------- Start ----------
async function boot() {
  load();
  app().innerHTML = '<div class="title-screen"><p class="sub">Lade den Python-Interpreter …</p></div>';
  try {
    await loadNatter();
  } catch (e) {
    app().innerHTML = `<div class="title-screen"><h1>Natter konnte nicht geladen werden</h1><p class="sub">Das Spiel braucht beim Start eine Internetverbindung (jsDelivr). ${esc(e.message)}</p></div>`;
    return;
  }
  showTitle();
  if (game.meta.runs === 0) showHowto();
}

boot();
