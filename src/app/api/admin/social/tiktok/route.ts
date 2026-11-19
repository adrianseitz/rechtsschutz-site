import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/server/adminAuth";
import { deleteTiktokConnection, tiktokCreds } from "@/lib/server/socialSettings";
import { creatorInfo, freshTiktokTokens, tiktokRedirectUri } from "@/lib/server/tiktok";
import { jsonError, originAllowed } from "@/lib/server/request";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Stand der TikTok-Verbindung + die Einstellungen, die TikTok für dieses Konto erlaubt (für das Formular beim Hochladen) */
export async function GET() {
  if (!(await isAdmin())) return jsonError(401, "unauthorized");
  const { clientKey, secret, tokens } = await tiktokCreds();
  const base = { redirectUri: tiktokRedirectUri(), ready: Boolean(clientKey && secret), connected: Boolean(tokens) };
  if (!tokens) return NextResponse.json({ ok: true, ...base });
  try {
    const t = await freshTiktokTokens(tokens);
    const info = await creatorInfo(t);
    return NextResponse.json({ ok: true, ...base, scope: t.scope, creator: info });
  } catch (e) {
    return NextResponse.json({ ok: true, ...base, error: e instanceof Error ? e.message : "TikTok antwortet nicht." });
  }
}

/** Verbindung trennen */
export async function DELETE(req: Request) {
  if (!originAllowed(req)) return jsonError(403, "forbidden");
  if (!(await isAdmin())) return jsonError(401, "unauthorized");
  await deleteTiktokConnection();
  return NextResponse.json({ ok: true });
}
