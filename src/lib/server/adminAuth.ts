import "server-only";
import { createHash, createHmac, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { serverConfig } from "./config";
import { safeEqual } from "./crypto";

/**
 * Login für das CRM unter /admin.
 * Passwort kommt aus ADMIN_PASSWORD (mind. 12 Zeichen). Die Sitzung ist ein signiertes,
 * HttpOnly-Cookie (12 Stunden). Wird das Passwort geändert, sind alle Sitzungen ungültig.
 */
export const ADMIN_COOKIE = "rs_admin";
const MAX_AGE = 12 * 60 * 60;

const password = () => (process.env.ADMIN_PASSWORD ?? "").trim();
export const adminEnabled = () => password().length >= 12;

const secret = () => createHmac("sha256", `${serverConfig.hashSalt}:crm-session`).update(password()).digest();
const sign = (payload: string) => createHmac("sha256", secret()).update(payload).digest("base64url");

export function createSession(): string {
  const payload = `${Math.floor(Date.now() / 1000) + MAX_AGE}.${randomBytes(12).toString("hex")}`;
  return `${payload}.${sign(payload)}`;
}

export function verifySession(value?: string): boolean {
  if (!value || !adminEnabled()) return false;
  const [exp, nonce, sig] = value.split(".");
  if (!exp || !nonce || !sig || Number(exp) * 1000 < Date.now()) return false;
  return safeEqual(sig, sign(`${exp}.${nonce}`));
}

export async function isAdmin(): Promise<boolean> {
  return verifySession((await cookies()).get(ADMIN_COOKIE)?.value);
}

export function checkPassword(input: string): boolean {
  if (!adminEnabled()) return false;
  const h = (s: string) => createHash("sha256").update(s).digest("hex");
  return safeEqual(h(input), h(password()));
}

export const sessionCookie = (value: string, maxAge = MAX_AGE) => ({
  name: ADMIN_COOKIE,
  value,
  httpOnly: true,
  secure: process.env.NODE_ENV === "production" && process.env.ADMIN_COOKIE_INSECURE !== "1",
  sameSite: "strict" as const,
  path: "/",
  maxAge,
});
