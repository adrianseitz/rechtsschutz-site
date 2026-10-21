import "server-only";
import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { clientIp, jsonError, originAllowed, readJson } from "./request";
import { rateLimit } from "./rateLimit";
import { hashIdentifier } from "./crypto";

const MIN_FILL_MS = 2500;

type GuardOk = { ok: true; body: unknown; meta: { ipHash: string; userAgent: string } };
type GuardFail = { ok: false; response: NextResponse };

/** Gemeinsame Schutzschicht: Origin, Rate Limit, Größenlimit, JSON. */
export async function guard(req: Request, scope: string): Promise<GuardOk | GuardFail> {
  if (!originAllowed(req)) return { ok: false, response: jsonError(403, "Anfrage nicht erlaubt.") };
  const ipHash = hashIdentifier(clientIp(req));
  const rl = rateLimit(`${scope}:${ipHash}`);
  if (!rl.ok) {
    const res = jsonError(429, "Zu viele Anfragen. Bitte versuche es in einigen Minuten erneut.");
    res.headers.set("Retry-After", String(rl.retryAfter));
    return { ok: false, response: res };
  }
  let body: unknown;
  try {
    body = await readJson(req);
  } catch (e) {
    return { ok: false, response: jsonError((e as Error).message === "too_large" ? 413 : 400, "Ungültige Anfrage.") };
  }
  return { ok: true, body, meta: { ipHash, userAgent: (req.headers.get("user-agent") || "").slice(0, 160) } };
}

/** Honeypot gefüllt oder unrealistisch schnell → still verwerfen (Bot erhält keine Rückmeldung). */
export function isSpam(spam: { website?: string; startedAt: number }): boolean {
  if (spam.website && spam.website.trim().length > 0) return true;
  const elapsed = Date.now() - spam.startedAt;
  return elapsed < MIN_FILL_MS || elapsed > 1000 * 60 * 60 * 24;
}

export const silentOk = () => NextResponse.json({ ok: true, leadId: randomUUID() });

export function fieldErrors(issues: { path: (string | number)[]; message: string }[]) {
  return issues.slice(0, 10).map((i) => ({ field: i.path.join("."), message: i.message }));
}
