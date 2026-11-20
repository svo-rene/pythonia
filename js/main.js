// Einstieg: Titel, Karte des Akts, Talentbaum, Run-Ende, Einstellungen.
import { ROOM_INFO, TALENTS, CONCEPTS, EXP_PER_LEVEL, RUN_SKILLS, HEROES, CARDS, FORGE_LEVEL } from './data.js';
import { game, save, load, newRun, cardDef, exportCode, importCode, resetAll, reachable } from './state.js';
import { heroSprite } from './sprites.js';
import { loadNatter } from './natter.js';
import { startCombat, rerenderCombat } from './combat.js';
import { forgeRoom, debugRoom, shopRoom, restRoom, rewardScreen } from './rooms.js';
import { app, esc, modal, toast, cardView } from './ui.js';

// ---------- Kopfleiste ----------
function topbar() {
  const run = game.run;
  const s = game.meta.settings;
  const el = document.getElementById('topbar');
  el.innerHTML = `
    <button class="brand" data-go="title">🐍 Zauberlehrling</button>
    ${run ? `<span class="pill">❤ ${run.hp}/${run.maxHp}</span><span class="pill">💰 ${run.gold}</span>
      <span class="pill" title="Erfahrung">Lv ${run.level} · ${run.exp}/${EXP_PER_LEVEL} EXP</span>
      <button class="pill btnlike" data-go="deck">🂠 Deck ${run.deck.length}</button>` : ''}
    <span class="spacer"></span>
    <label class="toggle"><input type="checkbox" data-set="lesehilfe" ${s.lesehilfe ? 'checked' : ''}> Lesehilfe</label>
    <label class="toggle"><input type="checkbox" data-set="tempo" ${s.tempo === 'schnell' ? 'checked' : ''}> Schnell</label>`;
  el.querySelector('[data-go="title"]').onclick = () => { if (!document.querySelector('.combat') || confirm('Zum Titel? Der Kampf startet beim Fortsetzen neu.')) showTitle(); };
  el.querySelector('[data-go="deck"]')?.addEventListener('click', showDeck);
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
    <div class="card-grid">${run.deck.map((c) => cardView(cardDef(c), { lesehilfe: game.meta.settings.lesehilfe })).join('')}</div>
    <div class="row"><button class="btn ok">Schließen</button></div>`, { wide: true, onClose: () => {} });
  el.querySelector('.ok').addEventListener('click', close);
}

// ---------- Titel ----------
function showTitle() {
  topbar();
  const run = game.run;
  const m = game.meta;
  app().innerHTML = `<div class="title-screen">
    <h1>🐍 Zauberlehrling</h1>
    <p class="sub">Ein Deckbuilder, in dem deine Zauber Python sind.<br>Lies Code im Kampf, schreibe Code in der Schmiede, repariere Bugs.</p>
    <div class="menu">
      ${run ? '<button class="btn big" data-a="continue">Run fortsetzen</button>' : ''}
      <button class="btn big ${run ? 'secondary' : ''}" data-a="new">Neuer Run</button>
      <button class="btn secondary" data-a="talents">Talentbaum ${m.talentPoints ? `(${m.talentPoints} Punkte frei)` : ''}</button>
      <button class="btn secondary" data-a="howto">So funktioniert's</button>
      <button class="btn secondary" data-a="saves">Spielstand</button>
    </div>
    <p class="hint small">Runs: ${m.runs} · Siege: ${m.wins} · Prototyp, Akt 1</p></div>`;
  app().querySelector('[data-a="continue"]')?.addEventListener('click', () => { enterPendingOrMap(); });
  app().querySelector('[data-a="new"]').addEventListener('click', () => {
    if (run && !confirm('Den laufenden Run abbrechen und neu beginnen?')) return;
    showHeroSelect();
  });
  app().querySelector('[data-a="talents"]').addEventListener('click', showTalents);
  app().querySelector('[data-a="howto"]').addEventListener('click', showHowto);
  app().querySelector('[data-a="saves"]').addEventListener('click', showSaves);
}

function showHowto() {
  const { el, close } = modal(`<h3>So funktioniert's</h3>
    <ul class="howto">
      <li><b>Karten sind Python.</b> Beim Ausspielen läuft der Code Zeile für Zeile, rechts siehst du die Variablen.</li>
      <li><b>Gegner zeigen ihre Absicht als Code.</b> Lies ihn, bevor du entscheidest. Er läuft mit den Werten nach deinem Zug.</li>
      <li><b>Vorhersagen:</b> Sag vorher, was eine Karte bewirkt. Stimmt es, wirkt sie 1,5-mal so stark.</li>
      <li><b>Schmiede:</b> Schreibe oder ordne Code. Bestehen alle Tests, wird dein Code zu einer neuen Karte.</li>
      <li><b>Debug-Raum:</b> Bug-Karten haben typische Fehler. Repariert werden sie stärker.</li>
      <li><b>Händler:</b> Lerne neue Python-Konzepte (elif, for, while). Sie bringen neue Karten.</li>
      <li><b>Kämpfe</b> geben Gold, <b>Schmieden</b> geben EXP. Ab 50 EXP steigst du ein Level auf.</li>
      <li><b>Talentbaum:</b> Auch verlorene Runs geben Punkte.</li>
    </ul><div class="row"><button class="btn ok">Los geht's</button></div>`, { onClose: () => {} });
  el.querySelector('.ok').addEventListener('click', close);
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
function showHeroSelect() {
  topbar();
  const heroes = Object.entries(HEROES).map(([id, h]) => {
    const counts = {};
    for (const c of h.deck) counts[c] = (counts[c] ?? 0) + 1;
    const deck = Object.entries(counts).map(([c, n]) => `${n}× ${esc(CARDS[c].name)}`).join(', ');
    return `<button class="hero-pick" data-hero="${id}">
      <div class="hero-pick-fig">${heroSprite(id)}</div>
      <b>${esc(h.name)}</b>
      <span class="hint small">${esc(h.text)}</span>
      <span class="hero-stat">❤ ${h.hp} Leben</span>
      <span class="hero-gabe"><b>${esc(h.gabe)}:</b> ${esc(h.gabeText)}</span>
      <span class="hero-deck">${deck}</span></button>`;
  }).join('');
  app().innerHTML = `<div class="hero-select">
    <h2>Wähle deine Figur</h2>
    <p class="hint">Jede Figur startet mit anderen Karten. Was du in der Schmiede baust, gehört trotzdem allen.</p>
    <div class="hero-list">${heroes}</div>
    <div class="row center"><button class="btn secondary back">Zurück</button></div></div>`;
  app().querySelectorAll('[data-hero]').forEach((b) => b.addEventListener('click', () => {
    newRun(b.dataset.hero);
    showMap();
  }));
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
    <div class="map-head"><h2>Akt 1: Die Höhle der Verzweigungen</h2>
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
    run.pending = id;
    save();
    enterRoom(nodes[id]);
  }));
  // zur aktuellen Ebene scrollen
  const target = app().querySelector('.mnode.open') ?? app().querySelector('.mnode.here');
  target?.scrollIntoView({ block: 'center' });
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
  if (run.pos === 'boss') { runOver(true); return; }
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
  topbar();
}

// ---------- Run-Ende ----------
function runOver(won) {
  const run = game.run;
  const meta = game.meta;
  const points = won ? 3 : 1 + run.elitesWon;
  meta.talentPoints += points;
  if (won) meta.wins++;
  game.run = null;
  save();
  topbar();
  app().innerHTML = `<div class="title-screen">
    <h1>${won ? '♛ Sieg über den Verzweiger!' : 'Der Run ist vorbei'}</h1>
    <p class="sub">${won ? 'Akt 1 ist geschafft. In Akt 2 warten Schleifen und Listen.' : 'Kein Run ist verschwendet: Du bekommst trotzdem Talentpunkte.'}</p>
    <p>+${points} Talentpunkt${points === 1 ? '' : 'e'}${!won && run.elitesWon ? ` (1 + ${run.elitesWon} für Elite-Siege)` : ''}</p>
    <p class="hint">${run.path.length} Räume geschafft · Level ${run.level} · ${run.forgesDone.length} Schmieden gelöst</p>
    <div class="menu"><button class="btn big" data-a="talents">Zum Talentbaum</button><button class="btn secondary" data-a="new">Neuer Run</button></div></div>`;
  app().querySelector('[data-a="talents"]').addEventListener('click', showTalents);
  app().querySelector('[data-a="new"]').addEventListener('click', showHeroSelect);
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
