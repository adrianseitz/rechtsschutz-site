import { NextResponse } from "next/server";
import { isLeadStatus } from "@/lib/crm";
import { isAdmin } from "@/lib/server/adminAuth";
import { setStatus } from "@/lib/server/crmStatus";
import { fileStorageEnabled } from "@/lib/server/storage";
import { jsonError, originAllowed, readJson } from "@/lib/server/request";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  if (!originAllowed(req)) return jsonError(403, "forbidden");
  if (!(await isAdmin())) return jsonError(401, "unauthorized");
  if (!fileStorageEnabled()) return jsonError(409, "storage_disabled");

  let body: { id?: unknown; status?: unknown };
  try {
    body = (await readJson(req)) as typeof body;
  } catch {
    return jsonError(400, "bad_request");
  }
  const id = typeof body?.id === "string" && /^[0-9a-f-]{36}$/i.test(body.id) ? body.id : null;
  if (!id || !isLeadStatus(body.status)) return jsonError(400, "invalid");

  const entry = await setStatus(id, body.status);
  return NextResponse.json({ ok: true, entry }, { headers: { "Cache-Control": "no-store" } });
}
