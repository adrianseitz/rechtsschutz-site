import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/server/adminAuth";
import { removeStatus } from "@/lib/server/crmStatus";
import { deleteRecord, fileStorageEnabled } from "@/lib/server/storage";
import { jsonError, originAllowed, readJson } from "@/lib/server/request";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Löscht eine Anfrage samt CRM-Status endgültig. */
export async function POST(req: Request) {
  if (!originAllowed(req)) return jsonError(403, "forbidden");
  if (!(await isAdmin())) return jsonError(401, "unauthorized");
  if (!fileStorageEnabled()) return jsonError(409, "storage_disabled");

  let body: { id?: unknown };
  try {
    body = (await readJson(req)) as typeof body;
  } catch {
    return jsonError(400, "bad_request");
  }
  const id = typeof body?.id === "string" && /^[0-9a-f-]{36}$/i.test(body.id) ? body.id : null;
  if (!id) return jsonError(400, "invalid");

  const removed = await deleteRecord(id);
  await removeStatus(id);
  if (!removed) return jsonError(404, "not_found");
  return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
}
