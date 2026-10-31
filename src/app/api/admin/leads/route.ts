import { NextResponse } from "next/server";
import { serverConfig } from "@/lib/server/config";
import { safeEqual, hashIdentifier } from "@/lib/server/crypto";
import { readRecords } from "@/lib/server/storage";
import { rateLimit } from "@/lib/server/rateLimit";
import { clientIp } from "@/lib/server/request";
import type { SubmissionRecord } from "@/lib/server/records";
import { isAdmin } from "@/lib/server/adminAuth";
import { readStatuses } from "@/lib/server/crmStatus";
import { STATUSES } from "@/lib/crm";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Geschützter Export: GET /api/admin/leads?type=lead|contact&format=json|csv
 * Header: Authorization: Bearer <ADMIN_TOKEN>. Ohne ADMIN_TOKEN ist der Endpunkt deaktiviert.
 */
export async function GET(req: Request) {
  const rl = rateLimit(`admin:${hashIdentifier(clientIp(req))}`, 30, 60_000);
  if (!rl.ok) return new NextResponse("Too many requests", { status: 429 });

  // Zugriff entweder mit CRM-Login (Cookie) oder per Bearer-Token für Automationen.
  const session = await isAdmin();
  if (!session) {
    if (!serverConfig.adminToken || serverConfig.adminToken.length < 24) return new NextResponse("Not found", { status: 404 });
    const auth = req.headers.get("authorization") || "";
    const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
    if (!token || !safeEqual(token, serverConfig.adminToken)) return new NextResponse("Unauthorized", { status: 401, headers: { "WWW-Authenticate": "Bearer" } });
  }

  const url = new URL(req.url);
  const t = url.searchParams.get("type");
  const type = t === "contact" ? "contact" : t === "lead" ? "lead" : session ? "alle" : "lead";
  const records = type === "alle"
    ? [...(await readRecords("lead")), ...(await readRecords("contact"))].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    : await readRecords(type);

  if (url.searchParams.get("format") === "csv") {
    const st = await readStatuses();
    return new NextResponse(toCsv(records, st), {
      headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="${type}s-${new Date().toISOString().slice(0, 10)}.csv"`, "Cache-Control": "no-store" },
    });
  }
  return NextResponse.json({ count: records.length, records }, { headers: { "Cache-Control": "no-store" } });
}

function toCsv(rows: SubmissionRecord[], st: Awaited<ReturnType<typeof readStatuses>>) {
  const cols: [string, (r: SubmissionRecord) => unknown][] = [
    ["Status", (r) => STATUSES.find((x) => x.value === (st[r.id]?.status ?? "neu"))?.label],
    ["Datum", (r) => new Date(r.createdAt).toLocaleString("de-DE", { timeZone: "Europe/Berlin" })],
    ["Typ", (r) => r.type],
    ["Bereich", (r) => r.productLabel],
    ["Situation", (r) => r.answers.situation?.label],
    ["Wohneinheiten", (r) => r.answers.einheiten?.value],
    ["Beginn", (r) => r.answers.beginn?.label],
    ["Bestehender RS", (r) => r.answers.bestand?.label],
    ["Anliegen", (r) => r.request?.requestType],
    ["Nachricht", (r) => r.request?.message],
    ["Vorname", (r) => r.contact.firstName],
    ["Nachname", (r) => r.contact.lastName ?? r.contact.name],
    ["E-Mail", (r) => r.contact.email],
    ["Telefon", (r) => r.contact.phone],
    ["Kontaktweg", (r) => r.contact.contactMethod],
    ["Kanal", (r) => r.attribution.channel],
    ["utm_source", (r) => r.attribution.utm_source],
    ["utm_medium", (r) => r.attribution.utm_medium],
    ["utm_campaign", (r) => r.attribution.utm_campaign],
    ["utm_content", (r) => r.attribution.utm_content],
    ["utm_term", (r) => r.attribution.utm_term],
    ["Landingpage", (r) => r.attribution.landingPage],
    ["Einwilligung Kontakt", (r) => (r.consents.contact.granted ? "ja" : "nein")],
    ["Einwilligung Marketing", (r) => (r.consents.marketing?.granted ? "ja" : "nein")],
    ["ID", (r) => r.id],
  ];
  const cell = (v: unknown) => {
    let s = v === undefined || v === null ? "" : String(v);
    if (/^[=+\-@]/.test(s)) s = `'${s}`; // Schutz vor CSV-Injection
    return `"${s.replace(/"/g, '""')}"`;
  };
  return "﻿" + [cols.map((c) => cell(c[0])).join(";"), ...rows.map((r) => cols.map((c) => cell(c[1](r))).join(";"))].join("\r\n");
}
