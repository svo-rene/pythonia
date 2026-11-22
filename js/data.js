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
  // Eingabe-Karten: Die erste Zeile fragt beim Ausspielen nach einer Zahl (min bis max).
  streustrahl: { name: 'Streustrahl', cost: 1, concept: 'for', type: 'angriff', target: true, eingabe: { var: 'treffer', min: 1, max: 4 },
    code: 'treffer = int(input("Wie viele Treffer? (1-4)"))\nschaden = 12 // treffer + staerke\nfor i in range(treffer):\n    ziel_leben -= schaden',
    text: 'Du wählst: wenige starke oder viele schwache Treffer. Stärke zählt bei jedem Treffer.',
    up: { code: 'treffer = int(input("Wie viele Treffer? (1-4)"))\nschaden = 16 // treffer + staerke\nfor i in range(treffer):\n    ziel_leben -= schaden', text: 'Wie Streustrahl, aber 16 statt 12 werden aufgeteilt.' } },
  kraftschub: { name: 'Kraftschub', cost: 0, concept: 'basis', type: 'angriff', target: true, eingabe: { var: 'einsatz', min: 0, max: 'energie' },
    code: 'einsatz = int(input("Wie viel Energie einsetzen?"))\nenergie -= einsatz\nziel_leben -= 3 + 6 * einsatz',
    text: 'Du wählst, wie viel Energie du hineinsteckst: 6 Schaden pro Energie, plus 3.',
    up: { code: 'einsatz = int(input("Wie viel Energie einsetzen?"))\nenergie -= einsatz\nziel_leben -= 4 + 8 * einsatz', text: '8 Schaden pro Energie, plus 4.' } },
  kettenschlag: { name: 'Kettenschlag', cost: 1, concept: 'for', type: 'angriff', eingabe: { var: 'ziele', min: 1, max: 'gegner' },
    code: 'ziele = int(input("Wie viele Gegner treffen?"))\nfor i in range(ziele):\n    gegner_leben[i] -= 14 // ziele',
    text: 'Du wählst, wie viele Gegner (von vorn in der Liste) getroffen werden. 14 Schaden werden aufgeteilt.',
    up: { code: 'ziele = int(input("Wie viele Gegner treffen?"))\nfor i in range(ziele):\n    gegner_leben[i] -= 20 // ziele', text: '20 Schaden werden auf die gewählten Gegner aufgeteilt.' } },
  blutpakt: { name: 'Blutpakt', cost: 0, concept: 'basis', type: 'skill', eingabe: { var: 'opfer', min: 0, max: 10 },
    code: 'opfer = int(input("Wie viel Leben opfern? (0-10)"))\nleben -= opfer\nblock += 2 * opfer',
    text: 'Du wählst, wie viel Leben du opferst. Jedes geopferte Leben gibt 2 Block.',
    up: { code: 'opfer = int(input("Wie viel Leben opfern? (0-10)"))\nleben -= opfer\nblock += 3 * opfer', text: 'Jedes geopferte Leben gibt 3 Block.' } },
};

// ---------- Helden ----------
// Jeder Held hat eigenes Leben, ein eigenes Startdeck und eine Gabe.
export const HEROES = {
  magierin: { name: 'Die Funkenmagierin', hp: 46,
    deck: ['funke', 'funke', 'funke', 'funke', 'funke', 'schutz', 'schutz', 'schutz', 'doppelschlag', 'konter'],
    relic: 'glutstein',
    text: 'Greift hart an und hält wenig aus.' },
  waechter: { name: 'Der Steinwächter', hp: 60,
    deck: ['funke', 'funke', 'funke', 'funke', 'schutz', 'schutz', 'schutz', 'schutz', 'schutz', 'konter'],
    relic: 'steinhaut',
    text: 'Viel Leben und Block, aber langsam.' },
  orakel: { name: 'Das Orakel', hp: 50,
    deck: ['funke', 'funke', 'funke', 'funke', 'schutz', 'schutz', 'schutz', 'schutz', 'aufladen', 'hinrichtung'],
    relic: 'kristallkugel', extra: '+25 % Chance auf eine Eingebung pro Zug.',
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
  klarsicht: { name: 'Klarsicht', text: '+15 % Chance auf eine Eingebung pro Zug.' },
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
  gel2: { cluster: 'Gelehrte', name: 'Hellseher', text: '+15 % Chance auf eine Eingebung pro Zug.', x: 92, y: 92, req: 'gel1' },
  gel3: { cluster: 'Gelehrte', name: 'Fleiß', text: '+10 EXP für jede gelöste Schmiede.', x: 66, y: 94, req: 'gel1' },
};

// ---------- Karte des Akts ----------
// Jede Reihe ist eine Wahl, jeder Raum führt zu allen Räumen der nächsten Reihe.
// Bauplan der Höhle: eine Ebene pro Zeile, vom Eingang (unten) bis vor den Boss (oben).
// 'zufall' wählt je Knoten gewichtet einen Raumtyp, 'pool' die möglichen Kämpfe.
export const MAP_PLAN = [
  { typ: 'kampf', pool: ['tinte', 'rost'] },
  { zufall: { kampf: 3, haendler: 1, raetsel: 2 }, pool: ['tinte', 'rost', 'teufel'] },
  { zufall: { schmiede: 2, kampf: 2 }, pool: ['tinte', 'rost', 'teufel'], forges: ['vergeltung', 'aderlass'] },
  { zufall: { kampf: 3, elite: 2, rast: 1 }, pool: ['teufel', 'rost', 'tinte'] },
  { zufall: { haendler: 1, rast: 1, raetsel: 1 } },
  { zufall: { debug: 1, kampf: 1, rast: 1 }, pool: ['teufel', 'rost', 'tinte'] },
  { zufall: { kampf: 3, elite: 1, raetsel: 1 }, pool: ['biene_tinte', 'rost_biene', 'teufel'] },
  { zufall: { schmiede: 2, kampf: 2 }, pool: ['biene_tinte', 'rost_biene', 'teufel'], forges: ['trommelfeuer', 'flaechenbrand'] },
  { zufall: { kampf: 2, haendler: 1, raetsel: 1 }, pool: ['biene_tinte', 'rost_biene'] },
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
  raetsel: { name: 'Rätsel', icon: '?' },
  boss: { name: 'Boss', icon: '♛' },
};

export const EXP_PER_LEVEL = 50;

// ---------- ?-Räume: Rätsel ----------
// Der richtige Wert wird im Spiel mit Natter berechnet, hier steht nur Code und Variable.
export const RIDDLES = {
  tausch: { concept: 'basis', var: 'x', code: 'x = 4\ny = x * 3\nx = y - 5',
    erklaerung: 'y bekommt 4 · 3 = 12. Danach wird x überschrieben: 12 − 5 = 7.' },
  kopie: { concept: 'basis', var: 'b', code: 'a = 10\nb = a\na = 3',
    erklaerung: 'b = a kopiert den Wert 10. Dass a danach 3 wird, ändert b nicht mehr.' },
  liste: { concept: 'basis', var: 'summe', code: 'werte = [3, 8, 2]\nwerte[1] -= 5\nsumme = werte[0] + werte[1]',
    erklaerung: 'Index 1 ist die 8 (gezählt wird ab 0). 8 − 5 = 3, also 3 + 3 = 6.' },
  zweiifs: { concept: 'if', var: 'punkte', code: 'punkte = 7\nif punkte > 5:\n    punkte *= 2\nif punkte > 10:\n    punkte -= 4',
    erklaerung: 'Zwei getrennte if: Erst wird 7 zu 14. Das zweite if prüft den neuen Wert, 14 > 10, also 14 − 4 = 10.' },
  sonst: { concept: 'if', var: 'leben', code: 'leben = 12\nif leben < 10:\n    leben += 5\nelse:\n    leben -= 2',
    erklaerung: '12 < 10 ist falsch, also läuft der else-Zweig: 12 − 2 = 10.' },
  stufen: { concept: 'elif', var: 'y', code: 'x = 15\nif x > 20:\n    y = 1\nelif x > 10:\n    y = 2\nelif x > 5:\n    y = 3\nelse:\n    y = 4',
    erklaerung: 'Nur der erste wahre Zweig läuft. 15 > 20 nein, 15 > 10 ja, also y = 2. Der Rest wird übersprungen.' },
  zaehlen: { concept: 'for', var: 's', code: 's = 0\nfor i in range(1, 4):\n    s += i',
    erklaerung: 'range(1, 4) liefert 1, 2, 3 (die 4 nicht). 1 + 2 + 3 = 6.' },
  verdoppeln: { concept: 'for', var: 'n', code: 'n = 1\nfor i in range(3):\n    n *= 2',
    erklaerung: 'Dreimal verdoppeln: 1 → 2 → 4 → 8.' },
  halbieren: { concept: 'while', var: 'schritte', code: 'z = 20\nschritte = 0\nwhile z > 1:\n    z //= 2\n    schritte += 1',
    erklaerung: '20 → 10 → 5 → 2 → 1. Das sind 4 Schritte, dann ist z > 1 falsch.' },
};

// ---------- ?-Räume: Entscheidungen ----------
export const CHOICE_EVENTS = {
  quelle: { icon: '⛲', titel: 'Die Quelle der Ausnahmen', text: 'Eine leuchtende Quelle. Wer daraus trinkt, wird zäher, aber etwas Fehlerhaftes kriecht mit hinein.',
    optionen: [
      { name: 'Trinken', text: '+8 maximales Leben, aber eine Bug-Karte (Ewige Schleife) kommt ins Deck.', wirkung: { maxLeben: 8, bug: 'ewige_schleife' } },
      { name: 'Hände waschen', text: '10 Leben heilen.', wirkung: { heilen: 10 } },
    ] },
  buecherwurm: { icon: '🐛', titel: 'Der Bücherwurm', text: 'Ein dicker Wurm frisst sich durch Zauberbücher. Er ist hungrig.',
    optionen: [
      { name: 'Eine Karte verfüttern', text: 'Entferne eine Karte deiner Wahl aus dem Deck.', wirkung: { entfernen: true } },
      { name: 'Ihm Gold geben', text: '20 Gold: Er spuckt eine zufällige neue Karte aus.', kosten: { gold: 20 }, wirkung: { karte: true } },
      { name: 'Weitergehen', text: 'Nichts passiert.' },
    ] },
  altar: { icon: '🗿', titel: 'Der Blutaltar', text: 'Auf einem Altar liegen zwei glänzende Gegenstände. Eine Inschrift: „Nimm, aber zahle.“',
    optionen: [
      { name: 'Opfern', text: 'Verliere 8 Leben und wähle eines von zwei Relikten.', kosten: { leben: 8 }, wirkung: { relikt: 2 } },
      { name: 'Gold aufsammeln', text: '+25 Gold liegen daneben.', wirkung: { gold: 25 } },
    ] },
};

// ---------- Relikte ----------
// Jedes Relikt ist eine Python-Funktion, die zu einem festen Zeitpunkt aufgerufen wird.
// Relikte mit demselben Zeitpunkt laufen in der Reihenfolge, die der Spieler festlegt.
// Variablen: leben, block, energie, staerke, ziel_leben, gegner_leben, runde, gold, merk (bleibt im Kampf erhalten);
// bei karte_gespielt zusätzlich typ ("angriff"/"skill") und kosten.
export const HOOKS = {
  kampf_start: 'zu Beginn jedes Kampfs',
  zug_start: 'zu Beginn jedes Zugs',
  karte_gespielt: 'nach jeder gespielten Karte',
  zug_ende: 'am Ende deines Zugs',
  kampf_ende: 'nach jedem gewonnenen Kampf',
};
export const RELICS = {
  glutstein: { name: 'Glutstein', icon: '🔥', hook: 'kampf_start', code: 'staerke += 1', start: 'magierin' },
  steinhaut: { name: 'Steinhaut', icon: '🪨', hook: 'kampf_start', code: 'block += 5', start: 'waechter' },
  kristallkugel: { name: 'Kristallkugel', icon: '🔮', hook: 'zug_start', code: 'if runde == 1:\n    energie += 1', start: 'orakel' },
  kiesel: { name: 'Kiesel', icon: '🪙', hook: 'zug_start', code: 'block += 3' },
  spiegelschild: { name: 'Spiegelschild', icon: '🪞', hook: 'zug_start', code: 'if block < 12:\n    block *= 2' },
  verstaerker: { name: 'Verstärker', icon: '✖', hook: 'kampf_start', code: 'staerke *= 2' },
  lupe: { name: 'Lupe', icon: '🔍', hook: 'zug_start', code: 'if ziel_angriff > 8:\n    block += 6' },
  blutkristall: { name: 'Blutkristall', icon: '🩸', hook: 'karte_gespielt', code: 'if typ == "angriff":\n    leben += 1' },
  zaehlwerk: { name: 'Zählwerk', icon: '⚙', hook: 'karte_gespielt', code: 'merk += 1\nif merk % 3 == 0:\n    energie += 1' },
  dornen: { name: 'Dornenkranz', icon: '🌵', hook: 'zug_ende', code: 'for i in range(len(gegner_leben)):\n    gegner_leben[i] -= 2' },
  sparschwein: { name: 'Sparschwein', icon: '🐷', hook: 'zug_ende', code: 'if energie > 0:\n    block += 4 * energie' },
  goldzahn: { name: 'Goldzahn', icon: '🦷', hook: 'kampf_ende', code: 'gold += 8' },
  pflaster: { name: 'Pflaster', icon: '🩹', hook: 'kampf_ende', code: 'leben += 4' },
  wetzstein: { name: 'Wetzstein', icon: '🗡', hook: 'karte_gespielt', code: 'if kosten >= 2:\n    staerke += 1' },
};

// ---------- Evolutionen (wie in Vampire Survivors) ----------
// Zwei Karten verschmelzen am Rastplatz zu einer stärkeren, wenn eine davon verbessert (+) ist. Den neuen Code baut man selbst (Zeilen ordnen).
// Das Rezept steht im Zauberbuch erst als ???, bis man es entdeckt hat.
export const EVOLUTIONS = {
  funkenkette: { zutaten: ['funke', 'doppelschlag'], forge: 'evo_funkenkette' },
  bollwerk: { zutaten: ['schutz', 'konter'], forge: 'evo_bollwerk' },
  raserei: { zutaten: ['wut', 'salve'], forge: 'evo_raserei' },
  gericht: { zutaten: ['hinrichtung', 'kettenblitz'], forge: 'evo_gericht' },
};
Object.assign(FORGES, {
  evo_funkenkette: {
    titel: 'Funkenkette', stufe: 'Evolution', modus: 'parsons', konzepte: ['for'], evo: 'funkenkette',
    auftrag: 'Verschmilz Funke und Doppelschlag: Lege schaden = 5 + staerke an und triff das Ziel mit einer Schleife dreimal mit schaden.',
    zeilen: ['schaden = 5 + staerke', 'for i in range(3):', '    ziel_leben -= schaden'],
    falsch: ['    ziel_leben -= 5'],
    pruefe: ['ziel_leben'],
    tests: [{ ziel_leben: 40, staerke: 0 }, { ziel_leben: 40, staerke: 2 }],
    hinweise: ['Erst die Variable, dann die Schleife, die sie benutzt.', 'ziel_leben -= 5 vergisst die Stärke. Nimm die Variable schaden.', 'schaden = 5 + staerke, dann for i in range(3):, eingerückt ziel_leben -= schaden.'],
    karte: { name: 'Funkenkette', cost: 2, type: 'angriff', target: true, text: 'Evolution: dreimal 5 plus Stärke.' },
  },
  evo_bollwerk: {
    titel: 'Bollwerk', stufe: 'Evolution', modus: 'parsons', konzepte: ['if'], evo: 'bollwerk',
    auftrag: 'Verschmilz Schutz und Konter: Immer 5 Block. Wenn das Ziel mehr als 5 Schaden ankündigt, noch einmal 10 Block dazu, sonst 5.',
    zeilen: ['block += 5', 'if ziel_angriff > 5:', '    block += 10', 'else:', '    block += 5'],
    falsch: ['    block = 10'],
    pruefe: ['block'],
    tests: [{ block: 0, ziel_angriff: 8 }, { block: 3, ziel_angriff: 2 }, { block: 0, ziel_angriff: 5 }],
    hinweise: ['Die erste Zeile gilt immer, sie steht nicht eingerückt.', 'block = 10 überschreibt den Block. Du willst ihn erhöhen.', 'block += 5, dann if ziel_angriff > 5:, eingerückt block += 10, dann else: mit block += 5.'],
    karte: { name: 'Bollwerk', cost: 1, type: 'skill', target: true, text: 'Evolution: 15 Block bei starkem Angriff, sonst 10.' },
  },
  evo_raserei: {
    titel: 'Raserei', stufe: 'Evolution', modus: 'parsons', konzepte: ['for'], evo: 'raserei',
    auftrag: 'Verschmilz Wut und Salve: Dreimal hintereinander: Erst +1 Stärke, dann 3 plus Stärke Schaden. Jeder Treffer wird stärker.',
    zeilen: ['for i in range(3):', '    staerke += 1', '    ziel_leben -= 3 + staerke'],
    falsch: ['staerke += 1'],
    pruefe: ['ziel_leben', 'staerke'],
    tests: [{ ziel_leben: 40, staerke: 0 }, { ziel_leben: 40, staerke: 2 }],
    hinweise: ['Beide Zeilen gehören in die Schleife, also eingerückt.', 'Die Zeile ohne Einrückung liefe nur einmal vor der Schleife.', 'for i in range(3):, darunter eingerückt staerke += 1 und ziel_leben -= 3 + staerke.'],
    karte: { name: 'Raserei', cost: 2, type: 'angriff', target: true, text: 'Evolution: dreimal Stärke +1 und Treffer.' },
  },
  evo_gericht: {
    titel: 'Gericht', stufe: 'Evolution', modus: 'parsons', konzepte: ['for', 'if'], evo: 'gericht',
    auftrag: 'Verschmilz Hinrichtung und Kettenblitz: Gehe durch alle Gegner. Wer weniger als 12 Leben hat, fällt sofort, alle anderen bekommen 5 Schaden.',
    zeilen: ['for i in range(len(gegner_leben)):', '    if gegner_leben[i] < 12:', '        gegner_leben[i] = 0', '    else:', '        gegner_leben[i] -= 5'],
    falsch: ['    if gegner_leben < 12:'],
    pruefe: ['gegner_leben'],
    tests: [{ gegner_leben: [20, 8] }, { gegner_leben: [11, 12] }, { gegner_leben: [] }],
    hinweise: ['Für jeden Gegner brauchst du seinen Index i.', 'gegner_leben < 12 vergleicht die ganze Liste. Du brauchst gegner_leben[i].', 'for i in range(len(gegner_leben)):, darin if gegner_leben[i] < 12: … else: …'],
    karte: { name: 'Gericht', cost: 2, type: 'angriff', target: false, text: 'Evolution: Schwache Gegner fallen, alle anderen bekommen 5.' },
  },
});

// ---------- Erfolge: schalten neue Relikte frei ----------
export const ACHIEVEMENTS = {
  unverwundbar: { name: 'Unberührt', text: 'Gewinne einen Kampf, ohne Leben zu verlieren.', relic: 'schutzamulett' },
  hellseher: { name: 'Hellseher', text: 'Sag in einem Run 3 Eingebungen richtig vorher.', relic: 'drittes_auge' },
  minimalist: { name: 'Minimalist', text: 'Gewinne einen Kampf mit höchstens 8 Karten im Deck.', relic: 'feder' },
  meisterschmied: { name: 'Meisterschmied', text: 'Hol in einer schweren Schmiede 3 Sterne.', relic: 'amboss' },
  raetselmeister: { name: 'Rätselmeister', text: 'Löse 5 verschiedene Rätsel.', relic: 'eule' },
  alchemist: { name: 'Alchemist', text: 'Verschmilz zum ersten Mal zwei Karten.', relic: 'kessel' },
};
Object.assign(RELICS, {
  schutzamulett: { name: 'Schutzamulett', icon: '🛡', hook: 'kampf_start', code: 'block += 8', unlock: 'unverwundbar' },
  drittes_auge: { name: 'Drittes Auge', icon: '👁', hook: 'zug_start', code: 'if runde % 2 == 0:\n    energie += 1', unlock: 'hellseher' },
  feder: { name: 'Feder', icon: '🪶', hook: 'zug_start', code: 'if runde == 1:\n    staerke += 2', unlock: 'minimalist' },
  amboss: { name: 'Amboss', icon: '⚒', hook: 'karte_gespielt', code: 'if typ == "skill":\n    block += 2', unlock: 'meisterschmied' },
  eule: { name: 'Eule', icon: '🦉', hook: 'zug_ende', code: 'if block == 0:\n    leben += 2', unlock: 'raetselmeister' },
  kessel: { name: 'Kessel', icon: '🧪', hook: 'kampf_ende', code: 'leben += 2\ngold += 4', unlock: 'alchemist' },
});

// ---------- Boss-Regeln (wie die Boss-Blinds in Balatro) ----------
export const RULES = {
  staerke_null: { name: 'Kraftlos', code: 'staerke = 0  # vor jeder Karte', text: 'Deine Karten sehen staerke immer als 0. Stärke, die du aufbaust, bleibt trotzdem erhalten.' },
  if_teuer: { name: 'Verzweigungssteuer', code: 'if "if" in karte:\n    kosten += 1', text: 'Karten mit if kosten 1 Energie mehr.' },
  lang_teuer: { name: 'Kurz fassen!', code: 'if zeilen > 2:\n    kosten += 1', text: 'Karten mit mehr als 2 Zeilen Code kosten 1 Energie mehr.' },
};

// ---------- Prüfungsstufen (wie Ascension) ----------
// Nach einem Sieg wird die nächste Stufe frei. Jede Stufe enthält alle vorherigen.
export const STUFEN = [
  'Normal',
  'Gegner haben 15 % mehr Leben.',
  'Elite-Kämpfe haben eine Sonderregel.',
  'Du startest mit der Bug-Karte Zaunpfahl.',
  'Rastplätze heilen nur 10 statt 15.',
  'Der Boss hat 25 % mehr Leben.',
];

// =====================================================================
// AKT 2: Die Listengruben (Listen-Methoden und Sortieren)
// Neue Spielvariable: kristalle (eine Liste, die im Kampf erhalten bleibt und als Kästchen zu sehen ist).
// =====================================================================
Object.assign(CONCEPTS, {
  liste: { name: 'Listen-Methoden', act: 2, price: 0,
    quiz: { code: 'k = [4, 9]\nk.append(2)\nx = k.pop()', frage: 'Welchen Wert hat x am Ende?', antwort: 2,
      erklaerung: 'append(2) hängt die 2 hinten an: [4, 9, 2]. pop() nimmt das letzte Element heraus, also die 2.' } },
  sort: { name: 'Sortieren', act: 2, price: 50,
    quiz: { code: 'k = [7, 2, 5]\nk.sort()\nx = k[0] + k.pop()', frage: 'Welchen Wert hat x am Ende?', antwort: 9,
      erklaerung: 'sort() ordnet aufsteigend: [2, 5, 7]. k[0] ist 2, pop() nimmt die 7. Zusammen 9.' } },
});

Object.assign(CARDS, {
  kristall: { name: 'Kristall formen', cost: 1, concept: 'liste', type: 'skill',
    code: 'kristalle.append(3 + staerke)\nblock += 3', text: 'Hängt einen Kristall (3 plus Stärke) hinten an deine Liste. Dazu 3 Block.',
    up: { code: 'kristalle.append(5 + staerke)\nblock += 4', text: 'Kristall mit 5 plus Stärke, dazu 4 Block.' } },
  kristallwurf: { name: 'Kristallwurf', cost: 1, concept: 'liste', type: 'angriff', target: true,
    code: 'if len(kristalle) > 0:\n    ziel_leben -= kristalle.pop() * 2', text: 'Nimmt den letzten Kristall aus der Liste und wirft ihn: doppelter Wert als Schaden.',
    up: { code: 'if len(kristalle) > 0:\n    ziel_leben -= kristalle.pop() * 3', text: 'Letzter Kristall, dreifacher Wert als Schaden.' } },
  scheibe: { name: 'Scheibenschnitt', cost: 1, concept: 'liste', type: 'angriff', target: true,
    code: 'ziel_leben -= sum(kristalle[:2]) + 2', text: 'Die ersten beiden Kristalle (kristalle[:2]) treffen zusammen, plus 2. Sie bleiben in der Liste.',
    up: { code: 'ziel_leben -= sum(kristalle[:3]) + 2', text: 'Die ersten drei Kristalle treffen zusammen, plus 2.' } },
  ordnen: { name: 'Ordnen', cost: 0, concept: 'sort', type: 'skill',
    code: 'kristalle.sort()\nziehe(1)', text: 'Sortiert deine Kristalle aufsteigend: Der größte steht danach hinten. Du ziehst 1 Karte.',
    up: { code: 'kristalle.sort()\nziehe(2)', text: 'Sortiert deine Kristalle und du ziehst 2 Karten.' } },
  spitzenstein: { name: 'Spitzenstein', cost: 1, concept: 'sort', type: 'angriff', target: true,
    code: 'if len(kristalle) > 0:\n    ziel_leben -= max(kristalle) + staerke', text: 'Der größte Kristall trifft, ohne verbraucht zu werden.',
    up: { code: 'if len(kristalle) > 0:\n    ziel_leben -= max(kristalle) * 2', text: 'Der größte Kristall trifft doppelt, ohne verbraucht zu werden.' } },
  kristallregen: { name: 'Kristallregen', cost: 2, concept: 'for', type: 'angriff', target: true,
    code: 'for k in kristalle:\n    ziel_leben -= k\nkristalle = []', text: 'Alle Kristalle treffen nacheinander. Danach ist die Liste leer.',
    up: { code: 'for k in kristalle:\n    ziel_leben -= k + 1\nkristalle = []', text: 'Alle Kristalle treffen mit je +1. Danach ist die Liste leer.' } },
});

Object.assign(ENEMIES, {
  echofledermaus: { name: 'Echofledermaus', hp: 22, mem: { echo: [] },
    code: 'echo.append(3)\nfor e in echo:\n    leben -= e' },
  kristalldieb: { name: 'Kristalldieb', hp: 28,
    code: 'if len(kristalle) > 0:\n    kristalle.pop()\n    leben -= 3\nelse:\n    leben -= 9' },
  minenwurm: { name: 'Minenwurm', hp: 30, mem: { minen: [2, 8, 4] },
    code: 'leben -= minen[0]\nminen.append(minen.pop(0) + 1)' },
  zahlenhydra: { name: 'Zahlenhydra', hp: 64, elite: true, mem: { koepfe: [4] },
    code: 'for k in koepfe:\n    leben -= k\nkoepfe.append(4)' },
  mischer: { name: 'Der Mischer', hp: 130, boss: true, mem: { runde: 0, stapel: [9, 2, 6, 4] },
    code: 'runde += 1\nkristalle.reverse()\nleben -= stapel.pop()\nstapel.insert(0, 5 + runde)' },
});

Object.assign(ENCOUNTERS, {
  echo: ['echofledermaus'],
  dieb: ['kristalldieb'],
  wurm: ['minenwurm'],
  echo_dieb: ['echofledermaus', 'kristalldieb'],
  wurm_echo: ['minenwurm', 'echofledermaus'],
  hydra: ['zahlenhydra'],
  boss2: ['mischer'],
});

Object.assign(FORGES, {
  stapler: {
    titel: 'Doppelkristall', stufe: 'leicht', modus: 'parsons', konzepte: ['liste'],
    auftrag: 'Hänge zwei neue Kristalle hinten an die Liste kristalle: zuerst einen mit dem Wert 4, dann einen mit 4 + staerke.',
    zeilen: ['kristalle.append(4)', 'kristalle.append(4 + staerke)'],
    falsch: ['kristalle = [4]'],
    pruefe: ['kristalle'],
    tests: [{ kristalle: [], staerke: 0 }, { kristalle: [2], staerke: 3 }],
    hinweise: ['append hängt hinten an. Die Reihenfolge der Zeilen bestimmt die Reihenfolge in der Liste.', 'kristalle = [4] würde die ganze Liste ersetzen. Die alten Kristalle wären weg!', 'kristalle.append(4), dann kristalle.append(4 + staerke).'],
    karte: { name: 'Doppelkristall', cost: 1, type: 'skill', text: 'Deine geschmiedete Karte: zwei neue Kristalle.' },
  },
  sortierschuss: {
    titel: 'Sortierschuss', stufe: 'schwer', modus: 'frei', konzepte: ['liste', 'sort'], maxZeilen: 2,
    auftrag: 'Sortiere die Kristalle aufsteigend. Nimm dann den größten (er steht jetzt hinten) mit pop() heraus und ziehe seinen Wert von ziel_leben ab.',
    vorlage: '# Variablen: kristalle (Liste), ziel_leben\n',
    loesung: 'kristalle.sort()\nziel_leben -= kristalle.pop()',
    zeilen: ['kristalle.sort()', 'ziel_leben -= kristalle.pop()'],
    falsch: ['ziel_leben -= kristalle.pop(0)'],
    pruefe: ['kristalle', 'ziel_leben'],
    tests: [{ kristalle: [3, 9, 5], ziel_leben: 30 }, { kristalle: [7], ziel_leben: 10 }, { kristalle: [2, 2, 8, 1], ziel_leben: 20 }],
    hinweise: ['Erst sortieren, dann herausnehmen. Nach sort() steht der größte Wert ganz hinten.', 'pop() ohne Zahl nimmt das letzte Element. pop(0) nähme das erste, also das kleinste.', 'kristalle.sort()\nziel_leben -= …'],
    karte: { name: 'Sortierschuss', cost: 1, type: 'angriff', target: true, text: 'Deine geschmiedete Karte: wirft immer den größten Kristall.' },
  },
  durchzaehlen: {
    titel: 'Kristallschild', stufe: 'leicht', modus: 'parsons', konzepte: ['for', 'liste'],
    auftrag: 'Gehe mit einer Schleife durch alle Kristalle. Jeder Kristall gibt dir so viel Block, wie er wert ist. Die Kristalle bleiben in der Liste.',
    zeilen: ['for k in kristalle:', '    block += k'],
    falsch: ['    block = k'],
    pruefe: ['block', 'kristalle'],
    tests: [{ kristalle: [3, 5], block: 0 }, { kristalle: [], block: 4 }, { kristalle: [1, 1, 6], block: 2 }],
    hinweise: ['k ist in jedem Durchlauf ein anderer Kristall.', 'block = k würde den Block jedes Mal überschreiben. Du willst addieren.', 'for k in kristalle:, eingerückt block += k.'],
    karte: { name: 'Kristallschild', cost: 1, type: 'skill', text: 'Deine geschmiedete Karte: Block in Höhe aller Kristalle.' },
  },
  zwillinge: {
    titel: 'Zwillingskristall', stufe: 'schwer', modus: 'frei', konzepte: ['for', 'liste'], maxZeilen: 2,
    auftrag: 'Verdopple jeden Kristall in der Liste. Achtung: Die Werte in der Liste selbst müssen sich ändern.',
    vorlage: '# Variable: kristalle (Liste)\n',
    loesung: 'for i in range(len(kristalle)):\n    kristalle[i] *= 2',
    zeilen: ['for i in range(len(kristalle)):', '    kristalle[i] *= 2'],
    falsch: ['    k *= 2'],
    pruefe: ['kristalle'],
    tests: [{ kristalle: [3, 5] }, { kristalle: [] }, { kristalle: [1, 4, 2] }],
    hinweise: ['Mit for k in kristalle: bekommst du nur eine Kopie des Werts. k *= 2 ändert die Liste nicht!', 'Du brauchst die Position: for i in range(len(kristalle)):', 'Dann kristalle[i] *= 2.'],
    karte: { name: 'Zwillingskristall', cost: 1, type: 'skill', text: 'Deine geschmiedete Karte: verdoppelt alle Kristalle.' },
  },
});

Object.assign(RIDDLES, {
  popappend: { concept: 'liste', var: 'x', code: 'k = [5, 1]\nk.append(8)\nx = k.pop() + k.pop()',
    erklaerung: 'Nach append: [5, 1, 8]. Das erste pop() nimmt 8, das zweite nimmt 1. Zusammen 9.' },
  vorne: { concept: 'liste', var: 'x', code: 'k = [6, 3, 9]\nk.pop(0)\nx = k[0]',
    erklaerung: 'pop(0) nimmt das erste Element (6) heraus. Danach ist k = [3, 9], und k[0] ist 3.' },
  scheibe: { concept: 'liste', var: 's', code: 'k = [2, 7, 4, 1]\ns = sum(k[1:3])',
    erklaerung: 'k[1:3] sind die Positionen 1 und 2 (die 3 nicht mehr): [7, 4]. Die Summe ist 11.' },
  sortiert: { concept: 'sort', var: 'x', code: 'k = [8, 3, 5]\nk.sort()\nx = k[1]',
    erklaerung: 'sort() macht daraus [3, 5, 8]. An Position 1 steht 5.' },
  hinten: { concept: 'liste', var: 'x', code: 'k = [4, 9, 2]\nx = k[-1] * 2',
    erklaerung: 'k[-1] ist das letzte Element, also 2. Mal 2 gibt 4.' },
});

export const MAP_PLAN_2 = [
  { typ: 'kampf', pool: ['echo', 'dieb'] },
  { zufall: { kampf: 3, raetsel: 2, haendler: 1 }, pool: ['echo', 'dieb', 'wurm'] },
  { zufall: { schmiede: 2, kampf: 2 }, pool: ['echo', 'dieb', 'wurm'], forges: ['stapler', 'sortierschuss'] },
  { zufall: { kampf: 3, elite: 2, rast: 1 }, pool: ['wurm', 'dieb', 'echo'], elite: 'hydra' },
  { zufall: { haendler: 1, rast: 1, raetsel: 1 } },
  { zufall: { debug: 1, kampf: 1, rast: 1 }, pool: ['echo_dieb', 'wurm'] },
  { zufall: { kampf: 3, elite: 1, raetsel: 1 }, pool: ['echo_dieb', 'wurm_echo'], elite: 'hydra' },
  { zufall: { schmiede: 2, kampf: 2 }, pool: ['echo_dieb', 'wurm_echo'], forges: ['durchzaehlen', 'zwillinge'] },
  { zufall: { kampf: 2, haendler: 1, raetsel: 1 }, pool: ['wurm_echo', 'echo_dieb'] },
  { typ: 'rast' },
];

export const ACTS = {
  1: { name: 'Die Höhle der Verzweigungen', plan: MAP_PLAN, boss: 'boss', thema: 'if, Schleifen und Variablen' },
  2: { name: 'Die Listengruben', plan: MAP_PLAN_2, boss: 'boss2', thema: 'Listen-Methoden und Sortieren',
    intro: 'In den Listengruben sammelst du Kristalle in einer Liste. Mit append() kommen sie hinten dazu, pop() nimmt den letzten heraus, sort() ordnet sie. Gegner hier haben selbst Listen, und manche stehlen deine Kristalle!',
    geschenk: ['kristall', 'kristall', 'kristallwurf'], konzept: 'liste' },
};
Object.assign(FORGE_LEVEL, { stapler: 'leicht', sortierschuss: 'schwer', durchzaehlen: 'leicht', zwillinge: 'schwer' });
