import { NextResponse } from "next/server";
import { z } from "zod";
import { isAdmin } from "@/lib/server/adminAuth";
import { updateMeta } from "@/lib/server/crmStatus";
import { fileStorageEnabled } from "@/lib/server/storage";
import { jsonError, originAllowed, readJson } from "@/lib/server/request";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const id = z.string().regex(/^[0-9a-f-]{36}$/i);
const schema = z.discriminatedUnion("action", [
  z.object({ id, action: z.literal("note"), text: z.string().trim().min(1).max(2000) }),
  z.object({ id, action: z.literal("attempt") }),
  z.object({ id, action: z.literal("followUp"), date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable() }),
  z.object({ id, action: z.literal("value"), value: z.number().min(0).max(1_000_000).nullable() }),
  z.object({ id, action: z.literal("lostReason"), reason: z.string().max(60).nullable() }),
]);

/** Notiz, Kontaktversuch, Wiedervorlage, Vertragswert oder Verlustgrund zu einer Anfrage speichern. */
export async function POST(req: Request) {
  if (!originAllowed(req)) return jsonError(403, "forbidden");
  if (!(await isAdmin())) return jsonError(401, "unauthorized");
  if (!fileStorageEnabled()) return jsonError(409, "storage_disabled");
  let body: unknown;
  try {
    body = await readJson(req);
  } catch {
    return jsonError(400, "bad_request");
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) return jsonError(400, "invalid");
  const { id: leadId, ...patch } = parsed.data;
  const entry = await updateMeta(leadId, patch);
  return NextResponse.json({ ok: true, entry }, { headers: { "Cache-Control": "no-store" } });
}
