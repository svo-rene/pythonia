// Gezeichnete Weltkarte: goldener Lernweg von der Höhle (unten links) bis zur Klassenfestung (oben rechts),
// Nebenwege zu den freien Welten. Jeder Ort hat ein Wahrzeichen, das zum Thema passt.
// Koordinaten im viewBox 0 0 1000 660; die Beschriftungen sind HTML-Knöpfe darüber (Prozentangaben).

export const KARTE_B = 1000;
export const KARTE_H = 660;

// Ort: Ankerpunkt (Wahrzeichen) und Lage der Beschriftung
export const ORTE = {
  akt1: { x: 160, y: 515, lx: 160, ly: 590 },
  akt2: { x: 430, y: 478, lx: 430, ly: 540 },
  akt3: { x: 700, y: 392, lx: 700, ly: 452 },
  akt4: { x: 880, y: 205, lx: 880, ly: 262 },
  kasino: { x: 92, y: 330, lx: 92, ly: 392 },
  arena: { x: 285, y: 352, lx: 285, ly: 420 },
  rudel: { x: 480, y: 305, lx: 480, ly: 362 },
  bibliothek: { x: 590, y: 572, lx: 590, ly: 630 },
};

const WEG = [
  'M160 557 C 250 585, 340 505, 430 482',
  'M430 480 C 520 462, 610 430, 700 402',
  'M700 402 C 790 375, 830 300, 880 218',
];
const NEBENWEG = {
  kasino: 'M148 488 Q 100 430 95 372',
  arena: 'M185 495 Q 240 430 278 392',
  rudel: 'M440 458 Q 472 390 478 345',
  bibliothek: 'M468 492 Q 540 530 580 560',
};

// ---------- Wahrzeichen (lokale Koordinaten um den Anker) ----------
const HOEHLE = `
  <path d="M-115 42 Q-98 -55 -25 -82 Q38 -100 92 -52 Q124 -14 118 42 Z" fill="#4a3d66" stroke="#2a2142" stroke-width="3"/>
  <path d="M-80 -20 Q-60 -50 -30 -62" stroke="#6a5a8c" stroke-width="5" fill="none" stroke-linecap="round"/>
  <path d="M-38 42 Q-40 -22 0 -30 Q40 -22 38 42 Z" fill="#0c0917"/>
  <g stroke="#ffcc4d" stroke-width="3.5" fill="none" stroke-linecap="round" class="wk-glimmen">
    <path d="M0 38 L0 8 M0 8 L-17 -14 M0 8 L17 -14"/>
  </g>
  <circle cx="-17" cy="-14" r="4.5" fill="#7ee0c3"/><circle cx="17" cy="-14" r="4.5" fill="#ff8a8a"/>
  <text x="-17" y="-24" font-size="11" text-anchor="middle" fill="#7ee0c3" font-family="monospace">if</text>
  <text x="19" y="-24" font-size="11" text-anchor="middle" fill="#ff8a8a" font-family="monospace">else</text>
  <rect x="-62" y="2" width="4" height="22" fill="#6b4a2a"/>
  <path d="M-60 2 Q-67 -8 -60 -16 Q-53 -8 -60 2 Z" fill="#ffb347" class="wk-flamme"/>
  <ellipse cx="70" cy="38" rx="16" ry="7" fill="#3a3052"/><ellipse cx="-95" cy="38" rx="12" ry="6" fill="#3a3052"/>`;

function grube(i) {
  const farben = ['#7ee0c3', '#ff8fd0', '#ffcc4d', '#8fb8ff', '#b78cff'];
  const x = -100 + i * 42;
  return `<rect x="${x}" y="-14" width="34" height="28" rx="3" fill="#120e20" stroke="#7a6a9c" stroke-width="2"/>
    <path d="M${x + 17} -9 L${x + 25} 0 L${x + 17} 9 L${x + 9} 0 Z" fill="${farben[i]}" class="wk-kristall" style="animation-delay:${i * 0.35}s"/>
    <text x="${x + 17}" y="32" font-size="12" text-anchor="middle" fill="#b9a9e0" font-family="monospace">${i}</text>`;
}
const GRUBEN = `
  <ellipse cx="0" cy="6" rx="132" ry="40" fill="#3a2f55"/>
  <g transform="translate(-150 -10)">
    <path d="M-14 24 L0 -40 L14 24 M-8 0 L8 0" stroke="#8a6a44" stroke-width="4" fill="none"/>
    <circle cx="0" cy="-40" r="9" fill="none" stroke="#b08a5a" stroke-width="3"/>
    <path d="M0 -31 L0 18" stroke="#c9b48a" stroke-width="1.5"/>
  </g>
  <text x="-118" y="12" font-size="46" fill="#ffcc4d" opacity=".75" font-family="monospace" text-anchor="middle">[</text>
  <text x="118" y="12" font-size="46" fill="#ffcc4d" opacity=".75" font-family="monospace" text-anchor="middle">]</text>
  ${[0, 1, 2, 3, 4].map(grube).join('')}`;

const TURM = `
  <rect x="-24" y="-165" width="48" height="165" fill="#6f6a9c" stroke="#3f3a66" stroke-width="3"/>
  <path d="M-24 -110 L24 -110 M-24 -55 L24 -55" stroke="#5b5688" stroke-width="2"/>
  <path d="M-32 -165 L0 -218 L32 -165 Z" fill="#9b8fd6" stroke="#3f3a66" stroke-width="3"/>
  <rect x="-14" y="-150" width="28" height="34" fill="#1b1533" stroke="#ffcc4d" stroke-width="2"/>
  <rect x="-9" y="-144" width="18" height="22" fill="none" stroke="#ffcc4d" stroke-width="1.6"/>
  <rect x="-5" y="-139" width="10" height="12" fill="none" stroke="#ffcc4d" stroke-width="1.2"/>
  <rect x="-2" y="-135" width="4" height="5" fill="#ffcc4d"/>
  <rect x="-10" y="-30" width="20" height="30" rx="10" fill="#1b1533"/>`;
const SPIEGELTURM = `
  <defs><clipPath id="wk-see"><ellipse cx="0" cy="22" rx="118" ry="30"/></clipPath></defs>
  <ellipse cx="0" cy="22" rx="118" ry="30" fill="#23476b"/>
  <g clip-path="url(#wk-see)" opacity=".38"><g transform="translate(0 8) scale(1 -0.45)">${TURM}</g></g>
  <path d="M-80 22 L-40 22 M20 30 L70 30 M-30 38 L10 38" stroke="#9fd0ff" stroke-width="2" opacity=".5" stroke-linecap="round"/>
  <g transform="translate(0 6)">${TURM}</g>
  <circle cx="0" cy="-226" r="6" fill="#ffcc4d" class="wk-glimmen"/>`;

const KLASSENTURM = `
  <rect x="-15" y="-62" width="30" height="62" fill="#7a7290" stroke="#3a3350" stroke-width="2.5"/>
  <path d="M-15 -62 v-10 h8 v6 h7 v-6 h7 v6 h8 v-6 h0 v10" fill="#7a7290" stroke="#3a3350" stroke-width="2.5"/>
  <rect x="-5" y="-48" width="10" height="14" rx="5" fill="#1b1533"/>
  <path d="M0 -72 L0 -96" stroke="#d8d0e8" stroke-width="2"/>`;
function klassenturm(x, farbe, h) {
  return `<g transform="translate(${x} 0) scale(1 ${h})"><g>${KLASSENTURM}</g></g>
    <path d="M${x} ${-96 * h} l20 6 l-20 6 Z" fill="${farbe}"/>`;
}
const FESTUNG = `
  <path d="M-150 40 Q-100 -10 -40 -8 Q20 -16 70 -4 Q130 6 150 40 Z" fill="#3b3256"/>
  <rect x="-70" y="-30" width="140" height="34" fill="#655e80" stroke="#3a3350" stroke-width="2.5"/>
  <path d="M-70 -30 v-8 h10 v8 h10 v-8 h10 v8 h10 v-8 h10 v8 h10 v-8 h10 v8 h10 v-8 h10 v8 h10 v-8 h10 v8 h10 v-8 h10 v8 h10 v-8 h10 v8" fill="none" stroke="#3a3350" stroke-width="2.5"/>
  ${klassenturm(-62, '#ff8a8a', 1)}${klassenturm(0, '#7ee0c3', 1.25)}${klassenturm(62, '#8fb8ff', 1)}
  <rect x="-12" y="-16" width="24" height="20" rx="10" fill="#1b1533"/>
  <g transform="translate(-118 -88) rotate(-6)">
    <rect x="-34" y="-16" width="68" height="34" rx="3" fill="#2a4f8a" stroke="#8fb8ff" stroke-width="1.5"/>
    <text x="0" y="-2" font-size="11" text-anchor="middle" fill="#dbe8ff" font-family="monospace">class</text>
    <text x="0" y="12" font-size="11" text-anchor="middle" fill="#dbe8ff" font-family="monospace">Turm:</text>
  </g>`;

const KASINO = `
  <ellipse cx="0" cy="30" rx="62" ry="14" fill="#2f2648"/>
  <path d="M-52 30 L-40 -22 L0 -48 L40 -22 L52 30 Z" fill="#c74a5a"/>
  <path d="M-40 -22 L-26 30 M-13 -40 L-9 30 M13 -40 L9 30 M40 -22 L26 30" stroke="#f2e6d8" stroke-width="7" opacity=".85"/>
  <path d="M0 -48 L0 -64" stroke="#d8d0e8" stroke-width="2"/><path d="M0 -64 l14 5 l-14 5 Z" fill="#ffcc4d"/>
  <rect x="-12" y="4" width="24" height="26" rx="12" fill="#1b1533"/>
  <g transform="translate(46 6) rotate(14)"><rect x="-13" y="-13" width="26" height="26" rx="5" fill="#f5f0ff" stroke="#3a3350" stroke-width="2"/>
    <circle cx="-6" cy="-6" r="2.6" fill="#3a3350"/><circle cx="0" cy="0" r="2.6" fill="#3a3350"/><circle cx="6" cy="6" r="2.6" fill="#3a3350"/></g>`;

const ARENA = `
  <ellipse cx="0" cy="10" rx="72" ry="30" fill="#8a6440" stroke="#4a3420" stroke-width="2.5"/>
  <ellipse cx="0" cy="8" rx="50" ry="17" fill="#d9b072"/>
  <path d="M-72 10 L-72 26 Q0 58 72 26 L72 10 Q0 42 -72 10 Z" fill="#6e4e30" stroke="#4a3420" stroke-width="2"/>
  ${[-52, -26, 0, 26, 52].map((x) => `<rect x="${x - 6}" y="${22 + Math.abs(x) * -0.18 + 8}" width="12" height="12" rx="6" fill="#2a1d10"/>`).join('')}
  <path d="M-12 -2 L12 18 M12 -2 L-12 18" stroke="#e8e8f0" stroke-width="3" stroke-linecap="round"/>`;

function tanne(x, y, s, f) {
  return `<path d="M${x} ${y - 46 * s} L${x + 20 * s} ${y} L${x - 20 * s} ${y} Z" fill="${f}"/><rect x="${x - 3 * s}" y="${y}" width="${6 * s}" height="${8 * s}" fill="#4a3020"/>`;
}
const WALD = `
  <ellipse cx="0" cy="12" rx="78" ry="16" fill="#1f2a2a"/>
  ${tanne(-50, 8, 1, '#1f4a3a')}${tanne(48, 10, 1.05, '#1f4a3a')}${tanne(-22, 2, 1.25, '#2f6b50')}${tanne(22, 4, 1.15, '#2f6b50')}${tanne(0, 12, 0.85, '#255a44')}
  <g class="wk-augen"><circle cx="-34" cy="2" r="2.4" fill="#ffe066"/><circle cx="-27" cy="2" r="2.4" fill="#ffe066"/>
  <circle cx="34" cy="8" r="2.4" fill="#ffe066"/><circle cx="41" cy="8" r="2.4" fill="#ffe066"/></g>`;

const BIBLIOTHEK = `
  <rect x="-60" y="22" width="120" height="10" fill="#b9aedb"/>
  <rect x="-54" y="-18" width="108" height="40" fill="#8f86b6"/>
  ${[-42, -18, 6, 30].map((x) => `<rect x="${x}" y="-18" width="12" height="40" fill="#d6cff0"/>`).join('')}
  <path d="M-64 -18 L0 -50 L64 -18 Z" fill="#a69cd0" stroke="#5f5590" stroke-width="2.5"/>
  <circle cx="0" cy="-30" r="7" fill="#ffcc4d"/>
  <g transform="translate(76 22)"><rect x="-14" y="-8" width="28" height="8" fill="#c74a5a"/><rect x="-12" y="-16" width="24" height="8" fill="#2f6b50"/><rect x="-15" y="-24" width="26" height="8" fill="#2a4f8a"/></g>`;

const WAHRZEICHEN = { akt1: HOEHLE, akt2: GRUBEN, akt3: SPIEGELTURM, akt4: FESTUNG, kasino: KASINO, arena: ARENA, rudel: WALD, bibliothek: BIBLIOTHEK };

/**
 * SVG der Weltkarte.
 * @param {Record<string, 'done'|'open'|'locked'>} status Zustand je Ort (akt1 … akt4, Nebenwelten nach Schlüssel)
 */
export function weltkarteSVG(status) {
  const offen = (id) => status[id] !== 'locked';
  const sterne = [[60, 40], [180, 90], [260, 30], [390, 70], [520, 40], [620, 110], [760, 60], [960, 40], [940, 120], [330, 140], [140, 180], [560, 180]]
    .map(([x, y], i) => `<circle cx="${x}" cy="${y}" r="${i % 3 ? 1.4 : 2.2}" fill="#fff" opacity="${i % 2 ? 0.5 : 0.8}"/>`).join('');
  const weg = WEG.map((d, i) => `<path d="${d}" class="wk-weg ${offen('akt' + (i + 2)) ? 'frei' : ''}"/>`).join('');
  const neben = Object.entries(NEBENWEG).map(([id, d]) => `<path d="${d}" class="wk-nebenweg ${offen(id) ? 'frei' : ''}"/>`).join('');
  const orte = Object.entries(ORTE).map(([id, o]) => {
    const st = status[id] ?? 'locked';
    return `<g class="wk-zeichen ${st}" data-ort="${id}" transform="translate(${o.x} ${o.y})">${WAHRZEICHEN[id]}
      ${st === 'locked' ? '<ellipse class="wk-nebel" cx="0" cy="-10" rx="120" ry="70"/>' : ''}</g>`;
  }).join('');
  return `<svg class="wk-svg" viewBox="0 0 ${KARTE_B} ${KARTE_H}" role="img" aria-label="Weltkarte von Pythonia">
    <defs>
      <linearGradient id="wk-himmel" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#151029"/><stop offset=".45" stop-color="#241b40"/><stop offset="1" stop-color="#2b2147"/></linearGradient>
      <filter id="wk-grau"><feColorMatrix type="saturate" values="0.1"/></filter>
      <filter id="wk-weich"><feGaussianBlur stdDeviation="16"/></filter>
    </defs>
    <rect width="${KARTE_B}" height="${KARTE_H}" fill="url(#wk-himmel)"/>
    ${sterne}
    <circle cx="70" cy="70" r="26" fill="#f3e9c6" opacity=".9"/><circle cx="82" cy="62" r="24" fill="#151029"/>
    <path d="M0 250 L70 190 L130 225 L210 160 L300 215 L380 175 L470 220 L560 150 L650 200 L740 120 L820 160 L900 90 L1000 140 L1000 660 L0 660 Z" fill="#1d1734"/>
    <path d="M0 330 Q120 280 240 310 Q380 345 520 290 Q640 245 760 260 Q880 270 1000 250 L1000 660 L0 660 Z" fill="#251d3e"/>
    <path d="M0 450 Q160 410 320 440 Q480 470 640 430 Q820 390 1000 420 L1000 660 L0 660 Z" fill="#2c2347"/>
    <path d="M0 560 Q200 530 400 560 Q600 590 800 550 Q900 535 1000 545 L1000 660 L0 660 Z" fill="#31284f"/>
    ${neben}${weg}
    ${orte}
  </svg>`;
}
