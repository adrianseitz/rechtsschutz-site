/** Lead-Status im CRM – gemeinsam für Server und Oberfläche. */
export const STATUSES = [
  { value: "neu", label: "Neu", cls: "bg-sun text-navy", dot: "#FFD60A", stage: true },
  { value: "kontaktiert", label: "Kontaktiert", cls: "bg-sky-100 text-sky-900", dot: "#38BDF8", stage: true },
  { value: "termin", label: "Termin", cls: "bg-violet-100 text-violet-900", dot: "#A78BFA", stage: true },
  { value: "angebot", label: "Angebot", cls: "bg-orange-100 text-orange-900", dot: "#FB923C", stage: true },
  { value: "abschluss", label: "Gewonnen", cls: "bg-emerald-100 text-emerald-900", dot: "#10B981", stage: false },
  { value: "verloren", label: "Verloren", cls: "bg-rose-100 text-rose-900", dot: "#F43F5E", stage: false },
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
  einheiten?: string;
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
