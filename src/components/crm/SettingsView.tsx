"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Copy, Loader2, Mail, Megaphone, Send, ShieldCheck } from "lucide-react";

type Settings = { host: string; port: number; secure: boolean; user: string; from: string; to: string; enabled: boolean; confirm: boolean; hasPassword: boolean; source: "crm" | "env"; updatedAt: string };

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
  const [confirm, setConfirm] = useState(true);
  const [busy, setBusy] = useState<"" | "save" | "test">("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    fetch("/api/admin/settings/mail").then((r) => r.json()).then((j) => {
      const s: Settings | undefined = j.settings;
      if (!s) return;
      setLoaded(s);
      if (s.host) {
        setHost(s.host); setPort(s.port || 465); setUser(s.user || ""); setTo(s.to || DEFAULT_TO); setEnabled(s.enabled); setConfirm(s.confirm !== false);
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
        body: JSON.stringify({ host: host.trim(), port, secure: port === 465, user: user.trim(), pass, from: user.trim(), to: to.trim(), enabled, confirm }),
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
          <label className="flex cursor-pointer items-start gap-3 text-sm">
            <input type="checkbox" className="mt-0.5 h-5 w-5 shrink-0 accent-navy" checked={confirm} onChange={(e) => setConfirm(e.target.checked)} />
            <span>Eingangsbestätigung an den Kunden schicken
              <span className="mt-0.5 block text-xs text-ink-muted">Der Kunde bekommt eine kurze Mail mit seinen Angaben und deiner Telefonnummer. Antworten darauf landen bei {to || DEFAULT_TO}.</span>
            </span>
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
      <AdsSettings />
    </div>
  );
}

const URL_SUFFIX = "utm_source=google&utm_medium=cpc&utm_campaign={campaignid}&utm_term={keyword}";

/** Google-Ads-Conversion-Tracking: Kennungen eintragen, ohne dass am Server etwas geändert werden muss. */
function AdsSettings() {
  const [adsId, setAdsId] = useState("");
  const [label, setLabel] = useState("");
  const [saved, setSaved] = useState<{ adsId: string; label: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch("/api/admin/settings/tracking").then((r) => r.json()).then((j) => {
      const t = j.tracking as { adsId?: string; adsLeadLabel?: string } | undefined;
      if (!t) return;
      setAdsId(t.adsId ?? ""); setLabel(t.adsLeadLabel ?? "");
      setSaved({ adsId: t.adsId ?? "", label: t.adsLeadLabel ?? "" });
    }).catch(() => undefined);
  }, []);

  // Google zeigt beides oft zusammen an: „AW-123456789/AbCdEfGh“ – das darf man so einfügen.
  const paste = (raw: string) => {
    const m = raw.match(/(AW-\d{6,15})\/([A-Za-z0-9_-]{4,60})/);
    if (m) { setAdsId(m[1]); setLabel(m[2]); return true; }
    return false;
  };

  async function save() {
    setBusy(true); setMsg(null);
    try {
      const res = await fetch("/api/admin/settings/tracking", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ adsId: adsId.trim(), adsLeadLabel: label.trim() }) });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) { setMsg({ ok: false, text: j.error || "Speichern fehlgeschlagen." }); return; }
      setSaved({ adsId: adsId.trim(), label: label.trim() });
      setMsg({ ok: true, text: adsId.trim() ? "Gespeichert. Das Conversion-Tracking ist sofort aktiv – Besucher sehen ab jetzt die Cookie-Abfrage." : "Gespeichert. Das Conversion-Tracking ist ausgeschaltet, die Cookie-Abfrage entfällt." });
    } catch {
      setMsg({ ok: false, text: "Keine Verbindung." });
    } finally {
      setBusy(false);
    }
  }

  const active = Boolean(saved?.adsId && saved.label);
  const changed = !saved || saved.adsId !== adsId.trim() || saved.label !== label.trim();

  return (
    <section className="mx-auto mt-4 max-w-2xl rounded-xl border border-line bg-white p-5 sm:p-7">
      <div className="flex items-start gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-sun"><Megaphone className="h-5 w-5" aria-hidden /></span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-semibold tracking-[-0.02em]">Google Ads: Anfragen messen</h2>
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${active ? "bg-emerald-100 text-emerald-900" : "bg-paper text-ink-muted"}`}>{active ? "Aktiv" : "Aus"}</span>
          </div>
          <p className="mt-1 text-sm text-ink-soft">Damit erfährt Google, welche Klicks zu einer Anfrage geführt haben – die Voraussetzung dafür, dass der Algorithmus lernt. Gemessen wird nur bei Besuchern, die zugestimmt haben.</p>
        </div>
      </div>

      <div className="mt-4 rounded-lg border border-sky-200 bg-sky-50 px-3 py-3 text-sm leading-6 text-sky-950">
        <b>Wo finde ich das?</b> In Google Ads unter <b>Zielvorhaben → Conversions → Neue Conversion-Aktion → Website</b>, Kategorie „Lead-Formular senden“, manuell einrichten. Bei „Tag einrichten → Google-Tag verwenden“ steht eine Zeile wie <code className="font-mono text-[13px]">send_to: 'AW-123456789/AbCdEfGh'</code>. Der Teil vor dem Schrägstrich ist die ID, der Teil danach das Label. Du kannst die Zeile auch komplett ins erste Feld einfügen.
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="adsid" className="label">Conversion-ID</label>
          <input id="adsid" className="input font-mono" value={adsId} placeholder="AW-123456789" autoComplete="off"
            onChange={(e) => { if (!paste(e.target.value)) setAdsId(e.target.value.trim()); }} />
        </div>
        <div>
          <label htmlFor="adslabel" className="label">Conversion-Label</label>
          <input id="adslabel" className="input font-mono" value={label} placeholder="AbCdEfGhIjK" autoComplete="off"
            onChange={(e) => { if (!paste(e.target.value)) setLabel(e.target.value.trim()); }} />
        </div>
      </div>

      {msg && (
        <p role="status" className={`mt-4 flex items-start gap-2 rounded-lg px-3 py-2.5 text-sm ${msg.ok ? "bg-emerald-50 text-emerald-900" : "bg-rose-50 text-rose-900"}`}>
          {msg.ok && <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />}{msg.text}
        </p>
      )}
      <button type="button" onClick={save} disabled={busy || !changed}
        className="mt-5 inline-flex items-center gap-2 rounded-full bg-navy px-5 py-3 text-sm font-semibold text-white transition hover:bg-navy-800 disabled:opacity-40">
        {busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />} Speichern
      </button>

      <div className="mt-7 border-t border-line pt-5">
        <h3 className="text-sm font-semibold">Sehen, welches Keyword die Anfrage gebracht hat</h3>
        <p className="mt-1 text-sm text-ink-soft">Trage diesen Text in Google Ads ein: <b>Kampagne → Einstellungen → Weitere Einstellungen → Kampagnen-URL-Optionen → Suffix der finalen URL</b>. Danach steht bei jeder Anfrage der Suchbegriff, und die Statistik zeigt, welche Keywords sich lohnen.</p>
        <div className="mt-3 flex items-stretch gap-2">
          <code className="min-w-0 flex-1 overflow-x-auto whitespace-nowrap rounded-lg bg-paper px-3 py-2.5 font-mono text-[12.5px]">{URL_SUFFIX}</code>
          <button type="button" onClick={() => { navigator.clipboard?.writeText(URL_SUFFIX).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); }).catch(() => undefined); }}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-line px-3 text-sm font-medium hover:border-navy">
            <Copy className="h-4 w-4" aria-hidden />{copied ? "Kopiert" : "Kopieren"}
          </button>
        </div>
      </div>
    </section>
  );
}
