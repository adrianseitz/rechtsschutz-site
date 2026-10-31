import "server-only";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { serverConfig } from "./config";
import { decrypt, encrypt, encryptionEnabled } from "./crypto";

/**
 * E-Mail-Einstellungen, die im CRM gepflegt werden (data/mail-settings.json).
 * Das Passwort wird mit LEAD_ENCRYPTION_KEY verschlüsselt gespeichert.
 * Ohne Datei gelten die Werte aus der .env (SMTP_*, LEAD_NOTIFY_TO).
 */
export type MailSettings = { host: string; port: number; secure: boolean; user: string; from: string; to: string; enabled: boolean };
type Stored = MailSettings & { pass: string; updatedAt: string };

const file = () => path.join(serverConfig.storageDir, "mail-settings.json");

async function readStored(): Promise<Stored | null> {
  try {
    return JSON.parse(await readFile(file(), "utf8"));
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw e;
  }
}

/** Wirksame Konfiguration: CRM-Einstellungen vor .env. */
export async function effectiveMail(): Promise<(MailSettings & { pass: string }) | null> {
  const s = await readStored().catch(() => null);
  if (s) {
    if (!s.enabled || !s.host || !s.to) return null;
    return { ...s, pass: s.pass ? decrypt(s.pass) : "" };
  }
  const { smtp, notifyTo } = serverConfig;
  if (!smtp.host || !smtp.from || !notifyTo) return null;
  return { host: smtp.host, port: smtp.port, secure: smtp.secure, user: smtp.user, pass: smtp.pass, from: smtp.from, to: notifyTo, enabled: true };
}

/** Für die Oberfläche – ohne Passwort. */
export async function publicMailSettings() {
  const s = await readStored().catch(() => null);
  if (s) {
    const { pass, ...rest } = s;
    return { ...rest, hasPassword: Boolean(pass), source: "crm" as const };
  }
  const { smtp, notifyTo } = serverConfig;
  return {
    host: smtp.host, port: smtp.port, secure: smtp.secure, user: smtp.user, from: smtp.from, to: notifyTo,
    enabled: Boolean(smtp.host && notifyTo), hasPassword: Boolean(smtp.pass), updatedAt: "", source: "env" as const,
  };
}

/** Speichert die Einstellungen. Leeres Passwort = bisheriges behalten. */
export async function saveMailSettings(input: MailSettings & { pass?: string }) {
  if (input.pass && !encryptionEnabled()) throw new Error("Auf dem Server fehlt LEAD_ENCRYPTION_KEY – Passwort kann nicht sicher gespeichert werden.");
  const prev = await readStored();
  let pass = prev?.pass ?? "";
  if (input.pass) pass = encrypt(input.pass);
  else if (!prev && serverConfig.smtp.pass) pass = encrypt(serverConfig.smtp.pass);
  const data: Stored = {
    host: input.host, port: input.port, secure: input.secure, user: input.user,
    from: input.from || input.user, to: input.to, enabled: input.enabled, pass, updatedAt: new Date().toISOString(),
  };
  await mkdir(serverConfig.storageDir, { recursive: true, mode: 0o700 });
  const tmp = `${file()}.${process.pid}.tmp`;
  await writeFile(tmp, JSON.stringify(data), { encoding: "utf8", mode: 0o600 });
  await rename(tmp, file());
}
