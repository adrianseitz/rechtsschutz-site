import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/server/adminAuth";
import { sendTestMail } from "@/lib/server/notify";
import { hashIdentifier } from "@/lib/server/crypto";
import { rateLimit } from "@/lib/server/rateLimit";
import { clientIp, jsonError, originAllowed } from "@/lib/server/request";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  if (!originAllowed(req)) return jsonError(403, "forbidden");
  if (!(await isAdmin())) return jsonError(401, "unauthorized");
  if (!rateLimit(`mailtest:${hashIdentifier(clientIp(req))}`, 5, 10 * 60 * 1000).ok) return jsonError(429, "Zu viele Testmails – bitte kurz warten.");
  try {
    await sendTestMail();
  } catch (e) {
    return jsonError(502, e instanceof Error ? e.message : "Versand fehlgeschlagen.");
  }
  return NextResponse.json({ ok: true });
}
