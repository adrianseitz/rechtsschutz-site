// services.mjs: die zwei Dienste von außen – ElevenLabs (Stimme) und Upload-Post (Posten auf TikTok, Instagram, YouTube).
// Die Schlüssel kommen aus dem CRM (verschlüsselt gespeichert) und werden nie ausgegeben oder protokolliert.
import { readFile } from "node:fs/promises";

const EL = "https://api.elevenlabs.io/v1";
const UP = process.env.UPLOAD_POST_API || "https://api.upload-post.com/api";
const EL_BASE = process.env.ELEVENLABS_API || EL;

async function failText(res) {
  const t = await res.text().catch(() => "");
  try { const j = JSON.parse(t); return j.detail?.message || j.detail?.status || j.message || j.error || t.slice(0, 200); } catch { return t.slice(0, 200); }
}

/** Sprachaufnahme als MP3 (Buffer) */
export async function tts({ key, voiceId, text, speed = 1.1, model = "eleven_multilingual_v2", previous, next, expressive = false }) {
  const res = await fetch(`${EL_BASE}/text-to-speech/${encodeURIComponent(voiceId)}?output_format=mp3_44100_128`, {
    method: "POST",
    headers: { "xi-api-key": key, "Content-Type": "application/json", Accept: "audio/mpeg" },
    body: JSON.stringify({
      text, model_id: model,
      voice_settings: { stability: expressive ? 0.35 : 0.5, similarity_boost: 0.8, style: expressive ? 0.45 : 0.15, use_speaker_boost: true, speed: Math.min(1.2, Math.max(0.7, speed)) },
      ...(previous ? { previous_text: previous } : {}), ...(next ? { next_text: next } : {}),
    }),
    signal: AbortSignal.timeout(90_000),
  });
  if (!res.ok) throw new Error(`ElevenLabs ${res.status}: ${await failText(res)}`);
  return Buffer.from(await res.arrayBuffer());
}

/** Angaben zu einer Stimme (u. a. category: "cloned" für einen selbst erstellten Klon) */
export async function voiceInfo({ key, voiceId }) {
  const res = await fetch(`${EL_BASE}/voices/${encodeURIComponent(voiceId)}`, { headers: { "xi-api-key": key }, signal: AbortSignal.timeout(15_000) });
  if (!res.ok) throw new Error(`ElevenLabs ${res.status}: ${await failText(res)}`);
  return res.json();
}

/** Verbrauch im laufenden Monat */
export async function elevenlabsUsage(key) {
  const res = await fetch(`${EL_BASE}/user/subscription`, { headers: { "xi-api-key": key }, signal: AbortSignal.timeout(20_000) });
  if (!res.ok) throw new Error(`ElevenLabs ${res.status}: ${await failText(res)}`);
  const j = await res.json();
  return { used: j.character_count ?? null, limit: j.character_limit ?? null, reset: j.next_character_count_reset_unix ?? null, tier: j.tier ?? null };
}

/**
 * Video hochladen und auf den gewählten Plattformen veröffentlichen (asynchron; Status später abfragen).
 * @returns {Promise<{ requestId: string, response: object }>}
 */
export async function uploadVideo({ key, user, platforms, file, ep, requestId, youtubeDescription, aiLabel = true, promo = true }) {
  const f = new FormData();
  f.append("user", user);
  for (const p of platforms) f.append("platform[]", p);
  f.append("video", new Blob([await readFile(file)], { type: "video/mp4" }), `${ep.id}.mp4`);
  f.append("title", ep.caption);                       // TikTok + Instagram nutzen den Titel als Bildunterschrift
  f.append("youtube_title", (ep.youtube?.title || ep.title).slice(0, 100));
  f.append("youtube_description", youtubeDescription);
  for (const t of ep.youtube?.tags || []) f.append("tags[]", t);
  f.append("privacyStatus", "public");
  f.append("privacy_level", "PUBLIC_TO_EVERYONE");
  f.append("media_type", "REELS");
  f.append("share_to_feed", "true");
  if (aiLabel) { f.append("is_aigc", "true"); f.append("is_ai_generated", "true"); f.append("containsSyntheticMedia", "true"); }
  if (promo) { f.append("disclose_commercial", "true"); f.append("brand_organic_toggle", "true"); }
  f.append("async_upload", "true");
  f.append("request_id", requestId);
  const res = await fetch(`${UP}/upload`, {
    method: "POST",
    headers: { Authorization: `Apikey ${key}`, "Idempotency-Key": requestId },
    body: f,
    signal: AbortSignal.timeout(10 * 60_000),
  });
  const text = await res.text();
  let json = {}; try { json = JSON.parse(text); } catch { json = { raw: text.slice(0, 300) }; }
  if (!res.ok || json.success === false) throw new Error(`Upload-Post ${res.status}: ${json.message || json.error || json.raw || "Fehler"}`);
  return { requestId: json.request_id || requestId, response: json };
}

/** Status eines Uploads (pending, processing, completed, failed …) */
export async function uploadStatus({ key, requestId }) {
  const res = await fetch(`${UP}/uploadposts/status?request_id=${encodeURIComponent(requestId)}`, {
    headers: { Authorization: `Apikey ${key}` }, signal: AbortSignal.timeout(30_000),
  });
  const j = await res.json().catch(() => ({}));
  if (res.status === 404) return { status: "not_found", results: [] };
  if (!res.ok) throw new Error(`Upload-Post ${res.status}: ${j.message || j.error || "Status nicht abrufbar"}`);
  return j;
}
