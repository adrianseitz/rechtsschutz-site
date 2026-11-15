import { z } from "zod";
import { isAdmin } from "@/lib/server/adminAuth";
import { elevenlabsKey } from "@/lib/server/socialSettings";
import { rateLimit } from "@/lib/server/rateLimit";
import { jsonError, originAllowed, readJson } from "@/lib/server/request";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const API = process.env.ELEVENLABS_API || "https://api.elevenlabs.io/v1";
const SAMPLE = "Dein Mieter zahlt plötzlich keine Miete mehr? Dann wird es schnell teuer. Mach den kostenlosen Check, der Link ist in meiner Bio.";
const schema = z.object({ voiceId: z.string().regex(/^[A-Za-z0-9]{6,60}$/), speed: z.number().min(0.8).max(1.2) });

/** Hörprobe einer Stimme (ein Satz, kostet ca. 130 Zeichen Guthaben) */
export async function POST(req: Request) {
  if (!originAllowed(req)) return jsonError(403, "forbidden");
  if (!(await isAdmin())) return jsonError(401, "unauthorized");
  if (!rateLimit("voice-test", 20, 60 * 60 * 1000).ok) return jsonError(429, "Zu viele Hörproben – bitte später noch einmal.");
  let body: unknown;
  try { body = await readJson(req); } catch { return jsonError(400, "bad_request"); }
  const p = schema.safeParse(body);
  if (!p.success) return jsonError(422, "Bitte erst eine Stimme wählen.");
  const key = await elevenlabsKey().catch(() => "");
  if (!key) return jsonError(409, "Erst den ElevenLabs-Schlüssel speichern.");
  try {
    const res = await fetch(`${API}/text-to-speech/${p.data.voiceId}?output_format=mp3_44100_128`, {
      method: "POST",
      headers: { "xi-api-key": key, "Content-Type": "application/json", Accept: "audio/mpeg" },
      body: JSON.stringify({ text: SAMPLE, model_id: "eleven_multilingual_v2", voice_settings: { stability: 0.5, similarity_boost: 0.75, style: 0.15, use_speaker_boost: true, speed: p.data.speed } }),
      signal: AbortSignal.timeout(45_000),
    });
    if (!res.ok) return jsonError(502, res.status === 401 ? "ElevenLabs lehnt den Schlüssel ab." : `ElevenLabs-Fehler (${res.status}).`);
    return new Response(await res.arrayBuffer(), { headers: { "Content-Type": "audio/mpeg", "Cache-Control": "no-store" } });
  } catch {
    return jsonError(502, "ElevenLabs ist gerade nicht erreichbar.");
  }
}
