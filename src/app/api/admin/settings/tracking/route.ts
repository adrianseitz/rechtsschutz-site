import { NextResponse } from "next/server";
import { z } from "zod";
import { isAdmin } from "@/lib/server/adminAuth";
import { effectiveTracking, saveTracking } from "@/lib/server/trackingSettings";
import { fileStorageEnabled } from "@/lib/server/storage";
import { jsonError, originAllowed, readJson } from "@/lib/server/request";
import { TRACKING_FORMAT } from "@/lib/trackingConfig";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const opt = (re: RegExp, msg: string) => z.string().trim().refine((v) => v === "" || re.test(v), msg);
const schema = z.object({
  adsId: opt(TRACKING_FORMAT.adsId, "Die Conversion-ID sieht so aus: AW-123456789"),
  adsLeadLabel: opt(TRACKING_FORMAT.adsLeadLabel, "Das Conversion-Label besteht nur aus Buchstaben, Ziffern, - und _."),
});

export async function GET() {
  if (!(await isAdmin())) return jsonError(401, "unauthorized");
  return NextResponse.json({ ok: true, ...(await effectiveTracking()) }, { headers: { "Cache-Control": "no-store" } });
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
  const { adsId, adsLeadLabel } = parsed.data;
  if (Boolean(adsId) !== Boolean(adsLeadLabel)) return jsonError(422, "Bitte Conversion-ID und Conversion-Label zusammen eintragen (oder beide leer lassen).");
  // Ein Label für alle Anfrage-Arten (Check, Kontaktformular, Terminwunsch).
  await saveTracking({ adsId, adsLeadLabel, adsContactLabel: adsLeadLabel, adsAppointmentLabel: adsLeadLabel });
  return NextResponse.json({ ok: true, ...(await effectiveTracking()) }, { headers: { "Cache-Control": "no-store" } });
}
