import "server-only";
import { serverConfig } from "./config";
import { hmacSign } from "./crypto";
import type { SubmissionRecord } from "./records";

/**
 * CRM-Schnittstelle: sendet jeden Datensatz als JSON an CRM_WEBHOOK_URL
 * (z. B. Zapier „Catch Hook“ → Pipedrive, Make, n8n oder ein eigenes CRM).
 * Header X-Signature: HMAC-SHA256 des Bodys mit CRM_WEBHOOK_SECRET.
 */
export const webhookConfigured = () => Boolean(serverConfig.webhookUrl);

export async function sendToCrm(r: SubmissionRecord) {
  if (!webhookConfigured()) return { skipped: true as const };
  const body = JSON.stringify({ event: r.type === "lead" ? "lead.created" : "contact.created", data: r });
  const headers: Record<string, string> = { "Content-Type": "application/json", "User-Agent": "rechtsschutz-site/1.0" };
  if (serverConfig.webhookSecret) headers["X-Signature"] = hmacSign(body, serverConfig.webhookSecret);
  const res = await fetch(serverConfig.webhookUrl, { method: "POST", headers, body, signal: AbortSignal.timeout(8000) });
  if (!res.ok) throw new Error(`CRM-Webhook antwortete mit ${res.status}`);
  return { skipped: false as const };
}
