// tiktok.mjs: Videos über die offizielle TikTok-Schnittstelle (Content Posting API) – ohne Zusatzdienst.
// Zwei Wege:
//   entwurf – das Video landet im Postfach der TikTok-App; Adrian tippt dort auf „Posten“ (Sound, Text, Kennzeichnung prüfen)
//   direkt  – wird sofort veröffentlicht. Solange TikTok die App nicht geprüft hat, sind solche Videos nur privat sichtbar.
import { open, stat } from "node:fs/promises";

const API = process.env.TIKTOK_API || "https://open.tiktokapis.com";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function api(path, { token, body = {} }) {
  const res = await fetch(`${API}${path}`, {
    method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json; charset=UTF-8" },
    body: JSON.stringify(body), signal: AbortSignal.timeout(60_000),
  });
  const j = await res.json().catch(() => ({}));
  if (!res.ok || (j.error && j.error.code && j.error.code !== "ok")) {
    const code = j.error?.code || res.status;
    const hint = {
      access_token_invalid: " – bitte im CRM neu mit TikTok verbinden",
      scope_not_authorized: " – die App hat diese Berechtigung nicht (im TikTok-Entwicklerportal freischalten und neu verbinden)",
      spam_risk_too_many_pending_share: " – mehr als 5 offene Entwürfe in 24 Stunden; erst die Entwürfe in der App posten",
      unaudited_client_can_only_post_to_private_accounts: " – TikTok hat die App noch nicht geprüft; bis dahin nur privat oder als Entwurf",
    }[code] || "";
    throw new Error(`TikTok: ${j.error?.message || code}${hint}`);
  }
  return j.data || {};
}

/** Zugang (24 h) mit dem Erneuerungs-Schlüssel verlängern → neue Tokens oder null, wenn noch gültig */
export async function ttRefresh({ clientKey, secret, tokens }) {
  if (tokens.expires_at - Date.now() > 10 * 60_000) return null;
  const res = await fetch(`${API}/v2/oauth/token/`, {
    method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ client_key: clientKey, client_secret: secret, grant_type: "refresh_token", refresh_token: tokens.refresh_token }),
    signal: AbortSignal.timeout(20_000),
  });
  const j = await res.json().catch(() => ({}));
  if (!res.ok || j.error || !j.access_token) throw new Error(`TikTok-Zugang verlängern: ${j.error_description || j.error || res.status} – bitte im CRM neu verbinden`);
  const now = Date.now();
  return {
    access_token: j.access_token, refresh_token: j.refresh_token || tokens.refresh_token, open_id: j.open_id || tokens.open_id, scope: j.scope || tokens.scope,
    expires_at: now + (Number(j.expires_in) || 86400) * 1000, refresh_expires_at: now + (Number(j.refresh_expires_in) || 31536000) * 1000,
  };
}

/** Größen fürs Hochladen in Stücken (bis 64 MB in einem Stück; sonst 10-MB-Stücke, das letzte nimmt den Rest) */
function chunks(size) {
  if (size <= 64 * 1024 * 1024) return { chunk_size: size, total_chunk_count: 1 };
  const chunk = 10 * 1024 * 1024;
  return { chunk_size: chunk, total_chunk_count: Math.floor(size / chunk) };
}

async function uploadFile(url, file, size, { chunk_size, total_chunk_count }) {
  const fh = await open(file, "r");
  try {
    for (let i = 0; i < total_chunk_count; i++) {
      const start = i * chunk_size;
      const end = i === total_chunk_count - 1 ? size - 1 : start + chunk_size - 1;
      const buf = Buffer.alloc(end - start + 1);
      await fh.read(buf, 0, buf.length, start);
      const res = await fetch(url, {
        method: "PUT", body: buf,
        headers: { "Content-Type": "video/mp4", "Content-Length": String(buf.length), "Content-Range": `bytes ${start}-${end}/${size}` },
        signal: AbortSignal.timeout(10 * 60_000),
      });
      if (!res.ok && res.status !== 206) throw new Error(`TikTok: Hochladen fehlgeschlagen (${res.status})`);
    }
  } finally { await fh.close(); }
}

/**
 * Video zu TikTok schicken.
 * @param {{ token: string, file: string, caption: string, mode: "entwurf"|"direkt", opts?: object, onStep?: (t: string) => Promise<void> }} o
 * @returns {Promise<{ status: "inbox"|"published"|"private", url: string|null, username: string }>}
 */
export async function ttPost({ token, file, caption, mode, opts = {}, onStep = async () => {} }) {
  const size = (await stat(file)).size;
  const parts = chunks(size);
  const source_info = { source: "FILE_UPLOAD", video_size: size, ...parts };
  // Was erlaubt TikTok für dieses Konto? (Pflicht vor jedem Direkt-Post)
  const info = await api("/v2/post/publish/creator_info/query/", { token });
  let init, privacy = null;
  if (mode === "direkt") {
    const allowed = info.privacy_level_options || [];
    privacy = allowed.includes(opts.privacy) ? opts.privacy : allowed.includes("SELF_ONLY") ? "SELF_ONLY" : allowed[0];
    const post_info = {
      title: caption.slice(0, 2200), privacy_level: privacy,
      disable_comment: info.comment_disabled || opts.comments === false,
      disable_duet: info.duet_disabled || opts.duet === false,
      disable_stitch: info.stitch_disabled || opts.stitch === false,
      video_cover_timestamp_ms: 1000,
      brand_content_toggle: false, brand_organic_toggle: opts.ownBrand !== false,
      is_aigc: opts.aigc === true,
    };
    await onStep("Lädt das Video zu TikTok hoch");
    init = await api("/v2/post/publish/video/init/", { token, body: { post_info, source_info } });
  } else {
    await onStep("Schickt das Video ins TikTok-Postfach");
    init = await api("/v2/post/publish/inbox/video/init/", { token, body: { source_info } });
  }
  await uploadFile(init.upload_url, file, size, parts);
  // Verarbeitung abwarten (höchstens 10 Minuten)
  for (let i = 0; i < 120; i++) {
    await sleep(5_000);
    const st = await api("/v2/post/publish/status/fetch/", { token, body: { publish_id: init.publish_id } });
    if (st.status === "FAILED") throw new Error(`TikTok konnte das Video nicht verarbeiten (${st.fail_reason || "unbekannt"}).`);
    if (st.status === "SEND_TO_USER_INBOX") return { status: "inbox", url: null, username: info.creator_username || "" };
    if (st.status === "PUBLISH_COMPLETE") {
      const id = (st.publicaly_available_post_id || [])[0];
      const url = id && info.creator_username ? `https://www.tiktok.com/@${info.creator_username}/video/${id}` : null;
      return { status: privacy === "PUBLIC_TO_EVERYONE" && id ? "published" : "private", url, username: info.creator_username || "" };
    }
  }
  throw new Error("TikTok hat das Video nach 10 Minuten noch nicht verarbeitet.");
}
