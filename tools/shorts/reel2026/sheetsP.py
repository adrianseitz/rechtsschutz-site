# Kontrollstreifen für Spielszenen-Reels: pro Satz ein Standbild kurz vor Satzende
import json, os, subprocess, sys
S = os.path.dirname(os.path.abspath(__file__))
V = os.environ.get('SHEET_VOICE', S + '/voiceP')
env = dict(os.environ, REELS_DIR=S + '/scriptsP', VOICE_DIR=V, OUT_DIR=S + '/outP/sheets')
os.makedirs(S + '/outP/sheets', exist_ok=True)
for n in sys.argv[1:]:
    m = json.load(open(f'{V}/{n}.json'))
    ts = [round(b['words'][-1]['e'] - .05, 2) for b in m[:-1]]
    r = subprocess.run(['python3', '-I', S + '/render/render.py', n, 'stills', ','.join(map(str, ts))], env=env, capture_output=True, text=True)
    if r.returncode: print(n, 'FEHLER', r.stderr[-1500:]); continue
    files = [f'{S}/outP/sheets/{n}_t{t:05.2f}.jpg' for t in ts]
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error'] + sum([['-i', f] for f in files], []) + ['-filter_complex',
        f"{''.join(f'[{i}]' for i in range(len(files)))}hstack={len(files)},crop=iw:1300:0:380,scale=-1:420", f'{S}/outP/sheets/sheet_{n[:8]}.jpg'], check=True)
    for f in files: os.remove(f)
    print(n, 'ok')
