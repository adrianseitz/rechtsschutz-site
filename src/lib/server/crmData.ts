import "server-only";
import type { CrmLead } from "../crm";
import { readStatuses } from "./crmStatus";
import { readRecords } from "./storage";
import type { SubmissionRecord } from "./records";

const REQUEST_LABEL: Record<string, string> = { termin: "Termin", rueckruf: "Rückruf", frage: "Frage", angebot: "Angebot" };

function toLead(r: SubmissionRecord): Omit<CrmLead, "status" | "statusUpdatedAt" | "history"> {
  const name = [r.contact.firstName, r.contact.lastName].filter(Boolean).join(" ") || r.contact.name || "–";
  return {
    id: r.id,
    type: r.type,
    createdAt: r.createdAt,
    productLabel: r.productLabel,
    name,
    email: r.contact.email,
    phone: r.contact.phone,
    contactMethod: r.contact.contactMethod,
    situation: r.answers.situation?.label,
    beginn: r.answers.beginn?.label,
    bestand: r.answers.bestand?.label,
    requestType: r.request ? REQUEST_LABEL[r.request.requestType] ?? r.request.requestType : undefined,
    preferredTime: r.request?.preferredTime,
    message: r.request?.message,
    channel: r.attribution.channel,
    campaign: r.attribution.utm_campaign,
    landingPage: r.attribution.landingPage,
    marketingConsent: r.consents.marketing?.granted === true,
  };
}

/** Alle Anfragen (Check + Kontaktformular), neueste zuerst, mit Status. */
export async function loadCrmLeads(): Promise<CrmLead[]> {
  const [leads, contacts, statuses] = await Promise.all([readRecords("lead"), readRecords("contact"), readStatuses()]);
  return [...leads, ...contacts]
    .map((r) => {
      const s = statuses[r.id];
      return { ...toLead(r), status: s?.status ?? "neu", statusUpdatedAt: s?.updatedAt, history: s?.history ?? [] };
    })
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
