import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/server/adminAuth";
import { readStatuses } from "@/lib/server/crmStatus";
import { readRecords } from "@/lib/server/storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const NAMES = { termin: "CRM Termin", abschluss: "CRM Abschluss" } as const;
const REACHED = ["termin", "angebot", "abschluss"];

/** Zeitpunkt im Format, das Google Ads erwartet (Zeitzone steht in der Kopfzeile der Datei). */
const stamp = (iso: string) => new Date(iso).toLocaleString("sv-SE", { timeZone: "Europe/Berlin" });

/**
 * Offline-Conversions für Google Ads (Import über „Uploads“).
 * Enthält ausschließlich Klick-Kennung, Conversion-Name, Zeitpunkt und Wert – keine Personendaten.
 * Die Klick-Kennung liegt nur für Anfragen vor, bei denen der Werbe-Messung zugestimmt wurde.
 */
export async function GET(req: Request) {
  if (!(await isAdmin())) return new NextResponse("Unauthorized", { status: 401 });
  const kind = new URL(req.url).searchParams.get("kind") === "abschluss" ? "abschluss" : "termin";
  const [leads, contacts, statuses] = await Promise.all([readRecords("lead"), readRecords("contact"), readStatuses()]);

  const rows: string[] = [];
  for (const r of [...leads, ...contacts]) {
    const gclid = r.attribution.gclid;
    const st = statuses[r.id];
    if (!gclid || !st || !/^[A-Za-z0-9_-]{10,300}$/.test(gclid)) continue;
    if (kind === "abschluss") {
      if (st.status !== "abschluss") continue;
      const at = [...st.history].reverse().find((h) => h.status === "abschluss")?.at ?? st.updatedAt;
      rows.push([gclid, NAMES.abschluss, stamp(at), st.value ? String(st.value) : "", st.value ? "EUR" : ""].join(","));
    } else {
      const first = st.history.find((h) => REACHED.includes(h.status));
      if (!first && !REACHED.includes(st.status)) continue;
      rows.push([gclid, NAMES.termin, stamp(first?.at ?? st.updatedAt), "", ""].join(","));
    }
  }
  const csv = ["Parameters:TimeZone=Europe/Berlin", "Google Click ID,Conversion Name,Conversion Time,Conversion Value,Conversion Currency", ...rows].join("\r\n") + "\r\n";
  return new NextResponse(csv, {
    headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="google-ads-${kind}-${new Date().toISOString().slice(0, 10)}.csv"`, "Cache-Control": "no-store" },
  });
}
