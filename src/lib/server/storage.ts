import "server-only";
import { appendFile, mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { serverConfig } from "./config";
import { decrypt, encrypt } from "./crypto";
import type { SubmissionRecord } from "./records";

/** Personenbezogene Felder werden bei gesetztem LEAD_ENCRYPTION_KEY verschlüsselt gespeichert. */
const fileFor = (type: SubmissionRecord["type"]) => path.join(serverConfig.storageDir, type === "lead" ? "leads.ndjson" : "contacts.ndjson");

export const fileStorageEnabled = () => serverConfig.storage === "file";

/** Schreibzugriffe (Anhängen/Löschen) laufen nacheinander, damit beim Löschen nichts verloren geht. */
let lock: Promise<unknown> = Promise.resolve();
function exclusive<T>(fn: () => Promise<T>): Promise<T> {
  const run = lock.then(fn);
  lock = run.catch(() => undefined);
  return run;
}

export async function storeRecord(r: SubmissionRecord) {
  await mkdir(serverConfig.storageDir, { recursive: true, mode: 0o700 });
  const { contact, request, ...rest } = r;
  const line = JSON.stringify({ ...rest, pii: encrypt(JSON.stringify({ contact, request })) }) + "\n";
  await exclusive(() => appendFile(fileFor(r.type), line, { encoding: "utf8", mode: 0o600 }));
}

/** Entfernt eine Anfrage endgültig (z. B. Löschanfrage nach Art. 17 DSGVO). */
export function deleteRecord(id: string): Promise<boolean> {
  return exclusive(async () => {
    let removed = false;
    for (const type of ["lead", "contact"] as const) {
      let raw = "";
      try {
        raw = await readFile(fileFor(type), "utf8");
      } catch (e) {
        if ((e as NodeJS.ErrnoException).code === "ENOENT") continue;
        throw e;
      }
      const lines = raw.split("\n").filter(Boolean);
      const kept = lines.filter((l) => JSON.parse(l).id !== id);
      if (kept.length === lines.length) continue;
      const tmp = `${fileFor(type)}.${process.pid}.tmp`;
      await writeFile(tmp, kept.map((l) => l + "\n").join(""), { encoding: "utf8", mode: 0o600 });
      await rename(tmp, fileFor(type));
      removed = true;
    }
    return removed;
  });
}

export async function readRecords(type: SubmissionRecord["type"]): Promise<SubmissionRecord[]> {
  let raw = "";
  try {
    raw = await readFile(fileFor(type), "utf8");
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw e;
  }
  return raw
    .split("\n")
    .filter(Boolean)
    .map((l) => {
      const { pii, ...rest } = JSON.parse(l);
      const { contact, request } = JSON.parse(decrypt(pii));
      return { ...rest, contact, request } as SubmissionRecord;
    })
    .reverse();
}
