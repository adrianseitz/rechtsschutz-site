"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Loader2, Mail, Send, ShieldCheck } from "lucide-react";

type Settings = { host: string; port: number; secure: boolean; user: string; from: string; to: string; enabled: boolean; hasPassword: boolean; source: "crm" | "env"; updatedAt: string };

const PRESETS = [
  { id: "gmail", label: "Gmail", host: "smtp.gmail.com", port: 465, secure: true },
  { id: "ionos", label: "IONOS", host: "smtp.ionos.de", port: 465, secure: true },
  { id: "andere", label: "Anderer Anbieter", host: "", port: 465, secure: true },
] as const;

const DEFAULT_TO = "adrian.seitz@arag-partner.de";

export function SettingsView() {
  const [loaded, setLoaded] = useState<Settings | null>(null);
  const [preset, setPreset] = useState<(typeof PRESETS)[number]["id"]>("gmail");
  const [host, setHost] = useState("smtp.gmail.com");
  const [port, setPort] = useState(465);
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const [to, setTo] = useState(DEFAULT_TO);
  const [enabled, setEnabled] = useState(true);
  const [busy, setBusy] = useState<"" | "save" | "test">("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    fetch("/api/admin/settings/mail").then((r) => r.json()).then((j) => {
      const s: Settings | undefined = j.settings;
      if (!s) return;
      setLoaded(s);
      if (s.host) {
        setHost(s.host); setPort(s.port || 465); setUser(s.user || ""); setTo(s.to || DEFAULT_TO); setEnabled(s.enabled);
        setPreset(PRESETS.find((p) => p.host === s.host)?.id ?? "andere");
      }
    }).catch(() => undefined);
  }, []);

  const choose = (id: (typeof PRESETS)[number]["id"]) => {
    setPreset(id);
    const p = PRESETS.find((x) => x.id === id)!;
    if (p.host) setHost(p.host);
    else setHost("");
    setPort(p.port);
  };

  async function save(): Promise<boolean> {
    setBusy("save"); setMsg(null);
    try {
      const res = await fetch("/api/admin/settings/mail", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ host: host.trim(), port, secure: port === 465, user: user.trim(), pass, from: user.trim(), to: to.trim(), enabled }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) { setMsg({ ok: false, text: j.error || "Speichern fehlgeschlagen." }); return false; }
      setLoaded(j.settings); setPass("");
      setMsg({ ok: true, text: "Gespeichert." });
      return true;
    } catch {
      setMsg({ ok: false, text: "Keine Verbindung." });
      return false;
    } finally {
      setBusy("");
    }
  }

  async function test() {
    if (!(await save())) return;
    setBusy("test"); setMsg(null);
    try {
      const res = await fetch("/api/admin/settings/mail/test", { method: "POST" });
      const j = await res.json().catch(() => ({}));
      setMsg(res.ok ? { ok: true, text: `Testmail an ${to} verschickt – schau in dein Postfach (auch im Spam-Ordner).` } : { ok: false, text: j.error || "Versand fehlgeschlagen." });
    } catch {
      setMsg({ ok: false, text: "Keine Verbindung." });
    } finally {
      setBusy("");
    }
  }

  const needsPass = !loaded?.hasPassword || loaded.host !== host || loaded.user !== user.trim();
  const canSave = host.trim().length > 3 && /\S+@\S+\.\S+/.test(user) && /\S+@\S+\.\S+/.test(to) && (!needsPass || pass.length > 0);

  return (
    <div className="h-full overflow-y-auto px-4 pb-10">
      <section className="mx-auto max-w-2xl rounded-xl border border-line bg-white p-5 sm:p-7">
        <div className="flex items-start gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-sun"><Mail className="h-5 w-5" aria-hidden /></span>
          <div>
            <h2 className="text-lg font-semibold tracking-[-0.02em]">E-Mail bei neuen Anfragen</h2>
            <p className="mt-1 text-sm text-ink-soft">Sobald jemand den Check oder das Kontaktformular abschickt, bekommst du eine Mail mit Bereich, Situation und Herkunft – und einem Link ins CRM.</p>
          </div>
        </div>

        <p className="mt-4 flex items-start gap-2 rounded-lg bg-paper px-3 py-2.5 text-xs leading-5 text-ink-soft">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          Die Mail enthält bewusst keinen Namen, keine E-Mail-Adresse und keine Telefonnummer. Die Kontaktdaten bleiben auf deinem Server und stehen nur im CRM.
        </p>

        <div className="mt-6 space-y-5">
          <div>
            <span className="label">Absender-Postfach bei</span>
            <div className="grid grid-cols-3 gap-2">
              {PRESETS.map((p) => (
                <button key={p.id} type="button" onClick={() => choose(p.id)} aria-pressed={preset === p.id}
                  className={`rounded-lg border px-3 py-2.5 text-sm font-medium transition ${preset === p.id ? "border-navy bg-sun" : "border-line bg-white text-ink-soft hover:border-navy/40"}`}>
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {preset === "gmail" && (
            <div className="rounded-lg border border-sky-200 bg-sky-50 px-3 py-3 text-sm leading-6 text-sky-950">
              <b>So bekommst du das Gmail-Passwort:</b> Öffne <a className="underline" href="https://myaccount.google.com/apppasswords" target="_blank" rel="noopener noreferrer">myaccount.google.com/apppasswords</a> (dafür muss die Bestätigung in zwei Schritten aktiv sein), lege ein App-Passwort mit dem Namen „Website“ an und kopiere die 16 Zeichen hier hinein. Dein normales Gmail-Passwort funktioniert nicht.
            </div>
          )}
          {preset === "andere" && (
            <div className="grid grid-cols-[1fr_7rem] gap-3">
              <div>
                <label htmlFor="host" className="label">SMTP-Server</label>
                <input id="host" className="input" value={host} onChange={(e) => setHost(e.target.value)} placeholder="smtp.anbieter.de" />
              </div>
              <div>
                <label htmlFor="port" className="label">Port</label>
                <input id="port" type="number" className="input" value={port} onChange={(e) => setPort(Number(e.target.value) || 465)} />
              </div>
            </div>
          )}

          <div>
            <label htmlFor="user" className="label">E-Mail-Adresse des Absender-Postfachs</label>
            <input id="user" type="email" autoComplete="off" className="input" value={user} onChange={(e) => setUser(e.target.value)} placeholder={preset === "gmail" ? "name@gmail.com" : "website@seitz-rechtsschutz.de"} />
          </div>
          <div>
            <label htmlFor="pass" className="label">{preset === "gmail" ? "App-Passwort" : "Passwort des Postfachs"}</label>
            <input id="pass" type="password" autoComplete="new-password" className="input" value={pass} onChange={(e) => setPass(e.target.value)}
              placeholder={!needsPass ? "•••••••• (gespeichert – nur zum Ändern ausfüllen)" : ""} />
            <p className="mt-1.5 text-xs text-ink-muted">Wird verschlüsselt auf deinem Server gespeichert und nie angezeigt.</p>
          </div>
          <div>
            <label htmlFor="to" className="label">Benachrichtigung schicken an</label>
            <input id="to" type="email" className="input" value={to} onChange={(e) => setTo(e.target.value)} />
          </div>
          <label className="flex cursor-pointer items-center gap-3 text-sm">
            <input type="checkbox" className="h-5 w-5 accent-navy" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} />
            Benachrichtigungen eingeschaltet
          </label>
        </div>

        {msg && (
          <p role="status" className={`mt-5 flex items-start gap-2 rounded-lg px-3 py-2.5 text-sm ${msg.ok ? "bg-emerald-50 text-emerald-900" : "bg-rose-50 text-rose-900"}`}>
            {msg.ok && <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />}{msg.text}
          </p>
        )}

        <div className="mt-6 flex flex-wrap gap-3">
          <button type="button" onClick={test} disabled={!canSave || !!busy}
            className="inline-flex items-center gap-2 rounded-full bg-navy px-5 py-3 text-sm font-semibold text-white transition hover:bg-navy-800 disabled:opacity-40">
            {busy === "test" ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Send className="h-4 w-4" aria-hidden />} Speichern & Testmail senden
          </button>
          <button type="button" onClick={save} disabled={!canSave || !!busy}
            className="inline-flex items-center gap-2 rounded-full border border-line px-5 py-3 text-sm font-semibold transition hover:border-navy disabled:opacity-40">
            {busy === "save" && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />} Nur speichern
          </button>
        </div>
        {loaded?.updatedAt && <p className="mt-4 text-xs text-ink-muted">Zuletzt geändert: {new Date(loaded.updatedAt).toLocaleString("de-DE", { timeZone: "Europe/Berlin" })}</p>}
      </section>
    </div>
  );
}
