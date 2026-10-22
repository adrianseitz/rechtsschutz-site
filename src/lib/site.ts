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
  email: env("NEXT_PUBLIC_CONTACT_EMAIL", "Adrian.Seitz@arag-partner.de"),
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
    "[PLATZHALTER: Status laut Gewerbeerlaubnis/Registereintrag, z. B. gebundener Versicherungsvertreter nach § 34d Abs. 7 GewO oder Versicherungsvertreter mit Erlaubnis nach § 34d Abs. 1 GewO]",
  registerNumber: "[PLATZHALTER: Registrierungsnummer, Format D-XXXX-XXXXX-XX]",
  chamber: "[PLATZHALTER: Zuständige IHK inkl. Anschrift]",
  vatId: "[PLATZHALTER: USt-IdNr., falls vorhanden – sonst Zeile entfernen]",
  insurers: "[PLATZHALTER: Versicherer, für die Sie tätig sind, z. B. ARAG SE / ARAG Allgemeine Versicherungs-AG – bitte exakt laut Agenturvertrag]",
  participations:
    "[PLATZHALTER: Erklärung zu direkten/indirekten Beteiligungen über 10 % an bzw. von Versicherungsunternehmen]",
  remuneration:
    "[PLATZHALTER: Art der Vergütung laut § 15 Abs. 1 Nr. 8 VersVermV, z. B. Provision, die in der Versicherungsprämie enthalten ist]",
};

export const nav = [
  { href: "/privatrechtsschutz", label: "Privat" },
  { href: "/arbeitsrechtsschutz", label: "Arbeit" },
  { href: "/vermieterrechtsschutz", label: "Vermieter" },
  { href: "/firmenrechtsschutz", label: "Firma" },
  { href: "/kontakt", label: "Kontakt" },
];

export const isPlaceholder = (v: string) => v.startsWith(PLACEHOLDER_PREFIX);
