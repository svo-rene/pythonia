// Geführte Einführung: Ein Zeigefinger zeigt beim ersten Mal, was wohin gehört.
// Jede Einführung läuft nur einmal (gemerkt in meta.tut) und lässt sich in „So funktioniert's“ zurücksetzen.
import { game, save } from './state.js';

let active = null;

export const tutorialSeen = (key) => !!game.meta.tut?.[key];

export function resetTutorials() {
  game.meta.tut = {};
  save();
}

/**
 * Startet eine Einführung.
 * Schritt: { sel: string|() => Element, text, click?: true (weiter beim Antippen des Elements),
 *            until?: () => boolean (weiter, sobald wahr), sonst Knopf „Weiter“ }
 */
export function runTutorial(key, steps) {
  game.meta.tut ??= {};
  if (game.meta.tut[key] || active) return;
  const root = document.createElement('div');
  root.id = 'coach';
  root.innerHTML = `<div class="coach-ring"></div><div class="coach-finger">👆</div>
    <div class="coach-bubble"><div class="coach-text"></div>
      <div class="coach-btns"><button class="btn small coach-next">Weiter</button><button class="coach-skip">Einführung beenden</button></div></div>`;
  document.body.appendChild(root);
  active = { key, steps, i: -1, root, scrolled: false, raf: 0 };
  root.querySelector('.coach-next').addEventListener('click', () => next());
  root.querySelector('.coach-skip').addEventListener('click', () => finish());
  document.addEventListener('click', onClick, true);
  next();
  loop();
}

function find(step) {
  try { return typeof step.sel === 'function' ? step.sel() : document.querySelector(step.sel); } catch { return null; }
}

function onClick(e) {
  if (!active) return;
  const step = active.steps[active.i];
  if (!step?.click) return;
  const el = find(step);
  if (el && el.contains(e.target)) setTimeout(next, 60);
}

function next() {
  if (!active) return;
  active.i++;
  if (active.i >= active.steps.length) { finish(); return; }
  const step = active.steps[active.i];
  active.scrolled = false;
  active.root.querySelector('.coach-text').innerHTML = step.text;
  const last = active.i === active.steps.length - 1;
  const btn = active.root.querySelector('.coach-next');
  btn.style.display = step.click || step.until ? 'none' : '';
  btn.textContent = last ? 'Los geht’s!' : 'Weiter';
  active.root.querySelector('.coach-bubble').classList.remove('coach-pop');
  void active.root.offsetWidth;
  active.root.querySelector('.coach-bubble').classList.add('coach-pop');
}

function finish() {
  if (!active) return;
  cancelAnimationFrame(active.raf);
  document.removeEventListener('click', onClick, true);
  active.root.remove();
  game.meta.tut[active.key] = true;
  save();
  active = null;
}

/** Hält Finger, Ring und Sprechblase an ihrem Element, auch wenn das Spiel neu zeichnet. */
function loop() {
  if (!active) return;
  const step = active.steps[active.i];
  if (step?.until && step.until()) { next(); }
  const el = step ? find(step) : null;
  const ring = active.root.querySelector('.coach-ring');
  const finger = active.root.querySelector('.coach-finger');
  const bubble = active.root.querySelector('.coach-bubble');
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  if (el && el.getClientRects().length) {
    if (!active.scrolled) { el.scrollIntoView({ block: 'center', behavior: 'smooth' }); active.scrolled = true; }
    const r = el.getBoundingClientRect();
    ring.style.display = finger.style.display = '';
    Object.assign(ring.style, { left: `${r.left - 6}px`, top: `${r.top - 6}px`, width: `${r.width + 12}px`, height: `${r.height + 12}px` });
    const below = r.bottom + 150 < vh;
    finger.textContent = below ? '👆' : '👇';
    const fx = Math.min(vw - 40, Math.max(8, r.left + r.width / 2 - 18));
    finger.style.left = `${fx}px`;
    finger.style.top = below ? `${r.bottom + 4}px` : `${r.top - 46}px`;
    finger.classList.toggle('up', below);
    const bw = Math.min(340, vw - 32);
    bubble.style.width = `${bw}px`;
    bubble.style.left = `${Math.min(vw - bw - 16, Math.max(16, r.left + r.width / 2 - bw / 2))}px`;
    const bh = bubble.offsetHeight;
    bubble.style.top = below ? `${Math.min(vh - bh - 8, r.bottom + 50)}px` : `${Math.max(8, r.top - 54 - bh)}px`;
  } else {
    ring.style.display = finger.style.display = 'none';
    const bw = Math.min(380, vw - 32);
    bubble.style.width = `${bw}px`;
    bubble.style.left = `${(vw - bw) / 2}px`;
    bubble.style.top = `${vh - bubble.offsetHeight - 24}px`;
  }
  active.raf = requestAnimationFrame(loop);
}

// ---------- Die Einführungen ----------
const card = (name) => () => [...document.querySelectorAll('.hand .card:not(.cant)')].find((c) => c.querySelector('.name')?.textContent === name)
  ?? document.querySelector('.hand .card:not(.cant)');
const running = () => document.querySelector('.side-panel.left .panel-title')?.textContent.startsWith('Zauber');
const idle = () => !running() && !!document.querySelector('.end-turn:not([disabled])');

export function tutorialMap() {
  runTutorial('karte', [
    { sel: '.cave', text: '<b>Willkommen in Pythonia!</b> Das ist die Höhle der Verzweigungen. Jedes Symbol ist ein Raum, oben wartet der Boss.' },
    { sel: '.mnode.open', text: 'Du kannst nur den Linien nach oben folgen. Tippe auf einen <b>leuchtenden Raum</b>.', click: true },
  ]);
}

export function tutorialCombat() {
  runTutorial('kampf', [
    { sel: '.fighter.hero', text: 'Das bist <b>du</b>. Die gelbe Kugel ist deine <b>Energie</b>, der rote Balken dein <b>Leben</b>.' },
    { sel: '.foe .intent', text: 'Das ist ein <b>Gegner</b>. Über ihm steht als Python-Code, was er vorhat. Steht da zum Beispiel <code>leben -= 6</code>, will er dir 6 Leben abziehen. Mit <b>❓</b> lässt du dir jeden Code erklären.' },
    { sel: '.side-panel.left', text: 'Das sind <b>deine Variablen</b>. Deine Karten lesen und ändern sie.' },
    { sel: '.side-panel.right', text: 'Und das sind die <b>Variablen der Gegner</b>. <code>ziel_leben</code> ist das Leben des Gegners, den du angreifst.' },
    { sel: card('Funke'), text: 'Unten liegen deine <b>Karten</b>. Jede Karte ist ein Stück Python. Tippe auf <b>Funke</b>.', until: () => !!document.querySelector('.sel-bar') },
    { sel: '.sel-bar .play', text: 'Die Zahl oben links auf der Karte kostet Energie. <b>Spiel die Karte aus!</b>', click: true },
    { sel: '.side-panel.left', text: 'Schau zu: Der Code läuft <b>Zeile für Zeile</b>. Rechts wird <code>ziel_leben</code> kleiner.', until: () => idle() },
    { sel: card('Schutz'), text: '<b>Schutz</b> gibt dir Block. Block fängt Schaden ab, bevor er dein Leben trifft. Tippe auf Schutz.', until: () => !!document.querySelector('.sel-bar') },
    { sel: '.sel-bar .play', text: 'Und ausspielen!', click: true },
    { sel: '.side-panel.left', text: `Achte auf <code>block</code> in deinen Variablen.`, until: () => idle() },
    { sel: '.end-turn', text: 'Wenn du fertig bist: <b>Zug beenden</b>. Dann führt der Gegner seinen Code aus.', click: true },
    { sel: '.side-panel.right', text: 'Jetzt rechnet der Gegner. Dein Block fängt einen Teil ab.', until: () => idle() },
    { sel: '.hand', text: 'Du bist wieder dran, mit neuen Karten und voller Energie. <b>Besiege den Gegner!</b> Manchmal leuchtet eine Karte lila: Das ist eine 🔮 <b>Eingebung</b>. Sagst du vorher, was sie bewirkt, wirkt sie doppelt.' },
  ]);
}

export function tutorialForge(mode) {
  runTutorial('schmiede', [
    { sel: '.auftrag', text: 'In der <b>Schmiede</b> baust du selbst eine neue Karte. Hier steht, was dein Code können soll.' },
    { sel: '.forge .col:last-child', text: 'Die <b>Tests</b> probieren deinen Code mit verschiedenen Startwerten aus. Alle müssen stimmen.' },
    ...(mode === 'parsons' ? [
      { sel: '[data-pool]', text: 'Tippe die Zeilen in der <b>richtigen Reihenfolge</b> an. Achtung: Eine Zeile ist zu viel!', until: () => !!document.querySelector('.pline.placed') },
      { sel: '.pline.placed .pbtns', text: 'Falsch einsortiert? Mit ▲ ▼ verschiebst du eine Zeile, mit ✕ nimmst du sie wieder heraus. Die Einrückung ist schon richtig.' },
    ] : [
      { sel: '.editor', text: 'Schreib deinen Code hier hinein. Mit der <b>Tab-Taste</b> rückst du ein.' },
    ]),
    { sel: '.check', text: 'Fertig? <b>Prüfen!</b> Grün heißt: Test bestanden. Nach dem ersten Prüfen kannst du dir Hinweise holen. Ohne Hinweise gibt es mehr Sterne.' },
  ]);
}

export function tutorialDebug() {
  runTutorial('debug', [
    { sel: '.auftrag', text: 'Im <b>Debug-Raum</b> ist eine Karte kaputt. Hier steht, was sie eigentlich tun soll.' },
    { sel: '.editor', text: 'Finde den <b>Fehler</b> im Code und verbessere ihn direkt hier.' },
    { sel: '.check', text: 'Dann prüfen. Repariert wird die Karte sogar <b>stärker</b> als vorher.' },
  ]);
}

export function tutorialRiddle() {
  runTutorial('raetsel', [
    { sel: '.event-box pre', text: 'Ein <b>Rätsel</b>: Lies den Code und rechne im Kopf Zeile für Zeile mit.' },
    { sel: '.riddle-input', text: 'Tipp ein, welchen Wert die Variable <b>am Ende</b> hat. Du hast nur einen Versuch. Danach siehst du die Lösung Schritt für Schritt.' },
  ]);
}

export function tutorialShop() {
  runTutorial('haendler', [
    { sel: '.shop .offers', text: 'Beim <b>Händler</b> lernst du neue Python-Konzepte wie <code>for</code>. Erst kommt eine kleine Frage, bezahlt wird nur bei richtiger Antwort.' },
    { sel: '.shop .remove', text: '<b>Karten entfernen</b> macht dein Deck schlanker. Dann ziehst du deine besten Karten öfter.' },
  ]);
}

export function tutorialRest() {
  runTutorial('rast', [
    { sel: '.rest .choices', text: 'Am <b>Rastplatz</b> wählst du eins: heilen, eine Karte verbessern oder zwei Karten zu einer <b>Evolution</b> verschmelzen.' },
  ]);
}

export function tutorialReward() {
  runTutorial('belohnung', [
    { sel: '.reward .card-grid', text: 'Nach jedem Sieg darfst du eine Karte nehmen. <b>Überspringen</b> ist auch klug: Ein kleines Deck ist oft stärker.' },
  ]);
}


export function tutorialAct2() {
  runTutorial('akt2', [
    { sel: '.kristalle', text: '<b>Neu in den Listengruben:</b> deine Liste <code>kristalle</code>. Jedes blaue Kästchen ist ein Kristall, darunter steht sein <b>Index</b> (die Position, ab 0 gezählt).' },
    { sel: card('Kristall formen'), text: '<b>Kristall formen</b> hängt mit <code>append()</code> einen Kristall hinten an die Liste. Tippe die Karte an.', until: () => !!document.querySelector('.sel-bar') },
    { sel: '.sel-bar .play', text: 'Ausspielen!', click: true },
    { sel: '.kristalle', text: 'Schau auf die Liste …', until: () => idle() },
    { sel: '.kristalle', text: 'Da ist der Kristall! <b>Kristallwurf</b> nimmt mit <code>pop()</code> den <b>letzten</b> Kristall heraus und wirft ihn. Und Vorsicht: Manche Gegner stehlen Kristalle oder drehen deine Liste um.' },
    { sel: '.zeit-badge', text: '⏱ <b>Rechenzeit:</b> In den Listengruben darf dein Code pro Zug nur begrenzt viele Schritte machen. Jede Karte zeigt oben rechts, wie viele sie braucht. Schleifen kosten viele Schritte, zwei ineinander besonders viele!' },
  ]);
}

export function tutorialBuilds() {
  runTutorial('builds', [
    { sel: '.relic-strip', text: 'Deine Figur hat eine <b>Grundeigenschaft</b>, oben links als Relikt. Tippe es an, um seinen Code zu sehen. Darauf kannst du dein Deck aufbauen.' },
    { sel: '.side-panel.right', text: 'Manche Karten verändern neue Werte: <code>ziel_brand</code> (Schaden jede Runde), <code>ziel_schwach</code> (macht weniger Schaden), <code>ziel_verwundbar</code> (nimmt mehr Schaden). Sie erscheinen hier, sobald sie nicht 0 sind, und als Symbole am Gegner.' },
    { sel: '.side-panel.left', text: 'Bei dir kann <code>dornen</code> dazukommen: Wer dich angreift, bekommt so viel Schaden zurück. Bau dein Deck um eine Spielweise herum, oder mische sie!' },
  ]);
}

export function tutorialAct3() {
  runTutorial('akt3', [
    { sel: '.foe .intent', text: '<b>Im Spiegelturm</b> rechnen die Gegner mit Funktionen: <code>def</code> legt eine an, <code>return</code> gibt das Ergebnis zurück. Mit ❓ siehst du Schritt für Schritt, was passiert.' },
    { sel: '.foe', text: 'Ein <b>Spiegelschleim</b> teilt sich, wenn er fällt: in zwei halb so große. Die teilen sich wieder, bis sie zu klein sind. Genau so arbeitet eine Rekursion mit Abbruch.' },
  ]);
}

export function tutorialAct4() {
  runTutorial('akt4', [
    { sel: '.foe .intent', text: '<b>In der Klassenfestung</b> ist jeder Gegner ein Objekt. <code>class</code> ist der Bauplan, <code>__init__</code> legt fest, was sich das Objekt merkt (<code>self.…</code>), und Methoden sind seine Fähigkeiten. ❓ erklärt jede Zeile.' },
    { sel: '.hand', text: 'Auch deine Karten bauen jetzt Objekte, zum Beispiel ein Schild, das mit <code>halten()</code> Block gibt. Und Vorsicht: Manche Gegner bauen mit einer Methode neue Gegner!' },
  ]);
}
