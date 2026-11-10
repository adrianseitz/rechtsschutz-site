/**
 * Zählt eine anonyme Aktion auf dem eigenen Server (ohne Cookies, ohne Personendaten).
 * Erlaubte Namen stehen in EVENT_LABEL (lib/stats.ts).
 */
export function countEvent(name: string) {
  if (typeof window === "undefined") return;
  const payload = JSON.stringify({ e: name });
  try {
    const blob = new Blob([payload], { type: "application/json" });
    if (!navigator.sendBeacon?.("/api/collect", blob)) throw new Error();
  } catch {
    fetch("/api/collect", { method: "POST", body: payload, keepalive: true, headers: { "Content-Type": "application/json" } }).catch(() => undefined);
  }
}
