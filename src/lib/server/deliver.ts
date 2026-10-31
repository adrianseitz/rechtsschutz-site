import "server-only";
import { fileStorageEnabled, storeRecord } from "./storage";
import { sendToCrm, webhookConfigured } from "./crm";
import { mailReady, sendNotification } from "./notify";
import type { SubmissionRecord } from "./records";

export class DeliveryError extends Error {}

/**
 * Übergibt einen Datensatz an alle konfigurierten Ziele.
 * Erfolg nur, wenn mindestens ein dauerhaftes Ziel (Datei oder CRM) gespeichert hat –
 * es gibt keine simulierte Übermittlung.
 */
export async function deliver(r: SubmissionRecord) {
  const durable: Promise<unknown>[] = [];
  if (fileStorageEnabled()) durable.push(storeRecord(r));
  if (webhookConfigured()) durable.push(sendToCrm(r));
  if (durable.length === 0 && !(await mailReady())) throw new DeliveryError("Kein Speicherziel konfiguriert (LEAD_STORAGE, CRM_WEBHOOK_URL oder SMTP).");

  const results = await Promise.allSettled(durable);
  const stored = results.some((x) => x.status === "fulfilled");
  results.forEach((x) => x.status === "rejected" && console.error("[lead] Speicherziel fehlgeschlagen:", (x.reason as Error)?.message));

  // Ist die Anfrage gespeichert, wird die E-Mail im Hintergrund verschickt –
  // ein langsamer Mailserver hält den Besucher dann nicht auf.
  const notify = sendNotification(r).then((x) => !x.skipped).catch((e) => {
    console.error("[lead] E-Mail-Benachrichtigung fehlgeschlagen:", (e as Error).message);
    return false;
  });
  if (stored) return { stored, mailed: null };
  const mailed = await notify;

  if (!stored && !mailed) throw new DeliveryError("Die Anfrage konnte in keinem Ziel gespeichert werden.");
  return { stored, mailed };
}
