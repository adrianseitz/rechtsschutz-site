/** Lead-Status im CRM – gemeinsam für Server und Oberfläche. */
export const STATUSES = [
  { value: "neu", label: "Neu", cls: "bg-sun text-navy" },
  { value: "kontaktiert", label: "Kontaktiert", cls: "bg-sky-100 text-sky-900" },
  { value: "termin", label: "Termin", cls: "bg-violet-100 text-violet-900" },
  { value: "angebot", label: "Angebot", cls: "bg-orange-100 text-orange-900" },
  { value: "abschluss", label: "Abschluss", cls: "bg-emerald-100 text-emerald-900" },
  { value: "verloren", label: "Verloren", cls: "bg-neutral-200 text-neutral-600" },
] as const;

export type LeadStatus = (typeof STATUSES)[number]["value"];

export const isLeadStatus = (v: unknown): v is LeadStatus => STATUSES.some((s) => s.value === v);

export type StatusEntry = { status: LeadStatus; updatedAt: string; history: { status: LeadStatus; at: string }[] };

/** Für die Oberfläche aufbereiteter Datensatz. */
export type CrmLead = {
  id: string;
  type: "lead" | "contact";
  createdAt: string;
  productLabel: string;
  name: string;
  email: string;
  phone?: string;
  contactMethod?: string;
  situation?: string;
  beginn?: string;
  bestand?: string;
  requestType?: string;
  preferredTime?: string;
  message?: string;
  channel: string;
  campaign?: string;
  landingPage?: string;
  marketingConsent: boolean;
  status: LeadStatus;
  statusUpdatedAt?: string;
  history: { status: LeadStatus; at: string }[];
};
