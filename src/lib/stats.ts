/** Anonyme, aggregierte Besucherzahlen pro Tag (keine Personendaten). */
export type DayStats = {
  views: number;
  visitors: number;
  pages: Record<string, number>;
  sources: Record<string, number>;
  devices: Record<string, number>;
  /** Anonyme Zähler für Aktionen (z. B. Anruf-Klick, Schritte im Check). */
  events?: Record<string, number>;
};

export type StatsData = Record<string, DayStats>; // Schlüssel: YYYY-MM-DD (Europe/Berlin)

export const emptyDay = (): DayStats => ({ views: 0, visitors: 0, pages: {}, sources: {}, devices: {} });

export const PAGE_LABEL: Record<string, string> = {
  "/": "Startseite",
  "/privatrechtsschutz": "Privatrechtsschutz",
  "/arbeitsrechtsschutz": "Arbeitsrechtsschutz",
  "/vermieterrechtsschutz": "Vermieterrechtsschutz",
  "/firmenrechtsschutz": "Firmenrechtsschutz",
  "/rechtsschutz-check": "Rechtsschutz-Check",
  "/kontakt": "Kontakt",
  "/vielen-dank": "Danke-Seite (Anfrage gesendet)",
  "/impressum": "Impressum",
  "/datenschutz": "Datenschutz",
};

/** Aktionen, die gezählt werden dürfen (alles andere wird verworfen). */
export const EVENT_LABEL: Record<string, string> = {
  call: "Anruf-Klicks",
  mail: "E-Mail-Klicks",
  check_start: "Check gestartet",
  step_situation: "Situation gewählt",
  step_einheiten: "Wohneinheiten angegeben",
  step_beginn: "Beginn gewählt",
  step_bestand: "Kontaktformular erreicht",
  lead: "Anfrage abgeschickt",
};
