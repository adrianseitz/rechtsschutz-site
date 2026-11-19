import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/server/adminAuth";
import { instagramToken } from "@/lib/server/socialSettings";
import { jsonError } from "@/lib/server/request";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const IG = process.env.INSTAGRAM_API || "https://graph.instagram.com/v23.0";

/** Prüft den gespeicherten Instagram-Zugang: welches Konto ist verbunden? (Der Zugang selbst verlässt den Server nicht.) */
export async function GET() {
  if (!(await isAdmin())) return jsonError(401, "unauthorized");
  const token = await instagramToken().catch(() => "");
  if (!token) return jsonError(409, "Noch kein Instagram-Zugang gespeichert.");
  try {
    const res = await fetch(`${IG}/me?${new URLSearchParams({ fields: "user_id,username,account_type", access_token: token })}`, { cache: "no-store", signal: AbortSignal.timeout(15_000) });
    const j = await res.json().catch(() => ({}));
    if (!res.ok || j.error) {
      const e = j.error || {};
      return jsonError(e.code === 190 ? 401 : 502, e.code === 190 ? "Instagram lehnt den Zugang ab (abgelaufen oder falsch kopiert). Bitte neu erzeugen und eintragen." : `Instagram meldet: ${e.message || res.status}`);
    }
    return NextResponse.json({ ok: true, username: j.username || "", accountType: j.account_type || "" });
  } catch {
    return jsonError(502, "Instagram ist gerade nicht erreichbar.");
  }
}
