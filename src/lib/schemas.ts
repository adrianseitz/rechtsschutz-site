import { z } from "zod";
import { AREA_VALUES, BEGINN, BESTAND, SITUATION } from "./funnel";

/** Version der Einwilligungstexte – bei Textänderungen hochzählen (Nachweisbarkeit). */
export const CONSENT_VERSION = "2026-10-20";

export const CONSENT_TEXTS = {
  contact:
    "Ich bin damit einverstanden, dass Adrian Seitz mich über den gewählten Kontaktweg zur Bearbeitung meiner Anfrage kontaktiert. Die Datenschutzhinweise habe ich zur Kenntnis genommen.",
  marketing:
    "Optional: Ich möchte darüber hinaus gelegentlich per E-Mail oder Telefon Informationen zu weiteren passenden Versicherungslösungen erhalten. Diese Einwilligung kann ich jederzeit widerrufen.",
} as const;

const trimmed = (max: number) => z.string().trim().max(max);

const phoneRegex = /^[+0-9][0-9 ()/-]{5,24}$/;

export const contactFieldsSchema = z
  .object({
    firstName: trimmed(60).min(2, "Bitte gib deinen Vornamen an."),
    lastName: trimmed(80).min(2, "Bitte gib deinen Nachnamen an."),
    email: trimmed(160).email("Bitte gib eine gültige E-Mail-Adresse an."),
    phone: trimmed(30).optional().or(z.literal("")),
    contactMethod: z.enum(["email", "telefon", "egal"], { errorMap: () => ({ message: "Bitte wähle einen Kontaktweg." }) }),
    consentContact: z.literal(true, { errorMap: () => ({ message: "Bitte bestätige die Kontaktaufnahme zu deiner Anfrage." }) }),
    consentMarketing: z.boolean(),
  })
  .superRefine((d, ctx) => {
    const phone = d.phone?.trim() ?? "";
    if (d.contactMethod !== "email" && phone.length === 0) {
      ctx.addIssue({ code: "custom", path: ["phone"], message: "Für einen Rückruf benötigen wir deine Telefonnummer." });
    }
    if (phone.length > 0 && !phoneRegex.test(phone)) {
      ctx.addIssue({ code: "custom", path: ["phone"], message: "Bitte gib eine gültige Telefonnummer an." });
    }
  });

export type ContactFields = z.infer<typeof contactFieldsSchema>;

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
      situation: z.array(trimmed(40)).min(1).max(6),
      beginn: z.enum(BEGINN.options.map((o) => o.value) as [string, ...string[]]),
      bestand: z.enum(BESTAND.options.map((o) => o.value) as [string, ...string[]]),
    }),
    contact: contactFieldsSchema,
    attribution: attributionSchema,
    trackingConsent: z.object({ statistics: z.boolean(), marketing: z.boolean() }).default({ statistics: false, marketing: false }),
    spam: spamSchema,
  })
  .superRefine((d, ctx) => {
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
    email: trimmed(160).email("Bitte gib eine gültige E-Mail-Adresse an."),
    phone: trimmed(30).optional().or(z.literal("")),
    preferredTime: trimmed(120).optional().or(z.literal("")),
    message: trimmed(2000).optional().or(z.literal("")),
    consentContact: z.literal(true, { errorMap: () => ({ message: "Bitte bestätige die Kontaktaufnahme zu deiner Anfrage." }) }),
  })
  .superRefine((d, ctx) => {
    const phone = d.phone?.trim() ?? "";
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
