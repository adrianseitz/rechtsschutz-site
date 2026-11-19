import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/server/adminAuth";
import { tiktokCreds } from "@/lib/server/socialSettings";
import { newTiktokState, tiktokRedirectUri, TT_AUTH, TT_SCOPES } from "@/lib/server/tiktok";
import { jsonError } from "@/lib/server/request";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** „Mit TikTok verbinden“: leitet zur TikTok-Anmeldung weiter (Adrian meldet sich dort selbst an und erlaubt den Zugriff) */
export async function GET() {
  if (!(await isAdmin())) return jsonError(401, "unauthorized");
  const { clientKey, secret } = await tiktokCreds();
  if (!clientKey || !secret) return jsonError(409, "Bitte zuerst Client Key und Client Secret speichern.");
  const state = await newTiktokState();
  const url = `${TT_AUTH}?${new URLSearchParams({ client_key: clientKey, scope: TT_SCOPES, response_type: "code", redirect_uri: tiktokRedirectUri(), state })}`;
  return NextResponse.redirect(url, 302);
}
