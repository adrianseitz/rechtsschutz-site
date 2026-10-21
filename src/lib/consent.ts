export type ConsentState = {
  necessary: true;
  statistics: boolean;
  marketing: boolean;
  version: string;
  timestamp: string;
};

export const CONSENT_STORAGE_KEY = "rs_consent";
export const CONSENT_POLICY_VERSION = "1";
export const CONSENT_EVENT = "rs:consent-changed";

export function readConsent(): ConsentState | null {
  try {
    const raw = window.localStorage.getItem(CONSENT_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ConsentState;
    if (parsed.version !== CONSENT_POLICY_VERSION) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function writeConsent(c: { statistics: boolean; marketing: boolean }): ConsentState {
  const state: ConsentState = {
    necessary: true,
    statistics: c.statistics,
    marketing: c.marketing,
    version: CONSENT_POLICY_VERSION,
    timestamp: new Date().toISOString(),
  };
  try {
    window.localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* Speicher blockiert – Einwilligung gilt dann nur für diesen Seitenaufruf */
  }
  window.dispatchEvent(new CustomEvent(CONSENT_EVENT, { detail: state }));
  return state;
}

export function currentTrackingConsent(): { statistics: boolean; marketing: boolean } {
  if (typeof window === "undefined") return { statistics: false, marketing: false };
  const c = (window as unknown as { __rsConsent?: ConsentState }).__rsConsent ?? readConsent();
  return { statistics: !!c?.statistics, marketing: !!c?.marketing };
}
