import "server-only";
import { randomUUID } from "node:crypto";
import type { Attribution, ContactFormInput, LeadInput } from "../schemas";
import { CONSENT_TEXTS, CONSENT_VERSION } from "../schemas";
import { labelFor, MULTI_AREAS, SITUATION } from "../funnel";

export type ConsentRecord = { granted: boolean; text: string; version: string; at: string };

export type SubmissionRecord = {
  id: string;
  type: "lead" | "contact";
  createdAt: string;
  product: string;
  productLabel: string;
  answers: Record<string, { value: string | string[]; label: string }>;
  contact: { firstName?: string; lastName?: string; name?: string; email: string; phone?: string; contactMethod?: string };
  request?: { requestType: string; preferredTime?: string; message?: string };
  attribution: Attribution & { channel: string };
  consents: { contact: ConsentRecord; marketing?: ConsentRecord; tracking: { statistics: boolean; marketing: boolean } };
  meta: { ipHash: string; userAgent: string };
};

const PRODUCT_LABEL: Record<string, string> = {
  privat: "Privatrechtsschutz",
  arbeit: "Arbeitsrechtsschutz",
  vermieter: "Vermieterrechtsschutz",
  firma: "Firmenrechtsschutz",
  mehrere: "Kombination mehrerer Bereiche",
  allgemein: "Allgemein",
};

export function deriveChannel(a: Attribution): string {
  const src = (a.utm_source || "").toLowerCase();
  const med = (a.utm_medium || "").toLowerCase();
  const ref = (a.referrer || "").toLowerCase();
  if (a.gclid || (src.includes("google") && /cpc|paid|ppc|ads/.test(med))) return "Google Ads";
  if (a.fbclid || /facebook|instagram|meta|fb|ig/.test(src)) return /cpc|paid|ads|social_paid/.test(med) || a.fbclid ? "Meta Ads" : "Social (organisch)";
  if (src) return `Kampagne: ${src}${med ? ` / ${med}` : ""}`;
  if (/google\.|bing\.|duckduckgo\.|ecosia\./.test(ref)) return "Suchmaschine (organisch)";
  if (/facebook\.|instagram\.|t\.co|linkedin\./.test(ref)) return "Social (organisch)";
  if (ref) return `Verweis: ${ref}`;
  return "Direkt / Empfehlung";
}

export function buildLeadRecord(input: LeadInput, meta: SubmissionRecord["meta"]): SubmissionRecord {
  const now = new Date().toISOString();
  const { answers, contact } = input;
  const multi = SITUATION[answers.bereich]?.multi;
  return {
    id: randomUUID(),
    type: "lead",
    createdAt: now,
    product: answers.bereich,
    productLabel: PRODUCT_LABEL[answers.bereich] ?? answers.bereich,
    answers: {
      bereich: { value: answers.bereich, label: labelFor("bereich", answers.bereich) },
      situation: {
        value: multi ? answers.situation : answers.situation[0],
        label: multi
          ? answers.situation.map((s) => MULTI_AREAS.find((m) => m.value === s)?.label ?? s).join(", ")
          : labelFor("situation", answers.situation[0], answers.bereich),
      },
      beginn: { value: answers.beginn, label: labelFor("beginn", answers.beginn) },
      bestand: { value: answers.bestand, label: labelFor("bestand", answers.bestand) },
    },
    contact: {
      firstName: contact.firstName,
      lastName: contact.lastName,
      email: contact.email.toLowerCase(),
      phone: contact.phone || undefined,
      contactMethod: contact.contactMethod,
    },
    attribution: { ...input.attribution, channel: deriveChannel(input.attribution) },
    consents: {
      contact: { granted: true, text: CONSENT_TEXTS.contact, version: CONSENT_VERSION, at: now },
      marketing: { granted: contact.consentMarketing === true, text: CONSENT_TEXTS.marketing, version: CONSENT_VERSION, at: now },
      tracking: input.trackingConsent,
    },
    meta,
  };
}

export function buildContactRecord(form: ContactFormInput, attribution: Attribution, tracking: { statistics: boolean; marketing: boolean }, meta: SubmissionRecord["meta"]): SubmissionRecord {
  const now = new Date().toISOString();
  return {
    id: randomUUID(),
    type: "contact",
    createdAt: now,
    product: form.topic,
    productLabel: PRODUCT_LABEL[form.topic] ?? form.topic,
    answers: {},
    contact: { name: form.name, email: form.email.toLowerCase(), phone: form.phone || undefined },
    request: { requestType: form.requestType, preferredTime: form.preferredTime || undefined, message: form.message || undefined },
    attribution: { ...attribution, channel: deriveChannel(attribution) },
    consents: { contact: { granted: true, text: CONSENT_TEXTS.contact, version: CONSENT_VERSION, at: now }, tracking },
    meta,
  };
}
