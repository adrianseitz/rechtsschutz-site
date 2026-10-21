import "server-only";

const e = (k: string) => (process.env[k] ?? "").trim();

export const serverConfig = {
  storage: (e("LEAD_STORAGE") || "file") as "file" | "none",
  storageDir: e("LEAD_STORAGE_DIR") || `${process.cwd()}/data`,
  encryptionKey: e("LEAD_ENCRYPTION_KEY"), // base64, 32 Byte
  hashSalt: e("LEAD_HASH_SALT") || "change-me",
  adminToken: e("ADMIN_TOKEN"),
  webhookUrl: e("CRM_WEBHOOK_URL"),
  webhookSecret: e("CRM_WEBHOOK_SECRET"),
  smtp: {
    host: e("SMTP_HOST"),
    port: Number(e("SMTP_PORT") || 587),
    secure: e("SMTP_SECURE") === "true",
    user: e("SMTP_USER"),
    pass: e("SMTP_PASS"),
    from: e("SMTP_FROM"),
  },
  notifyTo: e("LEAD_NOTIFY_TO"),
  allowedOrigins: e("ALLOWED_ORIGINS").split(",").map((s) => s.trim()).filter(Boolean),
  siteUrl: e("NEXT_PUBLIC_SITE_URL"),
  rateLimit: { max: Number(e("RATE_LIMIT_MAX") || 5), windowMs: Number(e("RATE_LIMIT_WINDOW_MS") || 10 * 60 * 1000) },
};

export const mailConfigured = () => Boolean(serverConfig.smtp.host && serverConfig.smtp.from && serverConfig.notifyTo);
