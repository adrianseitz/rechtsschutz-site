import { NextResponse } from "next/server";
import { z } from "zod";
import { isAdmin } from "@/lib/server/adminAuth";
import { PLATFORMS, publicSocialSettings, readSocialLog, readSocialState, saveSocialSettings } from "@/lib/server/socialSettings";
import { fileStorageEnabled } from "@/lib/server/storage";
import { jsonError, originAllowed, readJson } from "@/lib/server/request";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const key = z.union([z.string().trim().max(2000).regex(/^[A-Za-z0-9_\-.:]*$/, "Ungültiger Schlüssel"), z.null()]).optional();
const schema = z.object({
  enabled: z.boolean(),
  days: z.array(z.number().int().min(0).max(6)).max(7),
  times: z.array(z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Ungültige Uhrzeit")).min(1).max(6),
  platforms: z.array(z.enum(PLATFORMS)).max(3),
  uploadUser: z.string().trim().max(80).regex(/^[A-Za-z0-9_.\- ]*$/, "Profilname: nur Buchstaben, Zahlen, Punkt, Bindestrich"),
  voiceEngine: z.enum(["own", "elevenlabs"]),
  cfAccount: z.string().trim().toLowerCase().regex(/^([a-f0-9]{32})?$/, "Die Cloudflare-Account-ID hat 32 Zeichen (0–9, a–f)."),
  voiceId: z.string().trim().max(60).regex(/^[A-Za-z0-9]*$/, "Ungültige Stimme"),
  voiceName: z.string().trim().max(80),
  speed: z.number().min(0.85).max(1.25),
  aiLabel: z.boolean(),
  promo: z.boolean(),
  repeat: z.boolean(),
  postVia: z.enum(["direkt", "uploadpost"]).default("direkt"),
  onlyUploads: z.boolean().default(true),
  keys: z.object({ elevenlabs: key, uploadpost: key, huggingface: key, cloudflare: key, instagram: key }).optional(),
});

export async function GET() {
  if (!(await isAdmin())) return jsonError(401, "unauthorized");
  const [settings, state, log] = await Promise.all([publicSocialSettings(), readSocialState(), readSocialLog()]);
  return NextResponse.json({ ok: true, settings, state, log }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(req: Request) {
  if (!originAllowed(req)) return jsonError(403, "forbidden");
  if (!(await isAdmin())) return jsonError(401, "unauthorized");
  if (!fileStorageEnabled()) return jsonError(409, "Speicherung ist ausgeschaltet.");
  let body: unknown;
  try { body = await readJson(req); } catch { return jsonError(400, "bad_request"); }
  const parsed = schema.safeParse(body);
  if (!parsed.success) return jsonError(422, parsed.error.issues[0]?.message ?? "Ungültige Angaben.");
  const { keys, ...rest } = parsed.data;
  try {
    const settings = await saveSocialSettings(rest, keys ?? {});
    return NextResponse.json({ ok: true, settings }, { headers: { "Cache-Control": "no-store" } });
  } catch (e) {
    return jsonError(500, e instanceof Error ? e.message : "Speichern fehlgeschlagen.");
  }
}
