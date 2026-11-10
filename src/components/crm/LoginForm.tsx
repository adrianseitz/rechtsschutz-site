"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Lock } from "lucide-react";

const MESSAGES: Record<string, string> = {
  invalid: "Das Passwort stimmt nicht.",
  rate_limited: "Zu viele Versuche. Bitte warte ein paar Minuten.",
  forbidden: "Anfrage blockiert. Bitte lade die Seite neu.",
};

export function LoginForm() {
  const router = useRouter();
  const lead = useSearchParams().get("lead");
  const target = lead && /^[0-9a-f-]{36}$/i.test(lead) ? `/admin?lead=${lead}` : "/admin";
  const [remember, setRemember] = useState(true);
  const [pw, setPw] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  return (
    <form
      className="mt-6 space-y-4"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        setError("");
        try {
          const res = await fetch("/api/admin/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password: pw, remember }) });
          const data = await res.json().catch(() => ({}));
          if (res.ok) {
            router.replace(target);
            router.refresh();
            return;
          }
          setError(MESSAGES[data.error] ?? "Login fehlgeschlagen.");
        } catch {
          setError("Keine Verbindung. Bitte erneut versuchen.");
        }
        setBusy(false);
      }}
    >
      <label className="label" htmlFor="pw">Passwort</label>
      <input id="pw" type="password" autoComplete="current-password" className="input" value={pw} onChange={(e) => setPw(e.target.value)} required autoFocus />
      <label className="flex cursor-pointer items-center gap-2.5 text-sm text-ink-soft">
        <input type="checkbox" className="h-4 w-4 accent-navy" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
        Auf diesem Gerät 30 Tage angemeldet bleiben
      </label>
      {error && <p className="field-error" role="alert">{error}</p>}
      <button type="submit" disabled={busy || !pw} className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-navy py-3.5 text-[15px] font-medium text-white transition hover:bg-navy-800 disabled:opacity-60">
        <Lock className="h-4 w-4" aria-hidden /> {busy ? "Prüfe …" : "Anmelden"}
      </button>
    </form>
  );
}
