import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/server/adminAuth";
import { elevenlabsKey } from "@/lib/server/socialSettings";
import { jsonError } from "@/lib/server/request";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const API = process.env.ELEVENLABS_API || "https://api.elevenlabs.io/v1";

type Voice = { voice_id: string; name: string; category?: string; description?: string; labels?: Record<string, string> };

/** Stimmen aus dem eigenen ElevenLabs-Konto (Schlüssel bleibt auf dem Server) */
export async function GET() {
  if (!(await isAdmin())) return jsonError(401, "unauthorized");
  const key = await elevenlabsKey().catch(() => "");
  if (!key) return jsonError(409, "Erst den ElevenLabs-Schlüssel speichern.");
  try {
    const res = await fetch(`${API}/voices`, { headers: { "xi-api-key": key }, cache: "no-store", signal: AbortSignal.timeout(15_000) });
    if (res.status === 401) return jsonError(401, "ElevenLabs lehnt den Schlüssel ab – bitte prüfen.");
    if (!res.ok) return jsonError(502, `ElevenLabs antwortet nicht (${res.status}).`);
    const j = (await res.json()) as { voices?: Voice[] };
    const voices = (j.voices ?? []).map((v) => ({
      id: v.voice_id, name: v.name, category: v.category ?? "",
      info: [v.labels?.gender, v.labels?.age, v.labels?.accent, v.labels?.language, v.labels?.description || v.labels?.descriptive || v.labels?.use_case].filter(Boolean).join(" · "),
    })).sort((a, b) => (b.category === "cloned" ? 1 : 0) - (a.category === "cloned" ? 1 : 0) || a.name.localeCompare(b.name));
    return NextResponse.json({ ok: true, voices }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return jsonError(502, "ElevenLabs ist gerade nicht erreichbar.");
  }
}
