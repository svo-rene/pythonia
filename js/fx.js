// Kampfeffekte: Ausfallschritt, Geschosse, Schild, Heilung, Krallenhiebe.
// Die Effekte laufen in einer eigenen Ebene über der Seite, damit das Neuzeichnen sie nicht abbricht.

const COLORS = { magierin: '#ffb03b', waechter: '#8fd0ff', orakel: '#b48bff', eishexe: '#9fe8ff', gaukler: '#ff7ad9' };
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

function layer() {
  let l = document.getElementById('fx-layer');
  if (!l) {
    l = document.createElement('div');
    l.id = 'fx-layer';
    document.body.appendChild(l);
  }
  return l;
}

const center = (el) => {
  const r = el.getBoundingClientRect();
  return { x: r.left + r.width / 2, y: r.top + r.height / 2, w: r.width, h: r.height };
};

const heroEl = () => document.querySelector('.hero .sprite');
const foeEl = (i) => document.querySelector(`[data-target="${i}"] .sprite`);

function spawn(cls, x, y, html = '') {
  const d = document.createElement('div');
  d.className = `fx ${cls}`;
  d.style.left = `${x}px`;
  d.style.top = `${y}px`;
  d.innerHTML = html;
  layer().appendChild(d);
  return d;
}

/** Figur macht einen Schritt nach vorn (dir = 1 nach rechts, -1 nach links). */
function lunge(el, dir, t) {
  if (!el) return;
  el.animate([
    { transform: 'translateX(0)' },
    { transform: `translateX(${-8 * dir}px)`, offset: 0.25 },
    { transform: `translateX(${34 * dir}px) scale(1.05)`, offset: 0.55 },
    { transform: 'translateX(0)' },
  ], { duration: 520 * t, easing: 'ease-out' });
}

function flash(el, color, t) {
  if (!el) return;
  el.animate([
    { filter: 'brightness(1)' },
    { filter: `brightness(1.8) drop-shadow(0 0 14px ${color})` },
    { filter: 'brightness(1)' },
  ], { duration: 380 * t });
}

/** Geschoss vom Helden zum Gegner. */
async function bolt(fromEl, toEl, color, t) {
  if (!fromEl || !toEl) return;
  const a = center(fromEl);
  const b = center(toEl);
  const sx = a.x + a.w * 0.3;
  const sy = a.y - a.h * 0.2;
  const o = spawn('bolt', sx, sy);
  o.style.setProperty('--c', color);
  const dx = b.x - sx;
  const dy = b.y - sy;
  const anim = o.animate([
    { transform: 'translate(-50%,-50%) translate(0,0) scale(.6)' },
    { transform: `translate(-50%,-50%) translate(${dx * 0.5}px,${dy * 0.5 - 40}px) scale(1)`, offset: 0.5 },
    { transform: `translate(-50%,-50%) translate(${dx}px,${dy}px) scale(1.1)` },
  ], { duration: 340 * t, easing: 'ease-in' });
  await anim.finished;
  o.remove();
  burst(b.x, b.y, color, t);
  flash(toEl, color, t);
  toEl.animate([{ transform: 'translateX(0)' }, { transform: 'translateX(10px)' }, { transform: 'translateX(0)' }], { duration: 200 * t });
}

function burst(x, y, color, t) {
  const o = spawn('burst', x, y);
  o.style.setProperty('--c', color);
  o.animate([{ transform: 'translate(-50%,-50%) scale(.2)', opacity: 1 }, { transform: 'translate(-50%,-50%) scale(1.6)', opacity: 0 }],
    { duration: 380 * t, easing: 'ease-out' }).finished.then(() => o.remove());
  for (let i = 0; i < 7; i++) {
    const p = spawn('spark', x, y);
    p.style.setProperty('--c', color);
    const ang = (Math.PI * 2 * i) / 7 + Math.random();
    const r = 30 + Math.random() * 30;
    p.animate([{ transform: 'translate(-50%,-50%)', opacity: 1 },
      { transform: `translate(-50%,-50%) translate(${Math.cos(ang) * r}px,${Math.sin(ang) * r}px)`, opacity: 0 }],
    { duration: 450 * t, easing: 'ease-out' }).finished.then(() => p.remove());
  }
}

function shield(el, t, broken = false) {
  if (!el) return Promise.resolve();
  const c = center(el);
  const o = spawn(`shield ${broken ? 'broken' : ''}`, c.x, c.y);
  o.style.width = o.style.height = `${Math.max(c.w, c.h) * 1.15}px`;
  const frames = broken
    ? [{ transform: 'translate(-50%,-50%) scale(1)', opacity: 1 }, { transform: 'translate(-50%,-50%) scale(1.3) rotate(8deg)', opacity: 0 }]
    : [{ transform: 'translate(-50%,-50%) scale(.5)', opacity: 0 }, { transform: 'translate(-50%,-50%) scale(1)', opacity: 1, offset: 0.4 }, { transform: 'translate(-50%,-50%) scale(1.05)', opacity: 0 }];
  return o.animate(frames, { duration: 650 * t, easing: 'ease-out' }).finished.then(() => o.remove());
}

/** Aufsteigende Teilchen: Heilung (grün, +) oder Stärkung (gold, ▲). */
function rise(el, color, symbol, t) {
  if (!el) return Promise.resolve();
  const c = center(el);
  const all = [];
  for (let i = 0; i < 6; i++) {
    const p = spawn('rise', c.x + (Math.random() - 0.5) * c.w * 0.8, c.y + c.h * 0.3, symbol);
    p.style.color = color;
    all.push(p.animate([{ transform: 'translate(-50%,-50%)', opacity: 0 }, { opacity: 1, offset: 0.2 },
      { transform: `translate(-50%,-50%) translateY(${-50 - Math.random() * 40}px)`, opacity: 0 }],
    { duration: (600 + i * 60) * t, delay: i * 50 * t, easing: 'ease-out' }).finished.then(() => p.remove()));
  }
  flash(el, color, t);
  return Promise.all(all);
}

function slash(el, t) {
  if (!el) return;
  const c = center(el);
  for (let i = 0; i < 3; i++) {
    const s = spawn('slash', c.x + (i - 1) * 14, c.y);
    s.animate([{ transform: 'translate(-50%,-50%) rotate(-35deg) scaleY(0)', opacity: 1 },
      { transform: 'translate(-50%,-50%) rotate(-35deg) scaleY(1)', opacity: 1, offset: 0.5 },
      { transform: 'translate(-50%,-50%) rotate(-35deg) scaleY(1)', opacity: 0 }],
    { duration: 320 * t, delay: i * 50 * t }).finished.then(() => s.remove());
  }
  flash(el, '#ff4a5e', t);
}

/**
 * Effekt einer ausgespielten Karte.
 * hits: Liste von Gegner-Indizes in Treffer-Reihenfolge; dazu Block-, Heil- und Stärke-Änderungen.
 */
export async function cardFx({ hero, hits, blockGain, heal, selfDamage, buff }, speed) {
  const t = speed;
  const h = heroEl();
  const color = COLORS[hero] ?? '#ffb03b';
  if (hits.length) {
    lunge(h, 1, t);
    await wait(160 * t);
    const shots = hits.slice(0, 8);
    for (let k = 0; k < shots.length; k++) {
      const p = bolt(h, foeEl(shots[k]), color, t);
      if (k === shots.length - 1) await p; else await wait(130 * t);
    }
  }
  const extra = [];
  if (blockGain > 0) extra.push(shield(h, t));
  if (heal > 0) extra.push(rise(h, '#7be38f', '+', t));
  if (buff) extra.push(rise(h, '#ffcc4d', '▲', t));
  if (selfDamage > 0) flash(h, '#ff4a5e', t);
  await Promise.all(extra);
  if (!hits.length && !extra.length) await wait(150 * t);
}

/** Effekt einer Gegneraktion. */
export async function enemyFx(index, { dmg, breaksBlock, heal, buff }, speed) {
  const t = speed;
  const e = foeEl(index);
  const h = heroEl();
  if (dmg > 0 || breaksBlock) {
    lunge(e, -1, t);
    await wait(260 * t);
    if (breaksBlock) await shield(h, t, true);
    if (dmg > 0) slash(h, t);
    await wait(260 * t);
  }
  if (heal > 0) await rise(e, '#7be38f', '+', t);
  if (buff) await rise(e, '#ff6b7a', '▲', t);
}
