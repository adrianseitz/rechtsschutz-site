/** Anonyme, aggregierte Besucherzahlen pro Tag (keine Personendaten). */
export type DayStats = {
  views: number;
  visitors: number;
  pages: Record<string, number>;
  sources: Record<string, number>;
  devices: Record<string, number>;
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
