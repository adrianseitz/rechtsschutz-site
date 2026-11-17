import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/server/adminAuth";
import { FOTO_TYPES, saveFigurFoto } from "@/lib/server/socialSettings";
import { fileStorageEnabled } from "@/lib/server/storage";
import { rateLimit } from "@/lib/server/rateLimit";
import { jsonError, originAllowed } from "@/lib/server/request";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BYTES = 12 * 1024 * 1024;

/** Foto für die Moderator-Figur hochladen. Bleibt auf dem Server; der Worker schickt eine verkleinerte Kopie an Cloudflare. */
export async function POST(req: Request) {
  if (!originAllowed(req)) return jsonError(403, "forbidden");
  if (!(await isAdmin())) return jsonError(401, "unauthorized");
  if (!fileStorageEnabled()) return jsonError(409, "Speicherung ist ausgeschaltet.");
  if (!rateLimit("figur-foto", 30, 60 * 60 * 1000).ok) return jsonError(429, "Zu viele Uploads – bitte später noch einmal.");
  if (Number(req.headers.get("content-length") || 0) > MAX_BYTES + 64 * 1024) return jsonError(413, "Das Foto ist zu groß (höchstens 12 MB).");
  let form: FormData;
  try { form = await req.formData(); } catch { return jsonError(400, "Foto konnte nicht gelesen werden."); }
  const file = form.get("foto");
  if (!(file instanceof Blob) || !file.size) return jsonError(422, "Kein Foto erhalten.");
  if (file.size > MAX_BYTES) return jsonError(413, "Das Foto ist zu groß (höchstens 12 MB).");
  const ext = FOTO_TYPES[(file.type || "").toLowerCase()];
  if (!ext) return jsonError(415, "Bitte ein JPG-, PNG- oder WebP-Foto verwenden.");
  try {
    const settings = await saveFigurFoto(Buffer.from(await file.arrayBuffer()), ext);
    return NextResponse.json({ ok: true, settings }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return jsonError(500, "Speichern fehlgeschlagen.");
  }
}
