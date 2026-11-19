import "server-only";
import { randomBytes } from "node:crypto";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { serverConfig } from "./config";
import { socialDir, tiktokCreds, saveTiktokConnection, type TiktokTokens } from "./socialSettings";

/** TikTok-Anbindung (Login Kit + Content Posting API) für Adrians eigenes Konto. */
export const TT_API = process.env.TIKTOK_API || "https://open.tiktokapis.com";
export const TT_AUTH = process.env.TIKTOK_AUTH || "https://www.tiktok.com/v2/auth/authorize/";
export const TT_SCOPES = "user.info.basic,video.upload,video.publish";

export const tiktokRedirectUri = () => `${(serverConfig.siteUrl || "https://www.seitz-rechtsschutz.de").replace(/\/$/, "")}/api/social/tiktok/callback`;

// Anmelde-Vorgang: zufälliger „state“, 10 Minuten gültig (der Rückweg von TikTok kommt ohne CRM-Cookie an)
const stateFile = () => path.join(socialDir(), "tiktok-state.json");
export async function newTiktokState(): Promise<string> {
  const state = randomBytes(24).toString("hex");
  await mkdir(socialDir(), { recursive: true, mode: 0o750 });
  await writeFile(stateFile(), JSON.stringify({ state, at: Date.now() }), { mode: 0o600 });
  return state;
}
export async function takeTiktokState(state: string): Promise<boolean> {
  try {
    const s = JSON.parse(await readFile(stateFile(), "utf8"));
    await rm(stateFile(), { force: true });
    return typeof s.state === "string" && s.state.length === 48 && s.state === state && Date.now() - s.at < 10 * 60_000;
  } catch { return false; }
}

async function tokenRequest(params: Record<string, string>): Promise<TiktokTokens> {
  const res = await fetch(`${TT_API}/v2/oauth/token/`, {
    method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: new URLSearchParams(params), signal: AbortSignal.timeout(20_000),
  });
  const j = await res.json().catch(() => ({}));
  if (!res.ok || j.error || !j.access_token) throw new Error(j.error_description || j.error || `TikTok ${res.status}`);
  const now = Date.now();
  return {
    access_token: j.access_token, refresh_token: j.refresh_token, open_id: j.open_id, scope: j.scope || "",
    expires_at: now + (Number(j.expires_in) || 86400) * 1000, refresh_expires_at: now + (Number(j.refresh_expires_in) || 31536000) * 1000,
  };
}

/** Code aus dem Rückweg gegen Zugang tauschen und Konto merken */
export async function finishTiktokLogin(code: string) {
  const { clientKey, secret } = await tiktokCreds();
  if (!clientKey || !secret) throw new Error("Client Key oder Client Secret fehlt im CRM.");
  const tokens = await tokenRequest({ client_key: clientKey, client_secret: secret, code, grant_type: "authorization_code", redirect_uri: tiktokRedirectUri() });
  let name = "";
  try {
    const r = await fetch(`${TT_API}/v2/user/info/?fields=open_id,display_name`, { headers: { Authorization: `Bearer ${tokens.access_token}` }, signal: AbortSignal.timeout(15_000) });
    name = (await r.json())?.data?.user?.display_name || "";
  } catch { /* nur Anzeige */ }
  await saveTiktokConnection(tokens, { name, scope: tokens.scope, at: new Date().toISOString() });
  return name;
}

/** Zugang gilt 24 Stunden – bei Bedarf mit dem Erneuerungs-Schlüssel (365 Tage) verlängern */
export async function freshTiktokTokens(t: TiktokTokens): Promise<TiktokTokens> {
  if (t.expires_at - Date.now() > 10 * 60_000) return t;
  const { clientKey, secret } = await tiktokCreds();
  const n = await tokenRequest({ client_key: clientKey, client_secret: secret, grant_type: "refresh_token", refresh_token: t.refresh_token });
  await saveTiktokConnection(n);
  return n;
}

export type CreatorInfo = {
  creator_username?: string; creator_nickname?: string; privacy_level_options: string[];
  comment_disabled: boolean; duet_disabled: boolean; stitch_disabled: boolean; max_video_post_duration_sec?: number;
};
export async function creatorInfo(t: TiktokTokens): Promise<CreatorInfo> {
  const res = await fetch(`${TT_API}/v2/post/publish/creator_info/query/`, {
    method: "POST", headers: { Authorization: `Bearer ${t.access_token}`, "Content-Type": "application/json; charset=UTF-8" }, body: "{}", signal: AbortSignal.timeout(15_000),
  });
  const j = await res.json().catch(() => ({}));
  if (!res.ok || (j.error && j.error.code !== "ok")) throw new Error(j.error?.message || `TikTok ${res.status}`);
  return j.data;
}
