# Video-Automatik (TikTok, Instagram Reels, YouTube Shorts)

Erklärvideos im Hochformat (1080×1920) in zwei Stilen – **Whiteboard** (Marker und Hand zeichnen live) und
**Cartoon** (flach, mit Schild-Maskottchen) – mit KI-Stimme von ElevenLabs, eigener Musik und Geräuschen
(keine fremden Musikrechte). Auf dem Server läuft der Docker-Service `shorts`: Er erstellt die nächsten Videos vorab
und postet sie zum Termin über Upload-Post. Eingerichtet und überwacht wird alles im CRM unter **Videos**.

## Ein neues Video = eine Datei in `episodes/`

```jsonc
{
  "id": "13-vermieter-kaution", "order": 13, "topic": "vermieter",   // privat | arbeit | vermieter | firma | allgemein
  "style": "whiteboard",                                              // whiteboard | cartoon (am besten abwechselnd)
  "title": "…", "caption": "Text zum Video inkl. Hashtags",
  "youtube": { "title": "… #shorts", "description": "…", "tags": ["…"] },
  "fine": "* je nach Tarif … Pflichtangaben",                         // erscheint im Video
  "beats": [                                                           // Abschnitte; jeder hat einen Sprechertext "say"
    { "type": "hook",     "say": "…", "lines": ["Erste Zeile", "[betont]"], "icon": "house", "items": ["März"], "mark": "cross" },
    { "type": "cost",     "say": "…", "title": "…", "big": "– 5.700 €", "note": "…", "itemsTitle": "Dazu kommen:", "items": ["Anwalt"] },
    { "type": "fact",     "say": "…", "kicker": ["…"], "big": "3 Wochen", "lines": ["…"], "icon": "calendar", "note": "…" },
    { "type": "list",     "say": "…", "title": ["…"], "items": ["…"], "mark": "check" },          // check | cross | num
    { "type": "solution", "say": "…", "product": ["Vermieter-", "rechtsschutz"], "lines": ["…*"], "highlight": "+ …", "highlightLines": ["…"] },
    { "type": "warning",  "say": "…", "title": "Aber Achtung:", "lines": ["…"], "note": "…", "icon": "clock" },
    { "type": "cta",      "say": "…", "question": ["Passt das zu", "[deiner Immobilie?]"] }
  ]
}
```

Auszeichnung im Text: `[betont]` (rot bzw. kursiv), `{markiert}` (gelber Marker), `*` = Fußnote zu den Pflichtangaben.
Symbole: house, calendar, coin, money, bill, letter, gavel, clock, building, person, contract, wrench, car, fire, phone.
Nur Aussagen verwenden, die auch auf der Website stehen – und Leistungen immer mit „je nach Tarif“.

Die Länge jedes Abschnitts richtet sich nach der Sprachaufnahme (`lib/timing.mjs`); ohne Aufnahme wird geschätzt.

## Lokal ansehen

```bash
cd tools/shorts && npm install
node render.mjs episodes/01-vermieter-mietausfall.json --sheet --out=out/01.jpg   # Kontrollbild (15 Momente)
node render.mjs episodes/01-vermieter-mietausfall.json --out=out/01.mp4           # Video (ohne Stimme)
node render.mjs episodes/01-….json --voice=<ordner mit beat-0.mp3 …> --out=out/01.mp4
```

Voraussetzungen: Node 22, Chrome/Chromium (`--chrome=` oder `CHROME_PATH`), Python 3 mit numpy/scipy, ffmpeg.

## Aufbau

- `whiteboard/` – Zeichen-Engine aus ReelMimic (MIT, siehe `LICENSE-ReelMimic.txt`), Vorlagen in `src/beats.js`, Maskottchen in `src/brand.js`
- `cartoon/player.html` – Cartoon-Vorlagen (eigene Zeichnungen)
- `render.mjs` – Bild für Bild in Chrome → ffmpeg, Tonspur aus `audio.py`, Lautheit −14 LUFS
- `worker/` – Server-Dienst: Warteschlange, ElevenLabs, Upload-Post, Zeitplan (`Dockerfile` für den Service `shorts`)
- `fonts/` – Geist, Instrument-Serif-Kursiv, Caveat, Kalam (OFL)
