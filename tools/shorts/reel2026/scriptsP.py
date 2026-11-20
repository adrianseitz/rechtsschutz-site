# Spielszenen-Reels (Vermieter) mit 3D-Figuren – Skripte. Stimme: Supertonic „Stimme 2“, synthetisch → dritte Person, KI-Kennzeichnung beim Posten.
import json, os, sys
OUT = sys.argv[1]
FINE = "* je nach Tarif und Versicherungsbedingungen; Wartezeiten und Ausschlüsse beachten. Adrian Seitz, gebundener Versicherungsvertreter (§ 34d Abs. 7 GewO), Vertriebspartner der ARAG."
TAGS = "\n\n#vermieter #mietrecht #immobilien #vermieterrechtsschutz #rechtsschutz"
CTA = {"key": "cta", "mood": "freundlich", "voice": "Adrian Seitz berät dich *kostenlos.* Der Link ist in der *Bio!*"}
R = {}
def reel(id, title, caption, beats, cta=CTA):
    bs = [dict(b) for b in beats] + [dict(cta)]
    for b in bs: b['say'] = b['voice'].replace('*', '')
    R[id] = {"id": id, "title": title, "topic": "vermieter", "format": "reel-2026-play", "caption": caption + TAGS, "fine": FINE, "beats": bs}

reel("reel-37-p-mietnomade", "Der perfekte Mieter?",
 "Der perfekte Mieter … bis er nicht mehr zahlt und trotzdem bleibt. Anwalt, Gericht, Räumung: Der Vermieterrechtsschutz übernimmt je nach Tarif die Kosten, mit Mietausfallschutz gibt es bis zu 12 Monatsmieten ersetzt. Wichtig: vorher abschließen, meist 3 Monate Wartezeit. Kostenloser Check über den Link in der Bio.",
 [{"key": "hook", "mood": "aufgeregt", "voice": "Der perfekte Mieter? Freundlich, gepflegt und pünktlich zur *Besichtigung.*"},
  {"key": "miete", "mood": "dramatisch", "voice": "Dann kommt die erste Miete. Und die zweite. Oder eben *nicht.*"},
  {"key": "ausrede", "mood": "ernst", "voice": "Ausreden gibt es viele. Nur ausziehen will er *nicht.*"},
  {"key": "kosten", "mood": "eindringlich", "voice": "Jetzt brauchst du Anwalt, Gericht und am Ende den *Gerichtsvollzieher.* Das kann schnell *teuer* werden."},
  {"key": "loesung", "mood": "warm", "voice": "Der Vermieterrechtsschutz übernimmt je nach Tarif Anwalt, Gericht und Räumung. Mit Mietausfallschutz gibt es sogar bis zu zwölf Monatsmieten *ersetzt.*"},
  {"key": "achtung", "mood": "eindringlich", "voice": "Wichtig: Abschließen, *bevor* der Ärger losgeht. Meist gilt eine Wartezeit von drei Monaten."}])


reel("reel-38-p-bank-wartet-nicht", "Die Bank wartet nicht",
 "Dein Mieter zahlt nicht – deine Bank will trotzdem ihre Rate. Und bis ein Räumungsurteil da ist, können Monate vergehen. Der Mietausfallschutz ersetzt je nach Tarif bis zu 12 Monatsmieten, Anwalt und Gericht laufen über den Vermieterrechtsschutz. Vorher abschließen, meist 3 Monate Wartezeit. Kostenloser Check über den Link in der Bio.",
 [{"key": "hook", "mood": "aufgeregt", "voice": "Dein Mieter zahlt nicht. Deine *Bank* will trotzdem ihr Geld."},
  {"key": "rate", "mood": "ernst", "voice": "Die Kreditrate läuft weiter, Monat für Monat. Egal, ob die Miete *kommt.*"},
  {"key": "dauer", "mood": "dramatisch", "voice": "Und bis ein Räumungsurteil da ist, können *Monate* vergehen."},
  {"key": "loesung", "mood": "warm", "voice": "Genau dafür gibt es den *Mietausfallschutz.* Je nach Tarif werden bis zu zwölf Monatsmieten ersetzt. Anwalt und Gericht laufen über den Vermieterrechtsschutz."},
  {"key": "achtung", "mood": "eindringlich", "voice": "Wichtig: Abschließen, *bevor* der Ärger losgeht. Meist gilt eine Wartezeit von drei Monaten."}])

reel("reel-39-p-schimmel-streit", "Schimmel – und wer ist schuld?",
 "Der Mieter meldet Schimmel und kürzt die Miete. Er sagt: das Haus. Du sagst: falsch gelüftet. Klären kann das oft nur ein Gutachter – und manchmal ein Gericht. Der Vermieterrechtsschutz übernimmt je nach Tarif Anwalt, Gericht und gerichtliche Gutachter. Vorher abschließen, meist 3 Monate Wartezeit. Kostenloser Check über den Link in der Bio.",
 [{"key": "hook", "mood": "aufgeregt", "voice": "Deine Mieterin meldet Schimmel. Und kürzt ab sofort die *Miete.*"},
  {"key": "streit", "mood": "ernst", "voice": "Sie sagt: Das Haus ist schuld. Du sagst: Es wird nicht richtig *gelüftet.*"},
  {"key": "gutachter", "mood": "eindringlich", "voice": "Klären kann das oft nur ein *Gutachter.* Und am Ende vielleicht ein Gericht."},
  {"key": "loesung", "mood": "warm", "voice": "Der Vermieterrechtsschutz übernimmt je nach Tarif Anwalt, Gericht und *gerichtliche* Gutachter."},
  {"key": "achtung", "mood": "eindringlich", "voice": "Wichtig: Abschließen, *bevor* der Ärger losgeht. Meist gilt eine Wartezeit von drei Monaten."}])

reel("reel-40-p-wohnung-verwuestet", "Auszug – und dann das",
 "Schlüssel zurück, Wohnung verwüstet – und die Kaution reicht nicht. Deinen Schadenersatz musst du dann oft einklagen. Der Vermieterrechtsschutz übernimmt je nach Tarif Anwalt und Gericht. Tipp: Übergabeprotokoll mit Fotos. Vorher abschließen, meist 3 Monate Wartezeit. Kostenloser Check über den Link in der Bio.",
 [{"key": "hook", "mood": "dramatisch", "voice": "Auszug. Schlüssel übergeben. Und dann *das.*"},
  {"key": "schaden", "mood": "ernst", "voice": "Löcher in der Wand, kaputter Boden, *Müll* überall."},
  {"key": "kaution", "mood": "eindringlich", "voice": "Die Kaution reicht nicht. Und dein Ex-Mieter will nicht *zahlen.*"},
  {"key": "loesung", "mood": "warm", "voice": "Mit dem Vermieterrechtsschutz setzt du deinen Schadenersatz durch. Anwalt und Gericht übernimmt je nach Tarif die *Versicherung.*"},
  {"key": "tipp", "mood": "freundlich", "voice": "Tipp: Mach beim Auszug ein *Übergabeprotokoll* mit Fotos. Und schließ den Schutz ab, *bevor* es Ärger gibt."}])

reel("reel-41-p-handwerker-kommt-nicht-rein", "Der Mieter macht nicht auf",
 "Heizung kaputt, Handwerker vor der Tür – und der Mieter macht nicht auf. Notwendige Reparaturen muss der Mieter in der Regel dulden (§ 555a BGB). Notfalls klärt das ein Gericht. Der Vermieterrechtsschutz übernimmt je nach Tarif Anwalt und Gericht. Vorher abschließen, meist 3 Monate Wartezeit. Kostenloser Check über den Link in der Bio.",
 [{"key": "hook", "mood": "aufgeregt", "voice": "Die Heizung ist kaputt. Der Handwerker steht vor der Tür. Und dein Mieter macht *nicht auf.*"},
  {"key": "problem", "mood": "ernst", "voice": "Ohne Zutritt keine Reparatur. Und der Schaden wird *größer.*"},
  {"key": "recht", "mood": "eindringlich", "voice": "Notwendige Reparaturen muss der Mieter in der Regel *dulden.* Notfalls klärt das ein Gericht."},
  {"key": "loesung", "mood": "warm", "voice": "Der Vermieterrechtsschutz übernimmt je nach Tarif Anwalt und Gericht, wenn du dein Recht *durchsetzen* musst."},
  {"key": "achtung", "mood": "eindringlich", "voice": "Wichtig: Abschließen, *bevor* der Ärger losgeht. Meist gilt eine Wartezeit von drei Monaten."}])

reel("reel-42-p-laerm-im-haus", "Party um drei Uhr nachts",
 "Ein Mieter feiert jede Woche bis in die Nacht – und die anderen beschweren sich. Abmahnung, Kündigung, Räumungsklage: Das kann ein langer Weg werden. Der Vermieterrechtsschutz übernimmt je nach Tarif Anwalt und Gericht. Vorher abschließen, meist 3 Monate Wartezeit. Kostenloser Check über den Link in der Bio.",
 [{"key": "hook", "mood": "aufgeregt", "voice": "Party um drei Uhr nachts. Jede *Woche.*"},
  {"key": "nachbarn", "mood": "ernst", "voice": "Die anderen Mieter beschweren sich. Und mindern vielleicht sogar die *Miete.*"},
  {"key": "weg", "mood": "eindringlich", "voice": "Abmahnung, Kündigung, Räumungsklage. Das kann ein *langer* Weg werden."},
  {"key": "loesung", "mood": "warm", "voice": "Der Vermieterrechtsschutz übernimmt je nach Tarif Anwalt und Gericht auf diesem *Weg.*"},
  {"key": "achtung", "mood": "eindringlich", "voice": "Wichtig: Abschließen, *bevor* der Ärger losgeht. Meist gilt eine Wartezeit von drei Monaten."}])

reel("reel-43-p-wohnung-geerbt", "Wohnung geerbt – Mieter inklusive",
 "Wohnung geerbt? Der Mietvertrag läuft weiter – mit allen Rechten und Pflichten. Und mit allem Ärger, der kommen kann. Der Vermieterrechtsschutz sichert dich je nach Tarif bei Streit mit dem Mieter ab. Am besten gleich nach der Übernahme abschließen, meist 3 Monate Wartezeit. Kostenloser Check über den Link in der Bio.",
 [{"key": "hook", "mood": "aufgeregt", "voice": "Du hast eine Wohnung *geerbt*? Der Mieter gehört dazu."},
  {"key": "vertrag", "mood": "ernst", "voice": "Der Mietvertrag läuft einfach weiter. Mit allen Rechten und *Pflichten.*"},
  {"key": "risiko", "mood": "eindringlich", "voice": "Und mit allem Ärger, der kommen kann: Nebenkosten, Mängel, *Mietrückstand.*"},
  {"key": "loesung", "mood": "warm", "voice": "Mit dem Vermieterrechtsschutz bist du je nach Tarif bei Streit mit dem Mieter *abgesichert.*"},
  {"key": "achtung", "mood": "eindringlich", "voice": "Am besten gleich nach der Übernahme *abschließen.* Meist gilt eine Wartezeit von drei Monaten."}])

reel("reel-44-p-zu-spaet", "Zwei Vermieter, gleicher Ärger",
 "Zwei Vermieter, gleicher Ärger – nur einer ist abgesichert. Versichert sind nur Fälle, die nach Vertragsbeginn und Wartezeit entstehen. Wer erst abschließt, wenn der Streit da ist, ist zu spät dran. Der Vermieterrechtsschutz übernimmt je nach Tarif Anwalt und Gericht. Kostenloser Check über den Link in der Bio.",
 [{"key": "hook", "mood": "aufgeregt", "voice": "Zwei Vermieter. Gleicher Ärger. Nur einer ist *abgesichert.*"},
  {"key": "tom", "mood": "warm", "voice": "Tom hat letztes Jahr abgeschlossen. Sein Anwalt? Läuft über die *Versicherung.*"},
  {"key": "max", "mood": "dramatisch", "voice": "Max will erst abschließen, als der Streit schon da ist. Zu *spät.*"},
  {"key": "regel", "mood": "eindringlich", "voice": "Versichert sind nur Fälle, die *nach* Vertragsbeginn und Wartezeit entstehen. Meist sind das drei Monate."},
  {"key": "loesung", "mood": "warm", "voice": "Also: Sei wie Tom. Der Vermieterrechtsschutz übernimmt je nach Tarif Anwalt und *Gericht.*"}])

reel("reel-45-p-nachzahlung", "Nachzahlung? Zahl ich nicht!",
 "Nebenkostenabrechnung raus, Nachzahlung 800 € – und der Mieter sagt: Zahl ich nicht. Jetzt wird jede Position geprüft, am Ende entscheidet vielleicht ein Gericht. Tipp: Belege aufheben, der Mieter darf sie einsehen. Der Vermieterrechtsschutz übernimmt je nach Tarif Anwalt und Gericht. Vorher abschließen, meist 3 Monate Wartezeit. Kostenloser Check über den Link in der Bio.",
 [{"key": "hook", "mood": "aufgeregt", "voice": "Die Nebenkostenabrechnung ist raus. *Nachzahlung:* 800 Euro."},
  {"key": "mieter", "mood": "ernst", "voice": "Deine Mieterin sagt: Zahl ich nicht. Die Abrechnung ist *falsch.*"},
  {"key": "streit", "mood": "eindringlich", "voice": "Jetzt wird jede Position geprüft. Und am Ende entscheidet vielleicht ein *Gericht.*"},
  {"key": "tipp", "mood": "freundlich", "voice": "Tipp: Heb alle *Belege* auf. Deine Mieterin darf sie einsehen."},
  {"key": "loesung", "mood": "warm", "voice": "Der Vermieterrechtsschutz übernimmt je nach Tarif Anwalt und Gericht. Wichtig: vorher abschließen, meist gilt eine Wartezeit von drei *Monaten.*"}])

reel("reel-46-p-ein-tag-als-vermieter", "Ein Tag als Vermieter",
 "Ein ganz normaler Tag als Vermieter: Mängelanzeige, fehlende Miete, Beschwerde wegen Lärm. Wenn daraus ein Rechtsstreit wird, übernimmt der Vermieterrechtsschutz je nach Tarif Anwalt und Gericht. Vorher abschließen, meist 3 Monate Wartezeit. Kostenloser Check über den Link in der Bio.",
 [{"key": "hook", "mood": "aufgeregt", "voice": "Ein ganz normaler Tag als *Vermieter.*"},
  {"key": "morgens", "mood": "aufgeregt", "voice": "Acht Uhr: Die Mieterin meldet einen Mangel und droht mit *Mietminderung.*"},
  {"key": "mittags", "mood": "ernst", "voice": "Zwölf Uhr: Die Miete von Wohnung drei ist wieder nicht *da.*"},
  {"key": "abends", "mood": "dramatisch", "voice": "Zwanzig Uhr: Beschwerde wegen *Lärm.*"},
  {"key": "loesung", "mood": "warm", "voice": "Ärger gibt es genug. Wenn es vor Gericht geht, übernimmt der Vermieterrechtsschutz je nach Tarif Anwalt und *Gericht.*"},
  {"key": "achtung", "mood": "eindringlich", "voice": "Wichtig: Abschließen, *bevor* der Ärger losgeht. Meist gilt eine Wartezeit von drei Monaten."}])

os.makedirs(OUT, exist_ok=True)
for k, v in R.items(): json.dump(v, open(os.path.join(OUT, k + '.json'), 'w'), ensure_ascii=False, indent=1)
print(len(R), 'Skripte')
