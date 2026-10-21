import "server-only";
import { createCipheriv, createDecipheriv, createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { serverConfig } from "./config";

function key(): Buffer | null {
  if (!serverConfig.encryptionKey) return null;
  const k = Buffer.from(serverConfig.encryptionKey, "base64");
  if (k.length !== 32) throw new Error("LEAD_ENCRYPTION_KEY muss 32 Byte (base64) lang sein.");
  return k;
}

export const encryptionEnabled = () => Boolean(serverConfig.encryptionKey);

/** AES-256-GCM; Ausgabe: "enc:v1:<iv>:<tag>:<ciphertext>" (base64) */
export function encrypt(plain: string): string {
  const k = key();
  if (!k) return plain;
  const iv = randomBytes(12);
  const c = createCipheriv("aes-256-gcm", k, iv);
  const ct = Buffer.concat([c.update(plain, "utf8"), c.final()]);
  return `enc:v1:${iv.toString("base64")}:${c.getAuthTag().toString("base64")}:${ct.toString("base64")}`;
}

export function decrypt(value: string): string {
  if (!value.startsWith("enc:v1:")) return value;
  const k = key();
  if (!k) throw new Error("Verschlüsselte Daten, aber kein LEAD_ENCRYPTION_KEY gesetzt.");
  const [, , iv, tag, ct] = value.split(":");
  const d = createDecipheriv("aes-256-gcm", k, Buffer.from(iv, "base64"));
  d.setAuthTag(Buffer.from(tag, "base64"));
  return Buffer.concat([d.update(Buffer.from(ct, "base64")), d.final()]).toString("utf8");
}

export function hashIdentifier(v: string): string {
  return createHmac("sha256", serverConfig.hashSalt).update(v).digest("hex").slice(0, 24);
}

export function hmacSign(body: string, secret: string): string {
  return createHmac("sha256", secret).update(body).digest("hex");
}

export function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a), bb = Buffer.from(b);
  return ab.length === bb.length && timingSafeEqual(ab, bb);
}
