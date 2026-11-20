import { site } from "./site";

/**
 * Zwei Domains, eine Website: seitz-rechtsschutz.de zeigt „Seitz Rechtsschutz“, im-rechtsschutz.de zeigt „im Rechtsschutz“.
 * Inhalte, Check, CRM und Impressum sind gleich. Für Google bleibt seitz-rechtsschutz.de die Hauptadresse (Canonical).
 */
export type Brand = {
  key: "seitz" | "im";
  name: string;   // im Titel, in Vorschauen und strukturierten Daten
  short: string;  // erster Teil im Logo („Seitz“ / „im“), danach kursiv „Rechtsschutz“
  mark: string;   // großes Wort unten im Footer
  url: string;
};

export const BRANDS: Record<Brand["key"], Brand> = {
  seitz: { key: "seitz", name: site.brand, short: site.brandShort, mark: site.brandShort, url: site.url },
  im: { key: "im", name: "im Rechtsschutz", short: "im", mark: "im Recht", url: (process.env.NEXT_PUBLIC_SITE_URL_2 || "https://www.im-rechtsschutz.de").replace(/\/$/, "") },
};

/** Welche Marke gehört zur aufgerufenen Adresse? (Host-Header, ggf. mit Port) */
export const brandForHost = (host?: string | null): Brand =>
  host && /(^|\.)im-rechtsschutz\.de(:\d+)?$/i.test(host.split(",")[0].trim()) ? BRANDS.im : BRANDS.seitz;
