/**
 * Werbe-/Statistik-Kennungen. Sie können im CRM (Einstellungen → Google Ads) gepflegt werden
 * und werden zur Laufzeit von /api/config geladen. Werte aus der .env dienen als Rückfall.
 */
export type TrackingConfig = {
  gtmId: string;
  ga4Id: string;
  adsId: string;
  adsLeadLabel: string;
  adsContactLabel: string;
  adsAppointmentLabel: string;
  metaPixelId: string;
};

const v = (s: string | undefined) => (s ?? "").trim();

export const ENV_TRACKING: TrackingConfig = {
  gtmId: v(process.env.NEXT_PUBLIC_GTM_ID),
  ga4Id: v(process.env.NEXT_PUBLIC_GA4_ID),
  adsId: v(process.env.NEXT_PUBLIC_GOOGLE_ADS_ID),
  adsLeadLabel: v(process.env.NEXT_PUBLIC_GOOGLE_ADS_LEAD_LABEL),
  adsContactLabel: v(process.env.NEXT_PUBLIC_GOOGLE_ADS_CONTACT_LABEL),
  adsAppointmentLabel: v(process.env.NEXT_PUBLIC_GOOGLE_ADS_APPOINTMENT_LABEL),
  metaPixelId: v(process.env.NEXT_PUBLIC_META_PIXEL_ID),
};

/** Strenge Formate – die Werte landen in Skript-Aufrufen und dürfen nichts anderes enthalten. */
export const TRACKING_FORMAT: Record<keyof TrackingConfig, RegExp> = {
  gtmId: /^GTM-[A-Z0-9]{4,12}$/,
  ga4Id: /^G-[A-Z0-9]{6,14}$/,
  adsId: /^AW-\d{6,15}$/,
  adsLeadLabel: /^[A-Za-z0-9_-]{4,60}$/,
  adsContactLabel: /^[A-Za-z0-9_-]{4,60}$/,
  adsAppointmentLabel: /^[A-Za-z0-9_-]{4,60}$/,
  metaPixelId: /^\d{8,20}$/,
};

export function cleanTracking(input: unknown): Partial<TrackingConfig> {
  const out: Partial<TrackingConfig> = {};
  if (!input || typeof input !== "object") return out;
  for (const k of Object.keys(TRACKING_FORMAT) as (keyof TrackingConfig)[]) {
    const val = (input as Record<string, unknown>)[k];
    if (typeof val === "string" && (val === "" || TRACKING_FORMAT[k].test(val))) out[k] = val;
  }
  return out;
}

export const trackingConfigured = (c: TrackingConfig) => Boolean(c.gtmId || c.ga4Id || c.adsId || c.metaPixelId);

let current: TrackingConfig = Object.fromEntries(Object.entries(ENV_TRACKING).map(([k, val]) => [k, TRACKING_FORMAT[k as keyof TrackingConfig].test(val) ? val : ""])) as TrackingConfig;
let pending: Promise<TrackingConfig> | null = null;

export const getTrackingConfig = () => current;

/** Lädt die aktuelle Konfiguration einmal pro Seitenaufruf (nur im Browser). */
export function loadTrackingConfig(): Promise<TrackingConfig> {
  if (typeof window === "undefined") return Promise.resolve(current);
  pending ??= fetch("/api/config", { cache: "no-store" })
    .then((r) => (r.ok ? r.json() : {}))
    .then((j) => {
      // Der Server liefert die fertig zusammengeführten Werte (CRM-Einstellungen vor .env).
      current = { ...current, ...cleanTracking((j as { tracking?: unknown }).tracking) } as TrackingConfig;
      return current;
    })
    .catch(() => current);
  return pending;
}
