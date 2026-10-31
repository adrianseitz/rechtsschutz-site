import { NextResponse } from "next/server";
import { z } from "zod";
import { isAdmin } from "@/lib/server/adminAuth";
import { publicMailSettings, saveMailSettings } from "@/lib/server/mailSettings";
import { fileStorageEnabled } from "@/lib/server/storage";
import { jsonError, originAllowed, readJson } from "@/lib/server/request";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({
  host: z.string().trim().min(3).max(120).regex(/^[a-z0-9.-]+$/i, "Ungültige Server-Adresse"),
  port: z.number().int().min(1).max(65535),
  secure: z.boolean(),
  user: z.string().trim().max(160),
  pass: z.string().max(200).optional(),
  from: z.string().trim().max(160),
  to: z.string().trim().email("Ungültige Empfänger-Adresse").max(160),
  enabled: z.boolean(),
});

export async function GET() {
  if (!(await isAdmin())) return jsonError(401, "unauthorized");
  return NextResponse.json({ ok: true, settings: await publicMailSettings() }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(req: Request) {
  if (!originAllowed(req)) return jsonError(403, "forbidden");
  if (!(await isAdmin())) return jsonError(401, "unauthorized");
  if (!fileStorageEnabled()) return jsonError(409, "Speicherung ist ausgeschaltet.");
  let body: unknown;
  try {
    body = await readJson(req);
  } catch {
    return jsonError(400, "bad_request");
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) return jsonError(422, parsed.error.issues[0]?.message ?? "Ungültige Angaben.");
  try {
    await saveMailSettings(parsed.data);
  } catch (e) {
    return jsonError(500, e instanceof Error ? e.message : "Speichern fehlgeschlagen.");
  }
  return NextResponse.json({ ok: true, settings: await publicMailSettings() }, { headers: { "Cache-Control": "no-store" } });
}
