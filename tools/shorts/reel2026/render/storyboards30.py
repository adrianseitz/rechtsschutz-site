# Drehbücher für die 30 Lern-Reels (reel-07 … reel-36)
V, F = 'Vermieter-Wissen', 'Firmen-Wissen'
END = {'type': 'endcard'}
def ck(title, items, note='je nach Tarif', **kw): return dict(type='checklist', title=title, items=[{'label': l, 'word': w} for l, w in items], note=note, noteWord='Tarif', **kw)
VR = lambda items=(('Anwalt', 'Anwalt'), ('Gericht', 'Gericht')), **kw: ck('Vermieter-<br>rechtsschutz', items, **kw)
AG = lambda items=(('Anwalt', 'Anwalt'), ('Gericht', 'Gericht')), **kw: ck('Arbeitgeber-<br>Baustein', items, **kw)
def st(*lines, icon=None, top=None):
    d = dict(type='statement', lines=[l if isinstance(l, dict) else {'t': l} for l in lines])
    if icon: d['icon'] = icon
    if top: d['top'] = top
    return d
def L(t, word=None, c=None, size=None, mute=False):
    d = {'t': t}
    if word: d['word'] = word
    if c: d['c'] = c
    if size: d['size'] = size
    if mute: d.update(c='mute', size=size or 60, s=92, w=750)
    return d
def chips(title, items, top=None):
    d = dict(type='chips', title=title, items=[{'label': l, 'word': w} for l, w in items])
    if top: d['top'] = top
    return d
def num(title, items, show=None, cont=False, timed=False):
    d = dict(type='numbered', title=title, items=[{'t': t, 'sub': s, 'word': w} for t, s, w in items], timed=timed)
    if show is not None: d['show'] = show
    if cont: d['cont'] = True
    return d
def ring(value, unit, label, word, sub='', color='yellow', size=None):
    d = dict(type='ring', value=value, unit=unit, label=label, word=word, sub=sub, color=color)
    if size: d['size'] = size
    return d
def tl(title, steps): return dict(type='timeline', title=title, steps=[dict(s) for s in steps])
def letter(frm, subject, lines, hl=None, hlWord=None, stamp=None, stampWord=None, h=760):
    d = dict(type='letter', from_=frm, subject=subject, lines=lines, top=470, h=h)
    if hl: d.update(highlight=hl, hlWord=hlWord)
    if stamp: d.update(stamp=stamp, stampWord=stampWord)
    return d
def myth(m, f, fw): return dict(type='myth', myth=m, fact=f, factWord=fw)
WAIT = lambda first, firstWord, last='Danach greift der Schutz', lastWord='Monaten': tl('Wichtig', [
    {'t': first, 'word': firstWord, 'fill': True}, {'t': 'Meist 3 Monate Wartezeit', 'word': 'Wartezeit'}, {'t': last, 'word': lastWord, 'fill': True}])
def blocks(block, word='Arbeitgeber', note='je nach Tarif', base='Firmenrechtsschutz'): return dict(type='blocks', block=block, base=base, word=word, note=note, noteWord='Tarif')
def phone(name, ini, msg, word, sub='online'): return dict(type='phone', name=name, initials=ini, sub=sub, msgs=[msg], msgWord=word)

BOARDS30 = {
 'reel-07-v-privatschutz-reicht-nicht': dict(badge=V, hookTitle='Rechtsschutz<br><span class="mark">+ Mietwohnung?</span>', lightAt='loesung', scenes={
   'hook': st(L('Rechtsschutz: ja.', 'Rechtsschutz'), L('Vermietest du?', 'vermietest', 'yellow'), icon='house', top=560),
   'fakt': myth('Mein Privat-Rechtsschutz deckt auch Streit mit Mietern.', 'In der Regel nicht.', 'nicht'),
   'loesung': ck('Vermieter-<br>Baustein', [('Streit mit Mietern', 'Vermieter'), ('Jede Wohnung im Vertrag', 'Wohnung')]),
   'tipp': st(L('Neue Wohnung gekauft?', 'Wohnung'), L('Gleich nachmelden.', 'nachmelden'), L('Sonst ist sie nicht geschützt.', 'sonst', 'red', 62), icon='house'),
   'cta': END}),
 'reel-08-v-kaution-zurueck': dict(badge=V, hookTitle='Mieter will die<br><span class="mark">Kaution zurück</span>', lightAt='loesung', scenes={
   'hook': phone('Mieter · Whg. 1', 'TL', 'Ich ziehe Ende des Monats aus. Bitte überweisen Sie mir die volle Kaution zurück.', 'volle'),
   'streit': chips('Streit beim Auszug', [('Schäden', 'Schäden'), ('Offene Nebenkosten', 'Nebenkosten'), ('Schönheitsreparaturen', 'Schönheitsreparaturen')]),
   'frist': ring('6', 'Monate', 'Dann verjähren deine Ansprüche', 'sechs', 'ab Rückgabe der Wohnung', 'red'),
   'loesung': VR(), 'cta': END}),
 'reel-09-v-3-fakten': dict(badge=V, hookTitle='3 Fakten für<br><span class="mark">Vermieter</span>', lightAt='drei', scenes={
   'hook': st(L('Kennst du', 'Drei'), L('alle drei?', 'Fakten', 'yellow'), icon='house', top=560),
   'eins': num('3 Fakten', [('Privat-Rechtsschutz deckt die Vermietung meist nicht', '', None), ('Jede Wohnung einzeln im Vertrag', '', None), ('Beiträge meist als Werbungskosten absetzbar', 'Details klärt deine Steuerberatung', None)], show=0),
   'zwei': num('3 Fakten', [('Privat-Rechtsschutz deckt die Vermietung meist nicht', '', None), ('Jede Wohnung einzeln im Vertrag', '', None), ('Beiträge meist als Werbungskosten absetzbar', 'Details klärt deine Steuerberatung', None)], show=1, cont=True),
   'drei': num('3 Fakten', [('Privat-Rechtsschutz deckt die Vermietung meist nicht', '', None), ('Jede Wohnung einzeln im Vertrag', '', None), ('Beiträge meist als Werbungskosten absetzbar', 'Details klärt deine Steuerberatung', None)], show=2, cont=True),
   'cta': END}),
 'reel-10-v-eigenbedarf': dict(badge=V, hookTitle='Eigenbedarf?<br><span class="mark">Oft Streit.</span>', lightAt='loesung', scenes={
   'hook': st(L('Die Wohnung', 'Wohnung'), L('für dich selbst?', 'selbst', 'yellow'), icon='house', top=560),
   'fakt': letter('Vermieter · Musterstraße 12', 'Kündigung wegen Eigenbedarf', ['Sehr geehrte Frau Weber,', 'hiermit kündige ich das', 'Mietverhältnis wegen Eigenbedarf.', '', 'Mit freundlichen Grüßen'], stamp='Widerspruch', stampWord='wehren'),
   'streit': chips('Streitpunkte', [('Ist der Eigenbedarf echt?', 'echt'), ('Härtefall beim Mieter?', 'Härtefall'), ('Frist und Form', 'Frist')]),
   'loesung': VR((('Anwalt', 'Anwalt'), ('Gericht', 'Gericht'), ('Räumung', 'Räumung'))),
   'achtung': WAIT('Vorher abschließen', 'bevor', 'Dann kündigen'), 'cta': END}),
 'reel-11-v-nebenkosten-frist': dict(badge=V, hookTitle='Nebenkosten-<br><span class="mark">abrechnung</span>', lightAt='streit', scenes={
   'hook': ring('12', 'Monate', 'So lange hast du Zeit', 'zwölf'),
   'frist': tl('Die Frist', [{'t': 'Abrechnungszeitraum endet', 'word': 'Ende'}, {'t': '12 Monate Zeit', 'word': 'zwölf'}, {'t': 'Abrechnung beim Mieter', 'word': 'Mieter', 'fill': True}]),
   'folge': st(L('Zu spät?', 'spät'), L('Nachforderung weg.', 'weg', 'red'), top=600),
   'streit': VR(), 'cta': END}),
 'reel-12-v-mieterhoehung-klage': dict(badge=V, hookTitle='Mieter sagt<br><span class="mark">Nein</span>', lightAt='loesung', scenes={
   'hook': letter('Mieter · Whg. 4', 'Ihre Mieterhöhung', ['Sehr geehrte Damen und Herren,', 'der Mieterhöhung vom 1. März', 'stimme ich nicht zu.', '', 'Mit freundlichen Grüßen'], hl='stimme ich nicht zu.', hlWord='nicht'),
   'frist': ring('3', 'Monate', 'Zeit für die Zustimmungsklage', 'drei', 'nach Ende seiner Überlegungsfrist', 'red'),
   'streit': chips('Streitpunkte', [('Mietspiegel', 'Mietspiegel'), ('Kappungsgrenze', 'Kappungsgrenze'), ('Form und Begründung', 'Form')]),
   'loesung': VR(), 'achtung': WAIT('Erst absichern', 'absichern', 'Dann erhöhen'), 'cta': END}),
 'reel-13-v-zahlungsverzug': dict(badge=V, hookTitle='Miete kommt<br><span class="mark">zu spät?</span>', lightAt='loesung', scenes={
   'hook': dict(type='months', months=['März', 'April', 'Mai'], label='Miete pünktlich?', sub='zu spät', mode='x', cols=3, top=650),
   'regel': ring('2', 'Monatsmieten', 'Rückstand für die fristlose Kündigung', 'zwei', 'in der Regel', 'red', 170),
   'tipp': num('Darauf kommt es an', [('Rückstand genau berechnen', '', 'Rückstand'), ('Schriftlich kündigen', '', 'schriftlich'), ('Zugang nachweisen', '', 'Zugang')], timed=True),
   'loesung': ck('Rechtsschutz<br>+ Mietausfall', [('Anwalt', 'Anwalt'), ('Gericht', 'Gericht'), ('Räumung', 'Räumung'), ('Miete ersetzt', 'Miete')], top=420),
   'cta': END}),
 'reel-14-v-kaution-hoehe': dict(badge=V, hookTitle='Wie hoch darf die<br><span class="mark">Kaution sein?</span>', lightAt='loesung', scenes={
   'hook': st(L('Drei Monatsmieten?', 'hoch'), L('Fünf? Oder mehr?', 'Kaution', 'yellow'), icon='euro', top=560),
   'regel': ring('3', 'Monatsmieten', 'Höchstens', 'drei', 'ohne Nebenkosten', 'yellow', 170),
   'raten': dict(type='months', months=['Rate 1', 'Rate 2', 'Rate 3'], label='Der Mieter darf in Raten zahlen', sub='Kaution', mode='fill', cols=3, top=650),
   'anlage': st(L('Getrennt anlegen.', 'getrennt'), L('Nicht mit deinem eigenen Vermögen vermischen.', 'Vermögen', mute=True, size=58), icon='euro'),
   'loesung': VR((('Streit um die Kaution', 'Kaution'),)), 'cta': END}),
 'reel-15-v-kappungsgrenze': dict(badge=V, hookTitle='Miete erhöhen?<br><span class="mark">Die Grenze.</span>', lightAt='loesung', scenes={
   'hook': st(L('Mehr Miete verlangen?', 'Miete'), L('Nicht unbegrenzt.', 'Grenze', 'red'), icon='house', top=560),
   'regel': dict(type='bars', title='Max. Erhöhung in 3 Jahren', items=[{'label': 'In der Regel', 'value': 20, 'display': '20 %', 'word': '20'}, {'label': 'Knapper Wohnraum', 'value': 15, 'display': '15 %', 'hidden': True}], max=20),
   'angespannt': dict(type='bars', cont=True, title='Max. Erhöhung in 3 Jahren', items=[{'label': 'In der Regel', 'value': 20, 'display': '20 %', 'done': True}, {'label': 'Knapper Wohnraum', 'value': 15, 'display': '15 %', 'word': '15'}], max=20),
   'vergleich': st(L('Und nie über die', 'nie'), L('ortsübliche Vergleichsmiete.', 'Vergleichsmiete', 'yellow')),
   'loesung': VR(), 'cta': END}),
 'reel-16-v-modernisierung': dict(badge=V, hookTitle='Modernisiert?<br><span class="mark">Das darfst du.</span>', lightAt='loesung', scenes={
   'hook': st(L('Neue Heizung, neue Fenster?', 'modernisierst', size=74), L('Ein Teil darf auf die Miete.', 'umlegen', 'yellow', 74), icon='house', top=560),
   'regel': ring('8 %', 'pro Jahr', 'Umlage der Kosten auf die Jahresmiete', '8', 'in der Regel', 'yellow', 150),
   'beispiel': dict(type='counter', label='Beispiel: 10.000 € Kosten', to=800, unit=' / Jahr', formula='10.000 € × 8 %', endWord='800', dur=1.2, color='yellow', size=170, extra={'text': '≈ 67 € im Monat', 'word': '67', 'tone': 'neutral'}),
   'grenze': chips('Achte auf', [('Kappungsgrenze', 'Kappungsgrenze'), ('Korrekte Ankündigung', 'Ankündigung')]),
   'loesung': VR(), 'cta': END}),
 'reel-17-v-schoenheitsreparaturen': dict(badge=V, hookTitle='Muss er<br><span class="mark">streichen?</span>', lightAt='tipp', scenes={
   'hook': st(L('Auszug.', 'Auszug'), L('Muss der Mieter streichen?', 'streichen', 'yellow', 76), icon='house', top=560),
   'fakt': myth('Der Mieter muss immer renovieren.', 'Viele Klauseln sind unwirksam.', 'unwirksam'),
   'beispiele': letter('Mietvertrag · Auszug', '§ 8 Schönheitsreparaturen', ['Der Mieter renoviert', 'Küche und Bad alle 3 Jahre,', 'Wohnräume alle 5 Jahre.'], hl='Küche und Bad alle 3 Jahre,', hlWord='starre', stamp='Unwirksam', stampWord='Fristen', h=700),
   'tipp': st(L('Vertrag prüfen lassen,', 'Mietvertrag'), L('bevor du von der Kaution', 'Kaution', size=70), L('etwas einbehältst.', 'einbehältst', size=70), icon='lens'),
   'loesung': VR((('Streit beim Auszug', 'Streit'),)), 'cta': END}),
 'reel-18-v-untervermietung': dict(badge=V, hookTitle='Mieter vermietet<br><span class="mark">einfach unter?</span>', lightAt='loesung', scenes={
   'hook': st(L('Neue Gesichter', 'Mieter'), L('in deiner Wohnung?', 'unter', 'yellow'), icon='house', top=560),
   'regel': dict(type='versus', a={'kicker': 'Die Regel', 'title': 'Erlaubnis nötig', 'text': 'Ohne Erlaubnis: Vertragsverstoß', 'icon': 'doc', 'word': 'Erlaubnis'}),
   'aber': dict(type='versus', cont=True, a={'kicker': 'Die Regel', 'title': 'Erlaubnis nötig', 'text': 'Ohne Erlaubnis: Vertragsverstoß', 'icon': 'doc', 'done': True},
                b={'kicker': 'Aber', 'title': 'Berechtigtes Interesse', 'text': 'Für einen Teil der Wohnung meist zu erlauben', 'icon': 'person', 'tone': 'yellow', 'word': 'berechtigtes'}),
   'folge': tl('Unerlaubt?', [{'t': 'Abmahnung', 'word': 'Abmahnung'}, {'t': 'Im Ernstfall Kündigung', 'word': 'Kündigung', 'c': 'red', 'fill': True}]),
   'loesung': VR(), 'cta': END}),
 'reel-19-v-uebergabeprotokoll': dict(badge=V, hookTitle='Dieses Papier<br><span class="mark">spart Ärger</span>', lightAt='loesung', scenes={
   'hook': st(L('Einzug. Auszug.', 'Blatt'), L('Immer mit Protokoll.', 'Ärger', 'yellow'), icon='doc', top=560),
   'was': dict(type='form', title='Übergabeprotokoll', rows=[{'label': 'Zählerstände', 'value': '4.812 kWh'}, {'label': 'Schlüssel', 'value': '3 Stück'}, {'label': 'Schäden + Fotos', 'value': 'Kratzer Flur'}], ticks=False, sign='M. Weber'),
   'inhalt': dict(type='form', cont=True, title='Übergabeprotokoll', rows=[{'label': 'Zählerstände', 'value': '4.812 kWh', 'word': 'Zählerstände'}, {'label': 'Schlüssel', 'value': '3 Stück', 'word': 'Schlüssel'}, {'label': 'Schäden + Fotos', 'value': 'Kratzer Flur', 'word': 'Schäden'}], sign='M. Weber', signWord='unterschreiben'),
   'warum': st(L('Ohne Beweis', 'Beweis'), L('wird es schwer.', 'schwer', 'red'), top=600),
   'loesung': VR(), 'cta': END}),
 'reel-20-v-mieterauswahl': dict(badge=V, hookTitle='Den richtigen<br><span class="mark">Mieter finden</span>', lightAt='loesung', scenes={
   'hook': st(L('Schutz vor Mietausfall', 'Schutz'), L('beginnt vor dem Vertrag.', 'Vertrag', 'yellow', 74), icon='house', top=560),
   'eins': num('3 Unterlagen', [('Einkommensnachweis', 'aktuell', None), ('Bonitätsauskunft', 'z. B. Schufa', None), ('Mietschuldenfreiheits&shy;bescheinigung', 'vom Vormieter', None)], show=0),
   'zwei': num('3 Unterlagen', [('Einkommensnachweis', 'aktuell', None), ('Bonitätsauskunft', 'z. B. Schufa', None), ('Mietschuldenfreiheits&shy;bescheinigung', 'vom Vormieter', None)], show=1, cont=True),
   'drei': num('3 Unterlagen', [('Einkommensnachweis', 'aktuell', None), ('Bonitätsauskunft', 'z. B. Schufa', None), ('Mietschuldenfreiheits&shy;bescheinigung', 'vom Vormieter', None)], show=2, cont=True),
   'loesung': ck('Falls doch<br>etwas passiert', [('Vermieterrechtsschutz', 'Vermieterrechtsschutz'), ('Mietausfallschutz', 'Mietausfallschutz')]), 'cta': END}),
 'reel-21-v-zahlt-nicht-alles': dict(badge=V, hookTitle='Rechtsschutz<br><span class="mark">zahlt alles?</span>', lightAt='tipp', scenes={
   'hook': myth('Rechtsschutz zahlt alles.', 'Leider nein.', 'Leider'),
   'eins': num('Darauf achten', [('Wartezeit', 'meist 3 Monate', None), ('Selbstbeteiligung', 'je nach Tarif', None), ('Ausschlüsse', 'z. B. Kauf oder Bau der Immobilie', None)], show=0),
   'zwei': num('Darauf achten', [('Wartezeit', 'meist 3 Monate', None), ('Selbstbeteiligung', 'je nach Tarif', None), ('Ausschlüsse', 'z. B. Kauf oder Bau der Immobilie', None)], show=1, cont=True),
   'drei': num('Darauf achten', [('Wartezeit', 'meist 3 Monate', None), ('Selbstbeteiligung', 'je nach Tarif', None), ('Ausschlüsse', 'z. B. Kauf oder Bau der Immobilie', None)], show=2, cont=True),
   'tipp': st(L('Vorher klären,', 'vorher'), L('was dein Tarif abdeckt.', 'Tarif'), icon='lens'), 'cta': END}),
 # ---------------- Firma ----------------
 'reel-22-f-privatschutz-zaehlt-nicht': dict(badge=F, hookTitle='Selbstständig?<br><span class="mark">Aufgepasst.</span>', lightAt='loesung', scenes={
   'hook': myth('Mein Privat-Rechtsschutz gilt auch für die Firma.', 'In der Regel nicht.', 'nicht'),
   'aerger': chips('Typischer Ärger im Betrieb', [('Streit mit Mitarbeitern', 'Mitarbeitern'), ('Bußgeldverfahren', 'Bußgeldverfahren'), ('Steuerstreit vor Gericht', 'Steuerstreit')]),
   'loesung': ck('Firmen-<br>rechtsschutz', [('Passend zur Branche', 'Branche'), ('Passend zur Größe', 'Größe'), ('Bausteine nach Bedarf', 'Bausteinen')]), 'cta': END}),
 'reel-23-f-finanzamt': dict(badge=F, hookTitle='Streit mit dem<br><span class="mark">Finanzamt?</span>', lightAt='loesung', scenes={
   'hook': letter('Finanzamt · Steuernummer 12/345/67890', 'Steuerbescheid', ['Festgesetzt wird:', 'Einkommensteuer 14.820,00 €', '', 'Nachzahlung fällig in 4 Wochen.'], hl='Nachzahlung fällig in 4 Wochen.', hlWord='Finanzamt', h=700),
   'fakt': tl('Wann greift der Schutz?', [{'t': 'Einspruch', 'sub': 'meist nicht versichert', 'c': 'red', 'word': 'Einspruch'}, {'t': 'Klage vor dem Finanzgericht', 'sub': 'hier greift Steuer-Rechtsschutz', 'fill': True, 'word': 'Finanzgericht'}]),
   'faelle': chips('Typische Fälle', [('Zu hoher Steuerbescheid', 'Steuerbescheid'), ('Betriebsausgaben', 'Betriebsausgaben'), ('Betriebsprüfung', 'Betriebsprüfung')]),
   'loesung': blocks('Steuer-<br>Rechtsschutz', 'Steuer', 'vor Gericht · je nach Tarif'), 'cta': END}),
 'reel-24-f-bussgeld': dict(badge=F, hookTitle='Bußgeld für<br><span class="mark">deinen Betrieb?</span>', lightAt='loesung', scenes={
   'hook': letter('Ordnungsamt', 'Bußgeldbescheid', ['Wegen eines Verstoßes gegen', 'Hygienevorschriften wird ein', 'Bußgeld festgesetzt:', '1.500,00 €'], hl='1.500,00 €', hlWord='schneller', h=700),
   'wann': chips('Schneller als gedacht', [('Hygiene-Kontrolle', 'Hygiene'), ('Arbeitsschutz', 'Arbeitsschutz'), ('Ordnungsamt', 'Ordnungsamt')]),
   'fakt': dict(type='versus', a={'kicker': 'Das Bußgeld selbst', 'title': 'zahlt keine Versicherung', 'icon': 'euro', 'word': 'Bußgeld'},
                b={'kicker': 'Die Verteidigung', 'title': 'Anwalt und Verfahren', 'text': 'je nach Tarif versichert', 'icon': 'scale', 'tone': 'yellow', 'word': 'Verteidigung'}),
   'loesung': ck('Firmen-<br>rechtsschutz', [('Ordnungswidrigkeiten-Rechtsschutz', 'Ordnungswidrigkeiten')]), 'cta': END}),
 'reel-25-f-rechtsschutz-oder-haftpflicht': dict(badge=F, hookTitle='Rechtsschutz?<br><span class="mark">Haftpflicht?</span>', lightAt='loesung', scenes={
   'hook': st(L('Zwei Versicherungen.', 'Rechtsschutz'), L('Zwei Aufgaben.', 'verwechseln', 'yellow'), top=640),
   'rs': dict(type='versus', a={'kicker': 'Du willst Geld von jemandem', 'title': 'Rechtsschutz', 'text': 'setzt deine Ansprüche durch', 'icon': 'scale', 'tone': 'yellow', 'word': 'Rechtsschutz'}),
   'hp': dict(type='versus', cont=True, a={'kicker': 'Du willst Geld von jemandem', 'title': 'Rechtsschutz', 'text': 'setzt deine Ansprüche durch', 'icon': 'scale', 'tone': 'yellow', 'done': True},
              b={'kicker': 'Jemand will Geld von dir', 'title': 'Betriebshaftpflicht', 'text': 'wehrt unberechtigte Forderungen ab', 'icon': 'shieldSmall', 'word': 'Betriebshaftpflicht'}),
   'loesung': st(L('Am besten', 'besten'), L('passen beide zusammen.', 'beide'), L('je nach Tarif', 'Tarif', mute=True), icon='shield'), 'cta': END}),
 'reel-26-f-3-fehler': dict(badge=F, hookTitle='3 Fehler beim<br><span class="mark">Rechtsschutz</span>', lightAt='loesung', scenes={
   'hook': st(L('Selbstständig?', 'Selbstständige'), L('Diese 3 Fehler kosten.', 'Fehler', 'yellow'), top=600),
   'eins': num('3 Fehler', [('„Mein privater Rechtsschutz reicht.“', '', None), ('Erst abschließen, wenn es kracht', '', None), ('Betrieb wächst, Vertrag nicht', '', None)], show=0),
   'zwei': num('3 Fehler', [('„Mein privater Rechtsschutz reicht.“', '', None), ('Erst abschließen, wenn es kracht', '', None), ('Betrieb wächst, Vertrag nicht', '', None)], show=1, cont=True),
   'drei': num('3 Fehler', [('„Mein privater Rechtsschutz reicht.“', '', None), ('Erst abschließen, wenn es kracht', '', None), ('Betrieb wächst, Vertrag nicht', '', None)], show=2, cont=True),
   'loesung': chips('Vertrag mitwachsen lassen', [('Neue Mitarbeiter', 'Mitarbeiter'), ('Zweiter Standort', 'Standort')]), 'cta': END}),
 'reel-27-f-erster-mitarbeiter': dict(badge=F, hookTitle='Erster<br><span class="mark">Mitarbeiter?</span>', lightAt='loesung', scenes={
   'hook': st(L('Das Team wächst.', 'ersten'), L('Glückwunsch!', 'Glückwunsch', 'yellow'), icon='person', top=520),
   'neu': chips('Neue Streitfälle', [('Kündigung', 'Kündigung'), ('Arbeitszeugnis', 'Arbeitszeugnis'), ('Lohn', 'Lohn')]),
   'loesung': blocks('Arbeitgeber-<br>Baustein'), 'achtung': tl('Wichtig', [{'t': 'Rechtzeitig ergänzen', 'word': 'Rechtzeitig', 'fill': True}, {'t': 'Meist 3 Monate Wartezeit', 'word': 'Wartezeit'}]), 'cta': END}),
 'reel-28-f-kuendigung-3-wochen': dict(badge=F, hookTitle='Gekündigt?<br><span class="mark">Frist läuft.</span>', lightAt='loesung', scenes={
   'hook': letter('Dein Betrieb', 'Kündigung', ['Hiermit kündigen wir das', 'Arbeitsverhältnis fristgerecht', 'zum nächstmöglichen Termin.'], h=640),
   'frist': ring('3', 'Wochen', 'Frist für die Kündigungsschutzklage', 'drei', 'ab Zugang der Kündigung', 'red'),
   'fehler': num('Häufige Fehler', [('Nicht schriftlich', '', 'schriftlich'), ('Frist falsch berechnet', '', 'Frist'), ('Betriebsrat nicht angehört', '', 'Betriebsrat')], timed=True),
   'loesung': AG(), 'cta': END}),
 'reel-29-f-kleinbetrieb': dict(badge=F, hookTitle='Kleiner Betrieb =<br><span class="mark">keine Klage?</span>', lightAt='loesung', scenes={
   'hook': myth('Kleiner Betrieb, also keine Klage.', 'Vorsicht!', 'Vorsicht'),
   'fakt': ring('10+', 'Mitarbeiter', 'Ab hier gilt das Kündigungsschutzgesetz', 'zehn', 'in der Regel: mehr als zehn', 'yellow', 170),
   'aber': chips('Geklagt wird trotzdem', [('Formfehler', 'Formfehlern'), ('Sonderkündigungsschutz', 'Sonderkündigungsschutz'), ('Lohn und Zeugnis', 'Lohn')]),
   'loesung': blocks('Arbeitgeber-<br>Baustein'), 'cta': END}),
 'reel-30-f-kunde-zahlt-nicht': dict(badge=F, hookTitle='Kunde zahlt<br><span class="mark">nicht?</span>', lightAt='loesung', scenes={
   'hook': phone('Kunde · Becker GmbH', 'BG', 'Die Rechnung zahlen wir erst mal nicht.', 'nicht', 'E-Mail'),
   'ehrlich': st(L('Ehrlich gesagt:', 'Ehrlich', mute=True), L('Streit mit Kunden', 'Streit'), L('oft nur eingeschränkt versicherbar.', 'eingeschränkt', 'red', 70)),
   'klaeren': num('Vorher klären', [('Welche Bausteine du brauchst', '', 'Bausteine'), ('Was dein Tarif ausschließt', '', 'Tarif'), ('Ab wann der Schutz gilt', '', 'Schutz')], timed=True),
   'loesung': st(L('Ich prüfe mit dir,', 'prüfe'), L('was wirklich möglich ist.', 'möglich'), icon='lens'), 'cta': END}),
 'reel-31-f-abmahnung': dict(badge=F, hookTitle='Kündigen ohne<br><span class="mark">Abmahnung?</span>', lightAt='loesung', scenes={
   'hook': st(L('Ständig zu spät.', 'spät'), L('Kündigen?', 'kündigen', 'red'), icon='person', top=520),
   'regel': letter('Dein Betrieb', 'Abmahnung', ['Sie sind am 3., 7. und 12. März', 'verspätet zur Arbeit erschienen.', 'Im Wiederholungsfall müssen Sie', 'mit einer Kündigung rechnen.'], hl='mit einer Kündigung rechnen.', hlWord='Abmahnung', h=700),
   'inhalt': num('Eine Abmahnung muss', [('Das Fehlverhalten genau benennen', '', 'Fehlverhalten'), ('Die Kündigung androhen', '', 'Kündigung')], timed=True),
   'folge': st(L('Ohne Abmahnung', 'Fehlt'), L('scheitert die Kündigung oft.', 'scheitert', 'red', 76), top=600),
   'loesung': AG(), 'cta': END}),
 'reel-32-f-arbeitszeugnis': dict(badge=F, hookTitle='Streit ums<br><span class="mark">Zeugnis?</span>', lightAt='loesung', scenes={
   'hook': phone('Ex-Mitarbeiter', 'JS', 'Bitte ändern Sie mein Arbeitszeugnis. Sonst gehe ich vor Gericht.', 'geändert', 'E-Mail'),
   'regel': ck('Arbeitszeugnis', [('Anspruch für jeden Mitarbeiter', 'Anspruch'), ('Wahr', 'wahr'), ('Wohlwollend', 'wohlwollend')], note=None, icon='none'),
   'streit': chips('Gestritten wird um', [('Noten', 'Noten'), ('Formulierungen', 'Formulierungen'), ('Versteckte Codes', 'Codes')]),
   'loesung': AG(), 'cta': END}),
 'reel-33-f-probezeit': dict(badge=F, hookTitle='Kündigen in der<br><span class="mark">Probezeit?</span>', lightAt='loesung', scenes={
   'hook': st(L('Probezeit.', 'Probezeit'), L('Schneller als gedacht.', 'schneller', 'yellow'), icon='person', top=520),
   'frist': ring('2', 'Wochen', 'Kündigungsfrist in der Probezeit', 'zwei', 'meist'),
   'dauer': tl('Die kurze Frist', [{'t': 'Monat 1 bis 6', 'sub': '2 Wochen Kündigungsfrist', 'word': 'sechs', 'fill': True}, {'t': 'Danach', 'sub': 'gelten die normalen Fristen', 'word': 'Monate'}]),
   'aber': chips('Streit gibt es trotzdem', [('Formfehler', 'Formfehler'), ('Lohn', 'Lohn'), ('Sonderkündigungsschutz', 'Sonderkündigungsschutz')]),
   'loesung': blocks('Arbeitgeber-<br>Baustein'), 'cta': END}),
 'reel-34-f-lohnfortzahlung': dict(badge=F, hookTitle='Mitarbeiter<br><span class="mark">krank?</span>', lightAt='loesung', scenes={
   'hook': st(L('Krankgeschrieben.', 'krank'), L('Wie lange zahlst du?', 'weiterzahlen', 'yellow'), icon='person', top=520),
   'regel': ring('6', 'Wochen', 'Lohnfortzahlung pro Krankheit', 'sechs', 'bis zu'),
   'tipp': dict(type='versus', a={'kicker': 'Gut zu wissen', 'title': 'Umlage U1', 'text': 'Kleinere Betriebe bekommen einen Teil zurück', 'icon': 'euro', 'tone': 'yellow', 'word': 'Kleinere'}),
   'streit': chips('Streit gibt es um', [('Zweifel an der Krankschreibung', 'Zweifel'), ('Eingestellte Zahlung', 'Zahlung')]),
   'loesung': AG(), 'cta': END}),
 'reel-35-f-firmenwagen': dict(badge=F, hookTitle='Unfall mit dem<br><span class="mark">Firmenwagen?</span>', lightAt='loesung', scenes={
   'hook': st(L('Unfall.', 'Unfall'), L('Und jetzt?', 'jetzt', 'yellow'), icon='car', top=560),
   'streit': chips('Oft folgt Streit', [('Schadenersatz', 'Schadenersatz'), ('Werkstatt', 'Werkstatt'), ('Bußgeld', 'Bußgelds')]),
   'fakt': myth('Mein privater Verkehrs-Rechtsschutz gilt auch hier.', 'Für Firmenfahrzeuge meist nicht.', 'nicht'),
   'loesung': ck('Firmen-<br>rechtsschutz', [('Firmenfahrzeuge mit absichern', 'Firmenfahrzeuge')]), 'cta': END}),
 'reel-36-f-gruender': dict(badge=F, hookTitle='Gerade<br><span class="mark">gegründet?</span>', lightAt='loesung', scenes={
   'hook': st(L('Gründung.', 'gründest'), L('Denk früh an Schutz.', 'früh', 'yellow'), top=600),
   'warum': ring('3', 'Monate', 'Wartezeit', 'drei', 'Streit, der vorher beginnt, ist nicht versichert', 'red'),
   'was': chips('Wichtig für Gründer', [('Arbeitgeber-Rechtsschutz', 'Arbeitgeber'), ('Steuer-Rechtsschutz vor Gericht', 'Steuer'), ('Ordnungswidrigkeiten', 'Ordnungswidrigkeiten')]),
   'loesung': ck('Firmenrechtsschutz<br>nach Maß', [('Wächst mit deinem Betrieb', 'wächst')], titleSize=58), 'cta': END}),
}
