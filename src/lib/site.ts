/**
 * Zentrale Website-Konfiguration.
 * Pflichtangaben, die (noch) fehlen, sind bewusst als PLATZHALTER markiert
 * und werden auf der Website gelb hervorgehoben. Nichts davon ist erfunden.
 */

const env = (key: string, fallback: string) => {
  const v = process.env[key];
  return v && v.trim().length > 0 ? v.trim() : fallback;
};

export const PLACEHOLDER_PREFIX = "[PLATZHALTER";

export const site = {
  brand: env("NEXT_PUBLIC_BRAND_NAME", "Seitz Rechtsschutz"),
  brandShort: env("NEXT_PUBLIC_BRAND_SHORT", "Seitz"),
  url: env("NEXT_PUBLIC_SITE_URL", "https://www.seitz-rechtsschutz.de").replace(/\/$/, ""),
  owner: "Adrian Seitz",
  role: "Selbstständiger Versicherungsvermittler – Vertriebspartner der ARAG",
  email: env("NEXT_PUBLIC_CONTACT_EMAIL", "adrian.seitz@arag-partner.de"),
  phone: env("NEXT_PUBLIC_CONTACT_PHONE", "0176 20017708"),
  /** Optionaler externer Buchungslink (z. B. Calendly). Ohne Wert läuft die Terminanfrage über /kontakt. */
  bookingUrl: process.env.NEXT_PUBLIC_BOOKING_URL?.trim() || "",
  locale: "de_DE",
  description:
    "Persönliche Beratung zu Privat-, Arbeits-, Vermieter- und Firmenrechtsschutz. Kostenloser Rechtsschutz-Check in rund 60 Sekunden – unverbindlich und transparent.",
};

/** Angaben für Impressum & Erstinformation nach § 15 VersVermV – vor Veröffentlichung ausfüllen. */
export const legal = {
  name: "Adrian Seitz",
  street: "Kaiserheinrichstraße 50",
  city: "56220 Urmitz",
  status:
    "Gebundener Versicherungsvertreter nach § 34d Abs. 7 GewO, ausschließlich tätig für die ARAG SE",
  registerNumber: "D-NJIQ-LK7E6-45",
  chamber: "Industrie- und Handelskammer Koblenz, Schlossstraße 2, 56068 Koblenz",
  vatId: "",
  insurers: "ARAG SE, ARAG Platz 1, 40472 Düsseldorf",
  participations:
    "Ich halte keine direkte oder indirekte Beteiligung von über 10 % der Stimmrechte oder des Kapitals an einem Versicherungsunternehmen. Kein Versicherungsunternehmen und kein Mutterunternehmen eines Versicherungsunternehmens hält eine solche Beteiligung an mir.",
  remuneration:
    "Für die Vermittlung erhalte ich eine Provision vom Versicherer, die in der Versicherungsprämie enthalten ist. Für dich entstehen keine zusätzlichen Kosten.",
};

export const nav = [
  { href: "/privatrechtsschutz", label: "Privat" },
  { href: "/arbeitsrechtsschutz", label: "Arbeit" },
  { href: "/vermieterrechtsschutz", label: "Vermieter" },
  { href: "/firmenrechtsschutz", label: "Firma" },
  { href: "/kontakt", label: "Kontakt" },
];

export const isPlaceholder = (v: string) => v.startsWith(PLACEHOLDER_PREFIX);
