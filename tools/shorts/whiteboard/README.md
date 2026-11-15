# Whiteboard-Shorts (Hochformat)

Zeichen-Engine aus ReelMimic (MIT, siehe LICENSE-ReelMimic.txt und LICENSE-render.mjs.txt), angepasst an
1080×1920, lokale Schriften und das Schild-Maskottchen (`src/brand.js`). Ein Video = eine Datei in `src/scenes/`.

```bash
npm install
node render.mjs --chrome=<Pfad zu Chrome> --sheet=2,6,10 --cols=3 --w=360 --out=out/check/a.jpg   # Kontrollbilder
node render.mjs --chrome=<Pfad zu Chrome> --clip --out=out/video_noaudio.mp4                       # Video
python3 ../audio.py out/sfx.json out/audio.wav                                                     # Tonspur
ffmpeg -i out/video_noaudio.mp4 -i out/audio.wav -map 0:v -map 1:a -c:v copy -af loudnorm=I=-14:TP=-1.5 -c:a aac -shortest out/video.mp4
```
