// Figuren als kleine SVG-Zeichnungen (keine Bilddateien nötig).
// Helden schauen nach rechts, Gegner nach links.

const svg = (body, w = 120, h = 140) =>
  `<svg class="sprite" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" aria-hidden="true">${body}</svg>`;

const shadow = (cx = 60, rx = 38, y = 134) => `<ellipse cx="${cx}" cy="${y}" rx="${rx}" ry="6" fill="rgba(0,0,0,.45)"/>`;
const eyes = (x1, x2, y, r = 3.2, c = '#fff') =>
  `<circle cx="${x1}" cy="${y}" r="${r}" fill="${c}"/><circle cx="${x2}" cy="${y}" r="${r}" fill="${c}"/>`;

export const HERO_SPRITES = {
  magierin: svg(`${shadow()}
    <line x1="92" y1="40" x2="84" y2="132" stroke="#8a5a3c" stroke-width="5" stroke-linecap="round"/>
    <circle cx="93" cy="36" r="9" fill="#ffcc4d"/><circle cx="93" cy="36" r="15" fill="#ffcc4d" opacity=".25"/>
    <path d="M32 132 L48 70 L72 70 L88 132 Z" fill="#7b3fa0"/>
    <path d="M44 132 L54 92 L66 92 L76 132 Z" fill="#5a2b78"/>
    <circle cx="60" cy="62" r="15" fill="#f2c9a5"/>
    <path d="M40 54 Q60 42 80 54 L60 6 Z" fill="#9b4fd0"/><path d="M36 56 Q60 46 84 56 Q60 62 36 56 Z" fill="#6c2f95"/>
    <circle cx="62" cy="22" r="2.5" fill="#ffcc4d"/><circle cx="56" cy="38" r="2" fill="#ffcc4d"/>
    ${eyes(57, 67, 63, 2.4, '#2a1840')}
    <path d="M78 82 Q86 76 90 80" stroke="#f2c9a5" stroke-width="6" fill="none" stroke-linecap="round"/>`),

  waechter: svg(`${shadow(60, 44)}
    <rect x="34" y="72" width="52" height="56" rx="10" fill="#5d6a7e"/>
    <rect x="40" y="78" width="40" height="12" rx="4" fill="#7b8aa1"/>
    <rect x="38" y="122" width="16" height="12" rx="3" fill="#3c4555"/><rect x="66" y="122" width="16" height="12" rx="3" fill="#3c4555"/>
    <path d="M36 66 Q60 22 84 66 Z" fill="#8a97ad"/><rect x="36" y="58" width="48" height="16" rx="4" fill="#8a97ad"/>
    <rect x="44" y="62" width="32" height="6" rx="3" fill="#1b2130"/>${eyes(54, 66, 65, 2, '#8fd0ff')}
    <path d="M60 22 L60 8" stroke="#c8443a" stroke-width="6" stroke-linecap="round"/>
    <path d="M70 84 L98 84 L98 108 Q98 124 84 132 Q70 124 70 108 Z" fill="#4a7fc0" stroke="#cfe4ff" stroke-width="3"/>
    <path d="M84 92 L84 120 M74 104 L94 104" stroke="#cfe4ff" stroke-width="3"/>`),

  orakel: svg(`${shadow()}
    <path d="M30 132 Q34 70 60 44 Q86 70 90 132 Z" fill="#3b2f63"/>
    <path d="M42 132 Q46 86 60 70 Q74 86 78 132 Z" fill="#2a2148"/>
    <path d="M38 76 Q60 20 82 76 Q60 66 38 76 Z" fill="#4d3c80"/>
    <ellipse cx="60" cy="68" rx="13" ry="11" fill="#120e22"/>${eyes(55, 65, 68, 2.6, '#c8a6ff')}
    <circle cx="96" cy="74" r="12" fill="#a98bff" opacity=".85"/><circle cx="96" cy="74" r="20" fill="#a98bff" opacity=".18"/>
    <circle cx="92" cy="70" r="3" fill="#fff" opacity=".8"/>
    <path d="M78 94 Q88 92 92 86" stroke="#4d3c80" stroke-width="7" fill="none" stroke-linecap="round"/>
    <text x="22" y="40" font-size="12" fill="#c8a6ff" opacity=".7" font-family="monospace">if</text>
    <text x="84" y="28" font-size="11" fill="#c8a6ff" opacity=".5" font-family="monospace">==</text>`),
};

export const ENEMY_SPRITES = {
  tintenfleck: svg(`${shadow(60, 42)}
    <path d="M22 128 Q14 96 34 82 Q30 54 58 56 Q84 46 92 76 Q112 88 100 118 Q104 132 84 130 Q72 138 58 130 Q36 138 22 128 Z" fill="#2c3f8f"/>
    <circle cx="18" cy="112" r="6" fill="#2c3f8f"/><circle cx="106" cy="98" r="5" fill="#2c3f8f"/><circle cx="96" cy="58" r="4" fill="#2c3f8f"/>
    <path d="M40 86 Q48 80 54 86" stroke="#4b63c4" stroke-width="4" fill="none"/>
    ${eyes(48, 72, 96, 7)}${eyes(46, 70, 97, 3.4, '#10142e')}
    <path d="M50 116 Q60 110 72 116" stroke="#10142e" stroke-width="3" fill="none" stroke-linecap="round"/>`),

  rostwaechter: svg(`${shadow(60, 40)}
    <rect x="30" y="58" width="60" height="66" rx="6" fill="#a0603a"/>
    <rect x="36" y="64" width="48" height="28" rx="4" fill="#3a2418"/>
    <rect x="42" y="72" width="12" height="8" fill="#ff8a3d"/><rect x="66" y="72" width="12" height="8" fill="#ff8a3d"/>
    <circle cx="44" cy="106" r="5" fill="#7a4428"/><circle cx="62" cy="112" r="4" fill="#7a4428"/><circle cx="76" cy="102" r="3" fill="#c98a52"/>
    <line x1="60" y1="58" x2="60" y2="40" stroke="#7a4428" stroke-width="4"/><circle cx="60" cy="38" r="5" fill="#ff8a3d"/>
    <rect x="16" y="70" width="14" height="34" rx="5" fill="#8a5232"/><rect x="90" y="70" width="14" height="34" rx="5" fill="#8a5232"/>
    <rect x="38" y="124" width="14" height="10" fill="#5e3620"/><rect x="68" y="124" width="14" height="10" fill="#5e3620"/>`),

  fehlerteufel: svg(`${shadow(60, 30)}
    <path d="M84 118 Q108 112 104 92 Q102 84 110 82" stroke="#b8243a" stroke-width="4" fill="none"/><path d="M106 76 L116 82 L106 88 Z" fill="#b8243a"/>
    <ellipse cx="60" cy="104" rx="24" ry="26" fill="#d83a52"/>
    <circle cx="60" cy="66" r="22" fill="#e44b62"/>
    <path d="M42 52 L34 30 L52 46 Z" fill="#f6e3b0"/><path d="M78 52 L86 30 L68 46 Z" fill="#f6e3b0"/>
    ${eyes(52, 68, 64, 5, '#ffe14d')}${eyes(51, 67, 65, 2, '#2a0a10')}
    <path d="M50 78 Q60 86 70 78" stroke="#2a0a10" stroke-width="3" fill="none"/>
    <path d="M54 80 L56 84 L58 80 M62 80 L64 84 L66 80" fill="#fff"/>
    <rect x="44" y="124" width="10" height="10" rx="3" fill="#8e1e30"/><rect x="66" y="124" width="10" height="10" rx="3" fill="#8e1e30"/>`),

  schwarmbiene: svg(`${shadow(60, 26)}
    <ellipse cx="44" cy="58" rx="18" ry="24" fill="#d6f0ff" opacity=".7" transform="rotate(-25 44 58)"/>
    <ellipse cx="76" cy="58" rx="18" ry="24" fill="#d6f0ff" opacity=".7" transform="rotate(25 76 58)"/>
    <ellipse cx="62" cy="90" rx="30" ry="22" fill="#f2c12e"/>
    <path d="M52 70 Q48 90 52 110 M66 68 Q62 90 66 112 M80 74 Q77 90 80 106" stroke="#2a2010" stroke-width="7" fill="none"/>
    <path d="M90 90 L104 94 L90 98 Z" fill="#2a2010"/>
    <circle cx="34" cy="86" r="14" fill="#2a2010"/>${eyes(30, 38, 84, 3, '#ff5a5a')}
    <path d="M30 74 Q24 60 18 62 M36 73 Q38 58 32 54" stroke="#2a2010" stroke-width="2" fill="none"/>`),

  schleifenschlange: svg(`${shadow(60, 48)}
    <circle cx="66" cy="112" r="22" fill="none" stroke="#3f9a5a" stroke-width="14"/>
    <circle cx="66" cy="112" r="22" fill="none" stroke="#7ad08d" stroke-width="4" stroke-dasharray="6 8"/>
    <path d="M88 112 Q100 90 82 74 Q66 60 58 44" stroke="#3f9a5a" stroke-width="14" fill="none" stroke-linecap="round"/>
    <ellipse cx="50" cy="38" rx="20" ry="14" fill="#4fae6a"/>
    ${eyes(42, 52, 32, 3.6, '#ffe14d')}<rect x="41" y="29" width="2" height="6" fill="#111"/><rect x="51" y="29" width="2" height="6" fill="#111"/>
    <path d="M30 42 L22 44 M22 44 L16 40 M22 44 L16 48" stroke="#ff5a7a" stroke-width="2.5" stroke-linecap="round"/>
    <text x="54" y="118" font-size="14" fill="#d9ffe2" font-family="monospace" font-weight="700">∞</text>`),

  verzweiger: svg(`${shadow(80, 64, 174)}
    <path d="M62 176 Q66 130 58 104 L102 104 Q94 130 98 176 Z" fill="#4a3426"/>
    <path d="M80 110 Q60 80 30 74 M80 110 Q100 80 130 74 M80 104 Q80 70 80 40 M58 90 Q40 56 50 30 M102 90 Q120 56 110 30"
      stroke="#5c4030" stroke-width="10" fill="none" stroke-linecap="round"/>
    <circle cx="30" cy="72" r="14" fill="#6c3fa0"/><circle cx="130" cy="72" r="14" fill="#6c3fa0"/><circle cx="80" cy="36" r="16" fill="#6c3fa0"/>
    <circle cx="50" cy="28" r="11" fill="#8b52c8"/><circle cx="110" cy="28" r="11" fill="#8b52c8"/>
    <text x="22" y="77" font-size="12" fill="#ffe14d" font-family="monospace" font-weight="700">if</text>
    <text x="118" y="77" font-size="10" fill="#ffe14d" font-family="monospace" font-weight="700">elif</text>
    <text x="64" y="41" font-size="10" fill="#ffe14d" font-family="monospace" font-weight="700">else</text>
    <ellipse cx="80" cy="128" rx="16" ry="12" fill="#f6e3b0"/><circle cx="80" cy="128" r="7" fill="#c8243a"/><circle cx="80" cy="128" r="3" fill="#111"/>
    <path d="M66 150 L72 156 L78 150 L84 156 L90 150 L94 156" stroke="#f6e3b0" stroke-width="3" fill="none"/>`, 160, 180),
};

// ---------- Eigene Bilder (z. B. aus Meshy) ----------
// Trage hier eine Bilddatei ein, dann ersetzt sie die Zeichnung. Am besten PNG oder WebP mit
// transparentem Hintergrund, Figur von der Seite: Helden schauen nach rechts, Gegner nach links.
// Beispiel: magierin: 'assets/figuren/magierin.png'
export const BILDER = {
  magierin: 'assets/figuren/magierin.png',
  waechter: 'assets/figuren/waechter.png',
  orakel: 'assets/figuren/orakel.png',
  tintenfleck: 'assets/figuren/tintenfleck.png',
  rostwaechter: 'assets/figuren/rostwaechter.png',
  fehlerteufel: 'assets/figuren/fehlerteufel.png',
  schwarmbiene: 'assets/figuren/schwarmbiene.png',
  schleifenschlange: 'assets/figuren/schleifenschlange.png',
  verzweiger: 'assets/figuren/verzweiger.png',
  eishexe: 'assets/figuren/eishexe.png',
  gaukler: 'assets/figuren/gaukler.png',
  echofledermaus: 'assets/figuren/echofledermaus.png',
  kristalldieb: 'assets/figuren/kristalldieb.png',
  minenwurm: 'assets/figuren/minenwurm.png',
  zahlenhydra: 'assets/figuren/zahlenhydra.png',
  mischer: 'assets/figuren/mischer.png',
  spiegelschleim: 'assets/figuren/spiegelschleim.png',
  turmwaechter: 'assets/figuren/turmwaechter.png',
  rekursionsrabe: 'assets/figuren/rekursionsrabe.png',
  spiegelritter: 'assets/figuren/spiegelritter.png',
  spiegelkoenigin: 'assets/figuren/spiegelkoenigin.png',
  ruestungsgolem: 'assets/figuren/ruestungsgolem.png',
  minigolem: 'assets/figuren/minigolem.png',
  schildknappe: 'assets/figuren/schildknappe.png',
  bogenschuetze: 'assets/figuren/bogenschuetze.png',
  golemfabrik: 'assets/figuren/golemfabrik.png',
  urklasse: 'assets/figuren/urklasse.png',
  croupier: 'assets/figuren/croupier.png',
  gladiator: 'assets/figuren/gladiator.png',
  wolfsmutter: 'assets/figuren/wolfsmutter.png',
  bibliothekar: 'assets/figuren/bibliothekar.png',
};

// Akt-2-Gegner nutzen vorerst umgefärbte Bilder (eigene Meshy-Figuren können später folgen).
const VARIANTEN = {
};
const SHADOW = 'drop-shadow(0 0 1px rgba(255,255,255,.45)) drop-shadow(0 6px 6px rgba(0,0,0,.5))';
const img = (id) => {
  const v = VARIANTEN[id];
  if (v) return `<img class="sprite bild" src="${BILDER[v[0]]}" alt="" draggable="false" style="filter:${v[1]} ${SHADOW}${v[2] ? ';transform:scaleX(-1)' : ''}">`;
  return `<img class="sprite bild" src="${BILDER[id]}" alt="" draggable="false">`;
};

export const heroSprite = (id) => (BILDER[id] || VARIANTEN[id] ? img(id) : HERO_SPRITES[id] ?? HERO_SPRITES.magierin);
export const enemySprite = (id) => (BILDER[id] || VARIANTEN[id] ? img(id) : ENEMY_SPRITES[id] ?? ENEMY_SPRITES.tintenfleck);
