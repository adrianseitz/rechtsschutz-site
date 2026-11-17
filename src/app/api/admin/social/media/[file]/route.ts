import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { Readable } from "node:stream";
import { isAdmin } from "@/lib/server/adminAuth";
import { socialMediaPath } from "@/lib/server/socialSettings";
import { jsonError } from "@/lib/server/request";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Fertige Videos und Vorschaubilder für die Vorschau im CRM (mit Range, damit man im Video spulen kann) */
export async function GET(req: Request, { params }: { params: Promise<{ file: string }> }) {
  if (!(await isAdmin())) return jsonError(401, "unauthorized");
  const { file } = await params;
  const p = socialMediaPath(file);
  if (!p) return jsonError(400, "bad_request");
  const s = await stat(p).catch(() => null);
  if (!s?.isFile()) return jsonError(404, "not_found");
  const type = file.endsWith(".mp4") ? "video/mp4" : file.endsWith(".mp3") ? "audio/mpeg" : "image/jpeg";
  const base = { "Content-Type": type, "Accept-Ranges": "bytes", "Cache-Control": "private, no-cache", "Last-Modified": s.mtime.toUTCString() };
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
