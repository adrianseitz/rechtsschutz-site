import { NextResponse } from "next/server";
import { adminEnabled, checkPassword, createSession, sessionCookie } from "@/lib/server/adminAuth";
import { hashIdentifier } from "@/lib/server/crypto";
import { rateLimit } from "@/lib/server/rateLimit";
import { clientIp, jsonError, originAllowed, readJson } from "@/lib/server/request";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  if (!adminEnabled()) return jsonError(404, "not_configured");
  if (!originAllowed(req)) return jsonError(403, "forbidden");
  const rl = rateLimit(`login:${hashIdentifier(clientIp(req))}`, 5, 15 * 60 * 1000);
  if (!rl.ok) return jsonError(429, "rate_limited", { retryAfter: rl.retryAfter });

  let body: unknown;
  try {
    body = await readJson(req);
  } catch {
    return jsonError(400, "bad_request");
  }
  const pw = typeof (body as { password?: unknown })?.password === "string" ? (body as { password: string }).password : "";
  if (!pw || !checkPassword(pw)) {
    await new Promise((r) => setTimeout(r, 600)); // bremst Durchprobieren
    return jsonError(401, "invalid");
  }
  const res = NextResponse.json({ ok: true });
  res.cookies.set(sessionCookie(createSession()));
  res.headers.set("Cache-Control", "no-store");
  return res;
}
