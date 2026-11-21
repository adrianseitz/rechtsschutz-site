import { z } from "zod";
import { AREA_VALUES, BEGINN, BESTAND, EINHEITEN_MAX, SITUATION, VERMIETER_ANLIEGEN } from "./funnel";

/** Version der Einwilligungstexte – bei Textänderungen hochzählen (Nachweisbarkeit). */
export const CONSENT_VERSION = "2026-11-21-3";

export const CONSENT_TEXTS = {
  // Kurz gehalten – genau dieser Text steht in allen drei Formularen (Check, Rückruf, Kontakt).
  contact: "Adrian Seitz darf mich zu meiner Anfrage kontaktieren. Die Datenschutzhinweise habe ich gelesen.",
  // Rechtsschutz-Check: Hinweis direkt unter dem Button – mit dem Klick auf „Jetzt Angebot berechnen“ erteilt.
  contactButton: "Mit Klick auf „Jetzt Angebot berechnen“ darf Adrian Seitz mich zu meiner Anfrage kontaktieren. Es gelten die Datenschutzhinweise.",
  marketing:
    "Optional: Ich möchte darüber hinaus gelegentlich per E-Mail oder Telefon Informationen zu weiteren passenden Versicherungslösungen erhalten. Diese Einwilligung kann ich jederzeit widerrufen.",
} as const;

const trimmed = (max: number) => z.string().trim().max(max);

export const phoneRegex = /^[+0-9][0-9 ()/-]{5,24}$/;

/**
 * Was der Server für eine Check-Anfrage annimmt. Nachname und E-Mail sind freiwillig:
 * Der Check fragt nur noch Name + Telefon ab (ältere, noch offene Seiten schicken weiter alle Felder).
 */
const contactBase = z
  .object({
    firstName: trimmed(60).min(2, "Bitte gib deinen Namen an."),
    lastName: trimmed(80).optional().default(""),
    email: trimmed(160).email("Bitte gib eine gültige E-Mail-Adresse an.").or(z.literal("")).optional().default(""),
    phone: trimmed(30).optional().or(z.literal("")),
    contactMethod: z.enum(["email", "telefon", "egal"], { errorMap: () => ({ message: "Bitte wähle einen Kontaktweg." }) }).default("telefon"),
    reachable: z.enum(["vormittags", "mittags", "nachmittags", "abends"]).optional().or(z.literal("")),
    consentContact: z.literal(true, { errorMap: () => ({ message: "Bitte bestätige kurz, dass ich dich kontaktieren darf." }) }),
    consentMarketing: z.boolean().default(false),
  });
const contactRefine = (d: z.infer<typeof contactBase>, ctx: z.RefinementCtx) => {
    const phone = d.phone?.trim() ?? "";
    if (d.contactMethod === "email" && !d.email) {
      ctx.addIssue({ code: "custom", path: ["email"], message: "Bitte gib deine E-Mail-Adresse an." });
    }
    if (d.contactMethod !== "email" && phone.length === 0) {
      ctx.addIssue({ code: "custom", path: ["phone"], message: "Bitte gib deine Telefonnummer an, damit ich dich zurückrufen kann." });
    }
    if (phone.length > 0 && !phoneRegex.test(phone)) {
      ctx.addIssue({ code: "custom", path: ["phone"], message: "Bitte gib eine gültige Telefonnummer an." });
    }
};
export const contactFieldsSchema = contactBase.superRefine(contactRefine);
/** Check: Name freiwillig – das Vermieter-Formular fragt nur Wohneinheiten, Mietausfallschutz, E-Mail und Telefon. */
export const leadContactSchema = contactBase.extend({ firstName: trimmed(60).optional().default("") }).superRefine(contactRefine);

export type ContactFields = z.infer<typeof contactFieldsSchema>;

/** Letzter Schritt im Check: nur Name und Telefon sind Pflicht. */
export const checkContactFormSchema = z.object({
  name: trimmed(120).min(2, "Bitte gib deinen Namen an."),
  phone: trimmed(30)
    .min(1, "Bitte gib deine Telefonnummer an, damit ich dich zurückrufen kann.")
    .regex(phoneRegex, "Bitte gib eine gültige Telefonnummer an."),
  email: trimmed(160).email("Bitte gib eine gültige E-Mail-Adresse an.").or(z.literal("")),
  reachable: z.enum(["vormittags", "mittags", "nachmittags", "abends"]).optional().or(z.literal("")),
  consentContact: z.literal(true, { errorMap: () => ({ message: "Bitte bestätige kurz, dass ich dich kontaktieren darf." }) }),
  consentMarketing: z.boolean(),
});

export type CheckContactForm = z.infer<typeof checkContactFormSchema>;

/** „Max Mustermann“ → Vorname „Max“, Nachname „Mustermann“. */
export function splitName(full: string) {
  const parts = full.trim().split(/\s+/);
  return { firstName: parts[0] ?? "", lastName: parts.slice(1).join(" ") };
}

export const attributionSchema = z
  .object({
    utm_source: trimmed(120).optional(),
    utm_medium: trimmed(120).optional(),
    utm_campaign: trimmed(200).optional(),
    utm_term: trimmed(200).optional(),
    utm_content: trimmed(200).optional(),
    landingPage: trimmed(300).optional(),
    referrer: trimmed(200).optional(),
    gclid: trimmed(300).optional(),
    fbclid: trimmed(300).optional(),
  })
  .partial()
  .default({});

export type Attribution = z.infer<typeof attributionSchema>;

const spamSchema = z.object({
  website: z.string().max(200).optional().default(""), // Honeypot – muss leer bleiben
  startedAt: z.number().int().positive(),
});

export const leadSchema = z
  .object({
    answers: z.object({
      bereich: z.enum(AREA_VALUES),
      situation: z.array(trimmed(40)).max(6).default([]),
      einheiten: z.number().int().min(1).max(EINHEITEN_MAX).optional(),
      anliegen: z.enum(VERMIETER_ANLIEGEN.map((o) => o.value) as [string, ...string[]]).optional(),
      /** Vermieter: Mietausfallschutz gewünscht? */
      mietausfall: z.enum(["ja", "nein"]).optional(),
      // Werden im Check nicht mehr abgefragt; ältere offene Seiten schicken sie evtl. noch mit.
      beginn: z.enum(BEGINN.options.map((o) => o.value) as [string, ...string[]]).optional(),
      bestand: z.enum(BESTAND.options.map((o) => o.value) as [string, ...string[]]).optional(),
    }),
    contact: leadContactSchema,
    attribution: attributionSchema,
    trackingConsent: z.object({ statistics: z.boolean(), marketing: z.boolean() }).default({ statistics: false, marketing: false }),
    spam: spamSchema,
  })
  .superRefine((d, ctx) => {
    if (d.answers.bereich === "vermieter") {
      // Vermieter: statt der Art der Immobilie zählt nur die Zahl der Wohneinheiten.
      if (d.answers.einheiten === undefined) {
        ctx.addIssue({ code: "custom", path: ["answers", "einheiten"], message: "Bitte gib die Anzahl der Wohneinheiten an." });
      }
      return;
    }
    const q = SITUATION[d.answers.bereich];
    const allowed = new Set(q?.options.map((o) => o.value) ?? []);
    if (!q?.multi && d.answers.situation.length !== 1) {
      ctx.addIssue({ code: "custom", path: ["answers", "situation"], message: "Ungültige Auswahl." });
    }
    if (d.answers.situation.some((s) => !allowed.has(s))) {
      ctx.addIssue({ code: "custom", path: ["answers", "situation"], message: "Ungültige Auswahl." });
    }
  });

export type LeadInput = z.infer<typeof leadSchema>;

export const REQUEST_TYPES = [
  { value: "termin", label: "Beratungstermin vereinbaren" },
  { value: "rueckruf", label: "Rückruf anfordern" },
  { value: "frage", label: "Allgemeine Frage" },
] as const;

export const contactFormSchema = z
  .object({
    requestType: z.enum(["termin", "rueckruf", "frage"]),
    topic: z.enum(["privat", "arbeit", "vermieter", "firma", "allgemein"]),
    name: trimmed(120).min(2, "Bitte gib deinen Namen an."),
    // Beim Rückruf reicht die Telefonnummer – weniger Felder, mehr Anfragen.
    email: trimmed(160).email("Bitte gib eine gültige E-Mail-Adresse an.").or(z.literal("")),
    phone: trimmed(30).optional().or(z.literal("")),
    preferredTime: trimmed(120).optional().or(z.literal("")),
    message: trimmed(2000).optional().or(z.literal("")),
    consentContact: z.literal(true, { errorMap: () => ({ message: "Bitte bestätige die Kontaktaufnahme zu deiner Anfrage." }) }),
  })
  .superRefine((d, ctx) => {
    const phone = d.phone?.trim() ?? "";
    if (d.requestType !== "rueckruf" && !d.email) {
      ctx.addIssue({ code: "custom", path: ["email"], message: "Bitte gib eine gültige E-Mail-Adresse an." });
    }
    if (d.requestType === "rueckruf" && phone.length === 0) {
      ctx.addIssue({ code: "custom", path: ["phone"], message: "Für einen Rückruf benötigen wir deine Telefonnummer." });
    }
    if (phone.length > 0 && !phoneRegex.test(phone)) {
      ctx.addIssue({ code: "custom", path: ["phone"], message: "Bitte gib eine gültige Telefonnummer an." });
    }
    if (d.requestType === "frage" && (d.message?.trim().length ?? 0) < 5) {
      ctx.addIssue({ code: "custom", path: ["message"], message: "Bitte beschreibe kurz dein Anliegen." });
    }
  });

export type ContactFormInput = z.infer<typeof contactFormSchema>;

export const contactPayloadSchema = z.object({
  form: contactFormSchema,
  attribution: attributionSchema,
  trackingConsent: z.object({ statistics: z.boolean(), marketing: z.boolean() }).default({ statistics: false, marketing: false }),
  spam: spamSchema,
});
