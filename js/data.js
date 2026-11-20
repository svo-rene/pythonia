// Spielinhalte des Prototyps: Karten, Bugs, Gegner, Schmieden, Konzepte, Talente, Karte.
// Alles Python steht hier als Text und läuft im Spiel über Natter.

// ---------- Konzepte ----------
// basis und if sind von Anfang an frei, der Rest wird beim Händler gekauft.
export const CONCEPTS = {
  basis: { name: 'Variablen', start: true },
  if: { name: 'if / else', start: true },
  elif: {
    name: 'elif', price: 40,
    quiz: { code: 'x = 7\nif x > 10:\n    y = 1\nelif x > 5:\n    y = 2\nelse:\n    y = 3', frage: 'Welchen Wert hat y am Ende?', antwort: 2,
      erklaerung: 'x > 10 ist falsch, also wird elif geprüft: 7 > 5 ist wahr, darum y = 2. Das else wird übersprungen.' },
  },
  for: {
    name: 'for-Schleife', price: 60,
    quiz: { code: 'summe = 0\nfor i in range(4):\n    summe += 2', frage: 'Welchen Wert hat summe am Ende?', antwort: 8,
      erklaerung: 'range(4) läuft 4-mal (i = 0, 1, 2, 3). Jedes Mal kommt 2 dazu: 4 · 2 = 8.' },
  },
  while: {
    name: 'while-Schleife', price: 70,
    quiz: { code: 'n = 10\nwhile n > 3:\n    n -= 3', frage: 'Welchen Wert hat n am Ende?', antwort: 1,
      erklaerung: '10 → 7 → 4 → 1. Bei n = 1 ist n > 3 falsch, die Schleife endet.' },
  },
};

// ---------- Karten ----------
// cost: Zahl oder 'X' (verbraucht nichts vorab, der Code nutzt energie selbst)
// target: braucht die Karte ein Ziel? (ziel_leben / ziel_angriff)
export const CARDS = {
  funke: { name: 'Funke', cost: 1, concept: 'basis', type: 'angriff', target: true,
    code: 'ziel_leben -= 6 + staerke', text: 'Zieht dem Ziel 6 plus Stärke Leben ab.',
    up: { code: 'ziel_leben -= 9 + staerke', text: 'Zieht dem Ziel 9 plus Stärke Leben ab.' } },
  schutz: { name: 'Schutz', cost: 1, concept: 'basis', type: 'skill',
    code: 'block += 5', text: 'Erhöht deinen Block um 5.',
    up: { code: 'block += 8', text: 'Erhöht deinen Block um 8.' } },
  doppelschlag: { name: 'Doppelschlag', cost: 1, concept: 'basis', type: 'angriff', target: true,
    code: 'schaden = 4 + staerke\nziel_leben -= schaden\nziel_leben -= schaden', text: 'Merkt sich den Schaden in einer Variable und trifft zweimal.',
    up: { code: 'schaden = 5 + staerke\nziel_leben -= schaden\nziel_leben -= schaden', text: 'Merkt sich den Schaden in einer Variable und trifft zweimal (5).' } },
  aufladen: { name: 'Aufladen', cost: 0, concept: 'basis', type: 'skill',
    code: 'energie += 1\nleben -= 3', text: '+1 Energie, kostet 3 Leben.',
    up: { code: 'energie += 2\nleben -= 3', text: '+2 Energie, kostet 3 Leben.' } },
  wut: { name: 'Wut', cost: 1, concept: 'basis', type: 'skill',
    code: 'staerke += 2', text: '+2 Stärke für den Rest des Kampfs.',
    up: { code: 'staerke += 3', text: '+3 Stärke für den Rest des Kampfs.' } },
  konter: { name: 'Konter', cost: 1, concept: 'if', type: 'skill', target: true,
    code: 'if ziel_angriff > 5:\n    block += 9\nelse:\n    block += 4', text: 'Viel Block, wenn das Ziel stark angreifen will, sonst wenig.',
    up: { code: 'if ziel_angriff > 5:\n    block += 12\nelse:\n    block += 6', text: 'Viel Block (12), wenn das Ziel stark angreifen will, sonst 6.' } },
  hinrichtung: { name: 'Hinrichtung', cost: 2, concept: 'if', type: 'angriff', target: true,
    code: 'if ziel_leben < 10:\n    ziel_leben = 0\nelse:\n    ziel_leben -= 5', text: 'Ein Ziel unter 10 Leben fällt sofort, sonst 5 Schaden.',
    up: { code: 'if ziel_leben < 15:\n    ziel_leben = 0\nelse:\n    ziel_leben -= 7', text: 'Ein Ziel unter 15 Leben fällt sofort, sonst 7 Schaden.' } },
  abwaegen: { name: 'Abwägen', cost: 1, concept: 'elif', type: 'skill', target: true,
    code: 'if leben < 20:\n    leben += 6\nelif ziel_angriff > 0:\n    block += 7\nelse:\n    ziehe(2)', text: 'Heilt bei wenig Leben, blockt bei Angriff, sonst 2 Karten ziehen.',
    up: { code: 'if leben < 25:\n    leben += 8\nelif ziel_angriff > 0:\n    block += 9\nelse:\n    ziehe(3)', text: 'Heilt (8) unter 25 Leben, blockt (9) bei Angriff, sonst 3 Karten ziehen.' } },
  salve: { name: 'Salve', cost: 1, concept: 'for', type: 'angriff', target: true,
    code: 'for i in range(3):\n    ziel_leben -= 2 + staerke', text: 'Trifft dreimal. Stärke zählt bei jedem Treffer.',
    up: { code: 'for i in range(4):\n    ziel_leben -= 2 + staerke', text: 'Trifft viermal. Stärke zählt bei jedem Treffer.' } },
  kettenblitz: { name: 'Kettenblitz', cost: 2, concept: 'for', type: 'angriff',
    code: 'for i in range(len(gegner_leben)):\n    gegner_leben[i] -= 4', text: 'Trifft jeden Gegner für 4.',
    up: { code: 'for i in range(len(gegner_leben)):\n    gegner_leben[i] -= 6', text: 'Trifft jeden Gegner für 6.' } },
  schildwall: { name: 'Schildwall', cost: 1, concept: 'for', type: 'skill',
    code: 'for karte in hand:\n    block += 2', text: '2 Block für jede andere Karte auf der Hand.',
    up: { code: 'for karte in hand:\n    block += 3', text: '3 Block für jede andere Karte auf der Hand.' } },
  ueberladung: { name: 'Überladung', cost: 'X', concept: 'while', type: 'angriff', target: true,
    code: 'while energie > 0:\n    energie -= 1\n    ziel_leben -= 5', text: 'Verbraucht alle Energie, 5 Schaden pro Energie.',
    up: { code: 'while energie > 0:\n    energie -= 1\n    ziel_leben -= 7', text: 'Verbraucht alle Energie, 7 Schaden pro Energie.' } },
};

// ---------- Helden ----------
// Jeder Held hat eigenes Leben, ein eigenes Startdeck und eine Gabe.
export const HEROES = {
  magierin: { name: 'Die Funkenmagierin', hp: 46,
    deck: ['funke', 'funke', 'funke', 'funke', 'funke', 'schutz', 'schutz', 'schutz', 'doppelschlag', 'konter'],
    gabe: 'Glut', gabeText: 'Beginnt jeden Kampf mit 1 Stärke.',
    text: 'Greift hart an und hält wenig aus.' },
  waechter: { name: 'Der Steinwächter', hp: 60,
    deck: ['funke', 'funke', 'funke', 'funke', 'schutz', 'schutz', 'schutz', 'schutz', 'schutz', 'konter'],
    gabe: 'Steinhaut', gabeText: 'Beginnt jeden Kampf mit 5 Block.',
    text: 'Viel Leben und Block, aber langsam.' },
  orakel: { name: 'Das Orakel', hp: 50,
    deck: ['funke', 'funke', 'funke', 'funke', 'schutz', 'schutz', 'schutz', 'schutz', 'aufladen', 'hinrichtung'],
    gabe: 'Vorausschau', gabeText: 'Darf jeden Zug eine Vorhersage mehr machen.',
    text: 'Wer Code gut liest, wird mit ihm am stärksten.' },
};

// ---------- Bug-Karten ----------
// Typische Anfängerfehler. Im Debug-Raum repariert, werden sie stärker als vorher.
export const BUGS = {
  zaunpfahl: { name: 'Zaunpfahl', cost: 2, concept: 'for', type: 'angriff', bug: true,
    code: 'for i in range(1, len(gegner_leben)):\n    gegner_leben[i] -= 5',
    text: 'Bug: Soll jeden Gegner treffen, aber einer bleibt verschont.',
    ziel: 'Die Karte soll jedem Gegner in gegner_leben 5 Schaden zufügen. Finde den Fehler.',
    loesung: 'for i in range(len(gegner_leben)):\n    gegner_leben[i] -= 5',
    pruefe: ['gegner_leben'],
    tests: [{ gegner_leben: [20, 14] }, { gegner_leben: [9] }, { gegner_leben: [30, 12, 8] }],
    hinweise: ['Schau dir range genau an: Mit welcher Zahl beginnt die Zählung?', 'range(1, …) fängt bei Index 1 an. Der erste Gegner hat aber Index 0.', 'Schreibe range(len(gegner_leben)) ohne die 1.'],
    repariert: { name: 'Ganzer Zaun', cost: 1, text: 'Repariert: trifft jeden Gegner für 5 und kostet nur noch 1.' } },
  ewige_schleife: { name: 'Ewige Schleife', cost: 1, concept: 'while', type: 'skill', bug: true,
    code: 'while energie > 0:\n    block += 3',
    text: 'Bug: Hört nie auf. Der Zauber verheddert sich und dein Zug endet.',
    ziel: 'Die Karte soll für jede übrige Energie 3 Block geben und die Energie dabei verbrauchen.',
    loesung: 'while energie > 0:\n    energie -= 1\n    block += 3',
    pruefe: ['energie', 'block'],
    tests: [{ energie: 2, block: 0 }, { energie: 0, block: 4 }, { energie: 3, block: 1 }],
    hinweise: ['Wann wird die Bedingung energie > 0 jemals falsch?', 'In der Schleife ändert sich energie nie. Sie muss bei jedem Durchlauf kleiner werden.', 'Füge in der Schleife die Zeile energie -= 1 ein.'],
    repariert: { name: 'Gezähmte Schleife', cost: 0, text: 'Repariert: 3 Block pro übriger Energie, kostet selbst nichts.' } },
};
export const BUG_BY_NAME = { Zaunpfahl: 'zaunpfahl', 'Ewige Schleife': 'ewige_schleife' };

// ---------- Gegner ----------
// Die Absicht ist Python-Code. Variablen: mein_leben, leben, block (vom Spieler) und eigene (mem).
export const ENEMIES = {
  tintenfleck: { name: 'Tintenfleck', hp: 20, code: 'leben -= 6' },
  rostwaechter: { name: 'Rostwächter', hp: 26, code: 'if block > 0:\n    block = 0\nelse:\n    leben -= 7' },
  fehlerteufel: { name: 'Fehlerteufel', hp: 24, mem: { fluch: '' },
    code: 'if mein_leben < 10:\n    mein_leben += 6\nelse:\n    leben -= 5\n    fluch = "Zaunpfahl"' },
  schwarmbiene: { name: 'Schwarmbiene', hp: 14, code: 'for i in range(3):\n    leben -= 2' },
  schleifenschlange: { name: 'Schleifenschlange', hp: 42, elite: true, mem: { wut: 0 },
    code: 'if wut < 3:\n    wut += 1\nelse:\n    leben -= 18\n    wut = 0' },
  verzweiger: { name: 'Der Verzweiger', hp: 80, boss: true, mem: { runde: 0, wut: 0 },
    code: 'runde += 1\nif runde % 3 == 1:\n    leben -= 9 + wut\nelif runde % 3 == 2:\n    mein_leben += 8\nelse:\n    wut += 4' },
};

export const ENCOUNTERS = {
  tinte: ['tintenfleck'],
  rost: ['rostwaechter'],
  teufel: ['fehlerteufel'],
  schlange: ['schleifenschlange'],
  biene_tinte: ['schwarmbiene', 'tintenfleck'],
  rost_biene: ['rostwaechter', 'schwarmbiene'],
  boss: ['verzweiger'],
};

// ---------- Schmieden ----------
// modus 'parsons': Zeilen ordnen. modus 'frei': selbst schreiben (mit Parsons als leichtem Ausweg,
// falls ein nötiges Konzept fehlt). Der geprüfte Code wird zur Karte.
export const FORGES = {
  vergeltung: {
    titel: 'Vergeltung', stufe: 'leicht', modus: 'parsons', konzepte: ['if'],
    auftrag: 'Wenn das Ziel mehr als 6 Schaden ankündigt (ziel_angriff), bekommst du 10 Block. Sonst ziehst du dem Ziel 7 Leben ab.',
    zeilen: ['if ziel_angriff > 6:', '    block += 10', 'else:', '    ziel_leben -= 7'],
    falsch: ['    block = 10'],
    pruefe: ['block', 'ziel_leben'],
    tests: [{ ziel_angriff: 8, block: 0, ziel_leben: 20 }, { ziel_angriff: 3, block: 2, ziel_leben: 20 }, { ziel_angriff: 6, block: 5, ziel_leben: 12 }],
    hinweise: ['Zuerst kommt die Bedingung, dann was passiert, wenn sie stimmt.', 'Achtung: block = 10 setzt den Block auf 10, block += 10 erhöht ihn um 10.', 'Reihenfolge: if …, eingerückt block += 10, dann else:, eingerückt ziel_leben -= 7.'],
    karte: { name: 'Vergeltung', cost: 1, type: 'skill', target: true, text: 'Deine geschmiedete Karte: Block oder Schaden, je nach Absicht.' },
  },
  aderlass: {
    titel: 'Aderlass', stufe: 'schwer', modus: 'frei', konzepte: ['basis'], maxZeilen: 4,
    auftrag: 'Lege die Variable schaden mit dem Wert 5 + staerke an. Ziehe schaden zweimal von ziel_leben ab. Die Karte kostet dich 2 Leben.',
    vorlage: '# Variablen: ziel_leben, leben, staerke\n',
    loesung: 'schaden = 5 + staerke\nziel_leben -= schaden\nziel_leben -= schaden\nleben -= 2',
    zeilen: ['schaden = 5 + staerke', 'ziel_leben -= schaden', 'ziel_leben -= schaden', 'leben -= 2'],
    falsch: ['schaden = 5'],
    pruefe: ['ziel_leben', 'leben', 'schaden'],
    tests: [{ ziel_leben: 30, leben: 40, staerke: 0 }, { ziel_leben: 30, leben: 40, staerke: 2 }, { ziel_leben: 8, leben: 12, staerke: 5 }],
    hinweise: ['Du brauchst drei Dinge: eine neue Variable anlegen, zweimal abziehen, Leben bezahlen.', 'Beginne mit schaden = 5 + staerke.', 'schaden = 5 + staerke\nziel_leben -= schaden\n… und noch zwei Zeilen.'],
    karte: { name: 'Aderlass', cost: 1, type: 'angriff', target: true, text: 'Deine geschmiedete Karte: zweimal 5 plus Stärke, kostet 2 Leben.' },
  },
  trommelfeuer: {
    titel: 'Trommelfeuer', stufe: 'leicht', modus: 'parsons', konzepte: ['for'],
    auftrag: 'Lege fest, dass es 4 Treffer gibt. Dann ziehe dem Ziel mit einer Schleife bei jedem Treffer 3 Leben ab.',
    zeilen: ['treffer = 4', 'for i in range(treffer):', '    ziel_leben -= 3'],
    falsch: ['for i in range(3):'],
    pruefe: ['ziel_leben', 'treffer'],
    tests: [{ ziel_leben: 30 }, { ziel_leben: 12 }],
    hinweise: ['Eine Variable muss angelegt sein, bevor die Schleife sie benutzt.', 'range(3) würde nur dreimal laufen. Du brauchst die Variable treffer.', 'treffer = 4, dann for i in range(treffer):, dann eingerückt ziel_leben -= 3.'],
    karte: { name: 'Trommelfeuer', cost: 2, type: 'angriff', target: true, text: 'Deine geschmiedete Karte: 4 Treffer zu je 3.' },
  },
  flaechenbrand: {
    titel: 'Flächenbrand', stufe: 'schwer', modus: 'frei', konzepte: ['for', 'if'], maxZeilen: 3,
    auftrag: 'Gehe mit einer Schleife durch gegner_leben. Jedem Gegner, der mehr als 10 Leben hat, ziehst du 6 Leben ab. Die anderen bleiben unberührt.',
    vorlage: '# Variable: gegner_leben (Liste)\n',
    loesung: 'for i in range(len(gegner_leben)):\n    if gegner_leben[i] > 10:\n        gegner_leben[i] -= 6',
    zeilen: ['for i in range(len(gegner_leben)):', '    if gegner_leben[i] > 10:', '        gegner_leben[i] -= 6'],
    falsch: ['    if gegner_leben > 10:'],
    pruefe: ['gegner_leben'],
    tests: [{ gegner_leben: [20, 5] }, { gegner_leben: [11, 10, 30] }, { gegner_leben: [] }, { gegner_leben: [8] }],
    hinweise: ['Du brauchst den Index i, um einen Wert in der Liste zu verändern.', 'for i in range(len(gegner_leben)): läuft über alle Positionen. Darin prüfst du gegner_leben[i].', 'for i in range(len(gegner_leben)):\n    if gegner_leben[i] > 10:\n        …'],
    karte: { name: 'Flächenbrand', cost: 1, type: 'angriff', target: false, text: 'Deine geschmiedete Karte: 6 Schaden an allen starken Gegnern.' },
  },
};

// ---------- Run-Skills (Level-up) ----------
export const RUN_SKILLS = {
  fruehstart: { name: 'Frühstarter', text: 'Im ersten Zug jedes Kampfs +1 Energie.' },
  panzerhaut: { name: 'Panzerhaut', text: 'Zu Beginn jedes Zugs 3 Block.' },
  kraftreserve: { name: 'Kraftreserve', text: 'Zu Beginn jedes Kampfs +1 Stärke.' },
};

// ---------- Talentbaum (dauerhaft) ----------
export const TALENTS = {
  vit: { cluster: 'Mitte', name: 'Zähigkeit', text: '+6 maximales Leben.', x: 50, y: 50 },
  glut1: { cluster: 'Glut', name: 'Glutstart', text: 'Eine Salve ersetzt einen Funken im Startdeck.', x: 20, y: 22 },
  glut2: { cluster: 'Glut', name: 'Zündung', text: 'Zu Beginn jedes Kampfs +1 Stärke.', x: 8, y: 8, req: 'glut1' },
  frost1: { cluster: 'Frost', name: 'Raureif', text: 'Zu Beginn jedes Kampfs 4 Block.', x: 80, y: 22 },
  frost2: { cluster: 'Frost', name: 'Dauerfrost', text: 'Block verfällt am Zugende nur zur Hälfte.', x: 92, y: 8, req: 'frost1' },
  takt1: { cluster: 'Takt', name: 'Auswahl', text: 'Nach Elite-Kämpfen 4 statt 3 Karten zur Wahl.', x: 20, y: 78 },
  takt2: { cluster: 'Takt', name: 'Schneller Griff', text: 'Im ersten Zug jedes Kampfs 1 Karte mehr.', x: 8, y: 92, req: 'takt1' },
  gel1: { cluster: 'Gelehrte', name: 'Gute Frage', text: 'Der erste Hinweis in jedem Run ist kostenlos.', x: 80, y: 78 },
  gel2: { cluster: 'Gelehrte', name: 'Hellseher', text: 'Zwei Vorhersagen pro Zug statt einer.', x: 92, y: 92, req: 'gel1' },
  gel3: { cluster: 'Gelehrte', name: 'Fleiß', text: '+10 EXP für jede gelöste Schmiede.', x: 66, y: 94, req: 'gel1' },
};

// ---------- Karte des Akts ----------
// Jede Reihe ist eine Wahl, jeder Raum führt zu allen Räumen der nächsten Reihe.
// Bauplan der Höhle: eine Ebene pro Zeile, vom Eingang (unten) bis vor den Boss (oben).
// 'zufall' wählt je Knoten gewichtet einen Raumtyp, 'pool' die möglichen Kämpfe.
export const MAP_PLAN = [
  { typ: 'kampf', pool: ['tinte', 'rost'] },
  { zufall: { kampf: 3, haendler: 1 }, pool: ['tinte', 'rost', 'teufel'] },
  { zufall: { schmiede: 2, kampf: 2 }, pool: ['tinte', 'rost', 'teufel'], forges: ['vergeltung', 'aderlass'] },
  { zufall: { kampf: 3, elite: 2, rast: 1 }, pool: ['teufel', 'rost', 'tinte'] },
  { zufall: { haendler: 1, rast: 1 } },
  { zufall: { debug: 1, kampf: 1, rast: 1 }, pool: ['teufel', 'rost', 'tinte'] },
  { zufall: { kampf: 3, elite: 1 }, pool: ['biene_tinte', 'rost_biene', 'teufel'] },
  { zufall: { schmiede: 2, kampf: 2 }, pool: ['biene_tinte', 'rost_biene', 'teufel'], forges: ['trommelfeuer', 'flaechenbrand'] },
  { zufall: { kampf: 2, haendler: 1 }, pool: ['biene_tinte', 'rost_biene'] },
  { typ: 'rast' },
];
export const MAP_COLS = 5;
export const FORGE_LEVEL = { vergeltung: 'leicht', trommelfeuer: 'leicht', aderlass: 'schwer', flaechenbrand: 'schwer' };

export const ROOM_INFO = {
  kampf: { name: 'Kampf', icon: '⚔' },
  elite: { name: 'Elite', icon: '☠' },
  schmiede: { name: 'Schmiede', icon: '⚒' },
  debug: { name: 'Debug-Raum', icon: '🐞' },
  haendler: { name: 'Händler', icon: '⚖' },
  rast: { name: 'Rastplatz', icon: '🔥' },
  boss: { name: 'Boss', icon: '♛' },
};

export const EXP_PER_LEVEL = 50;
