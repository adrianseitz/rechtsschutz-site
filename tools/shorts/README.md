# Shorts-Generator (Cartoon-Videos für TikTok, Instagram Reels, YouTube Shorts)

Erzeugt Hochformat-Videos (1080×1920, 30 fps) im Stil der Website – mit eigenem Schild-Maskottchen,
Untertiteln, synthetischer Musik und Geräuschen (keine fremden Musikrechte).

```bash
cd tools/shorts
node render.mjs engine/index.html out/video.mp4            # komplettes Video
node render.mjs engine/index.html out/vorschau --stills 2,9,15   # nur Standbilder
```

Voraussetzungen: Node mit Playwright + Chromium, Python 3 mit numpy/scipy, ffmpeg.
Die Lautstärke wird auf etwa −14 LUFS gebracht (Richtwert der Plattformen).
