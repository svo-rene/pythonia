// Relikte: kleine Python-Funktionen, die zu festen Zeitpunkten laufen. Die Reihenfolge legt der Spieler fest.
import { RELICS, HOOKS, ACHIEVEMENTS } from './data.js';
import { game, save, shuffle, noteBook } from './state.js';
import { esc, codeView, modal, toast } from './ui.js';
import { explainCode } from './explain.js';

/** Der Code eines Relikts als Python-Funktion. */
export function relicCode(id) {
  const r = RELICS[id];
  return `def ${r.hook}():\n${r.code.split('\n').map((l) => `    ${l}`).join('\n')}`;
}

export function relicView(id, { extra = '', cls = '' } = {}) {
  const r = RELICS[id];
  return `<div class="relic ${cls}" ${extra}>
    <div class="relic-head"><span class="relic-icon">${r.icon}</span><b>${esc(r.name)}</b></div>
    ${codeView(relicCode(id), { small: true })}
    <div class="hint small">Läuft ${esc(HOOKS[r.hook])}.</div></div>`;
}

/** Relikte, die man noch finden kann (ohne Start-Relikte, ohne gesperrte). */
export function relicPool() {
  const run = game.run;
  const builds = !!game.meta.builds;
  return Object.keys(RELICS).filter((k) => !RELICS[k].trait && !run.relics.includes(k)
    && (!RELICS[k].start || builds) && (!RELICS[k].build || builds) && (!RELICS[k].advanced || game.meta.advanced)
    && (!RELICS[k].act || (run.act ?? 1) >= RELICS[k].act)
    && (!RELICS[k].unlock || game.meta.achievements.includes(RELICS[k].unlock)));
}

export function gainRelic(id) {
  game.run.relics.push(id);
  noteBook('relics', id);
  save();
  toast(`${RELICS[id].icon} Relikt <b>${esc(RELICS[id].name)}</b> erhalten. Die Reihenfolge änderst du oben unter „Relikte“.`, 'good');
}

/** Erfolg freischalten: Das passende Relikt kann ab jetzt gefunden werden. */
export function unlockAchievement(id) {
  const meta = game.meta;
  if (meta.achievements.includes(id)) return;
  meta.achievements.push(id);
  save();
  const a = ACHIEVEMENTS[id];
  const r = RELICS[a.relic];
  toast(`🏆 Erfolg <b>${esc(a.name)}</b>! Neues Relikt freigeschaltet: ${r.icon} ${esc(r.name)}`, 'good');
}

/** Wahl aus n Relikten (oder überspringen). */
export function offerRelic(n, done) {
  const opts = shuffle(relicPool()).slice(0, n);
  if (!opts.length) { toast('Du hast schon alle Relikte!'); done(); return; }
  const { el, close } = modal(`<h3>🧿 Wähle ein Relikt</h3>
    <p class="hint">Relikte sind Funktionen. Das Spiel ruft sie zum angegebenen Zeitpunkt selbst auf.</p>
    <div class="relic-grid">${opts.map((id) => relicView(id, { extra: `data-r="${id}"`, cls: 'pickable' })).join('')}</div>
    <div class="row"><button class="btn secondary skip">Keins nehmen</button></div>`, { wide: true });
  el.querySelectorAll('[data-r]').forEach((d) => d.addEventListener('click', () => { close(); gainRelic(d.dataset.r); done(); }));
  el.querySelector('.skip').addEventListener('click', () => { close(); done(); });
}

/** Übersicht mit Reihenfolge: Funktionen mit demselben Zeitpunkt laufen von oben nach unten. */
export function showRelics(onChange = () => {}) {
  const run = game.run;
  const { el, close } = modal('<div class="relic-modal"></div>', { wide: true, onClose: () => onChange() });
  const draw = () => {
    el.querySelector('.relic-modal').innerHTML = `<h3>🧿 Deine Relikte</h3>
      <p class="hint">Jedes Relikt ist eine Funktion. Haben mehrere denselben Zeitpunkt, laufen sie <b>von oben nach unten</b>.
      Die Reihenfolge kann viel ändern: Erst <code>block += 3</code>, dann <code>block *= 2</code> gibt 6. Andersherum nur 3.</p>
      ${run.relics.length ? `<div class="relic-list">${run.relics.map((id, i) => `<div class="relic-row">
        <span class="order">${i + 1}.</span>${relicView(id)}
        <span class="pbtns"><button data-up="${i}" title="nach oben">▲</button><button data-down="${i}" title="nach unten">▼</button><button data-ex="${id}" title="Code erklären">❓</button></span></div>`).join('')}</div>`
        : '<p>Noch keine Relikte. Du findest sie nach Elite-Kämpfen, in ?-Räumen und beim Händler.</p>'}
      <div class="row"><button class="btn ok">Fertig</button></div>`;
    el.querySelectorAll('[data-up]').forEach((b) => b.addEventListener('click', () => {
      const i = Number(b.dataset.up);
      if (i > 0) [run.relics[i - 1], run.relics[i]] = [run.relics[i], run.relics[i - 1]];
      save(); draw();
    }));
    el.querySelectorAll('[data-down]').forEach((b) => b.addEventListener('click', () => {
      const i = Number(b.dataset.down);
      if (i < run.relics.length - 1) [run.relics[i + 1], run.relics[i]] = [run.relics[i], run.relics[i + 1]];
      save(); draw();
    }));
    el.querySelectorAll('[data-ex]').forEach((b) => b.addEventListener('click', () => explainCode(RELICS[b.dataset.ex].name, relicCode(b.dataset.ex))));
    el.querySelector('.ok').addEventListener('click', () => close());
  };
  draw();
}
