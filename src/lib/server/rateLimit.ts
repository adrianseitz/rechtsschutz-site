import "server-only";
import { serverConfig } from "./config";

/**
 * Einfaches Sliding-Window-Rate-Limit im Arbeitsspeicher.
 * Hinweis: gilt pro Server-Instanz. Für Serverless/mehrere Instanzen einen
 * zentralen Speicher (z. B. Upstash Redis) über dieselbe Schnittstelle anbinden.
 */
const hits = new Map<string, number[]>();

export function rateLimit(key: string, max = serverConfig.rateLimit.max, windowMs = serverConfig.rateLimit.windowMs) {
  const now = Date.now();
  const list = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
  if (list.length >= max) {
    hits.set(key, list);
    return { ok: false as const, retryAfter: Math.ceil((windowMs - (now - list[0])) / 1000) };
  }
  list.push(now);
  hits.set(key, list);
  if (hits.size > 5000) for (const [k, v] of hits) if (v.every((t) => now - t >= windowMs)) hits.delete(k);
  return { ok: true as const };
}
