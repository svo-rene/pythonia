# Prompts für Meshy

Neun Figuren für Pythonia. Die Prompts sind auf Englisch, weil Meshy damit meist bessere Ergebnisse liefert. Alle Prompts nutzen denselben Stil, damit die Figuren zusammenpassen.

## So gehst du vor

1. In Meshy **Text to 3D** wählen und den Prompt einfügen. Den **Negative Prompt** unten bei jeder Figur mitgeben, falls Meshy das Feld anbietet.
2. Aus den Vorschauen die beste auswählen und mit Textur fertig erzeugen lassen.
3. Das Modell in Meshy **von der Seite** drehen (leicht schräg, etwa 3/4-Ansicht). **Helden schauen nach rechts, Gegner nach links.**
4. Ein Bild davon speichern, den Hintergrund entfernen (z. B. mit einem Freistell-Werkzeug) und als PNG ablegen, etwa 480 × 560 Pixel, beim Boss 640 × 720.
5. Datei hier in `assets/figuren/` speichern, zum Beispiel `magierin.png`, und in `js/sprites.js` bei `BILDER` eintragen.

Bleibt der Stil zwischen den Figuren uneinheitlich, hilft es, die beste fertige Figur als Bildvorlage zu nehmen (**Image to 3D** oder Stil-Referenz, je nachdem, was dein Meshy-Tarif anbietet).

## Gemeinsamer Stil

Dieser Teil steht schon in jedem Prompt unten. Er ist hier nur zum Anpassen:

> stylized chibi game character, cute proportions with big head, hand-painted texture, soft colors, clean silhouette, full body, standing pose, cave dungeon fantasy, low poly friendly

**Negative Prompt (für alle):**

> realistic, photorealistic, gore, blood, scary, horror, text, logo, watermark, base, pedestal, ground plane, multiple characters, weapon pointing at viewer

---

## Helden

### `magierin` · Die Funkenmagierin

> Stylized chibi game character, young fire mage girl, tall pointed purple wizard hat with small golden stars, flowing purple robe, wooden staff topped with a glowing orange-yellow orb, confident smile, sparks floating around her hands, cute proportions with big head, hand-painted texture, soft colors, clean silhouette, full body, standing pose, fantasy cave adventure, low poly friendly

### `waechter` · Der Steinwächter

> Stylized chibi game character, sturdy stone guardian knight, rounded grey steel helmet with a narrow visor and a red plume, glowing light blue eyes behind the visor, bulky armor, large blue kite shield with a white cross emblem, short and broad, calm and protective pose, cute proportions with big head, hand-painted texture, soft colors, clean silhouette, full body, fantasy cave adventure, low poly friendly

### `orakel` · Das Orakel

> Stylized chibi game character, mysterious hooded oracle, deep indigo cloak with the face hidden in shadow, two glowing lavender eyes, floating crystal ball glowing purple beside one hand, faint glowing code symbols like "if" and "==" orbiting around, calm wise pose, cute proportions with big head, hand-painted texture, soft colors, clean silhouette, full body, fantasy cave adventure, low poly friendly

---

## Gegner

### `tintenfleck` · Tintenfleck

> Stylized chibi game monster, living ink blot slime, dark navy blue blob with drips and small splashes, two big round white eyes, small mischievous frown, glossy wet surface, cute and slightly grumpy, hand-painted texture, soft colors, clean silhouette, full body, fantasy cave creature, low poly friendly

### `rostwaechter` · Rostwächter

> Stylized chibi game monster, small boxy rusty robot guard, orange-brown corroded metal with rust spots, rectangular dark face screen with two glowing orange eyes, short antenna with an orange light, stubby arms and legs, slightly clunky, cute proportions, hand-painted texture, soft colors, clean silhouette, full body, fantasy cave creature, low poly friendly

### `fehlerteufel` · Fehlerteufel

> Stylized chibi game monster, small red imp gremlin, round body, cream-colored curved horns, yellow eyes, cheeky grin with tiny fangs, thin tail with a triangle tip, holding a tiny glowing bug, playful troublemaker, cute proportions with big head, hand-painted texture, soft colors, clean silhouette, full body, fantasy cave creature, low poly friendly

### `schwarmbiene` · Schwarmbiene

> Stylized chibi game monster, chubby yellow and black striped bee, translucent light blue wings, small red eyes, short stinger, two curly antennae, hovering pose, cute and angry, hand-painted texture, soft colors, clean silhouette, full body, fantasy cave creature, low poly friendly

### `schleifenschlange` · Schleifenschlange (Elite)

> Stylized chibi game monster, green snake whose body is coiled into a perfect loop like an infinity sign, lighter green belly pattern, yellow slit eyes, small forked pink tongue, raised head ready to strike, slightly menacing but cute, hand-painted texture, soft colors, clean silhouette, full body, fantasy cave creature, low poly friendly

### `verzweiger` · Der Verzweiger (Boss)

> Stylized game boss monster, ancient twisted tree creature, thick dark brown trunk splitting into many branches, glowing purple fruit at the branch tips, one large eye in the middle of the trunk, jagged bark mouth below the eye, roots spreading like legs, branches shaped like a decision tree, imposing but still cartoonish, hand-painted texture, rich colors, clean silhouette, full body, fantasy cave boss, low poly friendly

---

## Eintrag in `js/sprites.js`

```js
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
};
```

Trage nur Figuren ein, für die es schon ein Bild gibt. Die anderen bleiben Zeichnungen.
