# Platzhalter-Wortzeiten (0,36 s pro Wort), um Szenen ohne fertige Stimme zu prüfen
import json, sys, os
src, out = sys.argv[1], sys.argv[2]; os.makedirs(out, exist_ok=True)
for f in sorted(os.listdir(src)):
    d = json.load(open(os.path.join(src, f))); t = .3; marks = []
    for b in d['beats']:
        ws = b['say'].split(); s0 = t; words = []
        for w in ws: words.append({'w': w, 's': round(t, 2), 'e': round(t + .3, 2)}); t += .36
        marks.append({'key': b['key'], 'mood': b['mood'], 'say': b['say'], 'start': round(s0, 2), 'end': round(t, 2), 'words': words}); t += .45
    json.dump(marks, open(os.path.join(out, f), 'w'), ensure_ascii=False)
