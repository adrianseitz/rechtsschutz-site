import { NextResponse } from "next/server";
import { contactPayloadSchema } from "@/lib/schemas";
import { buildContactRecord } from "@/lib/server/records";
import { deliver, DeliveryError } from "@/lib/server/deliver";
import { fieldErrors, guard, isSpam, silentOk } from "@/lib/server/guard";
import { jsonError } from "@/lib/server/request";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const g = await guard(req, "contact");
  if (!g.ok) return g.response;

  const parsed = contactPayloadSchema.safeParse(g.body);
  if (!parsed.success) return jsonError(422, "Bitte prüfe deine Angaben.", { fields: fieldErrors(parsed.error.issues) });
  if (isSpam(parsed.data.spam)) return silentOk();

  const record = buildContactRecord(parsed.data.form, parsed.data.attribution, parsed.data.trackingConsent, g.meta);
  try {
    await deliver(record);
  } catch (e) {
    console.error("[contact] Zustellung fehlgeschlagen:", (e as Error).message);
    return jsonError(503, e instanceof DeliveryError ? "Der Dienst ist gerade nicht erreichbar. Bitte versuche es später erneut." : "Unerwarteter Fehler. Bitte versuche es erneut.");
  }
  return NextResponse.json({ ok: true, leadId: record.id }, { status: 201 });
}
