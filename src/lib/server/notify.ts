import "server-only";
import nodemailer from "nodemailer";
import { serverConfig } from "./config";
import { effectiveMail } from "./mailSettings";
import type { SubmissionRecord } from "./records";

const esc = (s: unknown) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
const REQUEST_LABEL: Record<string, string> = { termin: "Beratungstermin", rueckruf: "Rückruf", frage: "Allgemeine Frage" };
const METHOD_LABEL: Record<string, string> = { email: "E-Mail", telefon: "Telefon", egal: "Egal" };
const ANSWER_LABEL: Record<string, string> = { situation: "Situation", einheiten: "Wohneinheiten", beginn: "Gewünschter Beginn", bestand: "Bestehender Rechtsschutz" };

export const mailReady = async () => Boolean(await effectiveMail());

function transportFor(m: NonNullable<Awaited<ReturnType<typeof effectiveMail>>>) {
  return nodemailer.createTransport({
    host: m.host, port: m.port, secure: m.secure,
    auth: m.user ? { user: m.user, pass: m.pass } : undefined,
    requireTLS: !m.secure,
    connectionTimeout: 10_000, greetingTimeout: 10_000, socketTimeout: 15_000,
  });
}

const crmLink = () => `${(serverConfig.siteUrl || "").replace(/\/$/, "")}/admin`;

/**
 * Benachrichtigung über eine neue Anfrage.
 * Bewusst OHNE Kontaktdaten (kein Name, keine E-Mail, keine Telefonnummer):
 * Die Anfrage selbst wird im CRM geöffnet. So bleiben Kundendaten auf dem eigenen Server.
 */
export async function sendNotification(r: SubmissionRecord) {
  const m = await effectiveMail();
  if (!m) return { skipped: true as const };

  const subject = r.type === "lead"
    ? `Neue Anfrage: ${r.productLabel}${r.answers.einheiten ? ` (${r.answers.einheiten.label})` : ""}`
    : `Neue Kontaktanfrage: ${REQUEST_LABEL[r.request?.requestType ?? ""] ?? "Kontakt"}`;

  const rows: [string, unknown][] = [
    ["Eingang", new Date(r.createdAt).toLocaleString("de-DE", { timeZone: "Europe/Berlin", dateStyle: "medium", timeStyle: "short" })],
    ["Bereich", r.productLabel],
    ...Object.entries(r.answers).filter(([k]) => k !== "bereich").map(([k, v]) => [ANSWER_LABEL[k] ?? k, v.label] as [string, unknown]),
    ...(r.request ? ([["Anliegen", REQUEST_LABEL[r.request.requestType]]] as [string, unknown][]) : []),
    ["Gewünschter Kontakt", r.contact.contactMethod ? METHOD_LABEL[r.contact.contactMethod] : r.contact.phone ? "Telefon möglich" : "E-Mail"],
    ["Herkunft", r.attribution.channel],
  ];
  const visible = rows.filter(([, v]) => v !== undefined && v !== "");
  const link = crmLink();
  const html = `<div style="font-family:Arial,Helvetica,sans-serif;color:#0B0B0A;max-width:520px">
<p style="margin:0 0 4px;font-size:12px;letter-spacing:.12em;text-transform:uppercase;color:#71716B">§ Seitz Rechtsschutz</p>
<h2 style="margin:0 0 16px;font-size:22px">${esc(subject)}</h2>
<table cellpadding="6" style="border-collapse:collapse;font-size:15px">${visible
    .map(([k, v]) => `<tr><td style="color:#71716B;vertical-align:top;padding-left:0">${esc(k)}</td><td><strong>${esc(v)}</strong></td></tr>`)
    .join("")}</table>
${link.startsWith("http") ? `<p style="margin:24px 0"><a href="${esc(link)}" style="background:#0B0B0A;color:#fff;text-decoration:none;padding:12px 20px;border-radius:999px;font-weight:bold;display:inline-block">Im CRM öffnen →</a></p>` : ""}
<p style="font-size:12px;color:#71716B">Name und Kontaktdaten findest du aus Datenschutzgründen nur im CRM.</p></div>`;
  const text = [subject, "", ...visible.map(([k, v]) => `${k}: ${v}`), "", link.startsWith("http") ? `Im CRM öffnen: ${link}` : "", "Name und Kontaktdaten findest du aus Datenschutzgründen nur im CRM."].join("\n");

  await transportFor(m).sendMail({ from: m.from || m.user, to: m.to, subject, text, html });
  return { skipped: false as const };
}

/** Testmail aus den CRM-Einstellungen. Wirft mit verständlicher Meldung. */
export async function sendTestMail() {
  const m = await effectiveMail();
  if (!m) throw new Error("E-Mail-Benachrichtigung ist nicht eingerichtet oder ausgeschaltet.");
  try {
    await transportFor(m).sendMail({
      from: m.from || m.user, to: m.to,
      subject: "Testmail: Benachrichtigungen funktionieren",
      text: `Diese Testmail kommt von deiner Website.\nAb jetzt bekommst du hier eine Nachricht, sobald eine neue Anfrage eingeht.\n\nCRM: ${crmLink()}`,
    });
  } catch (e) {
    const err = e as { code?: string; responseCode?: number; message?: string };
    if (err.code === "EAUTH" || err.responseCode === 535) throw new Error("Anmeldung beim Mailserver fehlgeschlagen – E-Mail-Adresse oder Passwort stimmt nicht (bei Gmail: App-Passwort nötig).");
    if (err.code === "ETIMEDOUT" || err.code === "ECONNECTION" || err.code === "ESOCKET") throw new Error("Mailserver nicht erreichbar – Server-Adresse oder Port prüfen.");
    if (err.code === "EENVELOPE") throw new Error("Absender oder Empfänger wurde vom Mailserver abgelehnt.");
    throw new Error(`Versand fehlgeschlagen: ${String(err.message ?? "unbekannter Fehler").slice(0, 160)}`);
  }
}
