# Reels im Design 2026 („Textmarker“)

Lern-Reels für Instagram und TikTok (1080 × 1920, 30 fps): Problem im Dunkeln, ab der Lösung wird es hell,
wichtige Wörter gelb markiert, Endkarte mit Adrians Foto. Keine Musik, nur Stimme und dezente Soundeffekte.

## Inhalte

- `../reels/reel-01 … reel-06` – die ersten sechs Reels
- `../reels/reel-07 … reel-36` – 30 Lern-Reels (15 Vermieter, 15 Firma), erzeugt mit `scripts30.py`
- `render/storyboards.py`, `render/storyboards30.py` – welche Grafik zu welchem Satz gehört
- Regeln: Leistungen immer „je nach Tarif“, Wartezeit nennen, keine Superlative, „ARAG“ wird nicht gesprochen
  (die Stimme spricht es falsch aus), sondern steht auf der Endkarte.

## Ablauf

1. **Stimme** (`stimme/voice_v2.py`): Supertonic 3 über sherpa-onnx, Stimme 2 (Mischung M1 + M3, siehe `spec1.json`,
   Stimmen-Datei mit `st3_bank.py` aus `voice.bin` des Modells bauen). Jeder Satz wird bis zu 6-mal erzeugt; die
   Spracherkennung (Whisper small) wählt die sauberste Fassung. Letzter Parameter = Stärke der Emotion (0 … 1, Vorschau: 0,35).
2. **Wort-Zeiten** (`stimme/wordtimes.py`): Parakeet TDT v3 liefert die Zeit jedes Wortes für die Untertitel.
3. **Video** (`render/render.py <reel-id> full`): HTML-Animation (`render/reel.html`) wird Bild für Bild mit Chromium
   aufgenommen, Ton gemischt (Stimme + synthetische Effekte), Lautheit −14 LUFS.
   Ordner über `REELS_DIR`, `VOICE_DIR`, `OUT_DIR` setzen. `renderloop.sh` rendert alle, sobald die Stimme da ist.
4. **Kontrolle**: `sheets.py <reel-ids>` erzeugt pro Reel einen Streifen mit einem Standbild pro Satz.

## Modelle (alle über GitHub, nicht HuggingFace)

- `sherpa-onnx-supertonic-3-tts-int8-2026-05-11` (Lizenz OpenRAIL-M, kommerzielle Nutzung erlaubt)
- `sherpa-onnx-whisper-small`, `sherpa-onnx-nemo-parakeet-tdt-0.6b-v3-int8`
- Download: `https://github.com/k2-fsa/sherpa-onnx/releases/download/{tts-models|asr-models}/<name>.tar.bz2`
- Python: `sherpa-onnx`, `praat-parselmouth`, `num2words`, `scipy`, `playwright`

## Spielszenen mit Figuren (Reels 37–46)

Zehn Vermieter-Reels als kleine Szenen mit 3D-Figuren: Vermieter, Mieter, Anwältin, Richter, Handwerker, Nachbarn.

- Figuren und Requisiten: Microsoft Fluent Emoji 3D (MIT-Lizenz, `render/assets/fl/LICENSE.txt`), Brustbilder in einem
  Bühnenfenster; Szenen-Baustein `play` in `render/play.js` (Kulisse unscharf, Auftritte, Gesichts-/Posenwechsel,
  Sprechblasen, fliegende Requisiten, Stempel).
- Feste Besetzung: Vermieter = blonder Mann im blauen Pulli (`v_*`), Vermieterin = blonde Frau lila (`vw_*`),
  Mieter = dunkelhaariger Mann blau (`m_*`), Mieterin = Frau lila, dunkler Hautton (`mw_*`), Fachleute im Anzug.
  Keine Dollar-Symbole (Geldsack, Bank) – stattdessen Euro-Schein und Münze.
- Skripte: `scriptsP.py` → `../reels/reel-37 … reel-46`; Drehbuch: `render/storyboardsP.py`.
- Vorschau ohne fertige Stimme: `fake_marks.py` (Platzhalter-Zeiten) + `SHEET_VOICE=… sheetsP.py <reel-ids>`.
- `voiceloopP.sh` und `renderloopP.sh` erzeugen Stimmen und Videos nacheinander.

## Offen

- Stimme mit Adrian am Laptop verbessern (Aussprache „ARAG“, Betonung); danach alle Reels neu rendern –
  Drehbücher und Design bleiben gleich, die Zeiten passen sich automatisch an.
