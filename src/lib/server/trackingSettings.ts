import "server-only";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { serverConfig } from "./config";
import { cleanTracking, ENV_TRACKING, TRACKING_FORMAT, type TrackingConfig } from "../trackingConfig";

/** Im CRM gepflegte Werbe-Kennungen (data/tracking-settings.json). Ohne Datei gilt die .env. */
type Stored = Partial<TrackingConfig> & { updatedAt: string };
const file = () => path.join(serverConfig.storageDir, "tracking-settings.json");

const envClean = (): TrackingConfig =>
  Object.fromEntries(Object.entries(ENV_TRACKING).map(([k, v]) => [k, TRACKING_FORMAT[k as keyof TrackingConfig].test(v) ? v : ""])) as TrackingConfig;

async function readStored(): Promise<Stored | null> {
  try {
    return JSON.parse(await readFile(file(), "utf8"));
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw e;
  }
}

export async function effectiveTracking(): Promise<{ tracking: TrackingConfig; source: "crm" | "env"; updatedAt: string }> {
  const s = await readStored().catch(() => null);
  if (!s) return { tracking: envClean(), source: "env", updatedAt: "" };
  return { tracking: { ...envClean(), ...cleanTracking(s) } as TrackingConfig, source: "crm", updatedAt: s.updatedAt };
}

export async function saveTracking(input: Partial<TrackingConfig>) {
  const prev = (await readStored()) ?? { updatedAt: "" };
  const data: Stored = { ...cleanTracking(prev), ...cleanTracking(input), updatedAt: new Date().toISOString() };
  await mkdir(serverConfig.storageDir, { recursive: true, mode: 0o700 });
  const tmp = `${file()}.${process.pid}.tmp`;
  await writeFile(tmp, JSON.stringify(data), { encoding: "utf8", mode: 0o600 });
  await rename(tmp, file());
}
