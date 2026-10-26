import { classifySource, isBot, normalizePath, recordHit } from "@/lib/server/analytics";
import { fileStorageEnabled } from "@/lib/server/storage";
import { hashIdentifier } from "@/lib/server/crypto";
import { rateLimit } from "@/lib/server/rateLimit";
import { clientIp, originAllowed } from "@/lib/server/request";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Eigene Seite? Origin-Header bevorzugt, sonst Referer (manche Browser senden bei sendBeacon keinen Origin). */
function sameSite(req: Request) {
  if (req.headers.get("origin")) return originAllowed(req);
  const host = req.headers.get("x-forwarded-host") || req.headers.get("host");
  try {
    return !!host && new URL(req.headers.get("referer") || "").host === host;
  } catch {
    return false;
  }
}

const ok = () => new Response(null, { status: 204, headers: { "Cache-Control": "no-store" } });

/** Empfängt anonyme Seitenaufrufe (ohne Cookies). Antwortet immer leer. */
export async function POST(req: Request) {
  if (!fileStorageEnabled() || !sameSite(req)) return ok();
  const ua = req.headers.get("user-agent") || "";
  if (isBot(ua)) return ok();
  const ip = clientIp(req);
  if (!rateLimit(`collect:${hashIdentifier(ip)}`, 120, 60_000).ok) return ok();

  let body: { p?: unknown; r?: unknown; s?: unknown; m?: unknown; g?: unknown; f?: unknown; w?: unknown };
  try {
    const text = await req.text();
    if (text.length > 2048) return ok();
    body = JSON.parse(text);
  } catch {
    return ok();
  }
  const page = typeof body.p === "string" ? normalizePath(body.p) : null;
  if (!page) return ok();
  const str = (v: unknown) => (typeof v === "string" ? v.slice(0, 300) : "");
  const host = req.headers.get("x-forwarded-host") || req.headers.get("host") || "";
  const source = classifySource({ ref: str(body.r), utm: str(body.s), medium: str(body.m), gclid: body.g === 1, fbclid: body.f === 1, ownHost: host.split(":")[0] });
  const mobile = typeof body.w === "number" ? body.w < 768 : /Mobi|Android|iPhone/i.test(ua);
  recordHit({ ip, ua, page, source, mobile });
  return ok();
}
