# Zauberlehrling (Prototyp)

Ein Roguelike-Deckbuilder für den Informatikunterricht: Die Karten sind Python-Code. Im Kampf liest man Code, in der Schmiede schreibt man ihn, im Debug-Raum repariert man Bugs. Python läuft im Browser über [Natter](https://github.com/wi-wissen/Natter) (`@natterjs/core` 0.2.0 von jsDelivr).

## Starten

Die Seite braucht einen kleinen Webserver (ES-Module laufen nicht über `file://`):

```powershell
py -m http.server 8765 --directory zauberlehrling
```

Dann `http://localhost:8765` öffnen. Beim Start ist eine Internetverbindung nötig, weil Natter von jsDelivr geladen wird. Zum Hosten reicht jeder statische Webspace (z. B. GitHub Pages).

## Inhalt des Prototyps (Akt 1)

- Drei Figuren mit eigenem Startdeck und eigener Gabe (Funkenmagierin, Steinwächter, Orakel)
- Höhlenkarte als Knotengraph wie bei Slay the Spire, bei jedem Run neu erzeugt (10 Ebenen und Boss)
- Kampfbühne mit gezeichneten Figuren; Leben, Block und Energie stehen über den Figuren, die Absicht der Gegner als Code darüber
- Kampf: Karten- und Gegnercode läuft Zeile für Zeile mit Variablenanzeige, Vorhersage einmal pro Zug (richtig = Wirkung ×1,5)
- 12 Karten, 6 Gegner, 1 Boss, 2 Bug-Karten (Zaunpfahl, Ewige Schleife)
- 4 Schmieden (Zeilen ordnen oder frei schreiben), automatisch gegen Testfälle geprüft, mit Sternen und gestuften Hinweisen; der geprüfte Code wird zur Karte
- Händler mit den Konzepten `elif`, `for`, `while` (Freischaltung nach kurzer Nachverfolgungsaufgabe), Rastplatz mit Karten-Upgrade
- Level-ups, Run-Skills, Talentbaum mit 10 Knoten
- Speichern im Browser, Spielstand-Code zum Mitnehmen

## Dateien

| Datei | Inhalt |
| --- | --- |
| `js/data.js` | alle Inhalte: Helden, Karten, Gegner, Schmieden, Bugs, Konzepte, Talente, Bauplan der Höhle |
| `js/natter.js` | Anbindung an Natter: Ausführen mit Schrittspur, Tests, Sperren |
| `js/combat.js` | Kartenkampf und Animation |
| `js/rooms.js` | Schmiede, Debug-Raum, Händler, Rastplatz, Belohnung, Level-up |
| `js/main.js` | Titel, Karte, Talentbaum, Run-Ende |
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
