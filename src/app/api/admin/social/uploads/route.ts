import { NextResponse } from "next/server";
import { z } from "zod";
import { isAdmin } from "@/lib/server/adminAuth";
import { deleteUpload, listUploads, saveUpload, updateUpload, UPLOAD_ID } from "@/lib/server/socialSettings";
import { fileStorageEnabled } from "@/lib/server/storage";
import { rateLimit } from "@/lib/server/rateLimit";
import { jsonError, originAllowed, readJson } from "@/lib/server/request";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BYTES = 250 * 1024 * 1024;   // Instagram nimmt Reels bis 300 MB
const tiktok = z.object({
  privacy: z.enum(["PUBLIC_TO_EVERYONE", "MUTUAL_FOLLOW_FRIENDS", "FOLLOWER_OF_CREATOR", "SELF_ONLY"]),
  comments: z.boolean(), duet: z.boolean(), stitch: z.boolean(), aigc: z.boolean(), ownBrand: z.boolean(),
});
const meta = z.object({
  title: z.string().trim().min(1, "Bitte einen kurzen Namen für das Video angeben.").max(120),
  caption: z.string().trim().max(2200, "Der Text darf höchstens 2.200 Zeichen haben (Grenze von Instagram)."),
  tiktok: tiktok.optional(),
});
const parseTiktok = (v: FormDataEntryValue | null) => { try { return typeof v === "string" && v ? JSON.parse(v) : undefined; } catch { return undefined; } };

async function guard(req: Request, write: boolean) {
  if (write && !originAllowed(req)) return jsonError(403, "forbidden");
  if (!(await isAdmin())) return jsonError(401, "unauthorized");
  if (!fileStorageEnabled()) return jsonError(409, "Speicherung ist ausgeschaltet.");
  return null;
}

/** Eigene Videos: auflisten */
export async function GET(req: Request) {
  const g = await guard(req, false);
  if (g) return g;
  return NextResponse.json({ ok: true, uploads: await listUploads() });
}

/** Eigenes Video hochladen (MP4) – es kommt in die Warteschlange und wird zum nächsten Termin gepostet */
export async function POST(req: Request) {
  const g = await guard(req, true);
  if (g) return g;
  if (!rateLimit("social-upload", 60, 60 * 60 * 1000).ok) return jsonError(429, "Zu viele Uploads – bitte später noch einmal.");
  if (Number(req.headers.get("content-length") || 0) > MAX_BYTES + 256 * 1024) return jsonError(413, "Das Video ist zu groß (höchstens 250 MB).");
  let form: FormData;
  try { form = await req.formData(); } catch { return jsonError(400, "Das Video konnte nicht gelesen werden."); }
  const file = form.get("video");
  if (!(file instanceof Blob) || !file.size) return jsonError(422, "Kein Video erhalten.");
  if (file.size > MAX_BYTES) return jsonError(413, "Das Video ist zu groß (höchstens 250 MB).");
  if ((file.type || "").toLowerCase() !== "video/mp4") return jsonError(415, "Bitte ein MP4-Video hochladen (so wie die fertigen Reels).");
  const m = meta.safeParse({ title: form.get("title") ?? "", caption: form.get("caption") ?? "", tiktok: parseTiktok(form.get("tiktok")) });
  if (!m.success) return jsonError(422, m.error.issues[0]?.message ?? "Ungültige Angaben.");
  const data = Buffer.from(await file.arrayBuffer());
  // MP4 erkennen: ab Byte 4 steht „ftyp“
  if (data.subarray(4, 8).toString("latin1") !== "ftyp") return jsonError(415, "Die Datei ist kein MP4-Video.");
  try {
    const upload = await saveUpload(data, m.data);
    return NextResponse.json({ ok: true, upload });
  } catch {
    return jsonError(500, "Speichern fehlgeschlagen.");
  }
}

/** Name oder Text eines eigenen Videos ändern */
export async function PATCH(req: Request) {
  const g = await guard(req, true);
  if (g) return g;
  let body: unknown;
  try { body = await readJson(req); } catch { return jsonError(400, "bad_request"); }
  const p = meta.extend({ id: z.string().regex(UPLOAD_ID) }).safeParse(body);
  if (!p.success) return jsonError(422, p.error.issues[0]?.message ?? "Ungültige Angaben.");
  const upload = await updateUpload(p.data.id, p.data);
  return upload ? NextResponse.json({ ok: true, upload }) : jsonError(404, "Video nicht gefunden.");
}

/** Eigenes Video löschen */
export async function DELETE(req: Request) {
  const g = await guard(req, true);
  if (g) return g;
  const id = new URL(req.url).searchParams.get("id") || "";
  if (!UPLOAD_ID.test(id)) return jsonError(422, "Ungültiges Video.");
  await deleteUpload(id);
  return NextResponse.json({ ok: true });
}
