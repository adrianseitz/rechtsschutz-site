export type ProductKey = "privat" | "arbeit" | "vermieter" | "firma";

export type Product = {
  key: ProductKey;
  slug: string;
  name: string;
  short: string;
  icon: "Shield" | "Briefcase" | "House" | "Building2";
  cardText: string;
  cardTopics: string[];
  meta: { title: string; description: string };
  hero: { eyebrow: string; title: string; subtitle: string; cta: string };
  topicsTitle: string;
  topics: { title: string; text: string }[];
  facts: { title: string; text: string }[];
  notice: string;
  faq: { q: string; a: string }[];
  /** Das Wichtigste auf einen Blick – steht direkt unter der Überschrift (für Besucher aus Anzeigen). */
  quick?: { price: string; points: string[] };
  /** Was den ARAG-Schutz in diesem Bereich besonders macht (nur Vermieter und Firma). */
  usp?: {
    title: string;
    emphasis: string;
    intro: string;
    feature: { kicker: string; big: string; bigLabel: string; bigNote: string; title: string; text: string; points: string[] };
    items: { title: string; text: string }[];
    source: string;
  };
  /** Einstiegsbeiträge laut ARAG – immer mit den Annahmen darunter. */
  prices?: {
    title: string;
    emphasis: string;
    tiers: { name: string; price: string; text: string; badge?: string }[];
    addon?: { name: string; price: string; text: string };
    note: string;
  };
};

export const products: Record<ProductKey, Product> = {
  privat: {
    key: "privat",
    slug: "/privatrechtsschutz",
    name: "Privatrechtsschutz",
    short: "Privat",
    icon: "Shield",
    cardText: "Für rechtliche Auseinandersetzungen im Alltag – vom Online-Kauf bis zum Streit mit Handwerkern.",
    cardTopics: ["Verträge & Einkäufe", "Schadenersatz", "Behörden & Sozialrecht"],
    meta: {
      title: "Privatrechtsschutz – persönliche Beratung & Rechtsschutz-Check",
      description:
        "Privatrechtsschutz verständlich erklärt: Welche Bereiche du absichern kannst, was Wartezeiten bedeuten und wie du eine passende Absicherung findest. Kostenloser Check.",
    },
    hero: {
      eyebrow: "Privatrechtsschutz",
      title: "Privatrechtsschutz, der zu deinem Alltag passt.",
      subtitle:
        "Ärger mit Händler, Handwerker oder Behörde: Ein Rechtsstreit wird schnell teuer. Finde in 60 Sekunden heraus, welcher Schutz zu dir passt – ich berate dich persönlich. Versichert sind künftige Streitfälle.",
      cta: "Privatrechtsschutz prüfen",
    },
    topicsTitle: "Typische Bereiche im Privatrechtsschutz",
    topics: [
      { title: "Verträge & Einkäufe", text: "Ärger mit Händlern, Dienstleistern oder Handwerkern – etwa bei mangelhafter Ware oder nicht erbrachten Leistungen." },
      { title: "Schadenersatz", text: "Wenn du Ansprüche gegen jemanden durchsetzen möchtest, der dir einen Schaden zugefügt hat." },
      { title: "Sozial- & Verwaltungsrecht", text: "Streitigkeiten mit Sozialversicherungsträgern oder Behörden – je nach Tarif und Instanz." },
      { title: "Steuerrecht vor Gericht", text: "Unterstützung bei Verfahren vor Finanz- und Verwaltungsgerichten, sofern im Tarif enthalten." },
      { title: "Straf- & Ordnungswidrigkeiten", text: "Verteidigung bei bestimmten Vorwürfen – Umfang und Ausschlüsse hängen stark vom Tarif ab." },
      { title: "Beratung & Mediation", text: "Viele Tarife enthalten telefonische Erstberatung oder Mediation, um Konflikte früh zu klären." },
    ],
    facts: [
      { title: "Bausteine kombinieren", text: "Privatrechtsschutz lässt sich häufig mit Berufs-, Verkehrs- oder Wohnungsrechtsschutz kombinieren." },
      { title: "Wartezeit beachten", text: "Für viele Bereiche gilt nach Vertragsbeginn eine Wartezeit, häufig drei Monate. Einzelne Bereiche sind oft sofort versichert." },
      { title: "Nur zukünftige Fälle", text: "Versichert sind Rechtsstreitigkeiten, deren Ursache nach Vertragsbeginn (und ggf. nach Ablauf der Wartezeit) liegt." },
    ],
    notice:
      "Umfang, Leistungsgrenzen, Selbstbeteiligung und Wartezeiten richten sich nach dem gewählten Tarif und den jeweiligen Versicherungsbedingungen. Gerne erkläre ich dir die Details im persönlichen Gespräch.",
    faq: [
      { q: "Ist ein bereits laufender Streit versichert?", a: "Nein. Rechtsschutzversicherungen leisten nur für Fälle, deren Ursache nach Versicherungsbeginn und gegebenenfalls nach Ablauf der Wartezeit eintritt." },
      { q: "Kann ich meine Familie mitversichern?", a: "Bei vielen Tarifen ja – häufig gibt es Varianten für Singles, Paare und Familien. Welche Personen genau mitversichert sind, regeln die Bedingungen." },
    ],
  },
  arbeit: {
    key: "arbeit",
    slug: "/arbeitsrechtsschutz",
    name: "Arbeitsrechtsschutz",
    short: "Arbeit",
    icon: "Briefcase",
    cardText: "Für zukünftige Konflikte mit dem Arbeitgeber – von der Abmahnung bis zur Kündigung.",
    cardTopics: ["Kündigung", "Abmahnung", "Arbeitszeugnis"],
    meta: {
      title: "Arbeitsrechtsschutz – rechtzeitig abgesichert im Job",
      description:
        "Arbeitsrechtsschutz für zukünftige Streitigkeiten mit dem Arbeitgeber: Kündigung, Abmahnung, Zeugnis, Gehalt. Wartezeiten verstehen und passende Absicherung finden.",
    },
    hero: {
      eyebrow: "Arbeitsrechtsschutz",
      title: "Arbeitsrechtsschutz – bevor es im Job schwierig wird.",
      subtitle:
        "Kündigung, Abmahnung, Zeugnis: Vor dem Arbeitsgericht zahlt in der ersten Instanz jede Seite ihren Anwalt selbst. Finde in 60 Sekunden heraus, welcher Schutz zu dir passt. Versichert sind künftige Streitfälle.",
      cta: "Arbeitsrechtsschutz prüfen",
    },
    topicsTitle: "Typische Themen im Arbeitsrecht",
    topics: [
      { title: "Kündigungsschutz", text: "Wenn du dich gegen eine Kündigung wehren möchtest – etwa mit einer Kündigungsschutzklage." },
      { title: "Abmahnungen", text: "Unterstützung, wenn du eine aus deiner Sicht ungerechtfertigte Abmahnung erhältst." },
      { title: "Arbeitszeugnisse", text: "Wenn dein Zeugnis nicht wohlwollend oder unvollständig formuliert ist." },
      { title: "Gehaltsstreitigkeiten", text: "Bei Auseinandersetzungen um ausstehenden Lohn, Überstunden oder Sonderzahlungen." },
      { title: "Arbeitsverträge", text: "Streit über Vertragsinhalte, Versetzungen oder Änderungskündigungen." },
    ],
    facts: [
      {
        title: "Eigene Anwaltskosten in der 1. Instanz",
        text: "Vor dem Arbeitsgericht trägt in der ersten Instanz jede Partei ihre Anwaltskosten in der Regel selbst – unabhängig vom Ausgang (§ 12a ArbGG).",
      },
      { title: "Wartezeit einplanen", text: "Im Arbeitsrecht gilt meist eine Wartezeit, häufig drei Monate. Wer erst handelt, wenn die Stimmung im Betrieb kippt, ist oft zu spät dran." },
      { title: "Kein rückwirkender Schutz", text: "Konflikte, die sich bereits abzeichnen oder laufen, sind nicht versicherbar. Entscheidend ist der Zeitpunkt der Ursache." },
    ],
    notice:
      "Ob und in welchem Umfang ein Fall versichert ist, hängt vom Tarif, den Versicherungsbedingungen und möglichen Wartezeiten ab. Arbeitsrechtsschutz wird häufig als Baustein zusammen mit Privatrechtsschutz angeboten.",
    faq: [
      { q: "Ich habe schon eine Kündigung erhalten – kann ich mich jetzt noch versichern?", a: "Für diesen konkreten Fall leider nicht. Versichert sind nur Streitigkeiten, deren Ursache nach Versicherungsbeginn und Ablauf der Wartezeit liegt. Für zukünftige Fälle kann eine Absicherung trotzdem sinnvoll sein." },
      { q: "Gilt der Schutz auch für Beamte oder Azubis?", a: "Für Beamte, Auszubildende und Angestellte gibt es passende Lösungen. Bei Beamten betrifft der Schutz dienstrechtliche Streitigkeiten, die oft vor Verwaltungsgerichten verhandelt werden – Details regelt der Tarif." },
    ],
  },
  vermieter: {
    key: "vermieter",
    slug: "/vermieterrechtsschutz",
    name: "Vermieterrechtsschutz",
    short: "Vermieter",
    icon: "House",
    cardText: "Für zukünftige Auseinandersetzungen rund um deine vermietete Wohnung oder dein Haus – auf Wunsch mit Mietausfallschutz für bis zu 12 Monatsmieten.",
    cardTopics: ["Mietstreit", "Räumung", "Mietausfallschutz"],
    meta: {
      title: "Vermieterrechtsschutz – für deine vermietete Immobilie",
      description:
        "Vermieterrechtsschutz der ARAG: Mietstreit, Räumungsklage, Mietnomaden, Betriebskosten – auf Wunsch mit Mietausfallschutz für bis zu 12 Monatsmieten. Persönliche Beratung und kostenloser Check.",
    },
    hero: {
      eyebrow: "Vermieterrechtsschutz",
      title: "Vermieterrechtsschutz – bevor der Mieter nicht mehr zahlt.",
      subtitle:
        "Mietrückstand, Räumungsklage, Streit um die Nebenkosten: Der Vermieterrechtsschutz übernimmt im Rahmen deines Tarifs Anwalts- und Gerichtskosten – auf Wunsch mit Mietausfallschutz, der bis zu 12 Monatsmieten ersetzt. Versichert sind künftige Streitfälle.",
      cta: "Vermieterrechtsschutz prüfen",
    },
    topicsTitle: "Typische Themen für Vermieter",
    topics: [
      { title: "Mietausfallschutz", text: "Zahlt dein Mieter nicht mehr, ersetzt der Mietausfallschutz der ARAG die ausfallende Miete samt laufender Nebenkosten – je nach Vereinbarung für bis zu 6 oder 12 Monate. Als Zusatzbaustein wählbar." },
      { title: "Mietstreitigkeiten", text: "Auseinandersetzungen mit Mietern über Pflichten aus dem Mietvertrag." },
      { title: "Kündigung von Mietverhältnissen", text: "Wenn eine Kündigung rechtlich durchgesetzt oder verteidigt werden muss." },
      { title: "Räumungsklagen", text: "Rechtliche Schritte, wenn eine Wohnung trotz beendetem Mietverhältnis nicht geräumt wird – Umfang laut Tarif." },
      { title: "Betriebskosten", text: "Streit über Nebenkostenabrechnungen, Nachzahlungen oder Umlagefähigkeit." },
      { title: "Auseinandersetzungen mit Mietern", text: "Etwa bei Schäden an der Mietsache oder Streit über Mieterhöhungen." },
    ],
    facts: [
      { title: "Privatrechtsschutz reicht nicht", text: "Ein privater Rechtsschutz deckt Streit um vermietete Objekte in der Regel nicht ab. Dafür brauchst du den Vermieter-Baustein – das übersehen viele, bis es zum Streit kommt." },
      { title: "Jede Einheit zählt", text: "Versichert werden konkrete Objekte bzw. Wohneinheiten. Kommt eine Wohnung dazu, sollte sie in den Vertrag – sonst ist sie nicht geschützt." },
      { title: "Vor dem Streit absichern", text: "Für Mietangelegenheiten gilt meist eine Wartezeit, häufig drei Monate. Ein bestehender Mietrückstand oder Streit lässt sich nicht nachträglich versichern." },
    ],
    notice:
      "Der Mietausfallschutz ist ein Zusatzbaustein in ausgewählten Tarifen. Für ihn gilt eine Wartezeit von drei Monaten; Leerstand und bereits bestehende Zahlungsrückstände sind nicht versichert. Leistungen wie die Übernahme von Kosten für Räumungsverfahren, Leistungsgrenzen und Selbstbeteiligungen unterscheiden sich je nach Tarif. Pauschale Zusagen sind deshalb nicht möglich – ich prüfe gern, was zu deiner Immobilie passt.",
    faq: [
      { q: "Brauche ich für jede Wohnung einen eigenen Vertrag?", a: "Nicht unbedingt. Häufig lassen sich mehrere Wohneinheiten in einem Vertrag absichern. Entscheidend sind Anzahl und Art der Objekte." },
      { q: "Was ist, wenn mein Mieter nicht mehr zahlt?", a: "Der Rechtsschutz übernimmt – je nach Tarif – die Kosten, um deine Ansprüche durchzusetzen: Mahnverfahren, Anwalt, Gericht und Räumung. Die Miete selbst ersetzt er nicht. Dafür gibt es bei der ARAG den Mietausfallschutz als Zusatzbaustein: Er ersetzt die ausfallende Miete samt laufender Nebenkosten, je nach Vereinbarung für bis zu 6 oder 12 Monate." },
      { q: "Was muss ich beim Mietausfallschutz beachten?", a: "Er lässt sich in ausgewählten Tarifen zum Vermieterrechtsschutz dazuwählen. Es gilt eine Wartezeit von drei Monaten. Nicht versichert sind Leerstand ohne Mietverhältnis und Zahlungsrückstände, die beim Abschluss schon bestehen oder bekannt sind. Die genauen Voraussetzungen gehe ich mit dir anhand der Bedingungen durch." },
      { q: "Kann ich die Beiträge von der Steuer absetzen?", a: "Die Beiträge hängen mit deinen Mieteinnahmen zusammen und lassen sich deshalb in der Regel als Werbungskosten bei den Einkünften aus Vermietung und Verpachtung ansetzen. Verbindlich klärt das deine Steuerberatung." },
      { q: "Kann ich die Kosten auf meine Mieter umlegen?", a: "Nein. Eine Rechtsschutzversicherung gehört nicht zu den umlagefähigen Betriebskosten und kann nicht über die Nebenkostenabrechnung weitergegeben werden." },
      { q: "Was passiert bei Mietnomaden?", a: "Je nach Tarif übernimmt die ARAG die Anwalts- und Gerichtskosten, die Kosten der Räumungsvollstreckung und sogar das Ausräumen, den Abtransport und das Einlagern des Inventars. Mit dem Mietausfallschutz wird zusätzlich die ausfallende Miete samt laufender Nebenkosten ersetzt – für 6 oder bis zu 12 Monate." },
      { q: "Kann ich später weitere Wohnungen dazunehmen?", a: "Ja. Nach 6 Monaten Vertragslaufzeit lassen sich weitere Objekte ohne neue Wartezeit nachversichern. Eine Wohneinheit, die du selbst bewohnst, ist beitragsfrei mitversichert." },
    ],
    quick: {
      price: "6,45",
      points: [
        "Mietausfallschutz: bis zu 12 Monatsmieten (wählbar)",
        "Anwalt & Gericht bei Räumung, Mietrückstand, Nebenkosten",
        "Unbegrenzte Versicherungssumme · Anwalt am Telefon 24/7",
      ],
    },
    usp: {
      title: "Was den Vermieter\u00ADrechtsschutz der ARAG besonders macht.",
      emphasis: "besonders",
      intro: "Ich vermittle ausschließlich die ARAG. Für Vermieter hat sie Leistungen, die du nicht bei jedem Rechtsschutzversicherer bekommst.",
      feature: {
        kicker: "Mietausfallschutz",
        big: "12",
        bigLabel: "Monatsmieten",
        bigNote: "So lange ersetzt die ARAG die ausfallende Miete samt laufender Nebenkosten – je nach Vereinbarung 6 oder 12 Monate.",
        title: "Dein Mieter zahlt nicht? Deine Miete kommt trotzdem.",
        text: "Der Rechtsschutz bezahlt den Anwalt, das Mahnverfahren und die Räumung. Der Mietausfallschutz geht einen Schritt weiter: Er ersetzt die Nettomiete und die laufenden Nebenkosten, die dir fehlen. Nicht jeder Rechtsschutzversicherer bietet so einen Baustein überhaupt an.",
        points: [
          "Zusatzbaustein in den Tarifen Komfort und Premium",
          "Ab rund 9 € im Monat zusätzlich für eine Wohneinheit",
          "Gilt für Eigentumswohnung, Ein- und Mehrfamilienhaus – meist für alle Einheiten eines Objekts",
          "Wartezeit 3 Monate; nicht versichert sind Leerstand und Rückstände, die beim Abschluss schon bestehen",
        ],
      },
      items: [
        { title: "Mietnomaden: Räumung inklusive", text: "Anwalt, Gericht, Räumungsvollstreckung – und sogar Ausräumen, Abtransport und Einlagern des Inventars, je nach Tarif." },
        { title: "Das Mahnverfahren macht ein Profi", text: "Bei Mietrückständen kümmert sich ein Dienstleister um das Forderungsmanagement (Komfort und Premium)." },
        { title: "Unbegrenzte Versicherungssumme", text: "In allen drei Tarifen – auch ein langer Streit über mehrere Instanzen stößt an keine Obergrenze." },
        { title: "Anwalt am Telefon, rund um die Uhr", text: "Telefonische Rechtsberatung, Mediation und Musterschreiben gibt es ab dem ersten Tag – ohne Wartezeit." },
        { title: "Mieter vorher prüfen", text: "Mit dem Bonitäts-Check prüfst du Mietinteressenten, bevor du unterschreibst – diskret und digital." },
        { title: "Neue Wohnung? Einfach dazunehmen", text: "Ab 6 Monaten Vertragslaufzeit nimmst du weitere Objekte ohne neue Wartezeit mit in den Vertrag." },
        { title: "Eigene Wohnung beitragsfrei", text: "Wohnst du selbst in einer Einheit, ist sie beitragsfrei mitversichert." },
        { title: "Update-Garantie", text: "Verbessert die ARAG ihre Leistungen, gelten sie automatisch auch für deinen Vertrag – ohne Mehrkosten." },
      ],
      source: "Angaben laut ARAG-Produktinformationen (Stand November 2026). Welche Leistungen in welchem Tarif enthalten sind, gehe ich mit dir durch; maßgeblich sind die Versicherungsbedingungen.",
    },
    prices: {
      title: "Was kostet der Vermieter\u00ADrechtsschutz?",
      emphasis: "kostet",
      tiers: [
        { name: "Basis", price: "6,45", text: "Anwalts- und Gerichtskosten, wenn es vor Gericht geht." },
        { name: "Komfort", price: "15,90", text: "Zusätzlich außergerichtliche Anwaltskosten und Forderungsmanagement bei Mietrückständen. Mietausfallschutz wählbar.", badge: "Empfehlung der ARAG" },
        { name: "Premium", price: "27,88", text: "Zusätzlich Bauherren-Rechtsschutz und Schutz bei Streit mit Handwerkern. Mietausfallschutz wählbar." },
      ],
      addon: { name: "Mietausfallschutz", price: "9", text: "für eine Wohneinheit bis 15.000 € Bruttojahresmiete, in Komfort und Premium" },
      note: "Monatsbeiträge laut ARAG (Stand November 2026) für eine Person mit einer vermieteten Wohneinheit bis 12.000 € Bruttojahresmiete, ohne Selbstbeteiligung; Mietausfallschutz „ab rund 9 €“. Dein Beitrag hängt von Mieteinnahmen, Anzahl der Einheiten und Tarif ab – ich rechne ihn dir genau aus.",
    },
  },
  firma: {
    key: "firma",
    slug: "/firmenrechtsschutz",
    name: "Firmenrechtsschutz",
    short: "Firma",
    icon: "Building2",
    cardText: "Für Selbstständige und Unternehmen – mit Soforthilfe sogar für einen Streit, der schon begonnen hat.",
    cardTopics: ["Arbeitgeber-Rechtsschutz", "Steuerrecht", "Gewerbliche Risiken"],
    meta: {
      title: "Firmenrechtsschutz – Rechtsschutz für Selbstständige & Unternehmen",
      description:
        "Firmenrechtsschutz der ARAG für Selbstständige, Freiberufler und GmbHs: Arbeitsrecht als Arbeitgeber, Steuerrecht, Forderungsmanagement – mit Soforthilfe sogar rückwirkend. Persönliche Beratung.",
    },
    hero: {
      eyebrow: "Firmenrechtsschutz",
      title: "Firmenrechtsschutz mit Soforthilfe – sogar rückwirkend.",
      subtitle:
        "Streit mit Mitarbeitern, Finanzgericht, Bußgeldbescheid: Der Firmenrechtsschutz übernimmt im Rahmen deines Tarifs Anwalts- und Gerichtskosten. Und mit der Soforthilfe gibt es sogar für einen Streit, der schon begonnen hat, außergerichtliche Unterstützung.",
      cta: "Firmenrechtsschutz prüfen",
    },
    topicsTitle: "Typische Bereiche im Firmenrechtsschutz",
    topics: [
      { title: "Arbeitsrechtliche Streitigkeiten", text: "Auseinandersetzungen mit Mitarbeitenden, z. B. nach einer Kündigung – aus Sicht des Arbeitgebers." },
      { title: "Vertragsrechtliche Risiken", text: "Streit mit Kunden oder Lieferanten – nur soweit versicherbar und im Tarif als Baustein enthalten." },
      { title: "Steuerrechtliche Streitigkeiten", text: "Verfahren vor Finanzgerichten, sofern im Tarif eingeschlossen." },
      { title: "Gewerbliche Risiken", text: "Etwa Schadenersatzansprüche oder Ordnungswidrigkeiten im Zusammenhang mit dem Betrieb." },
      { title: "Individuelle Absicherung", text: "Zuschnitt nach Branche, Unternehmensgröße und Rechtsform – inklusive optionaler Bausteine." },
    ],
    facts: [
      { title: "Nicht jedes Risiko ist versichert", text: "Typische unternehmerische Risiken – etwa Gesellschafterstreit oder bestimmte Vertragsstreitigkeiten – sind häufig ausgeschlossen oder nur eingeschränkt versicherbar." },
      { title: "Bausteine nach Bedarf", text: "Firmenrechtsschutz ist modular aufgebaut. Welche Bausteine sinnvoll sind, hängt von deinem Geschäftsmodell ab." },
      { title: "Privater Schutz gilt nicht im Betrieb", text: "Dein privater Rechtsschutz gilt in der Regel nicht für deine selbstständige Tätigkeit. Für den Betrieb brauchst du eine eigene Absicherung – am besten, bevor der erste Streit da ist, denn auch hier gelten Wartezeiten." },
    ],
    notice:
      "Nicht jedes unternehmerische Risiko ist automatisch versichert. Versicherungsschutz besteht nur im Rahmen des gewählten Tarifs und der Versicherungsbedingungen. Die Soforthilfe gilt einmalig für einen zurückliegenden Fall, nur außergerichtlich, in begrenzter Höhe und nur, wenn noch kein Anwalt kontaktiert oder beauftragt wurde. Im Gespräch klären wir, was für dein Unternehmen tatsächlich infrage kommt.",
    faq: [
      { q: "Ist mein Vertragsstreit mit einem Kunden versichert?", a: "Das hängt stark vom Tarif ab. Vertragsrechtsschutz für Unternehmen ist häufig nur als optionaler Baustein und mit Einschränkungen erhältlich." },
      { q: "Gibt es Lösungen für Freiberufler?", a: "Ja, es gibt Angebote für Selbstständige und Freiberufler. Welche Bausteine passen, klären wir anhand deiner Tätigkeit." },
      { q: "Kann ich die Beiträge als Betriebsausgabe absetzen?", a: "Beiträge für einen betrieblichen Rechtsschutz sind in der Regel Betriebsausgaben. Verbindlich klärt das deine Steuerberatung." },
      { q: "Ich habe schon einen Streit – kann ich mich jetzt noch absichern?", a: "Ein laufender Streit ist normalerweise nicht versicherbar. Mit dem Firmenrechtsschutz mit Soforthilfe bekommst du aber einmalig außergerichtliche Unterstützung für einen zurückliegenden Fall – ohne Wartezeit, bis 2.000 € im Tarif Komfort oder 3.000 € im Tarif Premium. Voraussetzung: Du hast für diesen Fall noch keinen Anwalt kontaktiert oder beauftragt. Gerichts- und Mahnverfahren, die schon laufen, sind ausgeschlossen. Künftige Streitfälle sind ganz normal im Rahmen deines Tarifs versichert." },
      { q: "Was heißt „außergerichtliche Unterstützung“ bei der Soforthilfe?", a: "Zum Beispiel ein Anwalt, der dich berät und für dich mit der Gegenseite verhandelt, oder eine Wirtschaftsmediation. Ein Gerichtsverfahren ist bei der Soforthilfe nicht eingeschlossen." },
    ],
    quick: {
      price: "43,00",
      points: [
        "Hilfe auch bei Streit, der schon begonnen hat (außergerichtlich)",
        "Arbeitgeber-, Steuer- und Straf-Rechtsschutz",
        "Unbegrenzte Versicherungssumme · Inkasso offener Rechnungen",
      ],
    },
    usp: {
      title: "Was den Firmen\u00ADrechtsschutz der ARAG besonders macht.",
      emphasis: "besonders",
      intro: "Ich vermittle ausschließlich die ARAG. Für Selbstständige und Unternehmen gibt es dort einen Baustein, der sogar bei einem Streit hilft, der schon begonnen hat.",
      feature: {
        kicker: "Firmenrechtsschutz mit Soforthilfe",
        big: "Sofort",
        bigLabel: "sogar rückwirkend",
        bigNote: "Hilfe für einen zurückliegenden Rechtsfall – ohne Wartezeit. Laut ARAG gibt es das so nur bei der ARAG.",
        title: "Schon Ärger im Betrieb? Du bekommst trotzdem Hilfe.",
        text: "Normalerweise lässt sich ein Streit, der schon läuft, nicht mehr versichern. Mit der Soforthilfe übernimmt die ARAG einmalig die außergerichtliche Unterstützung für einen zurückliegenden Fall – etwa einen Anwalt, der berät und verhandelt, oder eine Mediation. Künftige Streitfälle sind im Rahmen deines Tarifs versichert.",
        points: [
          "Ohne Wartezeit",
          "Bis 2.000 € im Tarif Komfort, bis 3.000 € im Tarif Premium",
          "Voraussetzung: Für den Fall ist noch kein Anwalt kontaktiert oder beauftragt",
          "Nur außergerichtlich – laufende Gerichts- oder Mahnverfahren sind ausgeschlossen",
        ],
      },
      items: [
        { title: "Arbeitgeber-Rechtsschutz", text: "Streit mit Mitarbeitenden, etwa nach einer Kündigung. In Premium auch Beratung zu Betriebsvereinbarungen und Arbeitszeit." },
        { title: "Offene Rechnungen eintreiben", text: "Online-Forderungsmanagement in Komfort und Premium – in Premium sogar für bestrittene Forderungen." },
        { title: "Unbegrenzte Versicherungssumme", text: "Für Streitfälle in Europa in allen Tarifen – ohne Obergrenze." },
        { title: "Rechts- und Steuertelefon", text: "Juristische Ersteinschätzung am Telefon und ein Steuertelefon – ab dem ersten Tag, ohne Wartezeit." },
        { title: "Wirtschaftsmediation", text: "Streit mit Geschäftspartnern ohne Gericht lösen – schneller, günstiger und oft ohne die Geschäftsbeziehung zu verlieren." },
        { title: "Bonität prüfen", text: "Die ersten vier Bonitätsprüfungen sind in Komfort und Premium kostenlos." },
        { title: "Schutz für die Geschäftsführung", text: "Als Zusatzbaustein: erweiterter und Spezial-Straf-Rechtsschutz für Inhaber und Führungskräfte." },
        { title: "Schadenservice „sehr gut“", text: "Den Schadenservice der ARAG hat der TÜV Saarland mit „sehr gut“ bewertet (06/2025)." },
      ],
      source: "Angaben laut ARAG-Produktinformationen (Stand November 2026). Welche Leistungen in welchem Tarif enthalten sind, gehe ich mit dir durch; maßgeblich sind die Versicherungsbedingungen.",
    },
    prices: {
      title: "Was kostet der Firmen\u00ADrechtsschutz?",
      emphasis: "kostet",
      tiers: [
        { name: "Basis", price: "43,00", text: "Die wichtigsten Bereiche: Arbeitgeber-, Schadenersatz-, Steuer- und Straf-Rechtsschutz." },
        { name: "Komfort", price: "65,06", text: "Zusätzlich gewerbliche Mieträume, Online-Forderungsmanagement, Bonitätsprüfungen und Vertragscheck. Auch mit Soforthilfe erhältlich." },
        { name: "Premium", price: "92,41", text: "Zusätzlich Wettbewerbs-, Patent- und Urheberrecht sowie Forderungsmanagement für bestrittene Forderungen. Auch mit Soforthilfe erhältlich." },
      ],
      note: "Monatsbeiträge laut ARAG (Stand November 2026), Beispiel: Betrieb mit 3 Mitarbeitenden, monatliche Zahlung, 250 € Selbstbeteiligung. Dein Beitrag hängt von deinem Betrieb und dem Tarif ab – auch mit Soforthilfe rechne ich ihn dir genau aus.",
    },
  },
};

export const productList = [products.privat, products.arbeit, products.vermieter, products.firma];
