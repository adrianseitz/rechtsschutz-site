# Video-Automatik (TikTok, Instagram Reels, YouTube Shorts)

Erklärvideos im Hochformat (1080×1920) in zwei Stilen – **Whiteboard** (Marker und Hand zeichnen live) und
**Cartoon** (flach, mit Schild-Maskottchen) – mit der eigenen Stimme (Kyutai Pocket TTS auf dem Server, kostenlos) oder ElevenLabs, eigener Musik und Geräuschen
(keine fremden Musikrechte). Auf dem Server läuft der Docker-Service `shorts`: Er erstellt die nächsten Videos vorab
und postet sie zum Termin über Upload-Post. Eingerichtet und überwacht wird alles im CRM unter **Videos**.

**Das Erklär-Männchen** (das Schild-Maskottchen) steht in jedem Video rechts unten vor der Tafel: Es bewegt den Mund
passend zur Stimme (Lautstärke der Aufnahme, ohne Aufnahme aus dem Text geschätzt – `shared/talk.js`), zeigt auf die
Inhalte, schaut besorgt beim Haken, jubelt bei der Lösung und winkt am Schluss. Inhalte bleiben deshalb oben (volle
Breite bis y ≈ 1060) und links unten.

**Schwerpunkt Vermieter + Firma:** In `episodes/` liegt nur, was gepostet werden soll. Themen zu Arbeit, Privat und
Verkehr liegen in `episodes/reserve/` – zum Aktivieren mit Nummer und `order` zurück nach `episodes/` verschieben.

**Hooks für die Zielgruppe:** Jeder `hook` hat ein `tag` („Für Vermieter“, „Für Selbstständige“, „Für Arbeitgeber“),
das ab dem ersten Bild steht, und einen Sprechertext, der die Gruppe direkt anspricht. Jedes Thema gibt es zweimal:
Fassung A und Fassung B (`…-b`) mit anderem Hook und im anderen Stil. Oben läuft ein Fortschrittsbalken mit.

**Dauerbetrieb:** Im CRM lassen sich mehrere Uhrzeiten pro Tag einstellen. Sind alle Videos gepostet, beginnt die
Reihe von vorn – in jeder zweiten Runde im jeweils anderen Stil (Stimme wird wiederverwendet).

**Prüfung:** `node lib/validate.mjs` prüft alle Episoden (Aufbau, Pflichtangaben, „je nach Tarif“ bei Leistungen,
unzulässige Werbeaussagen). Der Server-Dienst überspringt alles, was durchfällt.

## Ein neues Video = eine Datei in `episodes/`

```jsonc
{
  "id": "15-vermieter-nebenkosten", "order": 15, "topic": "vermieter",   // vermieter | firma (Reserve: privat | arbeit | allgemein)
  "style": "whiteboard",                                              // studio3d | whiteboard | cartoon
  "title": "…", "caption": "Text zum Video inkl. Hashtags",
  "youtube": { "title": "… #shorts", "description": "…", "tags": ["…"] },
  "fine": "* je nach Tarif … Pflichtangaben",                         // erscheint im Video
  "beats": [                                                           // Abschnitte; jeder hat einen Sprechertext "say"
    { "type": "hook",     "tag": "Für Vermieter", "say": "Vermieter aufgepasst: …", "lines": ["Erste Zeile", "[betont]"], "icon": "house" },
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

## Bilder-Posts (Instagram-Karussell)

In `karussell/posts/` liegt je Bilder-Post eine Datei: erste Folie die Frage (`cover`), dahinter z. B. `chat`, `brief`, `zahl`,
`text`, `liste`, `vergleich`, `loesung`, `achtung`, zuletzt `cta` mit Adrians Foto und den Pflichtangaben (`fine`).
`karussell/vorlage.html` zeichnet die Folien (1080 × 1350, 4:5, Markenfarben), `karussell/render.mjs` macht daraus JPGs,
`karussell/validate.mjs` prüft wie bei den Videos („je nach Tarif“, Wartezeit, keine Superlative, höchstens 10 Folien).
Der Worker reiht sie in dieselbe Warteschlange wie die Videos ein und postet sie zum Termin als Karussell auf Instagram.
Abschaltbar im CRM: „Bilder-Posts auf Instagram mit posten“. Auf Wunsch zusätzlich als TikTok-Foto-Post („Bilder-Posts auch
auf TikTok“, `worker/tiktok.mjs` → `ttPostPhotos`): TikTok holt die Bilder von der Kurzzeit-Adresse ab (PULL_FROM_URL), dafür
muss die Domain `seitz-rechtsschutz.de` im TikTok-Entwicklerportal unter „URL properties“ bestätigt sein (TXT-Eintrag bei IONOS).

```bash
node karussell/render.mjs --alle --out=out/karussell --sheet    # alle Bilder + je ein Übersichtsbild
```

Auszeichnung: `[betont]` (gelb bzw. Marker), `{kursiv}`, `*` = Fußnote „je nach Tarif“.

## Lokal ansehen

```bash
cd tools/shorts && npm install
node render.mjs episodes/01-vermieter-mietausfall.json --sheet --out=out/01.jpg   # Kontrollbild (15 Momente)
node render.mjs episodes/01-vermieter-mietausfall.json --out=out/01.mp4           # Video (ohne Stimme)
node render.mjs episodes/01-….json --voice=<ordner mit beat-0.mp3 …> --out=out/01.mp4
node render.mjs episodes/01-….json --style=studio3d --out=out/01-3d.mp4               # dasselbe Thema im 3D-Stil
```

Voraussetzungen: Node 22, Chrome/Chromium (`--chrome=` oder `CHROME_PATH`), Python 3 mit numpy/scipy, ffmpeg.

## Aufbau

- `whiteboard/` – Zeichen-Engine aus ReelMimic (MIT, siehe `LICENSE-ReelMimic.txt`), Vorlagen in `src/beats.js`, Maskottchen in `src/brand.js`
- `cartoon/player.html` – Cartoon-Vorlagen (eigene Zeichnungen)
- `studio3d/player.html` – 3D-Vorlagen: echte 3D-Bühne mit three.js (MIT, gebündelt in `vendor/three.iife.js`, neu bauen mit `npm run build:three`). Läuft ohne Grafikkarte über den Software-Renderer von Chrome; ein Video braucht dadurch etwa 10–20 Minuten Rechenzeit.
- `figur/` – die Moderator-Figur im 3D-Stil: Bilder von einer Bild-KI (Grundbild, Mund halb/offen, Augen zu, fünf Gesten,
  grüner Hintergrund) → `python3 figur/vorbereiten.py <ordner> --vorschau vorschau.jpg` stellt frei, richtet aus und schreibt
  `figur/kit/`. Im Video bewegt sich der Mund zur Stimme, die Figur blinzelt und zeigt pro Abschnitt eine Geste.
  Ohne `figur/kit/` zeigt das Video einen Platzhalter-Umriss.
- `render.mjs` – Bild für Bild in Chrome → ffmpeg, Tonspur aus `audio.py`, Lautheit −14 LUFS
- `worker/` – Server-Dienst: Warteschlange, Stimme, Upload-Post, Zeitplan (`Dockerfile` für den Service `shorts`)
- `worker/ownvoice.mjs` – eigene Stimme: Pocket TTS (Programm MIT, Modell CC BY 4.0, Freischaltung bei HuggingFace). Aus der
  Aufnahme im CRM (`data/social/voice-sample/`) entsteht einmal ein Stimmabdruck (`data/social/ownvoice/`), damit wird jeder
  Satz gesprochen. Die Aufnahme bleibt auf dem Server und gehört nie ins Git-Repository.
- `worker/figur.mjs` – die Moderator-Figur aus Adrians Foto: CRM → Videos → „Deine Figur“. Der Server erzeugt mit FLUX.2
  (Cloudflare Workers AI, kostenloses Tageskontingent von etwa 6 Bildern) erst das Grundbild, nach Freigabe 3 Sprech-Varianten
  und 5 Gesten, stellt sie mit `figur/vorbereiten.py` frei (`data/social/figur/kit/`) und macht nach dem Tageslimit nachts
  von selbst weiter. 3D-Videos nutzen diese Figur; „Probevideo erstellen“ zeigt sie im Video.
- `lib/sprechtext.mjs` – schreibt Zahlen, €, %, § und Abkürzungen für die Stimme aus („5.700 €“ → „fünftausendsiebenhundert Euro“)
- `fonts/` – Geist, Instrument-Serif-Kursiv, Caveat, Kalam (OFL)
