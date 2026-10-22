import "server-only";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { serverConfig } from "./config";
import type { LeadStatus, StatusEntry } from "../crm";

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
    const entry: StatusEntry = { status, updatedAt: at, history: [...(all[id]?.history ?? []), { status, at }].slice(-50) };
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
