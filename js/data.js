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
  wut: { name: 'Wut', cost: 1, concept: 'basis', type: 'skill', einmalig: true,
    code: 'staerke += 2', text: '+2 Stärke für den Rest des Kampfs. Einmalig: danach ist die Karte für diesen Kampf weg.',
    up: { code: 'staerke += 3', text: '+3 Stärke für den Rest des Kampfs. Einmalig pro Kampf.' } },
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
    deck: ['funke', 'funke', 'funke', 'funke', 'schutz', 'schutz', 'schutz', 'schutz', 'doppelschlag', 'konter'],
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
  fehlerteufel: { name: 'Fehlerteufel', hp: 24, mem: { fluch: '', geheilt: 0 },
    code: 'if mein_leben < 10 and geheilt == 0:\n    mein_leben += 6\n    geheilt = 1\nelse:\n    leben -= 5\n    fluch = "Zaunpfahl"' },
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
  kristall: { act: 2, name: 'Kristall formen', cost: 1, concept: 'liste', type: 'skill',
    code: 'kristalle.append(4 + staerke)\nblock += 4', text: 'Hängt einen Kristall (4 plus Stärke) hinten an deine Liste. Dazu 4 Block.',
    up: { code: 'kristalle.append(6 + staerke)\nblock += 5', text: 'Kristall mit 6 plus Stärke, dazu 5 Block.' } },
  kristallwurf: { act: 2, name: 'Kristallwurf', cost: 0, concept: 'liste', type: 'angriff', target: true,
    code: 'if len(kristalle) > 0:\n    ziel_leben -= kristalle.pop() * 2', text: 'Nimmt den letzten Kristall aus der Liste und wirft ihn: doppelter Wert als Schaden.',
    up: { code: 'if len(kristalle) > 0:\n    ziel_leben -= kristalle.pop() * 3', text: 'Letzter Kristall, dreifacher Wert als Schaden.' } },
  scheibe: { act: 2, name: 'Scheibenschnitt', cost: 1, concept: 'liste', type: 'angriff', target: true,
    code: 'ziel_leben -= sum(kristalle[:2]) + 2', text: 'Die ersten beiden Kristalle (kristalle[:2]) treffen zusammen, plus 2. Sie bleiben in der Liste.',
    up: { code: 'ziel_leben -= sum(kristalle[:3]) + 2', text: 'Die ersten drei Kristalle treffen zusammen, plus 2.' } },
  ordnen: { act: 2, name: 'Ordnen', cost: 0, concept: 'sort', type: 'skill',
    code: 'kristalle.sort()\nziehe(1)', text: 'Sortiert deine Kristalle aufsteigend: Der größte steht danach hinten. Du ziehst 1 Karte.',
    up: { code: 'kristalle.sort()\nziehe(2)', text: 'Sortiert deine Kristalle und du ziehst 2 Karten.' } },
  spitzenstein: { act: 2, name: 'Spitzenstein', cost: 1, concept: 'sort', type: 'angriff', target: true,
    code: 'if len(kristalle) > 0:\n    ziel_leben -= max(kristalle) * 2', text: 'Der größte Kristall trifft doppelt, ohne verbraucht zu werden.',
    up: { code: 'if len(kristalle) > 0:\n    ziel_leben -= max(kristalle) * 3', text: 'Der größte Kristall trifft dreifach, ohne verbraucht zu werden.' } },
  kristallregen: { act: 2, name: 'Kristallregen', cost: 2, concept: 'for', type: 'angriff', target: true,
    code: 'for k in kristalle:\n    ziel_leben -= k\nkristalle = []', text: 'Alle Kristalle treffen nacheinander. Danach ist die Liste leer.',
    up: { code: 'for k in kristalle:\n    ziel_leben -= k + 1\nkristalle = []', text: 'Alle Kristalle treffen mit je +1. Danach ist die Liste leer.' } },
});

Object.assign(ENEMIES, {
  echofledermaus: { name: 'Echofledermaus', hp: 34, mem: { echo: [] },
    code: 'echo.append(3)\nfor e in echo:\n    leben -= e' },
  kristalldieb: { name: 'Kristalldieb', hp: 38,
    code: 'if len(kristalle) > 0:\n    kristalle.pop()\n    leben -= 4\nelse:\n    leben -= 9' },
  minenwurm: { name: 'Minenwurm', hp: 42, mem: { minen: [4, 9, 6] },
    code: 'leben -= minen[0]\nminen.append(minen.pop(0) + 1)' },
  zahlenhydra: { name: 'Zahlenhydra', hp: 85, elite: true, mem: { koepfe: [5] },
    code: 'for k in koepfe:\n    leben -= k\nkoepfe.append(5)' },
  mischer: { name: 'Der Mischer', hp: 160, boss: true, mem: { runde: 0, stapel: [14, 6, 11, 8] },
    code: 'runde += 1\nkristalle.reverse()\nleben -= stapel.pop()\nstapel.insert(0, 9 + runde)' },
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
    geschenk: ['kristall', 'kristallwurf'], konzept: 'liste' },
};
Object.assign(FORGE_LEVEL, { stapler: 'leicht', sortierschuss: 'schwer', durchzaehlen: 'leicht', zwillinge: 'schwer' });

// =====================================================================
// SPIELWEISEN (frei nach dem ersten Sieg über Akt 1)
// Jede Figur hat eine Grundeigenschaft (als Relikt). Die Karten jeder Spielweise kann jede Figur nutzen.
// Neue Variablen: dornen, ziel_brand, ziel_schwach, ziel_verwundbar, gegner_brand, gegner_schwach
// =====================================================================
export const BUILDS = {
  dornen: { name: 'Dornen und Block', icon: '🌵', text: 'Viel Block aufbauen. Wer dich angreift, verletzt sich an deinen Dornen.' },
  brand: { name: 'Brand', icon: '🔥', text: 'Gegner in Brand setzen. Brand schadet jede Runde und lässt sich verdoppeln.' },
  fluch: { name: 'Flüche', icon: '🌀', text: 'Gegner schwächen (weniger Schaden) und verwundbar machen (mehr Schaden).' },
};
Object.assign(HEROES.waechter, { trait: 'dornenschild', build: 'dornen' });
Object.assign(HEROES.magierin, { trait: 'glutherz', build: 'brand' });
Object.assign(HEROES.orakel, { trait: 'fluchsicht', build: 'fluch' });

Object.assign(RELICS, {
  // Grundeigenschaften der Figuren
  dornenschild: { name: 'Dornenschild', icon: '🌵', hook: 'kampf_start', code: 'dornen += 2', trait: 'waechter' },
  glutherz: { name: 'Glutherz', icon: '🌋', hook: 'karte_gespielt', code: 'if typ == "angriff":\n    ziel_brand += 1', trait: 'magierin' },
  fluchsicht: { name: 'Fluchsicht', icon: '🌀', hook: 'karte_gespielt', code: 'if typ == "skill":\n    ziel_schwach += 1', trait: 'orakel' },
  // findbare Relikte der Spielweisen
  stachelring: { name: 'Stachelring', icon: '💍', hook: 'kampf_start', code: 'dornen += 1', build: true },
  nadelkissen: { name: 'Nadelkissen', icon: '🧷', hook: 'zug_ende', code: 'if block >= 10:\n    dornen += 1', build: true },
  zunderbuechse: { name: 'Zunderbüchse', icon: '🧨', hook: 'zug_start', code: 'ziel_brand += 1', build: true },
  boeser_blick: { name: 'Böser Blick', icon: '🧿', hook: 'kampf_start', code: 'for i in range(len(gegner_schwach)):\n    gegner_schwach[i] += 1', build: true },
});

Object.assign(CARDS, {
  // Dornen und Block
  stachelpanzer: { name: 'Stachelpanzer', build: 'dornen', cost: 1, concept: 'basis', type: 'skill',
    code: 'dornen += 2\nblock += 4', text: '+2 Dornen für den Kampf und 4 Block.',
    up: { code: 'dornen += 3\nblock += 5', text: '+3 Dornen und 5 Block.' } },
  schildschlag: { name: 'Schildschlag', build: 'dornen', cost: 1, concept: 'basis', type: 'angriff', target: true,
    code: 'ziel_leben -= block // 2', text: 'Schaden in Höhe der Hälfte deines Blocks.',
    up: { code: 'ziel_leben -= block // 2 + 5', text: 'Halber Block plus 5 als Schaden.' } },
  igel: { name: 'Igel', build: 'dornen', cost: 2, concept: 'if', type: 'skill', target: true,
    code: 'block += 9\nif ziel_angriff > 0:\n    dornen += 3', text: '9 Block. Will das Ziel angreifen, +3 Dornen.',
    up: { code: 'block += 12\nif ziel_angriff > 0:\n    dornen += 3', text: '12 Block. Will das Ziel angreifen, +3 Dornen.' } },
  eisenhaut: { name: 'Eisenhaut', build: 'dornen', cost: 1, concept: 'basis', type: 'skill',
    code: 'block += 3 + 2 * dornen', text: '3 Block plus 2 für jeden Dorn.',
    up: { code: 'block += 5 + 2 * dornen', text: '5 Block plus 2 für jeden Dorn.' } },
  // Brand
  zunder: { name: 'Zunder', build: 'brand', cost: 1, concept: 'basis', type: 'angriff', target: true,
    code: 'ziel_leben -= 3\nziel_brand += 3', text: '3 Schaden und 3 Brand.',
    up: { code: 'ziel_leben -= 4\nziel_brand += 4', text: '4 Schaden und 4 Brand.' } },
  funkenschauer: { name: 'Funkenschauer', build: 'brand', cost: 1, concept: 'for', type: 'angriff', target: true,
    code: 'for i in range(3):\n    ziel_leben -= 1\n    ziel_brand += 1', text: 'Dreimal: 1 Schaden und 1 Brand.',
    up: { code: 'for i in range(4):\n    ziel_leben -= 1\n    ziel_brand += 1', text: 'Viermal: 1 Schaden und 1 Brand.' } },
  feuerring: { name: 'Feuerring', build: 'brand', cost: 1, concept: 'for', type: 'skill',
    code: 'for i in range(len(gegner_brand)):\n    gegner_brand[i] += 3', text: 'Jeder Gegner bekommt 3 Brand.',
    up: { code: 'for i in range(len(gegner_brand)):\n    gegner_brand[i] += 4', text: 'Jeder Gegner bekommt 4 Brand.' } },
  glutnest: { name: 'Glutnest', build: 'brand', cost: 1, concept: 'basis', type: 'skill', target: true,
    code: 'ziel_brand *= 2', text: 'Verdoppelt den Brand des Ziels.',
    up: { cost: 0, text: 'Verdoppelt den Brand des Ziels. Kostet nichts.' } },
  ausbrennen: { name: 'Ausbrennen', build: 'brand', cost: 2, concept: 'basis', type: 'angriff', target: true,
    code: 'ziel_leben -= ziel_brand * 2\nziel_brand = 0', text: 'Doppelter Brand als Schaden auf einmal. Danach ist der Brand weg.',
    up: { code: 'ziel_leben -= ziel_brand * 3\nziel_brand = 0', text: 'Dreifacher Brand als Schaden auf einmal.' } },
  // Flüche
  fluchblick: { name: 'Fluchblick', build: 'fluch', cost: 1, concept: 'basis', type: 'skill', target: true,
    code: 'ziel_schwach += 2\nblock += 4', text: 'Das Ziel ist 2 Züge schwach (−25 % Schaden). Dazu 4 Block.',
    up: { code: 'ziel_schwach += 3\nblock += 5', text: '3 Züge schwach und 5 Block.' } },
  blossstellen: { name: 'Bloßstellen', build: 'fluch', cost: 1, concept: 'basis', type: 'skill', target: true,
    code: 'ziel_verwundbar += 2\nziehe(1)', text: 'Das Ziel ist 2 Züge verwundbar (+50 % Schaden). Du ziehst 1 Karte.',
    up: { code: 'ziel_verwundbar += 3\nziehe(1)', text: '3 Züge verwundbar, 1 Karte ziehen.' } },
  wehrlos: { name: 'Wehrlos', build: 'fluch', cost: 1, concept: 'if', type: 'angriff', target: true,
    code: 'if ziel_verwundbar > 0:\n    ziel_leben -= 10\nelse:\n    ziel_leben -= 5', text: '10 Schaden, wenn das Ziel verwundbar ist, sonst 5.',
    up: { code: 'if ziel_verwundbar > 0:\n    ziel_leben -= 14\nelse:\n    ziel_leben -= 6', text: '14 Schaden, wenn verwundbar, sonst 6.' } },
  nebel: { name: 'Lähmender Nebel', build: 'fluch', cost: 2, concept: 'for', type: 'skill',
    code: 'for i in range(len(gegner_schwach)):\n    gegner_schwach[i] += 2\nblock += 5', text: 'Alle Gegner 2 Züge schwach. Dazu 5 Block.',
    up: { code: 'for i in range(len(gegner_schwach)):\n    gegner_schwach[i] += 3\nblock += 6', text: 'Alle Gegner 3 Züge schwach, 6 Block.' } },
  zehrfluch: { name: 'Zehrfluch', build: 'fluch', cost: 1, concept: 'basis', type: 'angriff', target: true,
    code: 'ziel_leben -= 2 + 3 * ziel_schwach', text: '2 Schaden plus 3 für jeden Zug, den das Ziel noch schwach ist.',
    up: { code: 'ziel_leben -= 3 + 4 * ziel_schwach', text: '3 Schaden plus 4 pro Schwäche-Zug.' } },
});

// =====================================================================
// NACH AKT 1: zwei weitere Spielweisen und zwei neue Figuren
// Neue Variablen: ziel_frost, gegner_frost (ab 5 Frost erstarrt ein Gegner und setzt einen Zug aus), kombo
// =====================================================================
Object.assign(BUILDS, {
  eis: { name: 'Eis', icon: '❄', advanced: true, text: 'Frost sammeln. Ab 5 Frost erstarrt ein Gegner und setzt einen ganzen Zug aus.' },
  kombo: { name: 'Kombo', icon: '🤹', advanced: true, text: 'Viele billige Karten in einem Zug. Die Variable kombo zählt mit und macht spätere Karten stärker.' },
});

Object.assign(HEROES, {
  eishexe: { name: 'Die Eishexe', hp: 52, advanced: true, trait: 'frosthauch', build: 'eis', relic: 'frosthauch',
    deck: ['funke', 'funke', 'funke', 'funke', 'schutz', 'schutz', 'schutz', 'schutz', 'frostsplitter', 'eiswand'],
    text: 'Lässt Gegner erstarren, bevor sie zuschlagen.' },
  gaukler: { name: 'Der Gaukler', hp: 44, advanced: true, trait: 'jonglierball', build: 'kombo', relic: 'jonglierball',
    deck: ['funke', 'funke', 'funke', 'schutz', 'schutz', 'schutz', 'wurfmesser', 'wurfmesser', 'wurfmesser', 'schwung'],
    text: 'Spielt viele kleine Karten blitzschnell hintereinander.' },
});

Object.assign(RELICS, {
  frosthauch: { name: 'Frosthauch', icon: '🌬', hook: 'zug_start', code: 'for i in range(len(gegner_frost)):\n    gegner_frost[i] += 1', trait: 'eishexe' },
  jonglierball: { name: 'Jonglierball', icon: '🤹', hook: 'karte_gespielt', code: 'if kombo == 4:\n    energie += 1', trait: 'gaukler' },
  eiszapfen: { name: 'Eiszapfen', icon: '🧊', hook: 'kampf_start', code: 'for i in range(len(gegner_frost)):\n    gegner_frost[i] += 2', build: true, advanced: true },
  taschenuhr: { name: 'Taschenuhr', icon: '⏱', hook: 'karte_gespielt', code: 'if kombo == 6:\n    energie += 1', build: true, advanced: true },
  schneekugel: { name: 'Schneekugel', icon: '🔮', hook: 'zug_ende', code: 'if kombo >= 5:\n    block += 6', build: true, advanced: true },
});

Object.assign(CARDS, {
  // Eis
  frostsplitter: { name: 'Frostsplitter', build: 'eis', cost: 1, concept: 'basis', type: 'angriff', target: true,
    code: 'ziel_leben -= 4\nziel_frost += 2', text: '4 Schaden und 2 Frost. Ab 5 Frost erstarrt das Ziel.',
    up: { code: 'ziel_leben -= 5\nziel_frost += 3', text: '5 Schaden und 3 Frost.' } },
  eiswand: { name: 'Eiswand', build: 'eis', cost: 1, concept: 'basis', type: 'skill', target: true,
    code: 'block += 5\nziel_frost += 1', text: '5 Block und 1 Frost aufs Ziel.',
    up: { code: 'block += 7\nziel_frost += 2', text: '7 Block und 2 Frost.' } },
  blizzard: { name: 'Blizzard', build: 'eis', cost: 2, concept: 'for', type: 'skill',
    code: 'for i in range(len(gegner_frost)):\n    gegner_frost[i] += 3', text: 'Jeder Gegner bekommt 3 Frost.',
    up: { code: 'for i in range(len(gegner_frost)):\n    gegner_frost[i] += 4', text: 'Jeder Gegner bekommt 4 Frost.' } },
  kaelteschock: { name: 'Kälteschock', build: 'eis', cost: 1, concept: 'if', type: 'skill', target: true,
    code: 'if ziel_frost >= 2:\n    ziel_frost += 3\nelse:\n    ziel_frost += 1', text: 'Hat das Ziel schon 2 Frost, kommen 3 dazu, sonst 1.',
    up: { code: 'if ziel_frost >= 2:\n    ziel_frost += 4\nelse:\n    ziel_frost += 2', text: 'Ab 2 Frost kommen 4 dazu, sonst 2.' } },
  eisbrecher: { name: 'Eisbrecher', build: 'eis', cost: 2, concept: 'basis', type: 'angriff', target: true,
    code: 'ziel_leben -= 4 + 3 * ziel_frost\nziel_frost = 0', text: '4 Schaden plus 3 pro Frost. Danach ist der Frost weg.',
    up: { code: 'ziel_leben -= 5 + 4 * ziel_frost\nziel_frost = 0', text: '5 Schaden plus 4 pro Frost.' } },
  // Kombo
  wurfmesser: { name: 'Wurfmesser', build: 'kombo', cost: 0, concept: 'basis', type: 'angriff', target: true,
    code: 'ziel_leben -= 2 + kombo', text: '2 Schaden plus 1 für jede Karte, die du in diesem Zug schon gespielt hast.',
    up: { code: 'ziel_leben -= 3 + kombo', text: '3 Schaden plus kombo.' } },
  schwung: { name: 'Schwung', build: 'kombo', cost: 0, concept: 'basis', type: 'skill',
    code: 'block += 2 + kombo', text: '2 Block plus kombo.',
    up: { code: 'block += 3 + kombo', text: '3 Block plus kombo.' } },
  jonglage: { name: 'Jonglage', build: 'kombo', cost: 1, concept: 'basis', type: 'skill',
    code: 'ziehe(2)\nblock += kombo', text: 'Du ziehst 2 Karten. Dazu Block in Höhe von kombo.',
    up: { code: 'ziehe(3)\nblock += kombo', text: 'Du ziehst 3 Karten, Block in Höhe von kombo.' } },
  finale: { name: 'Großes Finale', build: 'kombo', cost: 2, concept: 'for', type: 'angriff', target: true,
    code: 'for i in range(kombo):\n    ziel_leben -= 3', text: 'Trifft so oft, wie du in diesem Zug schon Karten gespielt hast, je 3.',
    up: { code: 'for i in range(kombo):\n    ziel_leben -= 4', text: 'Trifft kombo-mal je 4.' } },
  wirbel: { name: 'Klingenwirbel', build: 'kombo', cost: 1, concept: 'for', type: 'angriff',
    code: 'for i in range(len(gegner_leben)):\n    gegner_leben[i] -= 2 + kombo', text: 'Jeder Gegner bekommt 2 plus kombo Schaden.',
    up: { code: 'for i in range(len(gegner_leben)):\n    gegner_leben[i] -= 3 + kombo', text: 'Jeder Gegner bekommt 3 plus kombo.' } },
});

// =====================================================================
// KARTENSETS für alle Figuren, freigeschaltet je nach Akt
// Akt 1: Waage (Leben als Ressource, Variable wunden) und Zufall (import random)
// Akt 2: Beschwörer (Liste begleiter), Archivar (Listen ablage und ziehstapel), Rekursion (Funktionen, die sich selbst aufrufen)
// =====================================================================
export const CARD_SETS = {
  waage: { name: 'Waage', icon: '⚖', act: 1, text: 'Leben als Rohstoff: Je verletzter du bist (wunden), desto stärker werden diese Karten.' },
  zufall: { name: 'Zufall', icon: '🎲', act: 1, text: 'Würfelglück mit import random und random.randint(a, b).' },
  beschwoerer: { name: 'Beschwörer', icon: '🐺', act: 2, text: 'Begleiter in der Liste begleiter greifen am Ende deines Zugs mit ihrem Wert an.' },
  archivar: { name: 'Archivar', icon: '📚', act: 2, text: 'Arbeite mit den Listen ablage und ziehstapel: pop() holt Karten zurück auf die Hand.' },
  rekursion: { name: 'Rekursion', icon: '🔁', act: 2, text: 'Funktionen, die sich selbst aufrufen. Schwer, aber mächtig.' },
};

CONCEPTS.rekursion = { name: 'Funktionen und Rekursion', act: 2, price: 60,
  quiz: { code: 'def f(n):\n    if n == 0:\n        return 0\n    return 2 + f(n - 1)\nx = f(3)', frage: 'Welchen Wert hat x am Ende?', antwort: 6,
    erklaerung: 'f(3) = 2 + f(2) = 2 + 2 + f(1) = 2 + 2 + 2 + f(0) = 6. Bei n == 0 hört die Funktion auf, sich selbst aufzurufen.' } };

Object.assign(CARDS, {
  // ---------- Waage ----------
  rache: { set: 'waage', name: 'Rache', cost: 1, concept: 'basis', type: 'angriff', target: true,
    code: 'ziel_leben -= 4 + wunden // 3', text: '4 Schaden plus 1 für je 3 verlorene Leben (wunden).',
    up: { code: 'ziel_leben -= 6 + wunden // 3', text: '6 Schaden plus wunden // 3.' } },
  blutmauer: { set: 'waage', name: 'Blutmauer', cost: 1, concept: 'basis', type: 'skill',
    code: 'block += 3 + wunden // 4', text: '3 Block plus 1 für je 4 verlorene Leben.',
    up: { code: 'block += 5 + wunden // 4', text: '5 Block plus wunden // 4.' } },
  schmerzgrenze: { set: 'waage', name: 'Schmerzgrenze', cost: 1, concept: 'if', type: 'angriff', target: true,
    code: 'if leben < max_leben // 2:\n    ziel_leben -= 16\nelse:\n    ziel_leben -= 5', text: 'Unter halbem Leben 16 Schaden, sonst 5.',
    up: { code: 'if leben < max_leben // 2:\n    ziel_leben -= 20\nelse:\n    ziel_leben -= 7', text: 'Unter halbem Leben 20 Schaden, sonst 7.' } },
  blutrausch: { set: 'waage', name: 'Blutrausch', cost: 2, concept: 'for', type: 'angriff', target: true,
    code: 'leben -= 5\nfor i in range(3):\n    ziel_leben -= 3 + wunden // 6', text: 'Kostet 5 Leben. Dreimal 3 Schaden plus wunden // 6.',
    up: { code: 'leben -= 5\nfor i in range(3):\n    ziel_leben -= 4 + wunden // 6', text: 'Kostet 5 Leben. Dreimal 4 plus wunden // 6.' } },
  blutschwur: { set: 'waage', name: 'Blutschwur', cost: 0, concept: 'basis', type: 'skill',
    code: 'leben -= 4\nenergie += 2', text: 'Kostet 4 Leben, gibt 2 Energie.',
    up: { code: 'leben -= 3\nenergie += 2', text: 'Kostet nur 3 Leben, gibt 2 Energie.' } },
  // ---------- Zufall ----------
  wuerfelwurf: { set: 'zufall', name: 'Würfelwurf', cost: 1, concept: 'basis', type: 'angriff', target: true,
    code: 'import random\nwurf = random.randint(1, 6)\nziel_leben -= wurf * 2', text: 'Würfelt 1 bis 6, doppelt so viel Schaden.',
    up: { code: 'import random\nwurf = random.randint(1, 6)\nziel_leben -= wurf * 2 + 3', text: 'Gewürfelt mal 2, plus 3 Schaden.' } },
  gluecksschild: { set: 'zufall', name: 'Glücksschild', cost: 1, concept: 'basis', type: 'skill',
    code: 'import random\nblock += random.randint(3, 10)', text: 'Zufällig 3 bis 10 Block.',
    up: { code: 'import random\nblock += random.randint(5, 12)', text: 'Zufällig 5 bis 12 Block.' } },
  allesodernichts: { set: 'zufall', name: 'Alles oder nichts', cost: 1, concept: 'if', type: 'angriff', target: true,
    code: 'import random\nwurf = random.randint(1, 6)\nif wurf == 6:\n    ziel_leben -= 25\nelse:\n    ziel_leben -= wurf', text: 'Bei einer 6: 25 Schaden! Sonst so viel, wie gewürfelt.',
    up: { code: 'import random\nwurf = random.randint(1, 6)\nif wurf >= 5:\n    ziel_leben -= 25\nelse:\n    ziel_leben -= wurf', text: 'Bei 5 oder 6: 25 Schaden, sonst der Wurf.' } },
  muenzwurf: { set: 'zufall', name: 'Münzwurf', cost: 0, concept: 'if', type: 'skill',
    code: 'import random\nif random.randint(0, 1) == 1:\n    energie += 2\nelse:\n    leben -= 3', text: 'Kopf: +2 Energie. Zahl: −3 Leben.',
    up: { code: 'import random\nif random.randint(0, 1) == 1:\n    energie += 2\nelse:\n    leben -= 1', text: 'Kopf: +2 Energie. Zahl: nur −1 Leben.' } },
  gluecksregen: { set: 'zufall', name: 'Glücksregen', cost: 2, concept: 'for', type: 'angriff', target: true,
    code: 'import random\nfor i in range(3):\n    ziel_leben -= random.randint(2, 6)', text: 'Dreimal zufällig 2 bis 6 Schaden.',
    up: { code: 'import random\nfor i in range(4):\n    ziel_leben -= random.randint(2, 6)', text: 'Viermal zufällig 2 bis 6 Schaden.' } },
  // ---------- Beschwörer (Akt 2) ----------
  wolfsruf: { set: 'beschwoerer', act: 2, name: 'Wolfsruf', cost: 1, concept: 'liste', type: 'skill',
    code: 'begleiter.append(3)', text: 'Ein Wolf (3) kommt in deine Liste begleiter. Jeder Begleiter greift am Ende deines Zugs mit seinem Wert an.',
    up: { code: 'begleiter.append(5)', text: 'Ein Wolf mit Wert 5.' } },
  golem: { set: 'beschwoerer', act: 2, name: 'Steingolem', cost: 2, concept: 'liste', type: 'skill',
    code: 'begleiter.append(7)\nblock += 4', text: 'Ein Golem (7) kommt dazu, und 4 Block.',
    up: { code: 'begleiter.append(9)\nblock += 5', text: 'Ein Golem (9) und 5 Block.' } },
  rudelruf: { set: 'beschwoerer', act: 2, name: 'Rudelruf', cost: 1, concept: 'for', type: 'skill',
    code: 'for i in range(len(begleiter)):\n    begleiter[i] += 2', text: 'Jeder Begleiter wird um 2 stärker.',
    up: { code: 'for i in range(len(begleiter)):\n    begleiter[i] += 3', text: 'Jeder Begleiter wird um 3 stärker.' } },
  opfergabe: { set: 'beschwoerer', act: 2, name: 'Opfergabe', cost: 0, concept: 'liste', type: 'skill',
    code: 'if len(begleiter) > 0:\n    block += begleiter.pop() * 3', text: 'Der letzte Begleiter geht (pop) und gibt dreimal seinen Wert als Block.',
    up: { code: 'if len(begleiter) > 0:\n    block += begleiter.pop() * 4', text: 'Letzter Begleiter geht, viermal sein Wert als Block.' } },
  angriffsbefehl: { set: 'beschwoerer', act: 2, name: 'Angriffsbefehl', cost: 1, concept: 'liste', type: 'angriff', target: true,
    code: 'ziel_leben -= sum(begleiter)', text: 'Alle Begleiter greifen sofort zusätzlich an (Summe ihrer Werte).',
    up: { code: 'ziel_leben -= sum(begleiter) + 4', text: 'Summe der Begleiter plus 4.' } },
  // ---------- Archivar (Akt 2) ----------
  recyceln: { set: 'archivar', act: 2, name: 'Recyceln', cost: 1, concept: 'liste', type: 'skill',
    code: 'if len(ablage) > 0:\n    ablage.pop()', text: 'Die zuletzt abgelegte Karte kommt mit pop() zurück auf deine Hand.',
    up: { cost: 0, text: 'Die zuletzt abgelegte Karte kommt zurück auf die Hand. Kostet nichts.' } },
  stapelblick: { set: 'archivar', act: 2, name: 'Stapelwucht', cost: 1, concept: 'liste', type: 'angriff', target: true,
    code: 'ziel_leben -= 2 * len(ablage)', text: '2 Schaden für jede Karte in deiner Ablage.',
    up: { code: 'ziel_leben -= 3 * len(ablage)', text: '3 Schaden pro Karte in der Ablage.' } },
  nachschlagen: { set: 'archivar', act: 2, name: 'Nachschlagen', cost: 1, concept: 'for', type: 'skill',
    code: 'for i in range(2):\n    if len(ziehstapel) > 0:\n        ziehstapel.pop()', text: 'Nimmt zweimal die oberste Karte (das Ende der Liste) vom Ziehstapel auf die Hand.',
    up: { code: 'for i in range(3):\n    if len(ziehstapel) > 0:\n        ziehstapel.pop()', text: 'Dreimal die oberste Karte vom Ziehstapel.' } },
  archivschlag: { set: 'archivar', act: 2, name: 'Archivschlag', cost: 1, concept: 'liste', type: 'angriff', target: true,
    code: 'ziel_leben -= 4 + 3 * ablage.count("Funke")', text: '4 Schaden plus 3 für jeden Funken in der Ablage (count zählt).',
    up: { code: 'ziel_leben -= 4 + 4 * ablage.count("Funke")', text: '4 plus 4 pro Funke in der Ablage.' } },
  // ---------- Rekursion (Akt 2) ----------
  kettenreaktion: { set: 'rekursion', act: 2, name: 'Kettenreaktion', cost: 2, concept: 'rekursion', type: 'angriff', target: true,
    code: 'def welle(n):\n    if n == 0:\n        return 0\n    return n + welle(n - 1)\nziel_leben -= welle(4)', text: 'welle(4) = 4 + 3 + 2 + 1 = 10 Schaden. Die Funktion ruft sich selbst auf.',
    up: { code: 'def welle(n):\n    if n == 0:\n        return 0\n    return n + welle(n - 1)\nziel_leben -= welle(5)', text: 'welle(5) = 15 Schaden.' } },
  fraktal: { set: 'rekursion', act: 2, name: 'Fraktal', cost: 2, concept: 'rekursion', type: 'angriff',
    code: 'def teile(n):\n    if n < 2:\n        return 1\n    return 1 + teile(n // 2)\nfor i in range(len(gegner_leben)):\n    gegner_leben[i] -= 2 * teile(16)', text: 'teile(16) halbiert so lange, bis 1 übrig ist, und zählt mit. Jeder Gegner bekommt das Doppelte.',
    up: { code: 'def teile(n):\n    if n < 2:\n        return 1\n    return 1 + teile(n // 2)\nfor i in range(len(gegner_leben)):\n    gegner_leben[i] -= 3 * teile(16)', text: 'Jeder Gegner bekommt dreimal teile(16).' } },
  echoschild: { set: 'rekursion', act: 2, name: 'Echoschild', cost: 1, concept: 'rekursion', type: 'skill',
    code: 'def summe(liste):\n    if len(liste) == 0:\n        return 0\n    return liste[0] + summe(liste[1:])\nblock += summe(gegner_angriff)', text: 'Rechnet rekursiv zusammen, wie viel Schaden alle Gegner planen, und gibt so viel Block.',
    up: { code: 'def summe(liste):\n    if len(liste) == 0:\n        return 0\n    return liste[0] + summe(liste[1:])\nblock += summe(gegner_angriff) + 3', text: 'Block in Höhe des geplanten Schadens plus 3.' } },
  potenz: { set: 'rekursion', act: 2, name: 'Verdoppler', cost: 1, concept: 'rekursion', type: 'skill',
    code: 'def doppelt(wert, mal):\n    if mal == 0:\n        return wert\n    return doppelt(wert * 2, mal - 1)\nblock += doppelt(2, 2)', text: 'doppelt(2, 2) verdoppelt zweimal: 2 → 4 → 8 Block.',
    up: { code: 'def doppelt(wert, mal):\n    if mal == 0:\n        return wert\n    return doppelt(wert * 2, mal - 1)\nblock += doppelt(3, 2)', text: 'doppelt(3, 2) = 12 Block.' } },
});

// =====================================================================
// WELTKARTE: Hauptpfad (Lernweg) und freie Nebenwelten
// Hauptpfad: Akt 1 Grundlagen → Akt 2 Listen, Sortieren, Komplexität → Akt 3 Rekursion → Akt 4 OOP
// Nebenwelten zweigen ab, sobald ein Akt geschafft ist. Dort ist alles erlaubt; ihr Kartenset kommt häufiger.
// =====================================================================
Object.assign(ACTS, {
  3: { name: 'Der Spiegelturm', thema: 'Funktionen, return und Rekursion', bald: true },
  4: { name: 'Die Klassenfestung', thema: 'Klassen, Objekte und Vererbung (OOP)', bald: true },
});
ACTS[2].thema = 'Listen, Sortieren und Komplexität';

Object.assign(ENEMIES, {
  croupier: { name: 'Der Croupier', hp: 95, boss: true,
    code: 'import random\nwurf = random.randint(1, 6)\nif wurf == 6:\n    leben -= 20\nelse:\n    leben -= wurf * 2' },
  gladiator: { name: 'Der Gladiator', hp: 100, boss: true,
    code: 'if mein_leben < 40:\n    leben -= 14\nelse:\n    leben -= 8' },
  wolfsmutter: { name: 'Die Wolfsmutter', hp: 120, boss: true, mem: { welpen: [] },
    code: 'welpen.append(3)\nleben -= sum(welpen)' },
  bibliothekar: { name: 'Der Bibliothekar', hp: 130, boss: true, mem: { seiten: 0 },
    code: 'seiten += 1\nif seiten % 3 == 0:\n    kristalle = []\nleben -= 4 * seiten' },
});
Object.assign(ENCOUNTERS, { croupier: ['croupier'], gladiator: ['gladiator'], wolfsmutter: ['wolfsmutter'], bibliothekar: ['bibliothekar'] });

const SIDE_PLAN_1 = [
  { typ: 'kampf', pool: ['tinte', 'rost'] },
  { zufall: { kampf: 2, raetsel: 1, haendler: 1 }, pool: ['tinte', 'rost', 'teufel'] },
  { zufall: { kampf: 2, elite: 1, rast: 1 }, pool: ['teufel', 'biene_tinte'] },
  { zufall: { haendler: 1, raetsel: 1, rast: 1 } },
  { zufall: { kampf: 2, elite: 1 }, pool: ['biene_tinte', 'rost_biene'] },
  { typ: 'rast' },
];
const SIDE_PLAN_2 = [
  { typ: 'kampf', pool: ['echo', 'dieb'] },
  { zufall: { kampf: 2, raetsel: 1, haendler: 1 }, pool: ['echo', 'dieb', 'wurm'] },
  { zufall: { kampf: 2, elite: 1, rast: 1 }, pool: ['wurm', 'echo_dieb'], elite: 'hydra' },
  { zufall: { haendler: 1, raetsel: 1, rast: 1 } },
  { zufall: { kampf: 2, elite: 1 }, pool: ['echo_dieb', 'wurm_echo'], elite: 'hydra' },
  { typ: 'rast' },
];

export const WORLDS = {
  kasino: { name: 'Das Würfelkasino', icon: '🎲', nach: 1, level: 1, set: 'zufall', plan: SIDE_PLAN_1, boss: 'croupier',
    text: 'Glück und Wahrscheinlichkeit. Zufallskarten tauchen hier besonders oft auf. Der Croupier würfelt selbst.' },
  arena: { name: 'Die Blutarena', icon: '⚖', nach: 1, level: 1, set: 'waage', plan: SIDE_PLAN_1, boss: 'gladiator',
    text: 'Wer viel einsteckt, teilt viel aus. Waage-Karten tauchen hier besonders oft auf.' },
  rudel: { name: 'Der Rudelwald', icon: '🐺', nach: 2, level: 2, set: 'beschwoerer', plan: SIDE_PLAN_2, boss: 'wolfsmutter',
    text: 'Begleiter und Listen. Beschwörer-Karten tauchen hier besonders oft auf.' },
  bibliothek: { name: 'Die Bibliothek', icon: '📚', nach: 2, level: 2, set: 'archivar', plan: SIDE_PLAN_2, boss: 'bibliothekar',
    text: 'Ablage, Ziehstapel und count(). Archivar-Karten tauchen hier besonders oft auf.' },
};

// =====================================================================
// AKT 2 ERGÄNZT: Sortieren selbst bauen und Komplexität (Rechenzeit)
// Ab Akt 2 hat jeder Zug ein Budget an Rechenschritten (Variable zeit). Jede Karte zeigt ⏱, wie viele Schritte sie braucht.
// =====================================================================
export const ZEIT_PRO_ZUG = 30;

Object.assign(CARDS, {
  paarblitz: { act: 2, name: 'Paarblitz', cost: 1, concept: 'for', type: 'angriff', target: true,
    code: 'for a in gegner_leben:\n    for b in gegner_leben:\n        ziel_leben -= 2', text: 'Für jedes Paar von Gegnern 2 Schaden. Zwei Schleifen ineinander: Die Schritte wachsen quadratisch!',
    up: { code: 'for a in gegner_leben:\n    for b in gegner_leben:\n        ziel_leben -= 3', text: 'Für jedes Paar 3 Schaden (quadratisch viele Schritte).' } },
  rechenkunst: { act: 2, name: 'Rechenkunst', cost: 1, concept: 'basis', type: 'angriff', target: true,
    code: 'n = len(gegner_leben)\nziel_leben -= 2 * n * n', text: 'Gleicher Schaden wie Paarblitz, aber ausgerechnet statt gezählt: nur 2 Schritte.',
    up: { code: 'n = len(gegner_leben)\nziel_leben -= 3 * n * n', text: '3 · n · n Schaden in 2 Schritten.' } },
  halbierer: { act: 2, name: 'Halbierer', cost: 1, concept: 'while', type: 'angriff', target: true,
    code: 'wert = ziel_leben\nschritte = 0\nwhile wert > 1:\n    wert //= 2\n    schritte += 1\nziel_leben -= 3 * schritte', text: 'Halbiert das Leben des Ziels in Gedanken, bis 1 übrig ist, und zählt mit. Wenige Schritte, auch bei viel Leben.',
    up: { code: 'wert = ziel_leben\nschritte = 0\nwhile wert > 1:\n    wert //= 2\n    schritte += 1\nziel_leben -= 4 * schritte', text: '4 Schaden pro Halbierung.' } },
  blasensortierer: { act: 2, name: 'Blasensortierer', cost: 0, concept: 'for', type: 'skill',
    code: 'for i in range(len(kristalle)):\n    for j in range(len(kristalle) - 1):\n        if kristalle[j] > kristalle[j + 1]:\n            kristalle[j], kristalle[j + 1] = kristalle[j + 1], kristalle[j]',
    text: 'Sortiert die Kristalle selbst (Bubble Sort). Kostet keine Energie, aber viele Rechenschritte. Vergleiche mit Ordnen (sort).',
    up: { code: 'for i in range(len(kristalle)):\n    for j in range(len(kristalle) - 1 - i):\n        if kristalle[j] > kristalle[j + 1]:\n            kristalle[j], kristalle[j + 1] = kristalle[j + 1], kristalle[j]', text: 'Schlauerer Bubble Sort: Der hintere, schon sortierte Teil wird übersprungen.' } },
});

Object.assign(RELICS, {
  taktgeber: { name: 'Taktgeber', icon: '⏲', hook: 'zug_start', code: 'zeit += 10', act: 2 },
});

Object.assign(FORGES, {
  tauschzauber: {
    titel: 'Tauschzauber', stufe: 'leicht', modus: 'parsons', konzepte: ['if', 'liste'],
    auftrag: 'Steht der erste Kristall (Index 0) weiter vorn, obwohl er größer ist als der zweite (Index 1), tausche die beiden. Sonst bleibt alles, wie es ist.',
    zeilen: ['if kristalle[0] > kristalle[1]:', '    kristalle[0], kristalle[1] = kristalle[1], kristalle[0]'],
    falsch: ['    kristalle[0] = kristalle[1]'],
    pruefe: ['kristalle'],
    tests: [{ kristalle: [7, 3] }, { kristalle: [2, 9] }, { kristalle: [5, 5, 1] }],
    hinweise: ['Erst prüfen, dann tauschen. Getauscht wird nur, wenn die Reihenfolge falsch ist.', 'kristalle[0] = kristalle[1] überschreibt den ersten Wert, er geht verloren! Python kann zwei Werte gleichzeitig tauschen.', 'a, b = b, a tauscht zwei Werte in einer Zeile.'],
    karte: { name: 'Tauschzauber', cost: 0, type: 'skill', text: 'Deine geschmiedete Karte: bringt die ersten beiden Kristalle in die richtige Reihenfolge.' },
  },
  blasenschmiede: {
    titel: 'Bubble Sort', stufe: 'schwer', modus: 'frei', konzepte: ['for', 'if', 'liste'], maxZeilen: 4, versiegelt: ['sort', 'sorted'],
    auftrag: 'Sortiere die Liste kristalle aufsteigend, ohne sort() oder sorted(): Gehe immer wieder durch die Liste und tausche zwei Nachbarn, wenn der linke größer ist als der rechte.',
    vorlage: '# Variable: kristalle (Liste)\n',
    loesung: 'for i in range(len(kristalle)):\n    for j in range(len(kristalle) - 1):\n        if kristalle[j] > kristalle[j + 1]:\n            kristalle[j], kristalle[j + 1] = kristalle[j + 1], kristalle[j]',
    zeilen: ['for i in range(len(kristalle)):', '    for j in range(len(kristalle) - 1):', '        if kristalle[j] > kristalle[j + 1]:', '            kristalle[j], kristalle[j + 1] = kristalle[j + 1], kristalle[j]'],
    falsch: ['    for j in range(len(kristalle)):'],
    pruefe: ['kristalle'],
    tests: [{ kristalle: [5, 2, 8, 1] }, { kristalle: [3, 3, 1] }, { kristalle: [] }, { kristalle: [9, 7, 5, 3, 1] }],
    hinweise: ['Ein Durchgang vergleicht jedes Nachbarpaar: kristalle[j] und kristalle[j + 1]. Danach steht der größte Wert hinten.', 'Ein Durchgang reicht nicht. Wiederhole ihn so oft, wie die Liste lang ist (äußere Schleife).', 'Achtung: j darf nur bis len(kristalle) - 2 laufen, sonst gibt es kristalle[j + 1] nicht. Darum range(len(kristalle) - 1).'],
    karte: { name: 'Eigener Sortierer', cost: 0, type: 'skill', text: 'Deine geschmiedete Karte: dein eigener Bubble Sort für die Kristalle.' },
  },
});
FORGE_LEVEL.tauschzauber = 'leicht';
FORGE_LEVEL.blasenschmiede = 'schwer';

Object.assign(RIDDLES, {
  doppelschleife: { concept: 'for', var: 'z', code: 'z = 0\nfor i in range(3):\n    for j in range(4):\n        z += 1',
    erklaerung: 'Die innere Schleife läuft 4-mal, und das 3-mal: 3 · 4 = 12. Zwei Schleifen ineinander multiplizieren die Schritte.' },
  dreieck: { concept: 'for', var: 'z', code: 'z = 0\nfor i in range(4):\n    for j in range(i):\n        z += 1',
    erklaerung: 'Für i = 0, 1, 2, 3 läuft die innere Schleife 0, 1, 2 und 3-mal. Zusammen 0 + 1 + 2 + 3 = 6.' },
});

// Schmieden in Akt 2: Sortieren selbst bauen
MAP_PLAN_2[2].forges = ['stapler', 'tauschzauber', 'sortierschuss'];
MAP_PLAN_2[7].forges = ['blasenschmiede', 'durchzaehlen', 'zwillinge'];
ACTS[2].intro = 'In den Listengruben sammelst du Kristalle in einer Liste (append, pop, sort). Neu: Jeder Zug hat nur begrenzte Rechenzeit. Jede Karte zeigt ⏱, wie viele Schritte sie braucht. Zwei Schleifen ineinander werden schnell zu teuer!';

// =====================================================================
// AKT 3: Der Spiegelturm (Funktionen, return, Rekursion)
// Besonderheit: Spiegelschleime teilen sich, wenn sie fallen (teilt: true), bis sie zu klein sind.
// =====================================================================
Object.assign(ENEMIES, {
  spiegelschleim: { name: 'Spiegelschleim', hp: 24, teilt: true,
    code: 'def echo(n):\n    if n == 0:\n        return 0\n    return 2 + echo(n - 1)\nleben -= echo(mein_leben // 8 + 1)' },
  turmwaechter: { name: 'Turmwächter', hp: 40, mem: { runde: 0 },
    code: 'def schlag(stufe):\n    return stufe * 2 + 3\nrunde += 1\nleben -= schlag(runde)' },
  rekursionsrabe: { name: 'Rekursionsrabe', hp: 36, mem: { runde: 0 },
    code: 'def flug(n):\n    if n <= 1:\n        return 1\n    return flug(n - 1) + flug(n - 2)\nrunde += 1\nleben -= flug(runde + 2)' },
  spiegelritter: { name: 'Der Spiegelritter', hp: 100, elite: true,
    code: 'def spiegel(x):\n    if x < 5:\n        return x\n    return spiegel(x // 2) + 2\nleben -= spiegel(block) + 8' },
  spiegelkoenigin: { name: 'Die Spiegelkönigin', hp: 180, boss: true, mem: { runde: 0 },
    code: 'def welle(n):\n    if n == 0:\n        return 0\n    return 4 + welle(n - 1)\nrunde += 1\nif runde % 3 == 0:\n    mein_leben += welle(runde // 3 + 1)\nelse:\n    leben -= welle(runde % 3 + 2)' },
});
Object.assign(ENCOUNTERS, {
  schleim: ['spiegelschleim'],
  turm: ['turmwaechter'],
  rabe: ['rekursionsrabe'],
  schleim_rabe: ['spiegelschleim', 'rekursionsrabe'],
  turm_schleim: ['turmwaechter', 'spiegelschleim'],
  ritter: ['spiegelritter'],
  boss3: ['spiegelkoenigin'],
});

Object.assign(CARDS, {
  formel: { act: 3, name: 'Zauberformel', cost: 1, concept: 'rekursion', type: 'angriff', target: true,
    code: 'def stark(x):\n    return x * 2 + staerke\nziel_leben -= stark(4)', text: 'Eine Funktion mit Parameter x gibt x · 2 + Stärke zurück. stark(4) trifft.',
    up: { code: 'def stark(x):\n    return x * 2 + staerke\nziel_leben -= stark(6)', text: 'stark(6) trifft.' } },
  turmbau: { act: 3, name: 'Turmbau', cost: 1, concept: 'rekursion', type: 'skill',
    code: 'def turm(h):\n    if h == 0:\n        return 0\n    return h + turm(h - 1)\nblock += turm(4)', text: 'turm(4) = 4 + 3 + 2 + 1 = 10 Block, rekursiv gestapelt.',
    up: { code: 'def turm(h):\n    if h == 0:\n        return 0\n    return h + turm(h - 1)\nblock += turm(5)', text: 'turm(5) = 15 Block.' } },
  fakultaet: { act: 3, name: 'Fakultät', cost: 2, concept: 'rekursion', type: 'angriff', target: true,
    code: 'def fak(n):\n    if n <= 1:\n        return 1\n    return n * fak(n - 1)\nziel_leben -= fak(4)', text: 'fak(4) = 4 · 3 · 2 · 1 = 24 Schaden.',
    up: { code: 'def fak(n):\n    if n <= 1:\n        return 1\n    return n * fak(n - 1)\nziel_leben -= fak(4) + 6', text: 'fak(4) + 6 = 30 Schaden.' } },
  teilen: { act: 3, name: 'Teile und herrsche', cost: 2, concept: 'rekursion', type: 'angriff',
    code: 'def halb(n):\n    if n < 3:\n        return n\n    return halb(n // 2) + halb(n - n // 2)\nfor i in range(len(gegner_leben)):\n    gegner_leben[i] -= halb(7)', text: 'halb teilt die 7 immer weiter auf und zählt die Teile wieder zusammen: Jeder Gegner bekommt 7. Viele Aufrufe, viele Schritte!',
    up: { code: 'def halb(n):\n    if n < 3:\n        return n\n    return halb(n // 2) + halb(n - n // 2)\nfor i in range(len(gegner_leben)):\n    gegner_leben[i] -= halb(10)', text: 'Jeder Gegner bekommt halb(10) = 10.' } },
  rueckweg: { act: 3, name: 'Rückweg', cost: 1, concept: 'rekursion', type: 'skill', target: true,
    code: 'def stufe(n):\n    if n == 0:\n        return 1\n    return 2 * stufe(n - 1)\nziel_schwach += 1\nblock += stufe(3)', text: 'stufe(3) verdoppelt dreimal: 8 Block. Das Ziel wird schwach.',
    up: { code: 'def stufe(n):\n    if n == 0:\n        return 1\n    return 2 * stufe(n - 1)\nziel_schwach += 2\nblock += stufe(3) + 2', text: '10 Block, das Ziel 2 Züge schwach.' } },
});

Object.assign(BUGS, {
  ohne_abbruch: { name: 'Ohne Abbruch', cost: 1, concept: 'rekursion', type: 'angriff', bug: true,
    code: 'def welle(n):\n    return n + welle(n - 1)\nziel_leben -= welle(3)',
    text: 'Bug: Die Funktion ruft sich endlos selbst auf. Der Zauber verheddert sich.',
    ziel: 'welle(n) soll n + (n - 1) + … + 1 berechnen und bei n == 0 mit 0 aufhören. Die Karte zieht welle(3) = 6 von ziel_leben ab.',
    loesung: 'def welle(n):\n    if n == 0:\n        return 0\n    return n + welle(n - 1)\nziel_leben -= welle(3)',
    pruefe: ['ziel_leben'],
    tests: [{ ziel_leben: 20 }, { ziel_leben: 50 }],
    hinweise: ['Jede Rekursion braucht einen Abbruch: einen Fall, in dem die Funktion sich NICHT selbst aufruft.', 'Bei n == 0 soll welle einfach 0 zurückgeben.', 'Füge vor der return-Zeile ein: if n == 0: und eingerückt return 0.'],
    repariert: { name: 'Gezähmte Welle', cost: 1, text: 'Repariert: welle(3) = 6 Schaden, und die Rekursion hört sauber auf.' } },
});
BUG_BY_NAME['Ohne Abbruch'] = 'ohne_abbruch';

Object.assign(FORGES, {
  erste_funktion: {
    titel: 'Erste Funktion', stufe: 'leicht', modus: 'parsons', konzepte: ['rekursion'],
    auftrag: 'Lege eine Funktion verdopple(x) an, die x * 2 zurückgibt. Rufe sie danach mit 5 auf und ziehe das Ergebnis von ziel_leben ab.',
    zeilen: ['def verdopple(x):', '    return x * 2', 'ziel_leben -= verdopple(5)'],
    falsch: ['    print(x * 2)'],
    pruefe: ['ziel_leben'],
    tests: [{ ziel_leben: 30 }, { ziel_leben: 10 }],
    hinweise: ['Erst wird die Funktion angelegt (def), erst danach aufgerufen.', 'print zeigt nur etwas an. Damit der Aufrufer weiterrechnen kann, braucht es return.', 'def verdopple(x):, eingerückt return x * 2, dann ziel_leben -= verdopple(5).'],
    karte: { name: 'Doppelfunktion', cost: 1, type: 'angriff', target: true, text: 'Deine geschmiedete Karte: deine erste eigene Funktion.' },
  },
  countdown: {
    titel: 'Countdown', stufe: 'leicht', modus: 'parsons', konzepte: ['rekursion'],
    auftrag: 'Die Funktion zaehle(n) soll für jeden Schritt von n bis 1 zwei Punkte zählen und bei n == 0 mit 0 aufhören. Ziehe zaehle(5) von ziel_leben ab.',
    zeilen: ['def zaehle(n):', '    if n == 0:', '        return 0', '    return 2 + zaehle(n - 1)', 'ziel_leben -= zaehle(5)'],
    falsch: ['    return 2 + zaehle(n)'],
    pruefe: ['ziel_leben'],
    tests: [{ ziel_leben: 30 }, { ziel_leben: 12 }],
    hinweise: ['Erst der Abbruch (n == 0), dann der Selbstaufruf.', 'zaehle(n) ruft sich mit demselben n auf und hört nie auf. Es muss n - 1 sein.', 'def zaehle(n): / if n == 0: return 0 / return 2 + zaehle(n - 1).'],
    karte: { name: 'Countdown', cost: 1, type: 'angriff', target: true, text: 'Deine geschmiedete Karte: zaehle(5) = 10 Schaden, rekursiv.' },
  },
  summenturm: {
    titel: 'Summenturm', stufe: 'schwer', modus: 'frei', konzepte: ['rekursion'], maxZeilen: 5, versiegelt: ['sum', 'range'],
    auftrag: 'Schreibe eine rekursive Funktion summe(n), die 1 + 2 + … + n berechnet (summe(0) ist 0). Ohne Schleife, ohne sum und range! Erhöhe block um summe(4).',
    vorlage: '# Variable: block\n',
    loesung: 'def summe(n):\n    if n == 0:\n        return 0\n    return n + summe(n - 1)\nblock += summe(4)',
    zeilen: ['def summe(n):', '    if n == 0:', '        return 0', '    return n + summe(n - 1)', 'block += summe(4)'],
    falsch: ['    return summe(n - 1)'],
    pruefe: ['block'],
    tests: [{ block: 0 }, { block: 7 }],
    hinweise: ['Überlege: summe(4) = 4 + summe(3). Und summe(0) = 0.', 'Der Abbruch ist n == 0. Sonst gib n + summe(n - 1) zurück.', 'def summe(n):\n    if n == 0:\n        return 0\n    return …'],
    karte: { name: 'Summenturm', cost: 1, type: 'skill', text: 'Deine geschmiedete Karte: summe(4) = 10 Block, rekursiv.' },
  },
  groesste: {
    titel: 'Der Größte', stufe: 'schwer', modus: 'frei', konzepte: ['rekursion', 'if'], maxZeilen: 7, versiegelt: ['max'],
    auftrag: 'Schreibe eine rekursive Funktion groesste(liste), die den größten Wert einer Liste zurückgibt (ohne max). Hat die Liste nur einen Wert, ist es dieser. Ziehe groesste(gegner_leben) von ziel_leben ab.',
    vorlage: '# Variablen: gegner_leben (Liste), ziel_leben\n',
    loesung: 'def groesste(liste):\n    if len(liste) == 1:\n        return liste[0]\n    rest = groesste(liste[1:])\n    if liste[0] > rest:\n        return liste[0]\n    return rest\nziel_leben -= groesste(gegner_leben)',
    zeilen: ['def groesste(liste):', '    if len(liste) == 1:', '        return liste[0]', '    rest = groesste(liste[1:])', '    if liste[0] > rest:', '        return liste[0]', '    return rest', 'ziel_leben -= groesste(gegner_leben)'],
    falsch: ['    rest = groesste(liste)'],
    pruefe: ['ziel_leben'],
    tests: [{ gegner_leben: [12, 30, 7], ziel_leben: 50 }, { gegner_leben: [9], ziel_leben: 20 }, { gegner_leben: [4, 4, 11, 2], ziel_leben: 15 }],
    hinweise: ['Abbruch: Bei nur einem Element ist es das Größte.', 'Frag die Funktion nach dem Größten im Rest der Liste: groesste(liste[1:]). Vergleiche das mit liste[0].', 'rest = groesste(liste[1:]), dann: if liste[0] > rest: return liste[0], sonst return rest.'],
    karte: { name: 'Der Größte', cost: 1, type: 'angriff', target: true, text: 'Deine geschmiedete Karte: Schaden in Höhe des stärksten Gegners.' },
  },
});
Object.assign(FORGE_LEVEL, { erste_funktion: 'leicht', countdown: 'leicht', summenturm: 'schwer', groesste: 'schwer' });

Object.assign(RIDDLES, {
  fak3: { concept: 'rekursion', var: 'x', code: 'def fak(n):\n    if n <= 1:\n        return 1\n    return n * fak(n - 1)\nx = fak(3)',
    erklaerung: 'fak(3) = 3 · fak(2) = 3 · 2 · fak(1) = 3 · 2 · 1 = 6.' },
  fib5: { concept: 'rekursion', var: 'x', code: 'def f(n):\n    if n < 2:\n        return n\n    return f(n - 1) + f(n - 2)\nx = f(5)',
    erklaerung: 'f(0)=0, f(1)=1, f(2)=1, f(3)=2, f(4)=3, f(5)=5. Jede Zahl ist die Summe der beiden davor (Fibonacci).' },
  frueh: { concept: 'rekursion', var: 'x', code: 'def g(z):\n    if z > 3:\n        return 1\n    return 2\nx = g(5) + g(1)',
    erklaerung: 'g(5): 5 > 3, also return 1, die Funktion endet sofort. g(1): Bedingung falsch, also 2. Zusammen 3.' },
  halbieren2: { concept: 'rekursion', var: 'x', code: 'def h(n):\n    if n <= 1:\n        return 0\n    return 1 + h(n // 2)\nx = h(16)',
    erklaerung: '16 → 8 → 4 → 2 → 1: viermal halbiert, also 4. So schnell schrumpft eine Rekursion, die halbiert.' },
});

export const MAP_PLAN_3 = [
  { typ: 'kampf', pool: ['schleim', 'turm'] },
  { zufall: { kampf: 3, raetsel: 2, haendler: 1 }, pool: ['schleim', 'turm', 'rabe'] },
  { zufall: { schmiede: 2, kampf: 2 }, pool: ['schleim', 'rabe'], forges: ['erste_funktion', 'countdown'] },
  { zufall: { kampf: 3, elite: 2, rast: 1 }, pool: ['rabe', 'turm', 'schleim'], elite: 'ritter' },
  { zufall: { haendler: 1, rast: 1, raetsel: 1 } },
  { zufall: { debug: 1, kampf: 1, rast: 1 }, pool: ['schleim_rabe', 'turm_schleim'] },
  { zufall: { kampf: 3, elite: 1, raetsel: 1 }, pool: ['schleim_rabe', 'turm_schleim'], elite: 'ritter' },
  { zufall: { schmiede: 2, kampf: 2 }, pool: ['schleim_rabe', 'turm_schleim'], forges: ['summenturm', 'groesste'] },
  { zufall: { kampf: 2, haendler: 1, raetsel: 1 }, pool: ['turm_schleim', 'schleim_rabe'] },
  { typ: 'rast' },
];
Object.assign(ACTS[3], {
  bald: false, plan: MAP_PLAN_3, boss: 'boss3',
  intro: 'Im Spiegelturm rechnen alle mit Funktionen: def legt sie an, return gibt ein Ergebnis zurück. Und manche rufen sich selbst auf (Rekursion). Spiegelschleime teilen sich, wenn sie fallen, in zwei halb so große, bis sie zu klein sind. Wie eine Rekursion mit Abbruch!',
  geschenk: ['formel', 'turmbau'], konzept: 'rekursion',
});

// =====================================================================
// AKT 4: Die Klassenfestung (Klassen, Objekte, Methoden, Vererbung)
// Besonderheit: Gegner können mit einer Methode neue Gegner bauen (Variable beschwoere = Name des Gegners).
// =====================================================================
CONCEPTS.oop = { name: 'Klassen und Objekte', act: 4, price: 0,
  quiz: { code: 'class Trank:\n    def __init__(self, kraft):\n        self.kraft = kraft\nt = Trank(3)\nx = t.kraft * 2', frage: 'Welchen Wert hat x am Ende?', antwort: 6,
    erklaerung: 'Trank(3) erzeugt ein Objekt. __init__ speichert 3 in self.kraft. t.kraft ist also 3, mal 2 gibt 6.' } };

Object.assign(ENEMIES, {
  ruestungsgolem: { name: 'Rüstungsgolem', hp: 58,
    code: 'class Golem:\n    def __init__(self, kraft):\n        self.kraft = kraft\n    def schlag(self):\n        return self.kraft * 2\ng = Golem(5)\nleben -= g.schlag()' },
  minigolem: { name: 'Minigolem', hp: 16,
    code: 'class Golem:\n    def __init__(self, kraft):\n        self.kraft = kraft\nleben -= Golem(4).kraft' },
  schildknappe: { name: 'Schildknappe', hp: 48,
    code: 'class Knappe:\n    def __init__(self):\n        self.wut = 4\n    def angriff(self, block):\n        if block > 0:\n            return self.wut\n        return self.wut * 3\nleben -= Knappe().angriff(block)' },
  bogenschuetze: { name: 'Bogenschütze', hp: 42,
    code: 'class Krieger:\n    def angriff(self):\n        return 7\nclass Schuetze(Krieger):\n    def angriff(self):\n        return super().angriff() + 5\nleben -= Schuetze().angriff()' },
  golemfabrik: { name: 'Golem-Fabrik', hp: 110, elite: true, mem: { runde: 0, beschwoere: '' },
    code: 'class Fabrik:\n    def baue(self, runde):\n        if runde % 2 == 1:\n            return "minigolem"\n        return ""\nrunde += 1\nbeschwoere = Fabrik().baue(runde)\nleben -= 7' },
  urklasse: { name: 'Die Urklasse', hp: 190, boss: true, mem: { runde: 0, beschwoere: '' },
    code: 'class Zauber:\n    def wirke(self):\n        return 8\nclass Feuer(Zauber):\n    def wirke(self):\n        return super().wirke() + 6\nrunde += 1\nif runde % 3 == 0:\n    beschwoere = "minigolem"\nelif runde % 3 == 1:\n    leben -= Feuer().wirke()\nelse:\n    leben -= Zauber().wirke()\n    block = 0' },
});
Object.assign(ENCOUNTERS, {
  golem: ['ruestungsgolem'],
  knappe: ['schildknappe'],
  schuetze: ['bogenschuetze'],
  knappe_schuetze: ['schildknappe', 'bogenschuetze'],
  golem_schuetze: ['ruestungsgolem', 'bogenschuetze'],
  fabrik: ['golemfabrik'],
  boss4: ['urklasse'],
});

Object.assign(CARDS, {
  schildobjekt: { act: 4, name: 'Schild-Objekt', cost: 1, concept: 'oop', type: 'skill',
    code: 'class Schild:\n    def __init__(self, dicke):\n        self.dicke = dicke\n    def halten(self):\n        return self.dicke * 2\nblock += Schild(4).halten()', text: 'Erzeugt ein Schild-Objekt mit dicke 4. Seine Methode halten() gibt 8 Block.',
    up: { code: 'class Schild:\n    def __init__(self, dicke):\n        self.dicke = dicke\n    def halten(self):\n        return self.dicke * 2\nblock += Schild(6).halten()', text: 'Schild(6).halten() = 12 Block.' } },
  methodenstoss: { act: 4, name: 'Lanzenstoß', cost: 1, concept: 'oop', type: 'angriff', target: true,
    code: 'class Lanze:\n    def __init__(self):\n        self.spitze = 7\n    def stoss(self, extra):\n        return self.spitze + extra\nziel_leben -= Lanze().stoss(staerke)', text: 'Die Methode stoss bekommt deine Stärke als Parameter: 7 plus Stärke.',
    up: { code: 'class Lanze:\n    def __init__(self):\n        self.spitze = 10\n    def stoss(self, extra):\n        return self.spitze + extra\nziel_leben -= Lanze().stoss(staerke)', text: '10 plus Stärke.' } },
  flammenschwert: { act: 4, name: 'Flammenschwert', cost: 1, concept: 'oop', type: 'angriff', target: true,
    code: 'class Waffe:\n    def schaden(self):\n        return 5\nclass Flammenschwert(Waffe):\n    def schaden(self):\n        return super().schaden() * 2\nziel_leben -= Flammenschwert().schaden()', text: 'Flammenschwert erbt von Waffe und verdoppelt deren Schaden: 10.',
    up: { code: 'class Waffe:\n    def schaden(self):\n        return 6\nclass Flammenschwert(Waffe):\n    def schaden(self):\n        return super().schaden() * 2\nziel_leben -= Flammenschwert().schaden()', text: 'Waffe macht 6, das Flammenschwert das Doppelte: 12.' } },
  golembau: { act: 4, name: 'Golembau', cost: 1, concept: 'oop', type: 'skill',
    code: 'class Golem:\n    def __init__(self, kraft):\n        self.kraft = kraft\ng = Golem(3 + staerke)\nbegleiter.append(g.kraft)', text: 'Baut einen Golem mit kraft 3 plus Stärke. Er kämpft als Begleiter mit.',
    up: { code: 'class Golem:\n    def __init__(self, kraft):\n        self.kraft = kraft\ng = Golem(5 + staerke)\nbegleiter.append(g.kraft)', text: 'Golem mit kraft 5 plus Stärke als Begleiter.' } },
  truppe: { act: 4, name: 'Truppe', cost: 2, concept: 'oop', type: 'angriff', target: true,
    code: 'class Soldat:\n    def __init__(self, kraft):\n        self.kraft = kraft\ntruppe = [Soldat(3), Soldat(4), Soldat(5)]\nfor s in truppe:\n    ziel_leben -= s.kraft', text: 'Eine Liste aus drei Soldaten-Objekten. Jeder trifft mit seiner kraft: 12 Schaden.',
    up: { code: 'class Soldat:\n    def __init__(self, kraft):\n        self.kraft = kraft\ntruppe = [Soldat(4), Soldat(5), Soldat(6), Soldat(3)]\nfor s in truppe:\n    ziel_leben -= s.kraft', text: 'Vier Soldaten: 18 Schaden.' } },
});

Object.assign(BUGS, {
  vergessenes_self: { name: 'Vergessenes self', cost: 1, concept: 'oop', type: 'skill', bug: true,
    code: 'class Schild:\n    def __init__(self, dicke):\n        dicke = dicke\n    def halten(self):\n        return self.dicke * 2\nblock += Schild(5).halten()',
    text: 'Bug: Das Schild vergisst seine Dicke. Die Karte bricht mit einem Fehler ab.',
    ziel: 'Schild(5) soll sich seine dicke merken. halten() gibt das Doppelte zurück: 10 Block.',
    loesung: 'class Schild:\n    def __init__(self, dicke):\n        self.dicke = dicke\n    def halten(self):\n        return self.dicke * 2\nblock += Schild(5).halten()',
    pruefe: ['block'],
    tests: [{ block: 0 }, { block: 4 }],
    hinweise: ['Lies die Fehlermeldung: Das Objekt hat kein dicke. Wo sollte es gespeichert werden?', 'dicke = dicke ändert nur eine lokale Variable. Das Objekt merkt sich nur, was in self.… steht.', 'Schreibe in __init__: self.dicke = dicke'],
    repariert: { name: 'Festes Schild', cost: 1, text: 'Repariert: Schild(5).halten() = 10 Block.' } },
});

Object.assign(FORGES, {
  erste_klasse: {
    titel: 'Erste Klasse', stufe: 'leicht', modus: 'parsons', konzepte: ['oop'],
    auftrag: 'Lege eine Klasse Trank an. Ihr __init__ bekommt staerke und merkt sie sich in self.staerke. Erzeuge dann einen Trank mit 6 und erhöhe leben um seine staerke.',
    zeilen: ['class Trank:', '    def __init__(self, staerke):', '        self.staerke = staerke', 't = Trank(6)', 'leben += t.staerke'],
    falsch: ['        staerke = staerke'],
    pruefe: ['leben'],
    tests: [{ leben: 20 }, { leben: 1 }],
    hinweise: ['Erst die Klasse mit __init__, dann ein Objekt erzeugen, dann sein Attribut benutzen.', 'staerke = staerke speichert nichts im Objekt. Es muss self.staerke heißen.', 'class Trank: / def __init__(self, staerke): / self.staerke = staerke / t = Trank(6) / leben += t.staerke'],
    karte: { name: 'Heiltrank', cost: 1, type: 'skill', text: 'Deine geschmiedete Karte: ein Trank-Objekt heilt 6.' },
  },
  methode: {
    titel: 'Methode', stufe: 'leicht', modus: 'parsons', konzepte: ['oop'],
    auftrag: 'Die Klasse Bogen hat 3 pfeile (in __init__). Ihre Methode schiessen gibt pfeile * 4 zurück. Ziehe das Ergebnis von ziel_leben ab.',
    zeilen: ['class Bogen:', '    def __init__(self):', '        self.pfeile = 3', '    def schiessen(self):', '        return self.pfeile * 4', 'ziel_leben -= Bogen().schiessen()'],
    falsch: ['    def schiessen():'],
    pruefe: ['ziel_leben'],
    tests: [{ ziel_leben: 30 }, { ziel_leben: 12 }],
    hinweise: ['Jede Methode bekommt als ersten Parameter self, damit sie an die Attribute kommt.', 'def schiessen(): ohne self funktioniert nicht, Python übergibt das Objekt immer mit.', 'Die Methode steht eingerückt in der Klasse, auf derselben Höhe wie __init__.'],
    karte: { name: 'Bogen', cost: 1, type: 'angriff', target: true, text: 'Deine geschmiedete Karte: Bogen().schiessen() = 12 Schaden.' },
  },
  erbschaft: {
    titel: 'Vererbung', stufe: 'schwer', modus: 'frei', konzepte: ['oop'], maxZeilen: 8,
    auftrag: 'Die Klasse Zauber ist schon da (kraft() gibt 4). Schreibe darunter eine Klasse Feuerball, die von Zauber erbt. Ihre Methode kraft() soll mit super() doppelt so viel liefern. Ziehe Feuerball().kraft() von ziel_leben ab.',
    vorlage: 'class Zauber:\n    def kraft(self):\n        return 4\n\n',
    loesung: 'class Zauber:\n    def kraft(self):\n        return 4\nclass Feuerball(Zauber):\n    def kraft(self):\n        return super().kraft() * 2\nziel_leben -= Feuerball().kraft()',
    zeilen: ['class Zauber:', '    def kraft(self):', '        return 4', 'class Feuerball(Zauber):', '    def kraft(self):', '        return super().kraft() * 2', 'ziel_leben -= Feuerball().kraft()'],
    falsch: ['class Feuerball:'],
    pruefe: ['ziel_leben'],
    tests: [{ ziel_leben: 30 }, { ziel_leben: 8 }],
    hinweise: ['Vererbung: class Feuerball(Zauber): Die Elternklasse steht in Klammern.', 'In der neuen kraft() holst du mit super().kraft() den Wert der Elternklasse.', 'class Feuerball(Zauber):\n    def kraft(self):\n        return super().kraft() * 2'],
    karte: { name: 'Feuerball', cost: 1, type: 'angriff', target: true, text: 'Deine geschmiedete Karte: geerbte Kraft, verdoppelt.' },
  },
  objektliste: {
    titel: 'Kristallarmee', stufe: 'schwer', modus: 'frei', konzepte: ['oop', 'for'], maxZeilen: 8,
    auftrag: 'Die Klasse Kristall ist schon da (sie merkt sich wert). Lege eine Liste mit drei Kristall-Objekten an: Werte 2, 5 und 8. Ziehe dann mit einer Schleife jeden wert von ziel_leben ab.',
    vorlage: 'class Kristall:\n    def __init__(self, wert):\n        self.wert = wert\n\n',
    loesung: 'class Kristall:\n    def __init__(self, wert):\n        self.wert = wert\nliste = [Kristall(2), Kristall(5), Kristall(8)]\nfor k in liste:\n    ziel_leben -= k.wert',
    zeilen: ['class Kristall:', '    def __init__(self, wert):', '        self.wert = wert', 'liste = [Kristall(2), Kristall(5), Kristall(8)]', 'for k in liste:', '    ziel_leben -= k.wert'],
    falsch: ['    ziel_leben -= k'],
    pruefe: ['ziel_leben'],
    tests: [{ ziel_leben: 40 }, { ziel_leben: 15 }],
    hinweise: ['Ein Objekt erzeugst du mit Kristall(2). Mehrere passen in eine Liste: [Kristall(2), …].', 'k ist in der Schleife ein ganzes Objekt. Seinen Wert bekommst du mit k.wert.', 'liste = [Kristall(2), Kristall(5), Kristall(8)], dann for k in liste: ziel_leben -= k.wert'],
    karte: { name: 'Kristallarmee', cost: 2, type: 'angriff', target: true, text: 'Deine geschmiedete Karte: drei Kristall-Objekte treffen, 15 Schaden.' },
  },
});
Object.assign(FORGE_LEVEL, { erste_klasse: 'leicht', methode: 'leicht', erbschaft: 'schwer', objektliste: 'schwer' });

Object.assign(RIDDLES, {
  attribut: { concept: 'oop', var: 'x', code: 'class Kiste:\n    def __init__(self, gold):\n        self.gold = gold\na = Kiste(5)\nb = Kiste(3)\nx = a.gold - b.gold',
    erklaerung: 'Zwei verschiedene Objekte, jedes merkt sich sein eigenes gold: 5 und 3. Die Differenz ist 2.' },
  methode2: { concept: 'oop', var: 'x', code: 'class Zaehler:\n    def __init__(self):\n        self.n = 0\n    def plus(self):\n        self.n += 2\nz = Zaehler()\nz.plus()\nz.plus()\nx = z.n',
    erklaerung: 'Jeder Aufruf von plus() erhöht self.n um 2. Zweimal aufgerufen: 0 → 2 → 4.' },
  erbe: { concept: 'oop', var: 'x', code: 'class Tier:\n    def beine(self):\n        return 4\nclass Vogel(Tier):\n    def beine(self):\n        return 2\nx = Tier().beine() + Vogel().beine()',
    erklaerung: 'Vogel überschreibt beine() und liefert 2, das Tier 4. Zusammen 6.' },
});

export const MAP_PLAN_4 = [
  { typ: 'kampf', pool: ['golem', 'knappe'] },
  { zufall: { kampf: 3, raetsel: 2, haendler: 1 }, pool: ['golem', 'knappe', 'schuetze'] },
  { zufall: { schmiede: 2, kampf: 2 }, pool: ['knappe', 'schuetze'], forges: ['erste_klasse', 'methode'] },
  { zufall: { kampf: 3, elite: 2, rast: 1 }, pool: ['schuetze', 'golem', 'knappe'], elite: 'fabrik' },
  { zufall: { haendler: 1, rast: 1, raetsel: 1 } },
  { zufall: { debug: 1, kampf: 1, rast: 1 }, pool: ['knappe_schuetze', 'golem_schuetze'] },
  { zufall: { kampf: 3, elite: 1, raetsel: 1 }, pool: ['knappe_schuetze', 'golem_schuetze'], elite: 'fabrik' },
  { zufall: { schmiede: 2, kampf: 2 }, pool: ['knappe_schuetze', 'golem_schuetze'], forges: ['erbschaft', 'objektliste'] },
  { zufall: { kampf: 2, haendler: 1, raetsel: 1 }, pool: ['golem_schuetze', 'knappe_schuetze'] },
  { typ: 'rast' },
];
Object.assign(ACTS[4], {
  bald: false, plan: MAP_PLAN_4, boss: 'boss4',
  intro: 'In der Klassenfestung ist alles ein Objekt. Eine Klasse ist ein Bauplan, __init__ legt fest, was sich jedes Objekt merkt (self.…), und Methoden sind seine Fähigkeiten. Manche Gegner bauen mit einer Methode sogar neue Gegner!',
  geschenk: ['schildobjekt', 'methodenstoss'], konzept: 'oop',
});
