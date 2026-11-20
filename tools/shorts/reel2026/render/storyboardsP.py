# Drehbuch der Spielszenen-Reels: Szene „play“ = Bühne mit 3D-Figuren (Brustbilder), Sprechblasen, Requisiten, Stempeln.
# Zeiten: Zahl = Sekunden ab Satzbeginn, Text = Wort im Satz (Start des Wortes).
VERMIETER = 'Vermieter-Wissen'
END = {'type': 'endcard'}
def play(**kw): return dict(type='play', **kw)
def A(id, img, x, at=0.1, h=440, typ='up', **kw): return dict(id=id, img=img, x=x, h=h, **({'in': {'type': typ, 'at': at}}), **kw)
def say(who, text, at, side='r', **kw): return dict(who=who, text=text, at=at, side=side, **kw)
def lab(text, x, y, at, tone='white', **kw): return dict(text=text, x=x, y=y, at=at, tone=tone, **kw)
def fx(img, x, y, at, h=150, anim='pop', **kw): return dict(img=img, x=x, y=y, at=at, h=h, anim=anim, **kw)
def wait(title='Wichtig', first='Vorher abschließen', word1='Abschließen'):
    return dict(type='timeline', title=title, steps=[
        {'t': first, 'sub': 'bevor der Ärger losgeht', 'word': word1, 'fill': True},
        {'t': 'Meist 3 Monate Wartezeit', 'word': 'Wartezeit'},
        {'t': 'Danach greift der Schutz', 'sub': 'je nach Tarif', 'word': 'Monaten', 'fill': True}])

BOARDSP = {
 'reel-37-p-mietnomade': dict(
   badge=VERMIETER, hookTitle='Der perfekte<br><span class="mark">Mieter?</span>', lightAt='loesung',
   scenes={
     'hook': play(top=560, h=690, set='door', actors=[A('v', 'v_explain', 290, .15), A('m', 'm_charm', 690, .55, typ='right', flip=True)],
                  say=[say('m', 'Traumhafte Wohnung!', 'Freundlich', side='l', size=42)],
                  fx=[fx('handshake', 490, 520, 'gepflegt', h=150)],
                  labels=[lab('Besichtigung · 18:00 Uhr', 40, 40, 'Besichtigung', tone='white', size=40)]),
     'miete': play(top=470, h=760, set='living', actors=[A('v', 'v_explain', 300, .05, h=460, swap=[{'img': 'v_frown', 'at': 'nicht'}], shake=[{'at': 'nicht', 'dur': .6}])],
                   fx=[fx('phone', 470, 520, .1, h=170, rot=-10), fx('anger', 420, 170, 'nicht', h=110, anim='emote')],
                   labels=[lab('Januar  ✓', 580, 90, 'erste', tone='yellow', size=50), lab('Februar  ✓', 580, 210, 'zweite', tone='yellow', size=50),
                           lab('März  ✗', 580, 340, 'nicht', tone='red', size=62, stamp=True)]),
     'ausrede': play(top=470, h=760, tint='red', set=[{'img': 'couch', 'x': 600, 'y': 300, 'h': 460, 'blur': 0, 'op': 1}, {'img': 'window', 'x': 150, 'y': 70, 'h': 220, 'blur': 5, 'op': .5}],
                     actors=[A('m', 'm_shrug', 400, .05, h=430, swap=[{'img': 'm_no', 'at': 'ausziehen'}])],
                     say=[say('m', 'Nächste Woche, versprochen!', 'Ausreden', side='l', end='ausziehen', size=40, dx=-20),
                          say('m', 'Das Geld ist unterwegs!', 'viele', side='r', end='ausziehen', size=40, dx=40, dy=-120),
                          say('m', 'Ich bleib hier!', 'ausziehen', side='r', kind='shout', size=52)]),
     'kosten': play(top=470, h=760, set='court', actors=[A('l', 'lawyer', 190, 'Anwalt', h=340), A('j', 'judge', 480, 'Gericht', h=360), A('v', 'v_facepalm', 770, 'Gerichtsvollzieher', h=340)],
                    fx=[fx('truck', 790, 210, 'Gerichtsvollzieher', h=200), fx('euro', 770, 470, 'teuer', h=130, anim='stream', n=6, gap=.12, to={'x': 1000, 'y': -300}, dur=1.0)],
                    labels=[lab('Anwalt', 190, 40, 'Anwalt', center=True, size=44), lab('Gericht', 480, 40, 'Gericht', center=True, size=44),
                            lab('Räumung', 770, 40, 'Gerichtsvollzieher', center=True, size=44), lab('teuer!', 470, 230, 'teuer', tone='red', center=True, size=80, stamp=True)]),
     'loesung': play(top=470, h=760, tint='yellow', actors=[A('v', 'v_ok', 270, .1, h=480)],
                     fx=[fx('shield', 720, 190, 'Vermieterrechtsschutz', h=250, end='Mietausfallschutz'), fx('euro', 720, 260, 'Mietausfallschutz', h=260, rot=-8),
                         fx('coin', 720, -80, 'Mietausfallschutz', h=110, anim='stream', n=6, gap=.16, to={'x': 720, 'y': 250}, dur=.7, arc=40, spin=60, toScale=.6)],
                     labels=[lab('Anwalt  ✓', 560, 360, 'Anwalt', end='Mietausfallschutz', size=44), lab('Gericht  ✓', 560, 450, 'Gericht', end='Mietausfallschutz', size=44),
                             lab('Räumung  ✓', 560, 540, 'Räumung', end='Mietausfallschutz', size=44),
                             lab('bis zu 12<br>Monatsmieten*', 720, 450, 'zwölf', tone='ink', center=True, size=50, pad='20px 34px')]),
     'achtung': wait(),
     'cta': END}),
}

def yes(img='v_ok', x=270, words=(('Anwalt', 'Anwalt'), ('Gericht', 'Gericht')), shield='Vermieterrechtsschutz', y0=360, extra=None):
    """Lösung auf Gelb: glückliche Figur, Schild, Häkchen-Liste."""
    labels = [lab(f'{t}  ✓', 720, y0 + i * 90, w, size=44, center=True) for i, (t, w) in enumerate(words)]
    if extra: labels.append(extra)
    return play(top=470, h=760, tint='yellow', actors=[A('v', img, x, .1, h=480)], fx=[fx('shield', 720, 190, shield, h=250)], labels=labels)

BOARDSP.update({
 'reel-38-p-bank-wartet-nicht': dict(
   badge=VERMIETER, hookTitle='Die Bank<br><span class="mark">wartet nicht</span>', lightAt='loesung',
   scenes={
     'hook': play(top=560, h=690, set='bank', actors=[A('v', 'v_frown', 290, .1, swap=[{'img': 'v_facepalm', 'at': 'Bank'}]), A('b', 'expert', 720, 'Bank', h=420)],
                  say=[say('b', 'Ihre Rate ist fällig.', 'trotzdem', side='l', size=42)],
                  labels=[lab('Miete  ✗', 40, 40, 'zahlt', tone='red', size=50, stamp=True)]),
     'rate': play(top=470, h=760, set='office', actors=[A('v', 'v_frown', 260, .05, h=450)],
                  fx=[fx('tearoff', 720, 150, .2, h=200), fx('coin', 330, 420, 'Monat', h=100, anim='stream', n=4, gap=.25, to={'x': 1000, 'y': 120}, dur=.9), fx('sweat', 380, 170, 'Egal', h=100, anim='emote')],
                  labels=[lab('Kreditrate: fällig', 520, 330, 'Kreditrate', tone='ink', size=46), lab('Miete: 0 €', 520, 440, 'Miete', tone='red', size=56, stamp=True)]),
     'dauer': play(top=470, h=760, set='court', actors=[A('v', 'v_facepalm', 230, .05, h=380), A('j', 'judge', 780, 'Räumungsurteil', h=400)],
                   fx=[fx('hourglass', 500, 200, .3, h=190)],
                   labels=[lab('Räumungsurteil?', 480, 40, 'Räumungsurteil', center=True, size=44), lab('Monate …', 500, 330, 'Monate', tone='red', center=True, size=52, stamp=True)]),
     'loesung': play(top=470, h=760, tint='yellow', actors=[A('v', 'v_ok', 270, .1, h=480)],
                     fx=[fx('euro', 720, 200, 'Mietausfallschutz', h=240, rot=-8), fx('coin', 720, -80, 'Mietausfallschutz', h=100, anim='stream', n=6, gap=.15, to={'x': 720, 'y': 190}, dur=.7, arc=40, spin=60, toScale=.6)],
                     labels=[lab('bis zu 12<br>Monatsmieten*', 720, 360, 'zwölf', tone='ink', center=True, size=48, pad='20px 34px'),
                             lab('+ Anwalt & Gericht  ✓', 720, 560, 'Anwalt', tone='white', center=True, size=40)]),
     'achtung': wait(),
     'cta': END}),

 'reel-39-p-schimmel-streit': dict(
   badge=VERMIETER, hookTitle='Schimmel –<br><span class="mark">wer ist schuld?</span>', lightAt='loesung',
   scenes={
     'hook': play(top=560, h=690, set='living', actors=[A('m', 'mw_charm', 330, .1, swap=[{'img': 'mw_no', 'at': 'Miete'}])],
                  fx=[fx('microbe', 720, 200, 'Schimmel', h=170), fx('microbe', 850, 330, 'Schimmel', h=110), fx('microbe', 640, 360, 'meldet', h=80)],
                  labels=[lab('Mietminderung!', 690, 470, 'Miete', tone='red', size=52, stamp=True, center=True)]),
     'streit': play(top=470, h=760, set='living', actors=[A('m', 'mw_charm', 240, .05, h=420), A('v', 'v_explain', 760, .25, h=420, flip=True)],
                    fx=[fx('microbe', 500, 150, .1, h=110)],
                    say=[say('m', 'Das Haus ist schuld!', 'Haus', side='r', size=40, end='Du'), say('v', 'Hier wird nicht gelüftet!', 'gelüftet', side='l', size=40)]),
     'gutachter': play(top=470, h=760, set='office', actors=[A('e', 'expert', 250, .05, h=430), A('j', 'judge', 790, 'Gericht', h=380)],
                       fx=[fx('magnifier', 545, 285, 'Gutachter', h=220), fx('microbe', 515, 255, .1, h=90)],
                       labels=[lab('Gutachten', 520, 40, 'Gutachter', center=True, size=44), lab('Gericht', 790, 300, 'Gericht', center=True, size=44)]),
     'loesung': yes(words=(('Anwalt', 'Anwalt'), ('Gericht', 'Gericht'), ('Gerichtl. Gutachter', 'gerichtliche'))),
     'achtung': wait(),
     'cta': END}),

 'reel-40-p-wohnung-verwuestet': dict(
   badge=VERMIETER, hookTitle='Auszug –<br><span class="mark">und dann das</span>', lightAt='loesung',
   scenes={
     'hook': play(top=560, h=690, set='door', actors=[A('v', 'v_explain', 280, .1, swap=[{'img': 'v_frown', 'at': 'das'}]), A('m', 'm_charm', 700, .2, flip=True, out={'type': 'right', 'at': 'Und'})],
                  fx=[fx('key', 490, 430, 'Schlüssel', h=130, rot=20), fx('explode', 420, 150, 'das', h=120, anim='emote')]),
     'schaden': play(top=470, h=760, tint='red', set=[{'img': 'window', 'x': 200, 'y': 60, 'h': 230, 'blur': 5, 'op': .5}, {'img': 'picture', 'x': 760, 'y': 70, 'h': 160, 'blur': 5, 'op': .4}],
                     fx=[fx('hole', 230, 560, 'Löcher', h=230), fx('brick', 520, 590, 'Boden', h=170, rot=-15), fx('trash', 790, 520, 'Müll', h=220), fx('broom', 870, 560, 'überall', h=170, rot=10)],
                     labels=[lab('Löcher', 230, 360, 'Löcher', center=True, size=46), lab('Boden kaputt', 520, 420, 'Boden', center=True, size=46), lab('Müll', 790, 320, 'Müll', center=True, size=46)]),
     'kaution': play(top=470, h=760, set='living', actors=[A('v', 'v_frown', 230, .05, h=420), A('m', 'm_no', 780, 'Ex-Mieter', h=400)],
                     labels=[lab('Beispiel', 360, 30, .1, size=28, pad='10px 18px'), lab('Kaution: 2.400 €', 360, 90, 'Kaution', tone='yellow', size=46), lab('Schaden: 7.500 €', 360, 180, 'reicht', tone='red', size=46, stamp=True, rot=-4)],
                     say=[say('m', 'Zahl ich nicht!', 'zahlen', side='l', kind='shout', size=48, dy=50)]),
     'loesung': yes(words=(('Schadenersatz', 'Schadenersatz'), ('Anwalt', 'Anwalt'), ('Gericht', 'Gericht'))),
     'tipp': play(top=470, h=760, fx=[fx('clipboard', 290, 330, 'Übergabeprotokoll', h=300, rot=-6), fx('camera', 680, 320, 'Fotos', h=240, rot=8)],
                  labels=[lab('Übergabeprotokoll', 480, 50, 'Übergabeprotokoll', tone='ink', center=True, size=50), lab('+ Fotos', 680, 500, 'Fotos', tone='white', center=True, size=46),
                          lab('Vorher absichern', 480, 610, 'bevor', tone='yellow', center=True, size=48)]),
     'cta': END}),

 'reel-41-p-handwerker-kommt-nicht-rein': dict(
   badge=VERMIETER, hookTitle='Der Mieter<br><span class="mark">macht nicht auf</span>', lightAt='loesung',
   scenes={
     'hook': play(top=560, h=690, set='door', actors=[A('h', 'mechanic', 300, 'Handwerker', h=430)],
                  fx=[fx('snowflake', 100, -120, 'Heizung', h=70, anim='rain', n=7, spread=880, range=820, speed=230, front=False), fx('toolbox', 520, 600, 'Handwerker', h=150), fx('locked', 780, 330, 'nicht', h=150, anim='stamp')],
                  say=[say('h', 'Hallo? Jemand da?', 'Tür', side='r', size=42)]),
     'problem': play(top=470, h=760, set='living', actors=[A('v', 'v_frown', 260, .05, h=440)],
                     fx=[fx('snowflake', 100, -120, .05, h=70, anim='rain', n=7, spread=880, range=880, speed=230, front=False), fx('cold', 400, 170, 'Reparatur', h=110, anim='emote')],
                     labels=[lab('Zutritt  ✗', 540, 120, 'Zutritt', tone='red', size=50, stamp=True), lab('Reparatur  ✗', 540, 250, 'Reparatur', tone='red', size=50, stamp=True),
                             lab('Schaden wird größer', 540, 380, 'größer', tone='ink', size=40)]),
     'recht': play(top=470, h=760, set='court', actors=[A('j', 'judge', 780, 'Gericht', h=400)],
                   fx=[fx('balance', 300, 300, 'dulden', h=240)],
                   labels=[lab('Duldungspflicht', 300, 60, 'dulden', tone='yellow', center=True, size=46), lab('§ 555a BGB', 300, 150, 'dulden', tone='white', center=True, size=36)]),
     'loesung': yes(),
     'achtung': wait(),
     'cta': END}),

 'reel-42-p-laerm-im-haus': dict(
   badge=VERMIETER, hookTitle='Party um<br><span class="mark">drei Uhr nachts</span>', lightAt='loesung',
   scenes={
     'hook': play(top=560, h=690, set=[{'img': 'mirrorball', 'x': 480, 'y': -10, 'h': 150, 'blur': 0, 'op': 1}, {'img': 'window', 'x': 160, 'y': 80, 'h': 220, 'blur': 5, 'op': .4}],
                  actors=[A('m', 'm_dance', 480, .1, h=560, typ='pop')],
                  fx=[fx('music', 230, 260, .3, h=130), fx('music', 760, 200, 'nachts', h=110), fx('party', 800, 470, 'Woche', h=150), fx('speaker', 170, 520, .5, h=150)],
                  labels=[lab('03:00 Uhr', 40, 40, 'drei', tone='white', size=44)]),
     'nachbarn': play(top=470, h=760, set='living', actors=[A('a', 'x_frown', 250, .05, h=410), A('b', 'vw_frown', 750, .3, h=410)],
                      fx=[fx('music', 500, 150, .1, h=100), fx('tired', 360, 170, 'beschweren', h=90, anim='emote')],
                      say=[say('a', 'Ich kann nicht schlafen!', 'beschweren', side='r', size=40, end='mindern'), say('b', 'Dann zahl ich weniger Miete!', 'mindern', side='l', kind='shout', size=42)]),
     'weg': play(top=470, h=760, set='office', actors=[A('v', 'v_facepalm', 240, .05, h=420)],
                 fx=[fx('hourglass', 820, 520, 'langer', h=150)],
                 labels=[lab('1  Abmahnung', 470, 90, 'Abmahnung', size=48), lab('2  Kündigung', 470, 210, 'Kündigung', size=48), lab('3  Räumungsklage', 470, 330, 'Räumungsklage', size=48),
                         lab('langer Weg', 600, 490, 'langer', tone='red', center=True, size=56, stamp=True)]),
     'loesung': yes(),
     'achtung': wait(),
     'cta': END}),

 'reel-43-p-wohnung-geerbt': dict(
   badge=VERMIETER, hookTitle='Wohnung geerbt?<br><span class="mark">Mieter inklusive</span>', lightAt='loesung',
   scenes={
     'hook': play(top=560, h=690, set='house', actors=[A('v', 'vw_explain', 290, .1), A('m', 'm_charm', 760, 'Mieter', h=420, flip=True)],
                  fx=[fx('scroll', 140, 130, 'geerbt', h=150, rot=-8), fx('key', 480, 470, 'geerbt', h=120, rot=20)],
                  say=[say('m', 'Hallo, neue Vermieterin!', 'dazu', side='l', size=40)]),
     'vertrag': play(top=470, h=760, set='office', actors=[A('v', 'vw_explain', 230, .05, h=430)],
                     fx=[fx('page', 640, 220, .2, h=250, rot=4)],
                     labels=[lab('Mietvertrag', 660, 40, .2, tone='white', center=True, size=44), lab('läuft weiter  ✓', 680, 400, 'weiter', tone='yellow', center=True, size=48),
                             lab('Rechte & Pflichten', 690, 500, 'Pflichten', tone='ink', center=True, size=44)]),
     'risiko': play(top=470, h=760, tint='red', set='living', actors=[A('v', 'vw_frown', 220, .05, h=420)],
                    fx=[fx('receipt', 500, 130, 'Nebenkosten', h=110), fx('droplet', 500, 290, 'Mängel', h=100), fx('cross', 500, 450, 'Mietrückstand', h=100)],
                    labels=[lab('Nebenkosten', 570, 100, 'Nebenkosten', size=46), lab('Mängel', 570, 260, 'Mängel', size=46), lab('Mietrückstand', 570, 420, 'Mietrückstand', tone='red', size=46)]),
     'loesung': yes(img='vw_ok', words=(('Streit mit Mieter', 'Streit'), ('Anwalt & Gericht', 'abgesichert'))),
     'achtung': wait(first='Gleich abschließen', word1='abschließen'),
     'cta': END}),

 'reel-44-p-zu-spaet': dict(
   badge=VERMIETER, hookTitle='Zwei Vermieter.<br><span class="mark">Gleicher Ärger.</span>', lightAt='loesung',
   scenes={
     'hook': play(top=560, h=690, set='street', actors=[A('t', 'v_frown', 260, .1, h=400, swap=[{'img': 'v_explain', 'at': 'abgesichert'}]), A('x', 'x_frown', 740, .3, h=400)],
                  fx=[fx('shield', 420, 230, 'abgesichert', h=130), fx('cross', 900, 230, 'abgesichert', h=100)],
                  labels=[lab('Tom', 260, 40, .1, center=True, size=44), lab('Max', 740, 40, .3, center=True, size=44)]),
     'tom': play(top=470, h=760, tint='night', set='office', actors=[A('t', 'v_ok', 270, .05, h=450), A('l', 'lawyer', 760, 'Anwalt', h=400)],
                 labels=[lab('Tom', 40, 40, .05, size=40), lab('Anwalt  ✓  zahlt die Versicherung*', 480, 140, 'Versicherung', tone='yellow', center=True, size=38)]),
     'max': play(top=470, h=760, tint='red', set='office', actors=[A('x', 'x_frown', 270, .05, h=450, swap=[{'img': 'x_facepalm', 'at': 'spät'}])],
                 fx=[fx('calendar', 720, 230, 'Streit', h=230)],
                 labels=[lab('Max', 40, 40, .05, size=40), lab('zu spät', 720, 430, 'spät', tone='red', center=True, size=70, stamp=True)]),
     'regel': dict(type='timeline', title='So funktioniert es', steps=[
         {'t': 'Vertrag abschließen', 'word': 'Vertragsbeginn', 'fill': True},
         {'t': 'Wartezeit, meist 3 Monate', 'word': 'Wartezeit'},
         {'t': 'Danach entstandene Fälle: versichert*', 'word': 'Monate', 'fill': True}]),
     'loesung': yes(extra=lab('Sei wie Tom', 720, 560, 'Tom', tone='ink', center=True, size=46), words=(('Anwalt', 'Anwalt'), ('Gericht', 'Gericht'))),
     'cta': END}),

 'reel-45-p-nachzahlung': dict(
   badge=VERMIETER, hookTitle='Nachzahlung?<br><span class="mark">Zahl ich nicht!</span>', lightAt='loesung',
   scenes={
     'hook': play(top=560, h=690, set='living', fx=[fx('receipt', 480, 260, .2, h=300, rot=-4)],
                  labels=[lab('Nebenkostenabrechnung', 480, 40, .2, center=True, size=42), dict(text='Nachzahlung: 800 €', x=250, y=470, at='Nachzahlung', tone='red', size=56, stamp=True)]),
     'mieter': play(top=470, h=760, set='living', actors=[A('m', 'mw_no', 480, .05, h=460)],
                    fx=[fx('receipt', 830, 200, .1, h=150, rot=12)],
                    say=[say('m', 'Zahl ich nicht!', 'Zahl', side='r', kind='shout', size=48, end='Abrechnung'), say('m', 'Die Abrechnung ist falsch!', 'Abrechnung', side='l', size=42)]),
     'streit': play(top=470, h=760, set='court', actors=[A('v', 'v_frown', 210, .05, h=380), A('j', 'judge', 820, 'Gericht', h=360)],
                    fx=[fx('receipt', 500, 270, .1, h=240), fx('magnifier', 560, 260, 'geprüft', h=170)],
                    labels=[lab('Position für Position', 500, 40, 'Position', center=True, size=40)]),
     'tipp': play(top=470, h=760, set='office', actors=[A('m', 'mw_charm', 760, 'Mieterin', h=420, flip=True)],
                  fx=[fx('clipboard', 210, 300, 'Belege', h=260, rot=-6)],
                  labels=[lab('Alle Belege aufheben', 270, 560, 'Belege', tone='yellow', center=True, size=44)],
                  say=[say('m', 'Darf ich mal sehen?', 'einsehen', side='l', size=40)]),
     'loesung': yes(words=(('Anwalt', 'Anwalt'), ('Gericht', 'Gericht')), extra=lab('meist 3 Monate<br>Wartezeit', 720, 560, 'Wartezeit', tone='ink', center=True, size=38, pad='16px 28px')),
     'cta': END}),

 'reel-46-p-ein-tag-als-vermieter': dict(
   badge=VERMIETER, hookTitle='Ein Tag als<br><span class="mark">Vermieter</span>', lightAt='loesung',
   scenes={
     'hook': play(top=560, h=690, set='house', actors=[A('v', 'v_explain', 400, .1, h=460)], fx=[fx('sparkles', 680, 200, 'normaler', h=140)]),
     'morgens': play(top=470, h=760, set='living', actors=[A('v', 'v_frown', 240, .05, h=420), A('m', 'mw_charm', 760, .2, h=420, flip=True)],
                     fx=[fx('clock8', 120, 110, .05, h=130)],
                     labels=[lab('08:00', 190, 80, .05, size=44), lab('Mietminderung?', 480, 330, 'Mietminderung', tone='red', center=True, size=52, stamp=True)],
                     say=[say('m', 'Das Fenster klemmt!', 'Mangel', side='l', size=40, end='droht')]),
     'mittags': play(top=470, h=760, set='office', actors=[A('v', 'v_facepalm', 260, .05, h=440)],
                     fx=[fx('clock12', 120, 110, .05, h=130), fx('phone', 680, 280, .2, h=230, rot=8)],
                     labels=[lab('12:00', 190, 80, .05, size=44), lab('Wohnung 3: Miete  ✗', 680, 470, 'nicht', tone='red', center=True, size=44, stamp=True)]),
     'abends': play(top=470, h=760, tint='red', set='living', actors=[A('v', 'v_facepalm', 240, .05, h=420), A('n', 'x_frown', 760, .2, h=420, flip=True)],
                    fx=[fx('clock8', 120, 110, .05, h=130), fx('speaker', 610, 200, 'Lärm', h=130), fx('explode', 420, 240, 'Lärm', h=110, anim='emote')],
                    labels=[lab('20:00', 190, 80, .05, size=44)],
                    say=[say('n', 'Viel zu laut hier!', 'Beschwerde', side='l', kind='shout', size=44)]),
     'loesung': yes(),
     'achtung': wait(),
     'cta': END}),
})
