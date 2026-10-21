import "server-only";
import { NextResponse } from "next/server";
import { serverConfig } from "./config";

export const MAX_BODY_BYTES = 16 * 1024;

export function clientIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for");
  return (xff?.split(",")[0] || req.headers.get("x-real-ip") || "unknown").trim();
}

/** Same-Origin-Prüfung gegen CSRF und Fremdeinbindung. */
export function originAllowed(req: Request): boolean {
  const origin = req.headers.get("origin");
  if (!origin) return false;
  const host = req.headers.get("x-forwarded-host") || req.headers.get("host");
  try {
    const o = new URL(origin);
    if (host && o.host === host) return true;
    const allowed = [...serverConfig.allowedOrigins, serverConfig.siteUrl].filter(Boolean).map((u) => new URL(u).origin);
    return allowed.includes(o.origin);
  } catch {
    return false;
  }
}

export async function readJson(req: Request): Promise<unknown> {
  const len = Number(req.headers.get("content-length") || 0);
  if (len > MAX_BODY_BYTES) throw new Error("too_large");
  const text = await req.text();
  if (text.length > MAX_BODY_BYTES) throw new Error("too_large");
  return JSON.parse(text);
}

export const jsonError = (status: number, error: string, extra: Record<string, unknown> = {}) =>
  NextResponse.json({ ok: false, error, ...extra }, { status });
