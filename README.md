# Pythonia – Die Höhle der Verzweigungen (Prototyp)

Ein Roguelike-Deckbuilder für den Informatikunterricht: Die Karten sind Python-Code. Im Kampf liest man Code, in der Schmiede schreibt man ihn, im Debug-Raum repariert man Bugs. Python läuft im Browser über [Natter](https://github.com/wi-wissen/Natter) (`@natterjs/core` 0.2.0 von jsDelivr).

## Starten

Die Seite braucht einen kleinen Webserver (ES-Module laufen nicht über `file://`):

```powershell
py -m http.server 8765
```

(im Projektordner starten) und dann `http://localhost:8765` öffnen. Beim Start ist eine Internetverbindung nötig, weil Natter von jsDelivr geladen wird. Zum Hosten reicht jeder statische Webspace (z. B. GitHub Pages).

## Weltkarte

„Neuer Run“ öffnet die Weltkarte. Links der **Lernweg** (Hauptpfad), rechts zweigen **freie Welten** ab:

| Lernweg | Thema | Stand | Freie Welten danach |
| --- | --- | --- | --- |
| Akt 1 · Höhle der Verzweigungen | Variablen, if/elif, for, while | fertig | 🎲 Würfelkasino (Zufall), ⚖ Blutarena (Waage) |
| Akt 2 · Listengruben | Listen, Sortieren, Komplexität (Rechenzeit ⏱) | fertig | 🐺 Rudelwald (Beschwörer), 📚 Bibliothek (Archivar) |
| Akt 3 · Spiegelturm | Funktionen, return, Rekursion (Spiegelschleime teilen sich; Fibonacci-Rabe; Schmieden Erste Funktion, Countdown, Summenturm, Der Größte) | fertig | |
| Akt 4 · Klassenfestung | Klassen, `__init__`/`self`, Methoden, Vererbung mit `super()` (Golem-Fabrik baut neue Gegner per Methode; Schmieden Erste Klasse, Methode, Vererbung, Kristallarmee) | fertig | |

Ein geschaffter Akt öffnet den nächsten; man kann jeden offenen Akt direkt starten (mit Ausgleich: Karten, Gold, Leben, Level). Freie Welten sind kürzer (6 Ebenen + Boss), alle Figuren und Karten sind erlaubt, ihr Kartenset wird in den Belohnungen bevorzugt.

**Komplexität (ab Akt 2):** Jeder Zug hat 30 Rechenschritte (`zeit`). Jede Handkarte zeigt ⏱, wie viele Schritte sie gerade bräuchte; reicht die Zeit nicht, bleibt sie auf der Hand. Gegenüberstellungen wie Paarblitz (zwei Schleifen, n²) und Rechenkunst (2 Schritte) oder Blasensortierer (Bubble Sort) und Ordnen (`sort()`) machen den Unterschied spürbar. Schmieden: Tauschzauber (Tausch mit `a, b = b, a`) und Bubble Sort selbst schreiben (`sort` versiegelt).

## Akte

| Akt | Name | Thema | Besonderes |
| --- | --- | --- | --- |
| 1 | Die Höhle der Verzweigungen | Variablen, if/elif, for, while | Boss: Der Verzweiger |
| 2 | Die Listengruben | append, pop, insert, Slicing, sum/max, sort | Kristall-Liste `kristalle` im Kampf; Gegner mit eigenen Listen; Boss: Der Mischer |

Nach dem Boss eines Akts geht es in den nächsten (volle Heilung, Geschenk-Karten). Geplant: Stapel/Warteschlangen/Dictionaries mit Komplexität (Akt 3) und Klassen (Akt 4); Natter kann beides schon. Die Akt-2-Gegner nutzen vorerst umgefärbte Figuren aus Akt 1.

## Figuren und Spielweisen

Jede Figur hat eine **Grundeigenschaft** (ein Relikt, also eine Python-Funktion) und eine Lieblings-Spielweise. Die Karten aller Spielweisen kann jede Figur nutzen; Belohnungen bieten immer eine Karte der eigenen Spielweise an.

| Figur | Grundeigenschaft | Spielweise | frei |
| --- | --- | --- | --- |
| Steinwächter | Dornenschild: `dornen += 2` | 🌵 Dornen und Block | von Anfang an |
| Funkenmagierin | Glutherz: Angriffe geben `ziel_brand += 1` | 🔥 Brand | von Anfang an |
| Orakel | Fluchsicht: Skills geben `ziel_schwach += 1` | 🌀 Flüche (schwach, verwundbar) | von Anfang an |
| Eishexe | Frosthauch: jede Runde +1 Frost auf alle | ❄ Eis (ab 5 Frost setzt ein Gegner aus) | nach Akt 1 |
| Gaukler | Jonglierball: 4. Karte im Zug gibt Energie | 🤹 Kombo (`kombo` zählt die Karten im Zug) | nach Akt 1 |

Dazu kommen **Kartensets für alle Figuren**, freigeschaltet je nach Akt:

| Set | ab Akt | Python | Idee |
| --- | --- | --- | --- |
| ⚖ Waage | 1 | `wunden`, `//`, `if` | Je verletzter, desto stärker |
| 🎲 Zufall | 1 | `import random`, `random.randint` | Würfelglück (keine Eingebung auf Zufallskarten) |
| 🐺 Beschwörer | 2 | Liste `begleiter`, `append`, `pop`, `sum` | Begleiter greifen am Zugende an |
| 📚 Archivar | 2 | Listen `ablage`, `ziehstapel`, `pop`, `count` | Karten aus Ablage/Ziehstapel auf die Hand holen |
| 🔁 Rekursion | 2 | `def`, `return`, Selbstaufruf | Konzept „Funktionen und Rekursion“ beim Händler |

Statuswerte: Brand schadet am Zugende und sinkt um 1; schwach = −25 % Gegnerschaden; verwundbar = +50 % Schaden; Frost ab 5 = Zug aussetzen. Statuswerte, die 0 sind, blendet die Variablentafel aus.

## Inhalt des Prototyps

- Drei Figuren mit eigenem Startdeck und eigenem Start-Relikt (Funkenmagierin, Steinwächter, Orakel)
- Höhlenkarte als Knotengraph wie bei Slay the Spire, bei jedem Run neu erzeugt (10 Ebenen und Boss); Schmiede und Debug-Raum sind Abzweigungen, keine Pflicht
- Kampfbühne: links deine Werte, rechts die der Gegner, die Absicht der Gegner als Code über ihnen
- Kampf: Karten- und Gegnercode läuft Zeile für Zeile mit Variablenanzeige
- **Eingebung:** Mit etwas Glück leuchtet pro Zug eine Karte; wer ihre Wirkung richtig vorhersagt, bekommt die doppelte Wirkung. Die Chance steigt mit Level, Orakel, Talent und Run-Skill
- **Relikte** (14 + 6 freischaltbare) sind Python-Funktionen zu festen Zeitpunkten (`kampf_start`, `zug_start`, `karte_gespielt`, `zug_ende`, `kampf_ende`). Die Reihenfolge legt der Spieler fest und sie zählt (wie die Joker in Balatro)
- **?-Räume:** 9 Code-Rätsel (Wert am Ende vorhersagen, mit Schritt-für-Schritt-Auflösung) und 3 Entscheidungs-Ereignisse
- **Evolutionen** (wie in Vampire Survivors): Zwei Karten verschmelzen am Rastplatz, wenn eine verbessert ist; den neuen Code ordnet man selbst
- **Zauberbuch** mit Karten, Relikten, Evolutionen und 6 Erfolgen, die neue Relikte freischalten
- **Klassen-Code:** Gleicher Code = gleiche Höhle und gleiche Angebote, Tages-Code per Knopf
- **Prüfungsstufen 1–5** (wie Ascension), frei nach jedem Sieg; Boss-Regeln wie die Boss-Blinds in Balatro
- **Rückblick** am Ende eines Runs: stärkster Zauber, fleißigstes Relikt, Kommentar des Meisters
- **Einführung mit Zeigefinger** beim ersten Mal: Karte, erster Kampf Schritt für Schritt, Schmiede, Debug-Raum, Rätsel, Händler, Rastplatz, Belohnung (zurücksetzbar unter „So funktioniert's“)
- **Code erklären ❓** an Karten, Gegnerabsichten, im Deck und bei Relikten: jede Zeile in Worten, eigene und Spielvariablen mit aktuellen Werten, Begriffe wie Liste, Index, range, // mit Beispielen
- **Eingabe-Karten** (Streustrahl, Kraftschub, Kettenschlag, Blutpakt): Die erste Zeile ist `x = int(input(...))`, beim Ausspielen wählt man die Zahl
- 16 Karten, 6 Gegner, 1 Boss, 2 Bug-Karten, 4 Schmieden, 4 Evolutionen
- Händler mit den Konzepten `elif`, `for`, `while`, Karten, einem Relikt und Kartenentfernen
- Level-ups, Run-Skills, Talentbaum mit 10 Knoten
- Speichern im Browser, Spielstand-Code zum Mitnehmen

## Dateien

| Datei | Inhalt |
| --- | --- |
| `js/data.js` | alle Inhalte: Helden, Karten, Gegner, Schmieden, Bugs, Konzepte, Talente, Bauplan der Höhle, Rätsel, Ereignisse, Relikte, Evolutionen, Erfolge, Regeln, Stufen |
| `js/natter.js` | Anbindung an Natter: Ausführen mit Schrittspur, Tests, Sperren |
| `js/combat.js` | Kartenkampf und Animation |
| `js/rooms.js` | Schmiede, Debug-Raum, Händler, Rastplatz (mit Evolutionen), Belohnung, Level-up |
| `js/events.js` | ?-Räume: Code-Rätsel und Entscheidungen |
| `js/relics.js` | Relikte: Anzeige, Auswahl, Reihenfolge, Erfolge |
| `js/explain.js` | Code erklären: Zeilen in Worten, Variablen, Begriffe |
| `js/tutorial.js` | Einführung mit Zeigefinger |
| `js/main.js` | Titel, Heldenauswahl (Klassen-Code, Stufe), Karte, Zauberbuch, Talentbaum, Run-Ende mit Rückblick |
| `js/state.js` | Spielstand, Zufall, Erzeugung der Höhlenkarte |
| `js/sprites.js` | Figuren als SVG-Zeichnungen, Platz für eigene Bilder |
| `js/fx.js` | Kampfeffekte: Geschosse, Schild, Heilung, Hiebe |

Neue Karten, Gegner oder Schmieden werden nur in `js/data.js` eingetragen.

## Figuren

Die Figuren wurden mit Meshy als 3D-Modelle erzeugt (Prompts in `assets/figuren/MESHY-PROMPTS.md`) und als PNG in Seitenansicht gerendert. Sie liegen in `assets/figuren/` und sind in `js/sprites.js` bei `BILDER` eingetragen. Fehlt dort ein Eintrag, zeigt das Spiel die eingebaute SVG-Zeichnung.

Neu rendern (z. B. andere Drehung oder mehr Licht):

1. Modell als `tools/modelle/<figur>.glb` ablegen.
2. Speicherdienst starten: `py tools/speicherdienst.py`
3. `http://localhost:8765/tools/figuren-render.html` öffnen, Figur und Drehung wählen, „Als PNG speichern“. Das Bild landet in `assets/figuren/`. Danach auf etwa 400 Pixel Höhe verkleinern.

Der Ordner `tools/` (die 3D-Modelle sind zusammen über 400 MB groß) wird für das Spiel nicht gebraucht und sollte beim Veröffentlichen weggelassen werden.

## Testbot

`tools/spielbot.js` spielt das Spiel über die echte Oberfläche durch, als guter oder schlechter Spieler, und schreibt alles mit. In der Browser-Konsole auf der laufenden Seite:

```js
const b = await import('/tools/spielbot.js');
await b.start('gut', 'magierin');   // 'gut' (≈ 7–8/10), 'schwach' (≈ 3/10, liest Code unsicher) oder 'schlecht' (zufällig)
BOT.fights; BOT.log; BOT.summary;
```

Der Bot schaltet das Tempo auf „turbo“ und markiert alle Einführungen als gesehen. Er überschreibt den Spielstand dieses Browsers.

## Über das Spiel

Entstanden für meine Schülerinnen und Schüler am Gymnasium Dresden-Pieschen. Über Feedback und Hinweise freue ich mich sehr. – René Richter, richter (at) gdpie.lernsax.de
