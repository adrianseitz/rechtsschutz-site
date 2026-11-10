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

export const LOST_REASONS = ["Nicht erreicht", "Kein Interesse", "Zu teuer", "Anderer Anbieter", "Laufender Streit (nicht versicherbar)", "Sonstiges"] as const;

/** Zusatzangaben je Anfrage: Notizen, Kontaktversuche, Wiedervorlage, Vertragswert. */
export type LeadMeta = {
  notes?: { text: string; at: string; enc?: boolean }[];
  /** Zeitpunkte, zu denen jemand nicht erreicht wurde */
  attempts?: string[];
  /** Wiedervorlage (YYYY-MM-DD) */
  followUp?: string;
  /** Jahresbeitrag in Euro (bei Abschluss) */
  value?: number;
  lostReason?: string;
  /** Erste Reaktion (erster Kontaktversuch oder Phasenwechsel) */
  firstResponseAt?: string;
};

export type StatusEntry = { status: LeadStatus; updatedAt: string; history: { status: LeadStatus; at: string }[] } & LeadMeta;

export const todayKey = () => new Date().toLocaleDateString("sv-SE", { timeZone: "Europe/Berlin" });
/** Wiedervorlage heute oder überfällig (nur offene Anfragen). */
export const followUpDue = (l: { followUp?: string; status: LeadStatus }) =>
  Boolean(l.followUp) && l.followUp! <= todayKey() && l.status !== "abschluss" && l.status !== "verloren";

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
  /** Telefonisch am besten erreichbar (Angabe aus dem Check) */
  reachable?: string;
  /** Suchbegriff aus der Anzeige (utm_term) */
  keyword?: string;
  /** Google-Klick-ID vorhanden (nur mit Einwilligung gespeichert) */
  hasClickId: boolean;
  status: LeadStatus;
  statusUpdatedAt?: string;
  history: { status: LeadStatus; at: string }[];
} & LeadMeta;

/** Kurzname der Quelle für Karten und Auswertungen. */
export const channelShort = (c: string) =>
  c.startsWith("Google Ads") ? "Google Ads" : c.startsWith("Meta Ads") ? "Meta Ads" : c.startsWith("Kampagne") ? c.replace(/ \/ .*$/, "") : c.startsWith("Suchmaschine") ? "Google organisch" : c.startsWith("Social") ? "Social" : c.startsWith("Verweis") ? "Verweis" : "Direkt";

/** Hat die Anfrage mindestens die Phase „Termin“ erreicht? */
export const reachedAppointment = (l: { status: LeadStatus; history: { status: LeadStatus }[] }) =>
  ["termin", "angebot", "abschluss"].includes(l.status) || l.history.some((h) => ["termin", "angebot", "abschluss"].includes(h.status));
