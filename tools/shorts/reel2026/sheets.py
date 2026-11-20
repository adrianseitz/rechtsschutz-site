# Kontrollbilder: pro Satz ein Standbild kurz vor Satzende, als ein Streifen pro Reel
import json, os, subprocess, sys
S = os.path.dirname(os.path.abspath(__file__))
env = dict(os.environ, REELS_DIR=S + '/scripts30', VOICE_DIR=os.environ.get('SHEET_VOICE', S + '/voice30'), OUT_DIR=S + '/out30')
os.makedirs(S + '/out30', exist_ok=True)
for n in sys.argv[1:]:
    m = json.load(open(os.environ.get('SHEET_VOICE', S + '/voice30') + f'/{n}.json'))
    ts = [round(b['words'][-1]['e'] - .05, 2) for b in m[:-1]] + [round(m[-1]['words'][-1]['e'] + 1.2, 2)]
    r = subprocess.run(['python3', '-I', S + '/render/render.py', n, 'stills', ','.join(map(str, ts))], env=env, capture_output=True, text=True)
    if r.returncode: print(n, 'FEHLER', r.stderr[-1500:]); continue
    files = [f'{S}/out30/{n}_t{t:05.2f}.jpg' for t in ts]
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error'] + sum([['-i', f] for f in files], []) + ['-filter_complex',
        f"{''.join(f'[{i}]' for i in range(len(files)))}hstack={len(files)},scale={216*len(files)}:384,pad=1512:384", f'{S}/out30/sheet_{n[:8]}.jpg'], check=True)
    for f in files: os.remove(f)
    print(n, 'ok')
