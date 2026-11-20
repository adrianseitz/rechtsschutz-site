import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { Readable } from "node:stream";
import { publicClip } from "@/lib/server/socialSettings";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Kurzzeit-Link für Instagram: Beim Veröffentlichen legt der Worker eine Kopie des Videos (oder der Bilder eines Bilder-Posts) unter einem zufälligen,
 * nicht erratbaren Namen ab (32 Hex-Zeichen), Instagram lädt sie von hier, danach wird sie gelöscht (spätestens nach 6 Stunden).
 */
export async function GET(req: Request, { params }: { params: Promise<{ file: string }> }) {
  const { file } = await params;
  const p = await publicClip(file);
  if (!p) return new Response("not found", { status: 404 });
  const s = await stat(p).catch(() => null);
  if (!s) return new Response("not found", { status: 404 });
  const base = { "Content-Type": file.endsWith(".jpg") ? "image/jpeg" : "video/mp4", "Accept-Ranges": "bytes", "Cache-Control": "no-store", "X-Robots-Tag": "noindex" };
  const m = /^bytes=(\d*)-(\d*)$/.exec(req.headers.get("range") || "");
  if (m && (m[1] || m[2])) {
    const start = m[1] ? Number(m[1]) : Math.max(0, s.size - Number(m[2]));
    const end = m[1] && m[2] ? Math.min(Number(m[2]), s.size - 1) : s.size - 1;
    if (start >= s.size || start > end) return new Response(null, { status: 416, headers: { "Content-Range": `bytes */${s.size}` } });
    const body = Readable.toWeb(createReadStream(p, { start, end })) as ReadableStream;
    return new Response(body, { status: 206, headers: { ...base, "Content-Range": `bytes ${start}-${end}/${s.size}`, "Content-Length": String(end - start + 1) } });
  }
  const body = Readable.toWeb(createReadStream(p)) as ReadableStream;
  return new Response(body, { headers: { ...base, "Content-Length": String(s.size) } });
}
