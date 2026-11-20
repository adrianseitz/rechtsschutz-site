# 30 Lern-Reels (Format reel-2026). Gesprochenes ohne „ARAG“ (Aussprache), die Marke steht auf der Endkarte.
# Fakten: aus den geprüften Episoden 02–20 bzw. Gesetz (Paragraf in der Caption).
import json, os, re, sys
OUT = sys.argv[1]
CTA = "Adrian Seitz berät dich *kostenlos.* Der Link ist in der *Bio!*"
TAGS_V = "#vermieter #mietrecht #immobilien #vermieterrechtsschutz #rechtsschutz"
TAGS_F = "#selbstständig #unternehmer #arbeitgeber #firmenrechtsschutz #rechtsschutz"

def B(key, mood, voice): return {'key': key, 'mood': mood, 'voice': voice, 'say': re.sub(r'\*', '', voice)}

R = [
# ---------------- Vermieter ----------------
('07-v-privatschutz-reicht-nicht', 'Du hast Rechtsschutz und vermietest? Aufgepasst', 'vermieter', [
  B('hook', 'aufgeregt', 'Du hast Rechtsschutz und *vermietest* eine Wohnung? Dann aufgepasst.'),
  B('fakt', 'ernst', 'Dein privater Rechtsschutz deckt Streit mit deinen Mietern in der Regel *nicht* ab.'),
  B('loesung', 'warm', 'Dafür brauchst du den *Vermieter-Baustein.* Und jede vermietete Wohnung muss im Vertrag stehen.'),
  B('tipp', 'eindringlich', 'Neue Wohnung gekauft? Dann gleich *nachmelden,* sonst ist sie nicht geschützt.'),
  B('cta', 'freundlich', 'Sind alle deine Wohnungen abgesichert? ' + CTA)],
 'Du hast Rechtsschutz und vermietest? Ein privater Rechtsschutz deckt Streit mit Mietern in der Regel nicht ab. Dafür brauchst du den Vermieter-Baustein – und jede Wohnung muss im Vertrag stehen. Neue Wohnung? Gleich nachmelden. Kostenloser Check über den Link in der Bio.'),
('08-v-kaution-zurueck', 'Mieter will die volle Kaution zurück? Diese Frist läuft', 'vermieter', [
  B('hook', 'aufgeregt', 'Dein Mieter zieht aus und will die *volle* Kaution zurück?'),
  B('streit', 'ernst', 'Streit gibt es oft um Schäden, offene Nebenkosten oder Schönheitsreparaturen.'),
  B('frist', 'dramatisch', 'Und Vorsicht: Ansprüche wegen Schäden verjähren schon *sechs Monate* nach Rückgabe der Wohnung.'),
  B('loesung', 'warm', 'Kommt es zum Streit, übernimmt der Vermieterrechtsschutz je nach Tarif Anwalt und Gericht.'),
  B('cta', 'freundlich', CTA)],
 'Mieter zieht aus und will die volle Kaution zurück? Streit gibt es oft um Schäden, Nebenkosten oder Schönheitsreparaturen. Wichtig: Ersatzansprüche wegen Schäden verjähren 6 Monate nach Rückgabe der Wohnung (§ 548 BGB). Vermieterrechtsschutz übernimmt im Streitfall je nach Tarif Anwalt und Gericht.'),
('09-v-3-fakten', '3 Fakten, die jeder Vermieter kennen sollte', 'vermieter', [
  B('hook', 'aufgeregt', 'Drei Fakten, die jeder Vermieter kennen sollte.'),
  B('eins', 'ernst', 'Erstens: Dein privater Rechtsschutz deckt die Vermietung meist *nicht.*'),
  B('zwei', 'eindringlich', 'Zweitens: Jede Wohnung muss *einzeln* im Vertrag stehen.'),
  B('drei', 'begeistert', 'Drittens: Die Beiträge sind in der Regel als *Werbungskosten* absetzbar.'),
  B('cta', 'freundlich', 'Lass deine Wohnungen checken. ' + CTA)],
 '3 Fakten für Vermieter: 1. Privatrechtsschutz deckt die Vermietung meist nicht. 2. Jede Wohnung muss im Vertrag stehen. 3. Die Beiträge sind in der Regel als Werbungskosten absetzbar (verbindlich klärt das deine Steuerberatung).'),
('10-v-eigenbedarf', 'Eigenbedarf? Darum gibt es oft Streit', 'vermieter', [
  B('hook', 'aufgeregt', 'Du brauchst deine vermietete Wohnung *selbst?*'),
  B('fakt', 'ernst', 'Dann kündigst du wegen Eigenbedarf. Und viele Mieter wehren sich, oft bis vor *Gericht.*'),
  B('streit', 'eindringlich', 'Typische Streitpunkte: Ist der Eigenbedarf echt, gibt es einen Härtefall, und stimmen Frist und Form?'),
  B('loesung', 'warm', 'Der Vermieterrechtsschutz übernimmt je nach Tarif Anwalt, Gericht und Räumung.'),
  B('achtung', 'eindringlich', 'Aber: Abschließen, *bevor* du kündigst. Meist gilt eine Wartezeit von drei Monaten.'),
  B('cta', 'freundlich', CTA)],
 'Eigenbedarf? Viele Mieter wehren sich – oft bis vor Gericht. Streitpunkte: Ist der Eigenbedarf echt, liegt ein Härtefall vor, stimmen Frist und Form? Vermieterrechtsschutz je nach Tarif – aber abschließen, bevor du kündigst (Wartezeit meist 3 Monate).'),
('11-v-nebenkosten-frist', 'Nebenkostenabrechnung: Diese Frist kostet Vermieter Geld', 'vermieter', [
  B('hook', 'aufgeregt', 'Für die Nebenkostenabrechnung hast du nur *zwölf Monate* Zeit.'),
  B('frist', 'ernst', 'Sie muss spätestens zwölf Monate nach Ende des Abrechnungszeitraums beim Mieter sein.'),
  B('folge', 'dramatisch', 'Kommt sie zu spät, ist eine Nachforderung in der Regel *weg.*'),
  B('streit', 'eindringlich', 'Und zahlt der Mieter die Nachzahlung nicht, übernimmt der Vermieterrechtsschutz je nach Tarif Anwalt und Gericht.'),
  B('cta', 'freundlich', CTA)],
 'Die Nebenkostenabrechnung muss spätestens 12 Monate nach Ende des Abrechnungszeitraums beim Mieter sein (§ 556 Abs. 3 BGB). Danach ist die Nachforderung in der Regel ausgeschlossen. Kommt es zum Streit, übernimmt der Vermieterrechtsschutz je nach Tarif Anwalt und Gericht.'),
('12-v-mieterhoehung-klage', 'Mieter lehnt die Mieterhöhung ab? Diese Frist läuft', 'vermieter', [
  B('hook', 'aufgeregt', 'Dein Mieter stimmt der Mieterhöhung *nicht* zu?'),
  B('frist', 'ernst', 'Dann musst du auf Zustimmung klagen. Dafür hast du nur *drei Monate* nach Ende seiner Überlegungsfrist.'),
  B('streit', 'eindringlich', 'Gestritten wird oft um Mietspiegel, Kappungsgrenze, Form und Begründung.'),
  B('loesung', 'warm', 'Der Vermieterrechtsschutz übernimmt je nach Tarif Anwalt und Gericht.'),
  B('achtung', 'eindringlich', 'Wichtig: Erst absichern, dann erhöhen. Meist gilt eine Wartezeit von drei Monaten.'),
  B('cta', 'freundlich', CTA)],
 'Mieter stimmt der Mieterhöhung nicht zu? Dann musst du auf Zustimmung klagen – innerhalb von 3 Monaten nach Ablauf seiner Überlegungsfrist (§ 558b BGB). Vermieterrechtsschutz je nach Tarif, vorher abschließen (Wartezeit meist 3 Monate).'),
('13-v-zahlungsverzug', 'Mieter zahlt nicht? Ab wann du fristlos kündigen darfst', 'vermieter', [
  B('hook', 'aufgeregt', 'Dein Mieter zahlt ständig zu spät oder gar nicht?'),
  B('regel', 'ernst', 'Ab einem Rückstand von *zwei Monatsmieten* ist eine fristlose Kündigung in der Regel möglich.'),
  B('tipp', 'eindringlich', 'Darauf kommt es an: Rückstand genau berechnen, schriftlich kündigen und den Zugang nachweisen.'),
  B('loesung', 'warm', 'Der Vermieterrechtsschutz übernimmt je nach Tarif Anwalt, Gericht und Räumung. Mit Mietausfallschutz gibt es sogar die Miete ersetzt.'),
  B('cta', 'freundlich', CTA)],
 'Ab einem Rückstand von zwei Monatsmieten ist eine fristlose Kündigung in der Regel möglich (§ 543 BGB). Wichtig: Rückstand genau berechnen, schriftlich kündigen, Zugang nachweisen. Vermieterrechtsschutz plus Mietausfallschutz (je nach Tarif).'),
('14-v-kaution-hoehe', 'Wie hoch darf die Kaution sein?', 'vermieter', [
  B('hook', 'aufgeregt', 'Wie hoch darf die Kaution eigentlich sein?'),
  B('regel', 'ernst', 'Höchstens *drei Monatsmieten,* gerechnet ohne Nebenkosten.'),
  B('raten', 'eindringlich', 'Und dein Mieter darf sie in *drei Raten* zahlen. Die erste ist zu Beginn des Mietverhältnisses fällig.'),
  B('anlage', 'ernst', 'Du musst die Kaution getrennt von deinem eigenen Vermögen anlegen.'),
  B('loesung', 'warm', 'Gibt es später Streit um die Kaution, hilft der Vermieterrechtsschutz je nach Tarif.'),
  B('cta', 'freundlich', CTA)],
 'Die Kaution darf höchstens drei Monatsmieten ohne Nebenkosten betragen, der Mieter darf in drei Raten zahlen, und du musst sie getrennt von deinem Vermögen anlegen (§ 551 BGB). Streit um die Kaution? Vermieterrechtsschutz je nach Tarif.'),
('15-v-kappungsgrenze', 'Mieterhöhung: Um wie viel darfst du erhöhen?', 'vermieter', [
  B('hook', 'aufgeregt', 'Du willst die Miete erhöhen? Dann kenn diese *Grenze.*'),
  B('regel', 'ernst', 'Innerhalb von drei Jahren darf die Miete um höchstens *20 Prozent* steigen.'),
  B('angespannt', 'eindringlich', 'In vielen Städten mit knappem Wohnraum sind es sogar nur *15 Prozent.*'),
  B('vergleich', 'ernst', 'Und nie über die ortsübliche Vergleichsmiete hinaus.'),
  B('loesung', 'warm', 'Kommt es zum Streit über die Erhöhung, übernimmt der Vermieterrechtsschutz je nach Tarif Anwalt und Gericht.'),
  B('cta', 'freundlich', CTA)],
 'Kappungsgrenze: In drei Jahren darf die Miete um höchstens 20 % steigen, in Gebieten mit angespanntem Wohnungsmarkt um 15 % – und nie über die ortsübliche Vergleichsmiete (§ 558 BGB). Streit über die Erhöhung? Vermieterrechtsschutz je nach Tarif.'),
('16-v-modernisierung', 'Modernisiert? So viel darfst du umlegen', 'vermieter', [
  B('hook', 'aufgeregt', 'Du modernisierst deine Wohnung? Dann darfst du einen Teil *umlegen.*'),
  B('regel', 'ernst', 'In der Regel *8 Prozent* der Kosten pro Jahr kommen auf die Jahresmiete.'),
  B('beispiel', 'dramatisch', 'Bei 10.000 Euro Kosten sind das 800 Euro im Jahr, also rund 67 Euro im Monat.'),
  B('grenze', 'eindringlich', 'Aber es gibt eine *Kappungsgrenze,* und die Ankündigung muss stimmen.'),
  B('loesung', 'warm', 'Wehrt sich dein Mieter, übernimmt der Vermieterrechtsschutz je nach Tarif Anwalt und Gericht.'),
  B('cta', 'freundlich', CTA)],
 'Nach einer Modernisierung darfst du in der Regel 8 % der Kosten pro Jahr auf die Jahresmiete umlegen (§ 559 BGB) – mit Kappungsgrenze und korrekter Ankündigung. Beispiel: 10.000 € = 800 € im Jahr, rund 67 € im Monat. Streit? Vermieterrechtsschutz je nach Tarif.'),
('17-v-schoenheitsreparaturen', 'Schönheitsreparaturen: Diese Klauseln sind oft unwirksam', 'vermieter', [
  B('hook', 'aufgeregt', 'Muss dein Mieter beim Auszug *streichen?* Nicht unbedingt.'),
  B('fakt', 'ernst', 'Viele Klauseln zu Schönheitsreparaturen sind *unwirksam.*'),
  B('beispiele', 'eindringlich', 'Zum Beispiel starre Fristen wie: alle drei Jahre Küche und Bad. Oder wenn die Wohnung unrenoviert übergeben wurde.'),
  B('tipp', 'warm', 'Lass deinen Mietvertrag prüfen, bevor du Geld von der Kaution einbehältst.'),
  B('loesung', 'warm', 'Und kommt es zum Streit, hilft der Vermieterrechtsschutz je nach Tarif.'),
  B('cta', 'freundlich', CTA)],
 'Viele Klauseln zu Schönheitsreparaturen sind unwirksam – z. B. starre Fristenpläne oder wenn die Wohnung unrenoviert übergeben wurde (BGH). Vertrag prüfen lassen, bevor du von der Kaution etwas einbehältst. Streit? Vermieterrechtsschutz je nach Tarif.'),
('18-v-untervermietung', 'Mieter vermietet unter? Das gilt', 'vermieter', [
  B('hook', 'aufgeregt', 'Dein Mieter vermietet einfach *unter?*'),
  B('regel', 'ernst', 'Dafür braucht er deine *Erlaubnis.* Ohne Erlaubnis ist das ein Vertragsverstoß.'),
  B('aber', 'eindringlich', 'Aber: Hat er ein berechtigtes Interesse an der Untervermietung eines Teils der Wohnung, muss die Erlaubnis meist erteilt werden.'),
  B('folge', 'ernst', 'Bei unerlaubter Untervermietung sind Abmahnung und im Ernstfall Kündigung möglich.'),
  B('loesung', 'warm', 'Streitest du darüber, übernimmt der Vermieterrechtsschutz je nach Tarif Anwalt und Gericht.'),
  B('cta', 'freundlich', CTA)],
 'Untervermietung braucht die Erlaubnis des Vermieters (§ 540 BGB). Hat der Mieter ein berechtigtes Interesse an der Untervermietung eines Teils der Wohnung, muss sie meist erteilt werden (§ 553 BGB). Unerlaubt? Abmahnung, im Ernstfall Kündigung. Streit? Vermieterrechtsschutz je nach Tarif.'),
('19-v-uebergabeprotokoll', 'Wohnungsübergabe: Dieses Papier spart dir Ärger', 'vermieter', [
  B('hook', 'aufgeregt', 'Ein Blatt Papier kann dir beim Auszug *viel* Ärger sparen.'),
  B('was', 'ernst', 'Das Übergabeprotokoll. Halte beim Einzug und beim Auszug alles fest.'),
  B('inhalt', 'eindringlich', 'Zählerstände, Schlüssel, Schäden mit Fotos. Und beide unterschreiben.'),
  B('warum', 'dramatisch', 'Denn ohne Beweis wird es schwer, Schäden von der Kaution abzuziehen.'),
  B('loesung', 'warm', 'Und reicht das nicht, hilft der Vermieterrechtsschutz je nach Tarif mit Anwalt und Gericht.'),
  B('cta', 'freundlich', CTA)],
 'Übergabeprotokoll bei Ein- und Auszug: Zählerstände, Schlüssel, Schäden mit Fotos – und beide unterschreiben. Ohne Beweis ist es schwer, Schäden von der Kaution abzuziehen. Vermieterrechtsschutz hilft im Streitfall je nach Tarif.'),
('20-v-mieterauswahl', 'Den richtigen Mieter finden: Diese 3 Unterlagen', 'vermieter', [
  B('hook', 'aufgeregt', 'Der beste Schutz vor Mietausfall beginnt *vor* dem Vertrag.'),
  B('eins', 'ernst', 'Erstens: ein aktueller *Einkommensnachweis.*'),
  B('zwei', 'ernst', 'Zweitens: eine Bonitätsauskunft, zum Beispiel von der Schufa.'),
  B('drei', 'ernst', 'Drittens: eine Mietschuldenfreiheitsbescheinigung vom Vormieter.'),
  B('loesung', 'warm', 'Und falls trotzdem etwas schiefgeht: Vermieterrechtsschutz und Mietausfallschutz, je nach Tarif.'),
  B('cta', 'freundlich', CTA)],
 'Bevor du vermietest: Einkommensnachweis, Bonitätsauskunft (z. B. Schufa) und Mietschuldenfreiheitsbescheinigung vom Vormieter. Und falls trotzdem etwas schiefgeht: Vermieterrechtsschutz und Mietausfallschutz je nach Tarif.'),
('21-v-zahlt-nicht-alles', 'Rechtsschutz zahlt alles? Leider nein', 'vermieter', [
  B('hook', 'aufgeregt', 'Rechtsschutz zahlt *alles?* Leider nein.'),
  B('eins', 'ernst', 'Erstens: Es gibt meist eine *Wartezeit* von drei Monaten.'),
  B('zwei', 'ernst', 'Zweitens: Je nach Tarif gibt es eine *Selbstbeteiligung.*'),
  B('drei', 'eindringlich', 'Drittens: Manches ist ausgeschlossen, zum Beispiel Streit um Kauf oder Bau der Immobilie.'),
  B('tipp', 'warm', 'Darum vorher genau klären, was dein Tarif abdeckt.'),
  B('cta', 'freundlich', CTA)],
 'Rechtsschutz zahlt nicht alles: Meist gilt eine Wartezeit von 3 Monaten, je nach Tarif gibt es eine Selbstbeteiligung, und manches ist ausgeschlossen – z. B. Streit um Kauf oder Bau der Immobilie. Vorher klären, was dein Tarif abdeckt.'),
# ---------------- Firma ----------------
('22-f-privatschutz-zaehlt-nicht', 'Selbstständig? Dein Privat-Rechtsschutz zählt nicht', 'firma', [
  B('hook', 'aufgeregt', 'Du bist selbstständig? Dann gilt dein privater Rechtsschutz in der Regel *nicht* für deine Firma.'),
  B('aerger', 'ernst', 'Typischer Ärger im Betrieb: Streit mit Mitarbeitern, ein Bußgeldverfahren oder ein Steuerstreit vor Gericht.'),
  B('loesung', 'warm', 'Dafür gibt es den *Firmenrechtsschutz,* passend zu Branche und Größe, je nach Tarif mit den passenden Bausteinen.'),
  B('cta', 'freundlich', 'Passt dein Schutz zu deinem Betrieb? ' + CTA)],
 'Selbstständig? Dein privater Rechtsschutz gilt in der Regel nicht für deinen Betrieb. Streit mit Mitarbeitern, Bußgeld oder Steuerstreit vor Gericht brauchen einen eigenen Firmenrechtsschutz – modular nach Branche und Größe (je nach Tarif).'),
('23-f-finanzamt', 'Streit mit dem Finanzamt? Das musst du wissen', 'firma', [
  B('hook', 'aufgeregt', 'Streit mit dem *Finanzamt?*'),
  B('fakt', 'ernst', 'Gut zu wissen: Steuer-Rechtsschutz greift meist erst *vor dem Finanzgericht,* nicht schon beim Einspruch.'),
  B('faelle', 'eindringlich', 'Typische Fälle: ein zu hoher Steuerbescheid, Streit um Betriebsausgaben oder Ärger nach einer Betriebsprüfung.'),
  B('loesung', 'warm', 'Im Firmenrechtsschutz ist Steuer-Rechtsschutz vor Gericht je nach Tarif als Baustein mit drin.'),
  B('cta', 'freundlich', CTA)],
 'Streit mit dem Finanzamt? Steuer-Rechtsschutz greift meist erst vor dem Finanzgericht, nicht schon beim Einspruch. Typisch: zu hoher Steuerbescheid, Betriebsausgaben, Betriebsprüfung. Im Firmenrechtsschutz je nach Tarif als Baustein.'),
('24-f-bussgeld', 'Bußgeld für den Betrieb? Das zahlt die Versicherung', 'firma', [
  B('hook', 'aufgeregt', 'Ein Bußgeldbescheid für deinen Betrieb kommt schneller, als du denkst.'),
  B('wann', 'ernst', 'Zum Beispiel nach einer Hygiene-Kontrolle, wegen Arbeitsschutz oder vom Ordnungsamt.'),
  B('fakt', 'dramatisch', 'Das Bußgeld selbst zahlt *keine* Versicherung. Aber die *Verteidigung,* also Anwalt und Verfahren.'),
  B('loesung', 'warm', 'Im Firmenrechtsschutz ist der Ordnungswidrigkeiten-Rechtsschutz je nach Tarif mit drin.'),
  B('cta', 'freundlich', CTA)],
 'Bußgeldbescheid nach Hygiene-Kontrolle, Arbeitsschutz oder vom Ordnungsamt? Das Bußgeld selbst zahlt keine Versicherung – wohl aber die Verteidigung. Ordnungswidrigkeiten-Rechtsschutz im Firmenrechtsschutz je nach Tarif.'),
('25-f-rechtsschutz-oder-haftpflicht', 'Rechtsschutz oder Haftpflicht? Das verwechseln viele', 'firma', [
  B('hook', 'aufgeregt', 'Rechtsschutz oder Haftpflicht? Das verwechseln viele Selbstständige.'),
  B('rs', 'warm', 'Du willst Geld von jemand anderem? Dann hilft der *Rechtsschutz,* deine Ansprüche durchzusetzen.'),
  B('hp', 'ernst', 'Will jemand Geld von dir, ist meist die *Betriebshaftpflicht* dran. Sie wehrt unberechtigte Forderungen ab.'),
  B('loesung', 'warm', 'Am besten passen beide zusammen, je nach Tarif.'),
  B('cta', 'freundlich', CTA)],
 'Faustregel: Willst du Geld von jemand anderem, hilft der Rechtsschutz, deine Ansprüche durchzusetzen. Will jemand Geld von dir, ist meist die Betriebshaftpflicht zuständig – sie wehrt unberechtigte Forderungen ab. Am besten passen beide zusammen.'),
('26-f-3-fehler', '3 Fehler, die Selbstständige beim Rechtsschutz machen', 'firma', [
  B('hook', 'aufgeregt', 'Drei Fehler, die Selbstständige beim Rechtsschutz machen.'),
  B('eins', 'ernst', 'Erstens: Zu glauben, der *private* Rechtsschutz reicht.'),
  B('zwei', 'ernst', 'Zweitens: Erst abschließen, wenn es *schon kracht.*'),
  B('drei', 'eindringlich', 'Drittens: Der Betrieb wächst, aber der Vertrag bleibt gleich.'),
  B('loesung', 'warm', 'Neue Mitarbeiter oder ein zweiter Standort? Dann sollte der Vertrag mitwachsen.'),
  B('cta', 'freundlich', CTA)],
 '3 Fehler beim Firmenrechtsschutz: 1. Glauben, der private Rechtsschutz reicht. 2. Erst abschließen, wenn es schon kracht. 3. Der Betrieb wächst, der Vertrag nicht.'),
('27-f-erster-mitarbeiter', 'Erster Mitarbeiter? Dann prüf deinen Rechtsschutz', 'firma', [
  B('hook', 'begeistert', 'Du hast deinen *ersten* Mitarbeiter eingestellt? Glückwunsch!'),
  B('neu', 'ernst', 'Ab jetzt gibt es neue Streitfälle: um eine Kündigung, ums Arbeitszeugnis oder um den Lohn.'),
  B('loesung', 'warm', 'Im Firmenrechtsschutz deckt der *Arbeitgeber-Baustein* solche Streitigkeiten je nach Tarif ab.'),
  B('achtung', 'eindringlich', 'Wichtig: Rechtzeitig ergänzen. Meist gilt eine Wartezeit von drei Monaten.'),
  B('cta', 'freundlich', CTA)],
 'Ersten Mitarbeiter eingestellt? Ab jetzt sind neue Streitfälle möglich: Kündigung, Arbeitszeugnis, Lohn. Der Arbeitgeber-Baustein im Firmenrechtsschutz deckt das je nach Tarif ab – rechtzeitig ergänzen, meist gilt eine Wartezeit.'),
('28-f-kuendigung-3-wochen', 'Mitarbeiter gekündigt? Diese Frist läuft jetzt', 'firma', [
  B('hook', 'aufgeregt', 'Du musst einem Mitarbeiter kündigen? Dann läuft danach eine wichtige *Frist.*'),
  B('frist', 'ernst', 'Ab Zugang der Kündigung hat er *drei Wochen* Zeit für eine Kündigungsschutzklage.'),
  B('fehler', 'eindringlich', 'Häufige Fehler: Die Kündigung ist nicht schriftlich, die Frist ist falsch berechnet, oder der Betriebsrat wurde nicht angehört.'),
  B('loesung', 'warm', 'Kommt die Klage, übernimmt der Arbeitgeber-Baustein je nach Tarif Anwalt und Gericht.'),
  B('cta', 'freundlich', CTA)],
 'Nach Zugang der Kündigung hat der Mitarbeiter 3 Wochen Zeit für eine Kündigungsschutzklage (§ 4 KSchG). Häufige Fehler: nicht schriftlich, Frist falsch berechnet, Betriebsrat nicht angehört. Arbeitgeber-Rechtsschutz je nach Tarif.'),
('29-f-kleinbetrieb', 'Kleinbetrieb = keine Klage? Vorsicht', 'firma', [
  B('hook', 'aufgeregt', 'Kleiner Betrieb, kein Kündigungsschutz, also auch keine Klage? *Vorsicht.*'),
  B('fakt', 'ernst', 'Das Kündigungsschutzgesetz gilt in der Regel erst bei mehr als *zehn* Mitarbeitern.'),
  B('aber', 'eindringlich', 'Geklagt wird trotzdem: wegen Formfehlern, wegen Sonderkündigungsschutz, zum Beispiel bei Schwangeren, oder um Lohn und Zeugnis.'),
  B('loesung', 'warm', 'Der Arbeitgeber-Baustein deckt solche Streitigkeiten je nach Tarif ab.'),
  B('cta', 'freundlich', CTA)],
 'Das Kündigungsschutzgesetz gilt in der Regel erst bei mehr als 10 Mitarbeitern (§ 23 KSchG). Klagen gibt es trotzdem – wegen Formfehlern, Sonderkündigungsschutz oder um Lohn und Zeugnis. Arbeitgeber-Rechtsschutz je nach Tarif.'),
('30-f-kunde-zahlt-nicht', 'Kunde zahlt nicht? Was Rechtsschutz wirklich abdeckt', 'firma', [
  B('hook', 'aufgeregt', 'Dein Kunde zahlt die Rechnung *nicht?*'),
  B('ehrlich', 'ernst', 'Ehrlich gesagt: Streit um Verträge mit Kunden ist im Firmenrechtsschutz oft nur *eingeschränkt* versicherbar.'),
  B('klaeren', 'eindringlich', 'Darum vorher klären: welche Bausteine du brauchst, was dein Tarif ausschließt und ab wann der Schutz gilt.'),
  B('loesung', 'warm', 'Ich prüfe mit dir, was für deinen Betrieb wirklich möglich ist.'),
  B('cta', 'freundlich', CTA)],
 'Kunde zahlt nicht? Ehrlich: Vertragsstreit mit Kunden ist im Firmenrechtsschutz oft nur als Baustein und eingeschränkt versicherbar. Vorher klären, welche Bausteine du brauchst und was dein Tarif ausschließt.'),
('31-f-abmahnung', 'Kündigen ohne Abmahnung? Meist ein Fehler', 'firma', [
  B('hook', 'aufgeregt', 'Ein Mitarbeiter kommt ständig zu spät, und du willst *kündigen?*'),
  B('regel', 'ernst', 'Bei Fehlverhalten brauchst du vorher meist eine *Abmahnung.*'),
  B('inhalt', 'eindringlich', 'Sie muss das Fehlverhalten genau benennen und klar machen: Beim nächsten Mal droht die Kündigung.'),
  B('folge', 'dramatisch', 'Fehlt die Abmahnung, scheitert die Kündigung vor Gericht oft.'),
  B('loesung', 'warm', 'Kommt es zur Klage, übernimmt der Arbeitgeber-Baustein je nach Tarif Anwalt und Gericht.'),
  B('cta', 'freundlich', CTA)],
 'Bei verhaltensbedingten Kündigungen ist vorher meist eine Abmahnung nötig. Sie muss das Fehlverhalten genau benennen und die Kündigung androhen. Fehlt sie, scheitert die Kündigung vor Gericht oft. Arbeitgeber-Rechtsschutz je nach Tarif.'),
('32-f-arbeitszeugnis', 'Streit ums Arbeitszeugnis? Das musst du wissen', 'firma', [
  B('hook', 'aufgeregt', 'Ein Ex-Mitarbeiter will sein Zeugnis *geändert* haben?'),
  B('regel', 'ernst', 'Jeder Mitarbeiter hat Anspruch auf ein Arbeitszeugnis. Und es muss *wahr* und *wohlwollend* sein.'),
  B('streit', 'eindringlich', 'Gestritten wird oft um Noten, um einzelne Formulierungen oder versteckte Codes.'),
  B('loesung', 'warm', 'Landet das vor Gericht, übernimmt der Arbeitgeber-Baustein je nach Tarif Anwalt und Gericht.'),
  B('cta', 'freundlich', CTA)],
 'Jeder Mitarbeiter hat Anspruch auf ein Arbeitszeugnis – wahr und wohlwollend (§ 109 GewO). Streit gibt es oft um Noten, Formulierungen und versteckte Codes. Arbeitgeber-Rechtsschutz je nach Tarif.'),
('33-f-probezeit', 'Probezeit: Was beim Kündigen gilt', 'firma', [
  B('hook', 'aufgeregt', 'Kündigen in der Probezeit? Das geht schneller, als viele denken.'),
  B('frist', 'ernst', 'In der Probezeit gilt meist eine Kündigungsfrist von nur *zwei Wochen.*'),
  B('dauer', 'eindringlich', 'Diese kurze Frist gilt höchstens für die ersten *sechs Monate.*'),
  B('aber', 'dramatisch', 'Trotzdem gibt es Streit: um Formfehler, um Lohn oder um Sonderkündigungsschutz.'),
  B('loesung', 'warm', 'Dann hilft der Arbeitgeber-Baustein im Firmenrechtsschutz, je nach Tarif.'),
  B('cta', 'freundlich', CTA)],
 'In der Probezeit gilt meist eine Kündigungsfrist von zwei Wochen, längstens für die ersten sechs Monate (§ 622 Abs. 3 BGB). Streit gibt es trotzdem – um Form, Lohn oder Sonderkündigungsschutz. Arbeitgeber-Rechtsschutz je nach Tarif.'),
('34-f-lohnfortzahlung', 'Mitarbeiter krank? So lange zahlst du weiter', 'firma', [
  B('hook', 'aufgeregt', 'Dein Mitarbeiter ist krank. Wie lange musst du *weiterzahlen?*'),
  B('regel', 'ernst', 'Bis zu *sechs Wochen* pro Krankheit zahlst du den Lohn weiter.'),
  B('tipp', 'begeistert', 'Kleinere Betriebe bekommen einen Teil davon über die Umlage U1 von der Krankenkasse zurück.'),
  B('streit', 'eindringlich', 'Streit gibt es, wenn Zweifel an der Krankschreibung bestehen oder die Zahlung eingestellt wird.'),
  B('loesung', 'warm', 'Dann hilft der Arbeitgeber-Baustein je nach Tarif.'),
  B('cta', 'freundlich', CTA)],
 'Bei Krankheit zahlst du den Lohn bis zu 6 Wochen weiter (Entgeltfortzahlungsgesetz). Kleinere Betriebe bekommen über die U1-Umlage einen Teil von der Krankenkasse erstattet. Streit um Krankschreibung oder Zahlung? Arbeitgeber-Rechtsschutz je nach Tarif.'),
('35-f-firmenwagen', 'Firmenwagen: Bist du hier abgesichert?', 'firma', [
  B('hook', 'aufgeregt', 'Dein Firmenwagen hat einen Unfall. Und jetzt?'),
  B('streit', 'ernst', 'Oft folgt Streit: um Schadenersatz, mit der Werkstatt oder wegen eines Bußgelds.'),
  B('fakt', 'eindringlich', 'Dein privater Verkehrs-Rechtsschutz gilt für Firmenfahrzeuge meist *nicht.*'),
  B('loesung', 'warm', 'Im Firmenrechtsschutz kannst du deine Firmenfahrzeuge je nach Tarif mit absichern.'),
  B('cta', 'freundlich', CTA)],
 'Unfall mit dem Firmenwagen? Oft folgt Streit um Schadenersatz, mit der Werkstatt oder wegen eines Bußgelds. Der private Verkehrs-Rechtsschutz gilt für Firmenfahrzeuge meist nicht. Firmenfahrzeuge im Firmenrechtsschutz je nach Tarif mit absichern.'),
('36-f-gruender', 'Gründer? Darum solltest du früh absichern', 'firma', [
  B('hook', 'begeistert', 'Du gründest gerade? Dann denk *früh* an Rechtsschutz.'),
  B('warum', 'ernst', 'Denn meist gilt eine Wartezeit von *drei Monaten.* Streit, der vorher beginnt, ist nicht versichert.'),
  B('was', 'eindringlich', 'Wichtig für Gründer: Arbeitgeber-Rechtsschutz, Steuer-Rechtsschutz vor Gericht und Ordnungswidrigkeiten.'),
  B('loesung', 'warm', 'Ein Firmenrechtsschutz nach Maß wächst je nach Tarif mit deinem Betrieb mit.'),
  B('cta', 'freundlich', CTA)],
 'Gerade gegründet? Meist gilt eine Wartezeit von 3 Monaten – Streit, der vorher beginnt, ist nicht versichert. Wichtig für Gründer: Arbeitgeber-, Steuer- (vor Gericht) und Ordnungswidrigkeiten-Rechtsschutz, je nach Tarif.'),
]
os.makedirs(OUT, exist_ok=True)
for i, (rid, title, topic, beats, cap) in enumerate(R):
    d = {'id': 'reel-' + rid, 'title': title, 'topic': topic, 'format': 'reel-2026',
         'caption': cap + ' Kostenloser Check über den Link in der Bio.\n\n' + (TAGS_V if topic == 'vermieter' else TAGS_F),
         'fine': '* je nach Tarif und Versicherungsbedingungen; Wartezeiten und Ausschlüsse beachten. Adrian Seitz, gebundener Versicherungsvertreter (§ 34d Abs. 7 GewO), Vertriebspartner der ARAG.',
         'beats': beats}
    json.dump(d, open(os.path.join(OUT, d['id'] + '.json'), 'w'), ensure_ascii=False, indent=1)
print(len(R), 'Skripte')
words = [len(' '.join(b['say'] for b in r[3]).split()) for r in R]
print('Wörter pro Reel:', min(words), '-', max(words))
