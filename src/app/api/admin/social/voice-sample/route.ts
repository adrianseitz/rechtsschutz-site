import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/server/adminAuth";
import { SAMPLE_TYPES, deleteVoiceSample, saveVoiceSample } from "@/lib/server/socialSettings";
import { fileStorageEnabled } from "@/lib/server/storage";
import { rateLimit } from "@/lib/server/rateLimit";
import { jsonError, originAllowed } from "@/lib/server/request";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BYTES = 15 * 1024 * 1024;

/** Eigene Sprachaufnahme hochladen (im Browser aufgenommen oder als Datei). Bleibt auf dem Server, wird nie veröffentlicht. */
export async function POST(req: Request) {
  if (!originAllowed(req)) return jsonError(403, "forbidden");
  if (!(await isAdmin())) return jsonError(401, "unauthorized");
  if (!fileStorageEnabled()) return jsonError(409, "Speicherung ist ausgeschaltet.");
  if (!rateLimit("voice-sample", 30, 60 * 60 * 1000).ok) return jsonError(429, "Zu viele Aufnahmen – bitte später noch einmal.");
  if (Number(req.headers.get("content-length") || 0) > MAX_BYTES + 64 * 1024) return jsonError(413, "Die Datei ist zu groß (höchstens 15 MB).");
  let form: FormData;
  try { form = await req.formData(); } catch { return jsonError(400, "Aufnahme konnte nicht gelesen werden."); }
  const file = form.get("audio");
  if (!(file instanceof Blob) || !file.size) return jsonError(422, "Keine Aufnahme erhalten.");
  if (file.size > MAX_BYTES) return jsonError(413, "Die Datei ist zu groß (höchstens 15 MB).");
  const type = (file.type || "").split(";")[0].trim().toLowerCase();
  const ext = SAMPLE_TYPES[type];
  if (!ext) return jsonError(415, "Dieses Format geht nicht. Bitte MP3, M4A, WAV oder eine Aufnahme hier im Browser verwenden.");
  const seconds = Math.max(0, Math.min(600, Number(form.get("seconds")) || 0));
  if (seconds && seconds < 8) return jsonError(422, "Die Aufnahme ist zu kurz. Bitte mindestens 15 Sekunden sprechen.");
  try {
    const settings = await saveVoiceSample(Buffer.from(await file.arrayBuffer()), ext, seconds);
    return NextResponse.json({ ok: true, settings }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return jsonError(500, "Speichern fehlgeschlagen.");
  }
}

export async function DELETE(req: Request) {
  if (!originAllowed(req)) return jsonError(403, "forbidden");
  if (!(await isAdmin())) return jsonError(401, "unauthorized");
  const settings = await deleteVoiceSample();
  return NextResponse.json({ ok: true, settings }, { headers: { "Cache-Control": "no-store" } });
}
