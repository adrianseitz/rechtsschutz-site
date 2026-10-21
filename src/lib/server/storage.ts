import "server-only";
import { appendFile, mkdir, readFile } from "node:fs/promises";
import path from "node:path";
import { serverConfig } from "./config";
import { decrypt, encrypt } from "./crypto";
import type { SubmissionRecord } from "./records";

/** Personenbezogene Felder werden bei gesetztem LEAD_ENCRYPTION_KEY verschlüsselt gespeichert. */
const fileFor = (type: SubmissionRecord["type"]) => path.join(serverConfig.storageDir, type === "lead" ? "leads.ndjson" : "contacts.ndjson");

export const fileStorageEnabled = () => serverConfig.storage === "file";

export async function storeRecord(r: SubmissionRecord) {
  await mkdir(serverConfig.storageDir, { recursive: true, mode: 0o700 });
  const { contact, request, ...rest } = r;
  const line = JSON.stringify({ ...rest, pii: encrypt(JSON.stringify({ contact, request })) }) + "\n";
  await appendFile(fileFor(r.type), line, { encoding: "utf8", mode: 0o600 });
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
