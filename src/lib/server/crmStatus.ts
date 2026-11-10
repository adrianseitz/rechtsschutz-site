import "server-only";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { serverConfig } from "./config";
import { LOST_REASONS, type LeadStatus, type StatusEntry } from "../crm";
import { decrypt, encrypt, encryptionEnabled } from "./crypto";

/**
 * Status je Lead in data/crm-status.json (enthält nur IDs + Status, keine Personendaten).
 * Schreibzugriffe laufen nacheinander und atomar (temporäre Datei + rename).
 */
const file = () => path.join(serverConfig.storageDir, "crm-status.json");

export async function readStatuses(): Promise<Record<string, StatusEntry>> {
  try {
    return JSON.parse(await readFile(file(), "utf8"));
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code === "ENOENT") return {};
    throw e;
  }
}

let queue: Promise<unknown> = Promise.resolve();

async function save(all: Record<string, StatusEntry>) {
  await mkdir(serverConfig.storageDir, { recursive: true, mode: 0o700 });
  const tmp = `${file()}.${process.pid}.tmp`;
  await writeFile(tmp, JSON.stringify(all), { encoding: "utf8", mode: 0o600 });
  await rename(tmp, file());
}

function serial<T>(fn: () => Promise<T>): Promise<T> {
  const run = queue.then(fn);
  queue = run.catch(() => undefined);
  return run;
}

export function setStatus(id: string, status: LeadStatus): Promise<StatusEntry> {
  return serial(async () => {
    const all = await readStatuses();
    const at = new Date().toISOString();
    const prev = all[id];
    const entry: StatusEntry = { ...prev, status, updatedAt: at, history: [...(prev?.history ?? []), { status, at }].slice(-50) };
    if (!entry.firstResponseAt && status !== "neu") entry.firstResponseAt = at;
    if (status !== "verloren") delete entry.lostReason;
    if (status === "abschluss" || status === "verloren") delete entry.followUp;
    all[id] = entry;
    await save(all);
    return entry;
  });
}

export function removeStatus(id: string): Promise<void> {
  return serial(async () => {
    const all = await readStatuses();
    if (!(id in all)) return;
    delete all[id];
    await save(all);
  });
}

export type MetaPatch =
  | { action: "note"; text: string }
  | { action: "attempt" }
  | { action: "followUp"; date: string | null }
  | { action: "value"; value: number | null }
  | { action: "lostReason"; reason: string | null };

/** Notizen, Kontaktversuche, Wiedervorlage, Vertragswert. Notizen werden verschlüsselt abgelegt. */
export function updateMeta(id: string, patch: MetaPatch): Promise<StatusEntry> {
  return serial(async () => {
    const all = await readStatuses();
    const at = new Date().toISOString();
    const entry: StatusEntry = all[id] ?? { status: "neu", updatedAt: at, history: [] };
    if (patch.action === "note") {
      const text = patch.text.trim().slice(0, 2000);
      if (text) entry.notes = [...(entry.notes ?? []), encryptionEnabled() ? { text: encrypt(text), at, enc: true } : { text, at }].slice(-100);
    } else if (patch.action === "attempt") {
      entry.attempts = [...(entry.attempts ?? []), at].slice(-30);
      entry.firstResponseAt ??= at;
    } else if (patch.action === "followUp") {
      if (patch.date && /^\d{4}-\d{2}-\d{2}$/.test(patch.date)) entry.followUp = patch.date;
      else delete entry.followUp;
    } else if (patch.action === "value") {
      if (typeof patch.value === "number" && Number.isFinite(patch.value) && patch.value >= 0 && patch.value <= 1_000_000) entry.value = Math.round(patch.value * 100) / 100;
      else delete entry.value;
    } else if (patch.action === "lostReason") {
      if (patch.reason && (LOST_REASONS as readonly string[]).includes(patch.reason)) entry.lostReason = patch.reason;
      else delete entry.lostReason;
    }
    entry.updatedAt = at;
    all[id] = entry;
    await save(all);
    return publicEntry(entry);
  });
}

/** Für die Oberfläche: Notizen entschlüsselt. */
export function publicEntry(e: StatusEntry): StatusEntry {
  if (!e.notes?.length) return e;
  return {
    ...e,
    notes: e.notes.map((n) => {
      if (!n.enc) return { text: n.text, at: n.at };
      try {
        return { text: decrypt(n.text), at: n.at };
      } catch {
        return { text: "(Notiz nicht lesbar – Schlüssel geändert?)", at: n.at };
      }
    }),
  };
}
