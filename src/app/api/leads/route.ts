import { NextResponse } from "next/server";
import { leadSchema } from "@/lib/schemas";
import { buildLeadRecord } from "@/lib/server/records";
import { deliver, DeliveryError } from "@/lib/server/deliver";
import { fieldErrors, guard, isSpam, silentOk } from "@/lib/server/guard";
import { jsonError } from "@/lib/server/request";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const g = await guard(req, "lead");
  if (!g.ok) return g.response;

  const parsed = leadSchema.safeParse(g.body);
  if (!parsed.success) return jsonError(422, "Bitte prüfe deine Angaben.", { fields: fieldErrors(parsed.error.issues) });
  if (isSpam(parsed.data.spam)) return silentOk();

  const record = buildLeadRecord(parsed.data, g.meta);
  try {
    await deliver(record);
  } catch (e) {
    console.error("[lead] Zustellung fehlgeschlagen:", (e as Error).message);
    const msg = e instanceof DeliveryError ? "Der Dienst ist gerade nicht erreichbar. Bitte versuche es später erneut oder kontaktiere mich direkt." : "Unerwarteter Fehler. Bitte versuche es erneut.";
    return jsonError(503, msg);
  }
  return NextResponse.json({ ok: true, leadId: record.id }, { status: 201 });
}
