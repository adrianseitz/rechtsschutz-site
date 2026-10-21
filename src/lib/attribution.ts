import type { Attribution } from "./schemas";

const KEY = "rs_attribution";
const UTM_KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"] as const;

/** Erfasst UTM-Parameter, Landingpage und Referrer-Domain einmal pro Sitzung (First Touch). */
export function captureAttribution() {
  try {
    const url = new URL(window.location.href);
    const existing = sessionStorage.getItem(KEY);
    const hasUtm = UTM_KEYS.some((k) => url.searchParams.get(k));
    if (existing && !hasUtm) return;

    const data: Attribution = {};
    for (const k of UTM_KEYS) {
      const v = url.searchParams.get(k);
      if (v) data[k] = v.slice(0, 200);
    }
    const gclid = url.searchParams.get("gclid");
    const fbclid = url.searchParams.get("fbclid");
    if (gclid) data.gclid = gclid.slice(0, 300);
    if (fbclid) data.fbclid = fbclid.slice(0, 300);
    data.landingPage = url.pathname;
    if (document.referrer) {
      const ref = new URL(document.referrer);
      if (ref.hostname !== url.hostname) data.referrer = ref.hostname; // nur Domain, keine vollständige URL
    }
    sessionStorage.setItem(KEY, JSON.stringify(data));
  } catch {
    /* sessionStorage nicht verfügbar */
  }
}

/** Liefert die Attribution. Klick-IDs (gclid/fbclid) nur mit Marketing-Einwilligung. */
export function getAttribution(marketingConsent: boolean): Attribution {
  try {
    const raw = sessionStorage.getItem(KEY);
    const data = raw ? (JSON.parse(raw) as Attribution) : {};
    if (!marketingConsent) {
      delete data.gclid;
      delete data.fbclid;
    }
    return data;
  } catch {
    return {};
  }
}
