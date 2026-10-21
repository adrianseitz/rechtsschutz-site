import "server-only";
import nodemailer from "nodemailer";
import { mailConfigured, serverConfig } from "./config";
import type { SubmissionRecord } from "./records";

const esc = (s: unknown) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
const REQUEST_LABEL: Record<string, string> = { termin: "Beratungstermin", rueckruf: "Rückruf", frage: "Allgemeine Frage" };
const METHOD_LABEL: Record<string, string> = { email: "E-Mail", telefon: "Telefon", egal: "Egal" };

export async function sendNotification(r: SubmissionRecord) {
  if (!mailConfigured()) return { skipped: true as const };
  const { smtp, notifyTo } = serverConfig;
  const transport = nodemailer.createTransport({
    host: smtp.host, port: smtp.port, secure: smtp.secure,
    auth: smtp.user ? { user: smtp.user, pass: smtp.pass } : undefined,
    requireTLS: !smtp.secure,
  });
  const name = r.contact.name ?? `${r.contact.firstName} ${r.contact.lastName}`;
  const subject = r.type === "lead"
    ? `Neuer Lead: ${r.productLabel} – ${name}`
    : `Neue Anfrage (${REQUEST_LABEL[r.request?.requestType ?? ""] ?? "Kontakt"}): ${name}`;

  const rows: [string, unknown][] = [
    ["Eingang", new Date(r.createdAt).toLocaleString("de-DE", { timeZone: "Europe/Berlin" })],
    ["Bereich", r.productLabel],
    ...Object.entries(r.answers).filter(([k]) => k !== "bereich").map(([k, v]) => [k[0].toUpperCase() + k.slice(1), v.label] as [string, unknown]),
    ...(r.request ? ([["Anliegen", REQUEST_LABEL[r.request.requestType]], ["Wunschzeit", r.request.preferredTime], ["Nachricht", r.request.message]] as [string, unknown][]) : []),
    ["Name", name],
    ["E-Mail", r.contact.email],
    ["Telefon", r.contact.phone ?? "–"],
    ["Kontaktweg", r.contact.contactMethod ? METHOD_LABEL[r.contact.contactMethod] : "–"],
    ["Herkunft", r.attribution.channel],
    ["Kampagne", r.attribution.utm_campaign ?? "–"],
    ["Marketing-Einwilligung", r.consents.marketing?.granted ? "Ja" : "Nein"],
    ["Lead-ID", r.id],
  ];
  const html = `<div style="font-family:Arial,sans-serif;color:#202733"><h2 style="color:#0B0B0A">${esc(subject)}</h2><table cellpadding="6" style="border-collapse:collapse">${rows
    .filter(([, v]) => v !== undefined && v !== "")
    .map(([k, v]) => `<tr><td style="color:#6B7385;vertical-align:top">${esc(k)}</td><td><strong>${esc(v).replace(/\n/g, "<br>")}</strong></td></tr>`)
    .join("")}</table></div>`;
  const text = rows.filter(([, v]) => v !== undefined && v !== "").map(([k, v]) => `${k}: ${v}`).join("\n");

  await transport.sendMail({ from: smtp.from, to: notifyTo, replyTo: r.contact.email, subject, text, html });
  return { skipped: false as const };
}
