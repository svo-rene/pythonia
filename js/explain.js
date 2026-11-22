// Code erklären: jede Zeile in einfachen Worten, dazu kurze Erklärungen der Begriffe und Variablen.
// Regelbasiert, ohne KI: Es deckt genau die Python-Teile ab, die im Spiel vorkommen.
import { HOOKS } from './data.js';
import { esc, hl, modal } from './ui.js';

// Was die Variablen im Spiel bedeuten
const VARS = {
  leben: 'deine Lebenspunkte (im Gegnercode: dein Leben, das der Gegner angreift)',
  max_leben: 'dein höchstmögliches Leben',
  block: 'dein Block: fängt Schaden ab, bevor er dein Leben trifft',
  energie: 'deine Energie in diesem Zug',
  staerke: 'deine Stärke: wird oft zum Schaden dazugezählt',
  ziel_leben: 'das Leben des Gegners, den du als Ziel gewählt hast',
  ziel_angriff: 'wie viel Schaden dein Ziel als Nächstes machen will',
  gegner_leben: 'eine Liste mit dem Leben aller Gegner',
  gegner_angriff: 'eine Liste mit dem geplanten Schaden aller Gegner',
  hand: 'eine Liste mit den Namen der anderen Karten auf deiner Hand',
  mein_leben: 'das eigene Leben des Gegners',
  runde: 'die Nummer des Zugs (1, 2, 3, …)',
  wut: 'ein Wert, den sich der Gegner merkt und der wächst',
  gold: 'dein Gold',
  merk: 'eine Zahl, die sich das Relikt während des Kampfs merkt',
  typ: 'die Art der gespielten Karte: "angriff" oder "skill"',
  kosten: 'wie viel Energie die gespielte Karte gekostet hat',
  i: 'eine Zählvariable der Schleife',
  kristalle: 'deine Kristall-Liste: Zahlen, die du sammelst und wirfst. Sie bleibt im ganzen Kampf erhalten',
  echo: 'eine Liste, die sich der Gegner merkt und die jede Runde wächst',
  minen: 'eine Liste mit Minen; die vorderste explodiert',
  koepfe: 'die Liste der Köpfe der Hydra; jeder greift an',
  stapel: 'der Zahlenstapel des Bosses'
};

// Begriffe, die im Code vorkommen können
const CONCEPTS = [
  { test: /\[[^\]]*\]|\bgegner_leben\b|\bgegner_angriff\b|\bhand\b/, name: 'Liste',
    text: 'Eine Liste speichert mehrere Werte in einer Variablen, z. B. <code>gegner_leben = [20, 14]</code>. Jeder Wert hat eine Position, den <b>Index</b>. Gezählt wird ab <b>0</b>: <code>gegner_leben[0]</code> ist der erste Gegner, <code>gegner_leben[1]</code> der zweite.', list: true },
  { test: /\.append\(/, name: 'append()', text: '<code>liste.append(x)</code> hängt x <b>hinten</b> an die Liste an. Aus <code>[4, 9]</code> wird mit <code>append(2)</code> die Liste <code>[4, 9, 2]</code>.' },
  { test: /\.pop\(/, name: 'pop()', text: '<code>liste.pop()</code> nimmt das <b>letzte</b> Element heraus und gibt es zurück. <code>pop(0)</code> nimmt das <b>erste</b>. Bei einer leeren Liste gibt es einen Fehler!' },
  { test: /\.sort\(|\bsorted\(/, name: 'sort()', text: '<code>liste.sort()</code> ordnet die Liste aufsteigend, die kleinste Zahl steht vorn, die größte hinten. Danach holt <code>pop()</code> also die größte.' },
  { test: /\.insert\(/, name: 'insert()', text: '<code>liste.insert(0, x)</code> fügt x an Position 0 ein, also ganz vorn. Alle anderen rücken einen Platz nach hinten.' },
  { test: /\.reverse\(/, name: 'reverse()', text: '<code>liste.reverse()</code> dreht die Reihenfolge um: aus <code>[1, 5, 3]</code> wird <code>[3, 5, 1]</code>.' },
  { test: /\[\s*-?\d*\s*:\s*-?\d*\s*\]/, name: 'Slicing [a:b]', text: '<code>liste[1:3]</code> ist ein Ausschnitt: die Positionen 1 und 2 (die 3 nicht mehr). <code>liste[:2]</code> sind die ersten beiden.' },
  { test: /\[-1\]/, name: 'Index -1', text: '<code>liste[-1]</code> ist das letzte Element, <code>liste[-2]</code> das vorletzte.' },
  { test: /\b(sum|max|min)\(/, name: 'sum(), max(), min()', text: '<code>sum(liste)</code> addiert alle Werte, <code>max(liste)</code> ist der größte, <code>min(liste)</code> der kleinste.' },
  { test: /\blen\(/, name: 'len()', text: '<code>len(liste)</code> sagt, wie viele Einträge eine Liste hat. Bei <code>[20, 14]</code> ist das 2.' },
  { test: /\brange\(/, name: 'range()', text: '<code>range(3)</code> liefert die Zahlen 0, 1, 2. Es fängt bei 0 an und hört <b>vor</b> der 3 auf. <code>range(1, 4)</code> liefert 1, 2, 3.' },
  { test: /^\s*for\b/m, name: 'for-Schleife', text: 'Eine for-Schleife wiederholt die eingerückten Zeilen darunter, einmal für jeden Wert. Was eingerückt ist, gehört zur Schleife.' },
  { test: /^\s*while\b/m, name: 'while-Schleife', text: 'Eine while-Schleife wiederholt, <b>solange</b> die Bedingung stimmt. Ändert sich darin nie etwas an der Bedingung, hört sie nie auf (Endlosschleife).' },
  { test: /^\s*if\b/m, name: 'if / else', text: 'Mit if prüft der Code eine Bedingung. Stimmt sie, laufen die eingerückten Zeilen darunter. Sonst springt er zu elif oder else, falls vorhanden.' },
  { test: /^\s*elif\b/m, name: 'elif', text: 'elif heißt „sonst, wenn“. Es wird nur geprüft, wenn alle Bedingungen davor falsch waren. Höchstens ein Zweig läuft.' },
  { test: /\+=|-=|\*=|\/\/=/, name: '+=, -=, *=', text: '<code>x += 3</code> ist die Kurzform von <code>x = x + 3</code>: x wird um 3 größer. Genauso <code>-=</code> (kleiner), <code>*=</code> (mal) und <code>//=</code> (geteilt).' },
  { test: /\/\//, name: '// (ganzzahlig teilen)', text: '<code>//</code> teilt und schneidet die Nachkommastellen ab: <code>12 // 5</code> ist 2, nicht 2,4.' },
  { test: /%/, name: '% (Rest)', text: '<code>%</code> gibt den Rest beim Teilen: <code>7 % 3</code> ist 1. <code>runde % 3 == 1</code> stimmt in Runde 1, 4, 7, …' },
  { test: /\binput\(/, name: 'input()', text: '<code>input()</code> fragt nach einer Eingabe. Sie kommt als Text an, darum macht <code>int(…)</code> eine ganze Zahl daraus. Im Spiel tippst du die Zahl beim Ausspielen ein.' },
  { test: /^\s*def\b/m, name: 'Funktion (def)', text: 'Mit <code>def name():</code> legt man eine Funktion an: einen Codeblock mit Namen. Er läuft erst, wenn jemand die Funktion aufruft. Bei Relikten macht das das Spiel selbst.' },
];

const OPS = { '>=': 'mindestens', '<=': 'höchstens', '==': 'gleich', '!=': 'ungleich', '>': 'größer als', '<': 'kleiner als' };

function c(s) { return `<code>${esc(s.trim())}</code>`; }

function condText(cond) {
  const parts = cond.split(/\s+(and|or)\s+/);
  if (parts.length > 1) return parts.map((p) => (p === 'and' ? 'und' : p === 'or' ? 'oder' : condText(p))).join(' ');
  const m = cond.match(/^(.+?)\s*(>=|<=|==|!=|>|<)\s*(.+)$/);
  if (m) return `${c(m[1])} ${OPS[m[2]]} ${c(m[3])} ist`;
  const inn = cond.match(/^(.+?)\s+in\s+(.+)$/);
  if (inn) return `${c(inn[1])} in ${c(inn[2])} vorkommt`;
  return `${c(cond)} wahr ist`;
}

function targetText(t) {
  const m = t.match(/^(\w+)\[(.+)\]$/);
  if (m) return `den Eintrag an Position ${c(m[2])} der Liste ${c(m[1])}`;
  return c(t);
}

/** Eine Zeile in Worten. */
export function explainLine(raw) {
  const line = raw.replace(/\s+#.*$/, '').trim();
  if (!line) return '';
  if (line.startsWith('#')) return 'Ein Kommentar: Er ist nur für Menschen und wird nicht ausgeführt.';
  let m;
  if ((m = line.match(/^def (\w+)\(\):$/))) return `Legt die Funktion ${c(m[1])} an. ${HOOKS[m[1]] ? `Das Spiel ruft sie <b>${esc(HOOKS[m[1]])}</b> auf.` : ''} Alles Eingerückte darunter gehört zu ihr.`;
  if ((m = line.match(/^if (.+):$/))) return `<b>Wenn</b> ${condText(m[1])}, laufen die eingerückten Zeilen darunter.`;
  if ((m = line.match(/^elif (.+):$/))) return `<b>Sonst, wenn</b> ${condText(m[1])}, laufen die eingerückten Zeilen darunter.`;
  if (line === 'else:') return '<b>Sonst</b> (wenn keine Bedingung davor gestimmt hat) laufen die eingerückten Zeilen darunter.';
  if ((m = line.match(/^for (\w+) in range\(len\((\w+)\)\):$/))) return `Geht jede Position der Liste ${c(m[2])} durch. ${c(m[1])} ist dabei 0, 1, 2, … (so viele, wie die Liste lang ist).`;
  if ((m = line.match(/^for (\w+) in range\(([^,]+)\):$/))) return `Wiederholt die eingerückten Zeilen ${c(m[2])}-mal. ${c(m[1])} zählt dabei 0, 1, 2, …`;
  if ((m = line.match(/^for (\w+) in range\((.+),\s*(.+)\):$/))) return `Wiederholt die eingerückten Zeilen, ${c(m[1])} läuft von ${c(m[2])} bis eins vor ${c(m[3])}.`;
  if ((m = line.match(/^for (\w+) in (\w+):$/))) return `Geht jeden Eintrag der Liste ${c(m[2])} durch. ${c(m[1])} ist jeweils der aktuelle Eintrag.`;
  if ((m = line.match(/^while (.+):$/))) return `<b>Solange</b> ${condText(m[1])}, wiederholt er die eingerückten Zeilen.`;
  if ((m = line.match(/^(\w+) = int\(input\((.*)\)\)$/))) return `Fragt dich beim Ausspielen nach einer Zahl und speichert sie in ${c(m[1])}.`;
  if ((m = line.match(/^ziehe\((.+)\)$/))) return `Du ziehst ${c(m[1])} Karten.`;
  if ((m = line.match(/^(\w+)\.append\((.+)\)$/))) return `Hängt ${c(m[2])} hinten an die Liste ${c(m[1])} an.`;
  if ((m = line.match(/^(\w+)\.pop\(\)$/))) return `Nimmt das letzte Element aus ${c(m[1])} heraus. Es ist danach weg.`;
  if ((m = line.match(/^(\w+)\.pop\(0\)$/))) return `Nimmt das erste Element aus ${c(m[1])} heraus. Es ist danach weg.`;
  if ((m = line.match(/^(\w+)\.sort\(\)$/))) return `Sortiert ${c(m[1])} aufsteigend: die kleinste Zahl vorn, die größte hinten.`;
  if ((m = line.match(/^(\w+)\.reverse\(\)$/))) return `Dreht die Reihenfolge von ${c(m[1])} um.`;
  if ((m = line.match(/^(\w+)\.insert\((.+?),\s*(.+)\)$/))) return `Fügt ${c(m[3])} an Position ${c(m[2])} in ${c(m[1])} ein. Die anderen rücken nach hinten.`;
  if (line === 'pass') return 'Tut nichts.';
  if ((m = line.match(/^([\w[\]]+)\s*(\+=|-=|\*=|\/\/=)\s*(.+)$/))) {
    const t = targetText(m[1]);
    const verb = { '+=': `Erhöht ${t} um`, '-=': `Verringert ${t} um`, '*=': `Multipliziert ${t} mit`, '//=': `Teilt ${t} (ganzzahlig) durch` }[m[2]];
    return `${verb} ${c(m[3])}.`;
  }
  if ((m = line.match(/^([\w[\]]+)\s*=\s*(.+)$/))) return `${targetText(m[1])} bekommt den Wert ${c(m[2])}. Ein alter Wert wird überschrieben.`;
  return 'Diese Zeile führt Python genau so aus.';
}

/** Liste mit Positionen anschaulich zeichnen. */
function listBoxes(name, arr) {
  return `<div class="listbox"><code>${esc(name)}</code> = ${arr.map((v, i) => `<span class="lb"><b>${esc(JSON.stringify(v))}</b><small>[${i}]</small></span>`).join('')}</div>`;
}

/**
 * Öffnet die Erklärung.
 * @param {string} title
 * @param {string} code
 * @param {Record<string, any>} [vars] aktuelle Werte (optional), werden bei Variablen angezeigt
 */
export function explainCode(title, code, vars = null) {
  const lines = code.split('\n');
  const rows = lines.map((l, i) => {
    const indent = (l.match(/^ */)[0].length / 4) | 0;
    return `<tr><td class="ex-code"><span class="ln"><i>${i + 1}</i>${hl(l) || ' '}</span></td>
      <td class="ex-text" style="padding-left:${8 + indent * 14}px">${indent ? '<span class="ex-in" title="eingerückt">↳</span> ' : ''}${explainLine(l)}</td></tr>`;
  }).join('');
  const used = Object.keys(VARS).filter((v) => new RegExp(`\\b${v}\\b`).test(code));
  const own = [...new Set([...code.matchAll(/^\s*(\w+)\s*=(?!=)/gm)].map((m) => m[1]))].filter((v) => !VARS[v]);
  const ownRows = own.map((v) => `<li><code>${esc(v)}</code>: eine eigene Variable, die dieser Code selbst anlegt, um sich einen Wert zu merken</li>`).join('');
  const varRows = ownRows + used.map((v) => {
    const val = vars && vars[v] !== undefined ? vars[v] : undefined;
    return `<li><code>${esc(v)}</code>: ${esc(VARS[v])}${val !== undefined && !Array.isArray(val) ? ` · gerade <b>${esc(JSON.stringify(val))}</b>` : ''}</li>`;
  }).join('');
  const lists = vars ? Object.entries(vars).filter(([k, v]) => Array.isArray(v) && v.length && new RegExp(`\\b${k}\\b`).test(code)) : [];
  const concepts = CONCEPTS.filter((k) => k.test.test(code)).map((k) => `<div class="concept"><b>${esc(k.name)}</b><p>${k.text}</p>
    ${k.list && lists.length ? `<p class="hint small">So sieht es gerade aus:</p>${lists.map(([n, a]) => listBoxes(n, a)).join('')}` : ''}</div>`).join('');
  const { el, close } = modal(`<h3>❓ ${esc(title)}: Zeile für Zeile</h3>
    <table class="explain">${rows}</table>
    ${varRows ? `<div class="panel-title">Variablen</div><ul class="ex-vars">${varRows}</ul>` : ''}
    ${concepts ? `<div class="panel-title">Was steckt drin?</div><div class="concepts">${concepts}</div>` : ''}
    <div class="row"><button class="btn ok">Verstanden</button></div>`, { wide: true, onClose: () => {} });
  el.querySelector('.ok').addEventListener('click', close);
}
