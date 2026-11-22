# Pythonia – Die Höhle der Verzweigungen (Prototyp)

Ein Roguelike-Deckbuilder für den Informatikunterricht: Die Karten sind Python-Code. Im Kampf liest man Code, in der Schmiede schreibt man ihn, im Debug-Raum repariert man Bugs. Python läuft im Browser über [Natter](https://github.com/wi-wissen/Natter) (`@natterjs/core` 0.2.0 von jsDelivr).

## Starten

Die Seite braucht einen kleinen Webserver (ES-Module laufen nicht über `file://`):

```powershell
py -m http.server 8765
```

(im Projektordner starten) und dann `http://localhost:8765` öffnen. Beim Start ist eine Internetverbindung nötig, weil Natter von jsDelivr geladen wird. Zum Hosten reicht jeder statische Webspace (z. B. GitHub Pages).

## Inhalt des Prototyps (Akt 1)

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
- 12 Karten, 6 Gegner, 1 Boss, 2 Bug-Karten, 4 Schmieden, 4 Evolutionen
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
