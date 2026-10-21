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
      title: "Im Alltag abgesichert, wenn es rechtlich wird.",
      subtitle:
        "Ob Streit mit dem Online-Händler, dem Handwerker oder einer Behörde – informiere dich, wie Privatrechtsschutz dich bei zukünftigen Auseinandersetzungen unterstützen kann.",
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
      title: "Rechtzeitig abgesichert, wenn es im Job schwierig wird.",
      subtitle:
        "Informiere dich über Rechtsschutz für zukünftige arbeitsrechtliche Streitigkeiten und finde eine passende Absicherung.",
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
      { title: "Wartezeit einplanen", text: "Im Arbeitsrecht gilt meist eine Wartezeit, häufig drei Monate. Wer früh vorsorgt, ist im Ernstfall besser vorbereitet." },
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
    cardText: "Für zukünftige Auseinandersetzungen rund um deine vermietete Wohnung oder dein Haus.",
    cardTopics: ["Mietstreit", "Betriebskosten", "Räumung"],
    meta: {
      title: "Vermieterrechtsschutz – für deine vermietete Immobilie",
      description:
        "Vermieterrechtsschutz verständlich erklärt: Mietstreitigkeiten, Kündigung, Räumungsklage, Betriebskosten. Persönliche Beratung und kostenloser Check.",
    },
    hero: {
      eyebrow: "Vermieterrechtsschutz",
      title: "Vermieten bringt Verantwortung. Sichere dich passend ab.",
      subtitle:
        "Informiere dich über Rechtsschutzmöglichkeiten für zukünftige rechtliche Auseinandersetzungen rund um deine vermietete Immobilie.",
      cta: "Vermieterrechtsschutz prüfen",
    },
    topicsTitle: "Typische Themen für Vermieter",
    topics: [
      { title: "Mietstreitigkeiten", text: "Auseinandersetzungen mit Mietern über Pflichten aus dem Mietvertrag." },
      { title: "Kündigung von Mietverhältnissen", text: "Wenn eine Kündigung rechtlich durchgesetzt oder verteidigt werden muss." },
      { title: "Räumungsklagen", text: "Rechtliche Schritte, wenn eine Wohnung trotz beendetem Mietverhältnis nicht geräumt wird – Umfang laut Tarif." },
      { title: "Betriebskosten", text: "Streit über Nebenkostenabrechnungen, Nachzahlungen oder Umlagefähigkeit." },
      { title: "Auseinandersetzungen mit Mietern", text: "Etwa bei Schäden an der Mietsache oder Streit über Mieterhöhungen." },
    ],
    facts: [
      { title: "Pro Objekt versichert", text: "Vermieterrechtsschutz bezieht sich meist auf konkrete Objekte bzw. Wohneinheiten. Weitere Einheiten lassen sich oft ergänzen." },
      { title: "Wartezeit beachten", text: "Für Miet- und Grundstücksangelegenheiten gilt in der Regel eine Wartezeit, häufig drei Monate." },
      { title: "Bestehende Konflikte ausgeschlossen", text: "Ein bereits bestehender Mietrückstand oder Streit kann nachträglich nicht versichert werden." },
    ],
    notice:
      "Leistungen wie die Übernahme von Kosten für Räumungsverfahren, Leistungsgrenzen und Selbstbeteiligungen unterscheiden sich je nach Tarif. Pauschale Zusagen sind deshalb nicht möglich – ich prüfe gern, was zu deiner Immobilie passt.",
    faq: [
      { q: "Brauche ich für jede Wohnung einen eigenen Vertrag?", a: "Nicht unbedingt. Häufig lassen sich mehrere Wohneinheiten in einem Vertrag absichern. Entscheidend sind Anzahl und Art der Objekte." },
      { q: "Sind ausstehende Mieten versichert?", a: "Rechtsschutz übernimmt – je nach Tarif – Kosten für die rechtliche Durchsetzung, ersetzt aber nicht die ausgefallene Miete selbst. Bereits bestehende Rückstände sind nicht versicherbar." },
    ],
  },
  firma: {
    key: "firma",
    slug: "/firmenrechtsschutz",
    name: "Firmenrechtsschutz",
    short: "Firma",
    icon: "Building2",
    cardText: "Für Selbstständige und Unternehmen, die sich auf ihr Geschäft konzentrieren möchten.",
    cardTopics: ["Arbeitgeber-Rechtsschutz", "Steuerrecht", "Gewerbliche Risiken"],
    meta: {
      title: "Firmenrechtsschutz – Rechtsschutz für Selbstständige & Unternehmen",
      description:
        "Firmenrechtsschutz für Selbstständige, Freiberufler und GmbHs: Arbeitsrecht als Arbeitgeber, Steuerrecht, gewerbliche Risiken. Persönliche Beratung.",
    },
    hero: {
      eyebrow: "Firmenrechtsschutz",
      title: "Konzentriere dich auf dein Unternehmen. Informiere dich über passenden Rechtsschutz.",
      subtitle:
        "Rechtliche Auseinandersetzungen können Zeit und Geld kosten. Finde heraus, welche Absicherung für dein Unternehmen infrage kommt.",
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
      { title: "Wartezeiten", text: "Auch im gewerblichen Bereich gelten für viele Rechtsgebiete Wartezeiten nach Vertragsbeginn." },
    ],
    notice:
      "Nicht jedes unternehmerische Risiko ist automatisch versichert. Versicherungsschutz besteht nur im Rahmen des gewählten Tarifs und der Versicherungsbedingungen. Im Gespräch klären wir, was für dein Unternehmen tatsächlich infrage kommt.",
    faq: [
      { q: "Ist mein Vertragsstreit mit einem Kunden versichert?", a: "Das hängt stark vom Tarif ab. Vertragsrechtsschutz für Unternehmen ist häufig nur als optionaler Baustein und mit Einschränkungen erhältlich." },
      { q: "Gibt es Lösungen für Freiberufler?", a: "Ja, es gibt Angebote für Selbstständige und Freiberufler. Welche Bausteine passen, klären wir anhand deiner Tätigkeit." },
    ],
  },
};

export const productList = [products.privat, products.arbeit, products.vermieter, products.firma];
