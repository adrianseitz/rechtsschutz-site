import { NextResponse } from "next/server";
import { effectiveTracking } from "@/lib/server/trackingSettings";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Öffentliche Laufzeit-Konfiguration: nur Kennungen, die ohnehin im Seitenquelltext stehen würden. */
export async function GET() {
  const { tracking, source } = await effectiveTracking();
  return NextResponse.json({ tracking, source }, { headers: { "Cache-Control": "no-store" } });
}
