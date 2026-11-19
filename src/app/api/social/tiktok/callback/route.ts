import { finishTiktokLogin, takeTiktokState } from "@/lib/server/tiktok";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
const page = (ok: boolean, text: string) =>
  new Response(
    `<!doctype html><html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>TikTok</title>
<style>body{font-family:system-ui,sans-serif;background:#F4F3EE;color:#0B0B0A;display:grid;place-items:center;min-height:100vh;margin:0;padding:16px}
main{background:#fff;border:1px solid #E6E5DF;border-radius:20px;padding:28px;max-width:420px}h1{font-size:20px;margin:0 0 8px}p{line-height:1.5;color:#45453F}
a{display:inline-block;margin-top:12px;background:#0B0B0A;color:#FFD60A;padding:12px 20px;border-radius:999px;text-decoration:none;font-weight:600}</style></head>
<body><main><h1>${ok ? "TikTok ist verbunden" : "TikTok-Verbindung fehlgeschlagen"}</h1><p>${esc(text)}</p><a href="/admin">Zurück zum CRM</a></main></body></html>`,
    { status: ok ? 200 : 400, headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" } },
  );

/**
 * Rückweg von der TikTok-Anmeldung. Kommt ohne CRM-Cookie an (Aufruf von tiktok.com), darum wird nur der
 * einmalige, zufällige „state“ geprüft, den das CRM beim Klick auf „Mit TikTok verbinden“ erzeugt hat.
 */
export async function GET(req: Request) {
  const u = new URL(req.url);
  const state = u.searchParams.get("state") || "";
  const code = u.searchParams.get("code") || "";
  if (u.searchParams.get("error")) return page(false, `TikTok meldet: ${u.searchParams.get("error_description") || u.searchParams.get("error")}`);
  if (!code || !(await takeTiktokState(state))) return page(false, "Die Anmeldung ist abgelaufen oder ungültig. Bitte im CRM noch einmal auf „Mit TikTok verbinden“ tippen.");
  try {
    const name = await finishTiktokLogin(code);
    return page(true, name ? `Verbunden mit dem Konto „${name}“. Der Server kann jetzt Videos zu TikTok schicken.` : "Der Server kann jetzt Videos zu TikTok schicken.");
  } catch (e) {
    return page(false, e instanceof Error ? e.message : "Unbekannter Fehler.");
  }
}
