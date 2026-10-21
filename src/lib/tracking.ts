import { currentTrackingConsent } from "./consent";

export type TrackEvent =
  | "funnel_started"
  | "funnel_step_completed"
  | "lead_submitted"
  | "appointment_requested"
  | "contact_form_submitted";

type Win = Window & {
  dataLayer?: unknown[];
  gtag?: (...args: unknown[]) => void;
  fbq?: (...args: unknown[]) => void;
};

const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID;
const ADS_ID = process.env.NEXT_PUBLIC_GOOGLE_ADS_ID;
const ADS_LABELS: Partial<Record<TrackEvent, string | undefined>> = {
  lead_submitted: process.env.NEXT_PUBLIC_GOOGLE_ADS_LEAD_LABEL,
  appointment_requested: process.env.NEXT_PUBLIC_GOOGLE_ADS_APPOINTMENT_LABEL,
  contact_form_submitted: process.env.NEXT_PUBLIC_GOOGLE_ADS_CONTACT_LABEL,
};
const META_EVENTS: Partial<Record<TrackEvent, string>> = {
  lead_submitted: "Lead",
  appointment_requested: "Schedule",
  contact_form_submitted: "Contact",
};

const FIRED_KEY = "rs_fired_events";

function alreadyFired(key: string): boolean {
  try {
    const list: string[] = JSON.parse(sessionStorage.getItem(FIRED_KEY) || "[]");
    if (list.includes(key)) return true;
    list.push(key);
    sessionStorage.setItem(FIRED_KEY, JSON.stringify(list.slice(-100)));
    return false;
  } catch {
    return false;
  }
}

/**
 * Sendet ein Event an GTM bzw. GA4/Google Ads/Meta – ausschließlich mit Einwilligung.
 * `dedupeKey` verhindert doppelte Auslösung (z. B. Lead-ID); `eventId` dient der
 * Deduplizierung auf Plattformseite (Google transaction_id, Meta eventID).
 */
export function track(event: TrackEvent, params: Record<string, unknown> = {}, opts: { dedupeKey?: string; eventId?: string } = {}) {
  if (typeof window === "undefined") return;
  const consent = currentTrackingConsent();
  if (!consent.statistics && !consent.marketing) return;
  if (opts.dedupeKey && alreadyFired(`${event}:${opts.dedupeKey}`)) return;

  const w = window as Win;
  const payload = { ...params, ...(opts.eventId ? { event_id: opts.eventId } : {}) };

  if (GTM_ID) {
    // Mit GTM werden alle Tags (GA4, Ads, Meta) im Container gesteuert.
    w.dataLayer = w.dataLayer || [];
    w.dataLayer.push({ event, ...payload });
    return;
  }

  if (consent.statistics && w.gtag) w.gtag("event", event, payload);

  if (consent.marketing) {
    const label = ADS_LABELS[event];
    if (w.gtag && ADS_ID && label) {
      w.gtag("event", "conversion", { send_to: `${ADS_ID}/${label}`, ...(opts.eventId ? { transaction_id: opts.eventId } : {}) });
    }
    const metaEvent = META_EVENTS[event];
    if (w.fbq && metaEvent) w.fbq("track", metaEvent, { content_category: params.bereich ?? params.topic }, opts.eventId ? { eventID: opts.eventId } : undefined);
  }
}
