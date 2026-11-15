import { NextResponse } from "next/server";
import { z } from "zod";
import { isAdmin } from "@/lib/server/adminAuth";
import { addSocialJob, toggleEpisode } from "@/lib/server/socialSettings";
import { fileStorageEnabled } from "@/lib/server/storage";
import { jsonError, originAllowed, readJson } from "@/lib/server/request";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({
  type: z.enum(["render", "post", "reset", "usage", "on", "off"]),
  id: z.string().regex(/^[a-z0-9][a-z0-9-]{0,80}$/).optional(),
});

/** Aufträge an die Video-Automatik: jetzt erstellen, jetzt posten, wieder einreihen, an/aus */
export async function POST(req: Request) {
  if (!originAllowed(req)) return jsonError(403, "forbidden");
  if (!(await isAdmin())) return jsonError(401, "unauthorized");
  if (!fileStorageEnabled()) return jsonError(409, "Speicherung ist ausgeschaltet.");
  let body: unknown;
  try { body = await readJson(req); } catch { return jsonError(400, "bad_request"); }
  const p = schema.safeParse(body);
  if (!p.success || (p.data.type !== "usage" && !p.data.id)) return jsonError(422, "Ungültiger Auftrag.");
  const { type, id = "" } = p.data;
  if (type === "on" || type === "off") await toggleEpisode(id, type === "on");
  else await addSocialJob(type, id);
  return NextResponse.json({ ok: true });
}
