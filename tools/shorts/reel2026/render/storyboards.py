# Drehbuch je Reel: Kopfzeile, Hook-Titel, ab welchem Satz es hell wird, Grafik pro Satz
VERMIETER, FIRMA = 'Vermieter-Wissen', 'Firmen-Wissen'
END = {'type': 'endcard'}

def checklist(title, items, note='je nach Tarif', note_word='Tarif', **kw):
    return dict(type='checklist', title=title, items=[{'label': l, 'word': w} for l, w in items], note=note, noteWord=note_word, **kw)

BOARDS = {
 'reel-01-mieter-zahlt-nicht': dict(
   badge=VERMIETER, hookTitle='Mieter zahlt<br><span class="mark">nicht mehr?</span>', lightAt='loesung',
   scenes={
     'hook': dict(type='phone', name='Mieter · Whg. 2', initials='MK', sub='zuletzt online 21:46',
                  msgs=['Hey, wegen der Miete… diesen Monat wird das leider nichts. Sorry!'], msgWord='das'),
     'nichts': dict(type='months', months=['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni'], label='Miete eingegangen?', mode='x', top=650),
     'kosten': dict(type='counter', label='Fehlende Miete nach 6 Monaten', to=5700, prefix='– ', formula='950 € × 6 Monate', endWord='5.700', dur=1.5, round=50),
     'dazu': dict(type='stack', items=[{'title': 'Anwalt', 'word': 'Anwalt'}, {'title': 'Gericht', 'word': 'Gericht'}, {'title': 'Räumung', 'word': 'Räumung'}]),
     'loesung': checklist('Vermieter-<br>rechtsschutz', [('Anwalt', 'Anwalt'), ('Gericht', 'Gericht'), ('Räumung', 'Räumung')]),
     'miete': dict(type='months', months=[str(i) for i in range(1, 13)], label='Bis zu 12 Monatsmieten ersetzt · je nach Tarif', sub='Miete ersetzt', mode='fill', cols=4, cw=205, ch=165, gap=22, top=640),
     'achtung': dict(type='timeline', title='Achtung', steps=[
         {'t': 'Vorher abschließen', 'sub': 'bevor der Ärger losgeht', 'word': 'Abschließen', 'fill': True},
         {'t': '3 Monate Wartezeit', 'word': 'Wartezeit'},
         {'t': 'Danach greift der Schutz', 'sub': 'je nach Tarif', 'word': 'Monaten', 'fill': True}]),
     'cta': END}),
 'reel-02-der-brief': dict(
   badge=VERMIETER, hookTitle='Dieser Brief<br><span class="mark">kostet dich Geld</span>', lightAt='loesung',
   scenes={
     'hook': dict(type='letter', from_='M. Krüger · Musterstraße 12, Whg. 3', subject='Mietminderung', top=470, h=760,
                  lines=['Sehr geehrte Damen und Herren,', 'wegen Mängeln in der Wohnung', 'mindere ich die Miete ab sofort', 'um 30 Prozent.', '', 'Mit freundlichen Grüßen'],
                  highlight='um 30 Prozent.', hlWord='Briefkasten'),
     'brief': dict(type='counter', label='Dein Mieter kürzt die Miete', to=30, prefix='– ', fmt='pct', endWord='30', dur=1.0, size=260, top=650),
     'kosten': dict(type='stack', items=[{'title': 'Gutachter', 'word': 'Gutachter'}, {'title': 'Anwalt', 'word': 'Anwalt'}, {'title': 'Gericht', 'word': 'Gericht'}]),
     'loesung': checklist('Vermieter-<br>rechtsschutz', [('Anwalt', 'Anwalt'), ('Gericht', 'Gericht'), ('Gutachter', 'Gutachter'), ('Keine Vorkasse', 'Vorkasse')], top=380),
     'achtung': dict(type='timeline', title='Achtung', steps=[
         {'t': 'Streit läuft schon?', 'sub': 'Dann ist es zu spät', 'c': 'red', 'fill': True, 'word': 'Streit'},
         {'t': 'Meist 3 Monate Wartezeit', 'word': 'Wartezeit'},
         {'t': 'Also: vorher absichern', 'fill': True, 'word': 'Monaten'}]),
     'cta': END}),
 'reel-03-mit-oder-ohne': dict(
   badge=VERMIETER, hookTitle='Mit oder<br><span class="mark">ohne?</span>', lightAt='loesung',
   scenes={
     'hook': dict(type='statement', icon='house', top=520, lines=[
         {'t': 'Gleicher Ärger.', 'word': 'Gleicher'}, {'t': 'Zwei Vermieter.', 'word': 'zwei', 'c': 'yellow'},
         {'t': 'Mieter zahlt nicht', 'word': 'zahlt', 'size': 62, 'c': 'mute', 's': 92, 'w': 750},
         {'t': 'und zieht nicht aus.', 'word': 'zieht', 'size': 62, 'c': 'mute', 's': 92, 'w': 750}]),
     'ohne': dict(type='split', left={'title': 'Ohne', 'to': 6000, 'prefix': '– ', 'word': 'zahlt', 'sub': 'Anwalt, Gericht, Räumung selbst bezahlt'},
                  right={'title': 'Mit', 'text': 'Zahlt die Versicherung', 'size': 62, 'hidden': True, 'placeholder': '?', 'sub': 'je nach Tarif'}),
     'mit': dict(type='split', enter=False, leftDone=True, left={'title': 'Ohne', 'to': 6000, 'prefix': '– ', 'sub': 'Anwalt, Gericht, Räumung selbst bezahlt'},
                 right={'title': 'Mit', 'text': 'Zahlt die Versicherung', 'size': 62, 'word': 'Versicherung', 'sub': 'je nach Tarif', 'good': True}),
     'loesung': checklist('Vermieter-<br>rechtsschutz', [('Anwalt', 'Anwalt'), ('Gericht', 'Gericht'), ('Kosten der Räumung', 'Räumung')]),
     'achtung': dict(type='timeline', title='Wichtig', steps=[
         {'t': 'Vorher abschließen', 'word': 'vorher', 'fill': True},
         {'t': 'Meist 3 Monate Wartezeit', 'word': 'Wartezeit'},
         {'t': 'Erst dann greift der Schutz', 'word': 'Monaten', 'fill': True}]),
     'cta': END}),
 'reel-04-zieht-nicht-aus': dict(
   badge=VERMIETER, hookTitle='Mieter zieht<br><span class="mark">nicht aus?</span>', lightAt='loesung',
   scenes={
     'hook': dict(type='statement', icon='house', top=560, lines=[
         {'t': 'Gekündigt.', 'word': 'gekündigt'}, {'t': 'Und bleibt einfach.', 'word': 'zieht', 'c': 'red'}]),
     'zaeh': dict(type='stack', items=[{'title': 'Räumungsklage', 'word': 'Räumungsklage', 'stamp': 'dauert'},
                                       {'title': 'Gerichtsvollzieher', 'word': 'Gerichtsvollzieher', 'stamp': 'dauert'},
                                       {'title': 'Monate warten', 'word': 'Monate', 'stamp': 'dauert'}]),
     'kosten': dict(type='counter', label='Fehlende Miete nach 8 Monaten', to=8800, prefix='– ', formula='1.100 € × 8 Monate', endWord='8.800', dur=1.5, round=50,
                    extra={'text': '+ Anwalt, Gericht, Räumung', 'word': 'Plus'}, top=600),
     'loesung': checklist('Rechtsschutz<br>+ Mietausfall', [('Räumungsverfahren', 'Räumungsverfahren'), ('Bis zu 12 Monatsmieten', 'zwölf')]),
     'achtung': dict(type='timeline', title='Wichtig', steps=[
         {'t': 'Abschließen, bevor es kracht', 'word': 'Abschließen', 'fill': True},
         {'t': '3 Monate Wartezeit', 'word': 'Wartezeit'}]),
     'cta': END}),
 'reel-05-firma-soforthilfe': dict(
   badge=FIRMA, hookTitle='Zu spät für<br><span class="mark">Rechtsschutz?</span>', lightAt='loesung',
   scenes={
     'hook': dict(type='phone', name='Kunde · Müller GmbH', initials='MG', sub='E-Mail',
                  msgs=['Ihre Rechnung zahlen wir nicht. Die Leistung war mangelhaft.'], msgWord='Streit'),
     'fakt': dict(type='statement', top=540, lines=[
         {'t': 'Normalerweise:', 'word': 'Normalerweise', 'c': 'mute', 'size': 62, 's': 92, 'w': 750},
         {'t': 'Laufender Streit', 'word': 'Streit'}, {'t': '= nicht versicherbar', 'word': 'versichern', 'c': 'red'}]),
     'loesung': dict(type='rewind', calLabel='Firmenrechtsschutz mit Soforthilfe', calDate='Der Fall liegt schon zurück', badge='Hilfe bis 3.000 €',
                     badgeWord='3.000', sub='außergerichtlich · je nach Tarif'),
     'achtung': dict(type='timeline', title='Wichtig', steps=[
         {'t': 'Noch kein Anwalt eingeschaltet', 'word': 'Anwalt', 'fill': True},
         {'t': 'Sonst keine Soforthilfe', 'word': 'eingeschaltet', 'c': 'red'}]),
     'cta': END}),
 'reel-06-mitarbeiter-klagt': dict(
   badge=FIRMA, hookTitle='Mitarbeiter<br><span class="mark">verklagt dich?</span>', lightAt='loesung',
   scenes={
     'hook': dict(type='letter', from_='Arbeitsgericht · Az. 3 Ca 128/26', subject='Klage', top=470, h=740,
                  lines=['In dem Rechtsstreit', 'Mitarbeiter gegen deinen Betrieb', 'wird beantragt festzustellen,', 'dass die Kündigung unwirksam ist.'],
                  highlight='dass die Kündigung unwirksam ist.', hlWord='verklagt'),
     'fakt': dict(type='statement', icon='scale', top=470, lines=[
         {'t': 'Arbeitsrecht, 1. Instanz:', 'word': 'Arbeitsrecht', 'c': 'mute', 'size': 58, 's': 92, 'w': 750},
         {'t': 'Du zahlst deinen Anwalt selbst.', 'word': 'Anwalt', 'size': 80},
         {'t': 'Auch wenn du gewinnst.', 'word': 'gewinnst', 'c': 'red', 'size': 80}]),
     'faelle': dict(type='chips', title='Typische Fälle', items=[{'label': 'Kündigungsschutzklage', 'word': 'Kündigungsschutzklage'},
         {'label': 'Arbeitszeugnis', 'word': 'Arbeitszeugnis'}, {'label': 'Lohn', 'word': 'Lohn'}, {'label': 'Überstunden', 'word': 'Überstunden'}]),
     'loesung': dict(type='blocks', block='Arbeitgeber-<br>Baustein', base='Firmenrechtsschutz', word='Arbeitgeber', note='je nach Tarif abgesichert', noteWord='Tarif'),
     'achtung': dict(type='timeline', title='Aber', steps=[
         {'t': 'Abschließen, bevor der Streit losgeht', 'word': 'Abschließen', 'fill': True},
         {'t': 'Meist 3 Monate Wartezeit', 'word': 'Wartezeit'}]),
     'cta': END}),
}
