"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { CheckCircle2, CircleAlert, Clapperboard, Copy, ExternalLink, Loader2, Mic, Pause, Play, RefreshCw, Send, Undo2, Volume2, X } from "lucide-react";

/* Video-Automatik: TikTok, Instagram Reels, YouTube Shorts.
   Der Worker auf dem Server erstellt die Videos und postet sie zum Termin; hier wird eingerichtet und überwacht. */

type Platform = "tiktok" | "instagram" | "youtube";
type Settings = {
  enabled: boolean; days: number[]; times: string[]; platforms: Platform[]; uploadUser: string; voiceId: string; voiceName: string;
  speed: number; aiLabel: boolean; promo: boolean; disabled: string[]; hasElevenlabs: boolean; hasUploadpost: boolean; updatedAt?: string;
};
type Ep = { id: string; order: number; title: string; topic: string; style: "whiteboard" | "cartoon"; caption: string; beats: number };
type EpState = {
  status?: string; video?: string; thumb?: string; duration?: number; voiced?: boolean; renderedAt?: string; postedAt?: string; error?: string | null;
  platforms?: Record<string, { status: string; url?: string | null; inbox?: boolean; message?: string }>;
};
type State = {
  heartbeat?: string; busy?: string | null; library?: Ep[]; episodes?: Record<string, EpState>; queue?: string[];
  nextSlot?: { key: string; label: string } | null; credits?: { used?: number | null; limit?: number | null; error?: string };
};
type LogEntry = { at: string; kind: string; text: string };

const PL: Record<Platform, string> = { tiktok: "TikTok", instagram: "Instagram", youtube: "YouTube" };
const DAYS = [{ d: 1, l: "Mo" }, { d: 2, l: "Di" }, { d: 3, l: "Mi" }, { d: 4, l: "Do" }, { d: 5, l: "Fr" }, { d: 6, l: "Sa" }, { d: 0, l: "So" }];
const TOPIC: Record<string, string> = { vermieter: "Vermieter", firma: "Firma", arbeit: "Arbeit", privat: "Privat", allgemein: "Allgemein" };
const fmt = (iso?: string) => (iso ? new Date(iso).toLocaleString("de-DE", { timeZone: "Europe/Berlin", day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }) : "");

async function post(url: string, body: unknown) {
  const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const j = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(j.error || "Fehler");
  return j;
}

export function SocialView() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [state, setState] = useState<State>({});
  const [log, setLog] = useState<LogEntry[]>([]);
  const [preview, setPreview] = useState<{ ep: Ep; e: EpState } | null>(null);
  const [note, setNote] = useState<{ ok: boolean; text: string } | null>(null);

  const load = useCallback(async () => {
    try {
      const j = await fetch("/api/admin/social", { cache: "no-store" }).then((r) => r.json());
      if (j.settings) setSettings((s) => s ?? j.settings);
      setState(j.state ?? {}); setLog(j.log ?? []);
      return j.settings as Settings | undefined;
    } catch { return undefined; }
  }, []);
  useEffect(() => {
    load();
    const t = setInterval(() => { if (document.visibilityState === "visible") load(); }, 8000);
    return () => clearInterval(t);
  }, [load]);

  async function saveAll(next: Settings, keys?: { elevenlabs?: string; uploadpost?: string }) {
    const { hasElevenlabs, hasUploadpost, updatedAt, disabled, ...rest } = next; void hasElevenlabs; void hasUploadpost; void updatedAt; void disabled;
    const j = await post("/api/admin/social", { ...rest, keys });
    setSettings(j.settings);
    return j.settings as Settings;
  }

  async function action(type: string, id?: string) {
    setNote(null);
    try {
      await post("/api/admin/social/action", { type, id });
      if (type === "on" || type === "off") setSettings((s) => s && { ...s, disabled: type === "off" ? [...s.disabled, id!] : s.disabled.filter((x) => x !== id) });
      setNote({ ok: true, text: type === "post" ? "Auftrag erteilt – das Video wird in der nächsten Minute veröffentlicht." : type === "render" ? "Auftrag erteilt – das Video wird neu erstellt (dauert ein paar Minuten)." : type === "reset" ? "Video ist wieder in der Warteschlange." : "Gespeichert." });
      setTimeout(load, 1500);
    } catch (e) {
      setNote({ ok: false, text: e instanceof Error ? e.message : "Fehler" });
    }
  }

  if (!settings) return <div className="grid h-full place-items-center text-sm text-ink-muted"><Loader2 className="h-5 w-5 animate-spin" aria-label="Lädt" /></div>;

  const online = state.heartbeat ? Date.now() - Date.parse(state.heartbeat) < 4 * 60_000 : false;
  const steps = [
    { done: settings.hasUploadpost && !!settings.uploadUser, text: "Upload-Post verbinden (postet auf TikTok, Instagram und YouTube)" },
    { done: settings.hasElevenlabs && !!settings.voiceId, text: "ElevenLabs-Stimme wählen" },
    { done: settings.platforms.length > 0 && settings.days.length > 0, text: "Zeitplan festlegen" },
    { done: settings.enabled, text: "Automatik einschalten" },
  ];
  const ready = steps.slice(0, 3).every((s) => s.done);

  return (
    <div className="h-full overflow-y-auto px-4 pb-10">
      <div className="mx-auto max-w-3xl space-y-4">
        {/* Status */}
        <section className="rounded-xl border border-line bg-white p-5 sm:p-7">
          <div className="flex flex-wrap items-start gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-sun"><Clapperboard className="h-5 w-5" aria-hidden /></span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg font-semibold tracking-[-0.02em]">Video-Automatik</h2>
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${settings.enabled ? "bg-emerald-100 text-emerald-900" : "bg-paper text-ink-muted"}`}>{settings.enabled ? "Postet automatisch" : "Pausiert"}</span>
              </div>
              <p className="mt-1 text-sm text-ink-soft">
                {settings.enabled ? (state.nextSlot ? <>Nächstes Video: <b>{state.nextSlot.label}</b> auf {settings.platforms.map((p) => PL[p]).join(", ")}.</> : "Die Automatik ist an – der nächste Termin erscheint in einer Minute.") : "Die Videos werden vorab erstellt. Gepostet wird erst, wenn die Automatik eingeschaltet ist."}
              </p>
            </div>
            <button type="button" disabled={!ready && !settings.enabled}
              onClick={async () => { try { await saveAll({ ...settings, enabled: !settings.enabled }); load(); } catch (e) { setNote({ ok: false, text: e instanceof Error ? e.message : "Fehler" }); } }}
              className={`inline-flex basis-full items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold transition disabled:opacity-40 sm:basis-auto ${settings.enabled ? "border border-line hover:border-navy" : "bg-navy text-white hover:bg-navy-800"}`}>
              {settings.enabled ? <><Pause className="h-4 w-4" aria-hidden /> Pausieren</> : <><Play className="h-4 w-4" aria-hidden /> Automatik starten</>}
            </button>
          </div>

          {!steps.every((s) => s.done) && (
            <ol className="mt-5 grid gap-2 text-sm sm:grid-cols-2">
              {steps.map((s, i) => (
                <li key={i} className={`flex items-start gap-2 rounded-lg px-3 py-2 ${s.done ? "bg-emerald-50 text-emerald-900" : "bg-paper text-ink-soft"}`}>
                  {s.done ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden /> : <span className="mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-full border border-current text-[10px] font-bold">{i + 1}</span>}
                  {s.text}
                </li>
              ))}
            </ol>
          )}

          <div className="mt-4 flex flex-wrap gap-x-5 gap-y-1 text-xs text-ink-muted">
            <span className="inline-flex items-center gap-1.5"><span className={`h-2 w-2 rounded-full ${online ? "bg-emerald-500" : "bg-rose-500"}`} />{online ? "Server-Dienst läuft" : "Server-Dienst meldet sich nicht – nach dem nächsten Update läuft er automatisch"}</span>
            {state.busy && <span className="inline-flex items-center gap-1.5"><Loader2 className="h-3 w-3 animate-spin" aria-hidden />{state.busy}</span>}
            {state.credits?.limit ? <span>Stimme: {(state.credits.used ?? 0).toLocaleString("de-DE")} von {state.credits.limit.toLocaleString("de-DE")} Zeichen diesen Monat</span> : null}
          </div>
          {note && <p role="status" className={`mt-4 rounded-lg px-3 py-2.5 text-sm ${note.ok ? "bg-emerald-50 text-emerald-900" : "bg-rose-50 text-rose-900"}`}>{note.text}</p>}
        </section>

        <Queue settings={settings} state={state} onPreview={setPreview} onAction={action} />
        <Setup settings={settings} onSave={saveAll} />
        <Log entries={log} />
      </div>
      {preview && <Preview ep={preview.ep} e={preview.e} onClose={() => setPreview(null)} />}
    </div>
  );
}

/* ---------- Warteschlange ---------- */
function statusOf(e: EpState | undefined, off: boolean) {
  if (off) return { label: "Aus", cls: "bg-paper text-ink-muted" };
  switch (e?.status) {
    case "rendert": return { label: "Wird erstellt", cls: "bg-sky-100 text-sky-900" };
    case "bereit": return { label: e.voiced ? "Bereit · mit Stimme" : "Bereit · ohne Stimme", cls: "bg-emerald-100 text-emerald-900" };
    case "wird gepostet": return { label: "Wird veröffentlicht", cls: "bg-amber-100 text-amber-900" };
    case "gepostet": return { label: `Veröffentlicht ${fmt(e.postedAt)}`, cls: "bg-navy text-white" };
    case "fehler": return { label: "Fehler", cls: "bg-rose-100 text-rose-900" };
    default: return { label: "Wartet", cls: "bg-paper text-ink-muted" };
  }
}

function Queue({ settings, state, onPreview, onAction }: { settings: Settings; state: State; onPreview: (p: { ep: Ep; e: EpState }) => void; onAction: (t: string, id?: string) => void }) {
  const lib = state.library ?? [];
  const queue = state.queue ?? [];
  const canPost = settings.hasUploadpost && !!settings.uploadUser && settings.platforms.length > 0;
  const left = queue.length;
  return (
    <section className="rounded-xl border border-line bg-white p-5 sm:p-7">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-lg font-semibold tracking-[-0.02em]">Videos</h2>
        <span className="text-xs text-ink-muted">{left} in der Warteschlange · {settings.days.length * settings.times.length} pro Woche</span>
      </div>
      {left > 0 && left <= 3 && <p className="mt-3 flex items-start gap-2 rounded-lg bg-amber-50 px-3 py-2.5 text-sm text-amber-950"><CircleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />Nur noch {left} Videos übrig – Zeit für neue Themen.</p>}
      {!lib.length && <p className="mt-4 text-sm text-ink-muted">Noch keine Videos – der Server-Dienst liest die Themen beim Start ein.</p>}
      <ul className="mt-4 divide-y divide-line">
        {lib.map((ep) => {
          const e = state.episodes?.[ep.id];
          const off = settings.disabled.includes(ep.id);
          const st = statusOf(e, off);
          const pos = queue.indexOf(ep.id);
          const posted = e?.status === "gepostet";
          return (
            <li key={ep.id} className="flex gap-3 py-3">
              <button type="button" onClick={() => e?.video && onPreview({ ep, e })} disabled={!e?.video} aria-label={`Vorschau: ${ep.title}`}
                className="relative h-[86px] w-[48px] shrink-0 overflow-hidden rounded-md bg-paper ring-1 ring-line disabled:cursor-default">
                {e?.thumb ? <img src={`/api/admin/social/media/${e.thumb}?v=${encodeURIComponent(e.renderedAt ?? "")}`} alt="" className="h-full w-full object-cover" /> : <Clapperboard className="mx-auto mt-7 h-4 w-4 text-ink-muted" aria-hidden />}
                {e?.video && <span className="absolute inset-0 grid place-items-center bg-black/0 text-white opacity-0 transition hover:bg-black/30 hover:opacity-100"><Play className="h-4 w-4" aria-hidden /></span>}
              </button>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-1.5">
                  {pos >= 0 && !off && <span className="text-xs font-semibold text-ink-muted">#{pos + 1}</span>}
                  <span className="truncate text-sm font-semibold">{ep.title}</span>
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs">
                  <span className={`rounded-full px-2 py-0.5 font-semibold ${st.cls}`}>{e?.status === "rendert" && <Loader2 className="mr-1 inline h-3 w-3 animate-spin" aria-hidden />}{st.label}</span>
                  <span className="text-ink-muted">{TOPIC[ep.topic] ?? ep.topic} · {ep.style === "whiteboard" ? "Whiteboard" : "Cartoon"}{e?.duration ? ` · ${Math.round(e.duration)} s` : ""}</span>
                </div>
                {e?.error && <p className="mt-1 text-xs text-rose-800">{e.error}</p>}
                {e?.platforms && (posted || e.status === "wird gepostet" || e.status === "fehler") && (
                  <div className="mt-1.5 flex flex-wrap gap-1.5 text-xs">
                    {Object.entries(e.platforms).map(([p, r]) => (
                      r.url ? <a key={p} href={r.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 rounded-full border border-line px-2 py-0.5 hover:border-navy">{PL[p as Platform] ?? p}<ExternalLink className="h-3 w-3" aria-hidden /></a>
                        : <span key={p} title={r.message} className={`rounded-full px-2 py-0.5 ${r.status === "failed" ? "bg-rose-50 text-rose-900" : r.status === "completed" ? "bg-emerald-50 text-emerald-900" : "bg-paper text-ink-muted"}`}>{PL[p as Platform] ?? p}: {r.status === "completed" ? (r.inbox ? "im Postfach der App" : "online") : r.status === "failed" ? "fehlgeschlagen" : r.status === "skipped" ? "nicht verbunden" : "läuft"}</span>
                    ))}
                  </div>
                )}
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {e?.video && <Small onClick={() => onPreview({ ep, e })}><Play className="h-3.5 w-3.5" aria-hidden />Ansehen</Small>}
                  {!posted && <Small onClick={() => onAction(off ? "on" : "off", ep.id)}>{off ? "Einschalten" : "Nicht posten"}</Small>}
                  {!posted && !off && canPost && e?.status !== "wird gepostet" && (
                    <Small onClick={() => { if (window.confirm(`„${ep.title}“ jetzt sofort auf ${settings.platforms.map((p) => PL[p]).join(", ")} veröffentlichen?`)) onAction("post", ep.id); }}><Send className="h-3.5 w-3.5" aria-hidden />Jetzt posten</Small>
                  )}
                  {(e?.video || e?.status === "fehler") && e?.status !== "rendert" && e?.status !== "wird gepostet" && <Small onClick={() => onAction("render", ep.id)}><RefreshCw className="h-3.5 w-3.5" aria-hidden />Neu erstellen</Small>}
                  {(posted || e?.status === "fehler") && <Small onClick={() => onAction("reset", ep.id)}><Undo2 className="h-3.5 w-3.5" aria-hidden />Wieder einreihen</Small>}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

const Small = ({ children, onClick }: { children: React.ReactNode; onClick: () => void }) => (
  <button type="button" onClick={onClick} className="inline-flex items-center gap-1 rounded-full border border-line px-2.5 py-1 text-xs font-medium transition hover:border-navy">{children}</button>
);

/* ---------- Einrichtung ---------- */
function Setup({ settings, onSave }: { settings: Settings; onSave: (s: Settings, keys?: { elevenlabs?: string; uploadpost?: string }) => Promise<Settings> }) {
  const [s, setS] = useState<Settings>(settings);
  const [upKey, setUpKey] = useState("");
  const [elKey, setElKey] = useState("");
  const [voices, setVoices] = useState<{ id: string; name: string; info: string; category: string }[]>([]);
  const [busy, setBusy] = useState<"" | "save" | "voices" | "test">("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const audio = useRef<HTMLAudioElement | null>(null);
  useEffect(() => { setS((cur) => ({ ...cur, hasElevenlabs: settings.hasElevenlabs, hasUploadpost: settings.hasUploadpost, enabled: settings.enabled, disabled: settings.disabled })); }, [settings]);
  const set = <K extends keyof Settings>(k: K, v: Settings[K]) => setS((x) => ({ ...x, [k]: v }));

  async function save() {
    setBusy("save"); setMsg(null);
    try {
      const next = await onSave(s, { uploadpost: upKey.trim() || undefined, elevenlabs: elKey.trim() || undefined });
      setS(next); setUpKey(""); setElKey("");
      setMsg({ ok: true, text: "Gespeichert. Der Server-Dienst übernimmt die Änderungen in der nächsten Minute." });
      return true;
    } catch (e) { setMsg({ ok: false, text: e instanceof Error ? e.message : "Speichern fehlgeschlagen." }); return false; }
    finally { setBusy(""); }
  }
  async function loadVoices() {
    if (elKey.trim() && !(await save())) return;
    setBusy("voices"); setMsg(null);
    try {
      const j = await fetch("/api/admin/social/voices", { cache: "no-store" }).then(async (r) => { const j = await r.json(); if (!r.ok) throw new Error(j.error); return j; });
      setVoices(j.voices ?? []);
      if (!j.voices?.length) setMsg({ ok: false, text: "In deinem ElevenLabs-Konto sind keine Stimmen. Füge in der Voice Library eine deutsche Stimme hinzu." });
    } catch (e) { setMsg({ ok: false, text: e instanceof Error ? e.message : "Stimmen konnten nicht geladen werden." }); }
    finally { setBusy(""); }
  }
  async function test() {
    setBusy("test"); setMsg(null);
    try {
      const res = await fetch("/api/admin/social/voice-test", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ voiceId: s.voiceId, speed: s.speed }) });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || "Hörprobe fehlgeschlagen.");
      const url = URL.createObjectURL(await res.blob());
      audio.current?.pause(); audio.current = new Audio(url); await audio.current.play();
    } catch (e) { setMsg({ ok: false, text: e instanceof Error ? e.message : "Hörprobe fehlgeschlagen." }); }
    finally { setBusy(""); }
  }
  const toggleDay = (d: number) => set("days", s.days.includes(d) ? s.days.filter((x) => x !== d) : [...s.days, d].sort());
  const togglePl = (p: Platform) => set("platforms", s.platforms.includes(p) ? s.platforms.filter((x) => x !== p) : [...s.platforms, p]);

  return (
    <section className="rounded-xl border border-line bg-white p-5 sm:p-7">
      <h2 className="text-lg font-semibold tracking-[-0.02em]">Einrichtung</h2>

      <div className="mt-5 space-y-5">
        <div>
          <h3 className="text-sm font-semibold">1. Posten über Upload-Post {settings.hasUploadpost && <span className="ml-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs text-emerald-900">Schlüssel gespeichert</span>}</h3>
          <p className="mt-1 text-sm leading-6 text-ink-soft">
            Lege ein Konto bei <a href="https://www.upload-post.com" target="_blank" rel="noopener noreferrer" className="underline">upload-post.com</a> an, erstelle ein Profil (z. B. „seitz“) und verbinde dort TikTok, Instagram (Business- oder Creator-Konto) und YouTube.
            TikTok ist erst ab dem Basic-Tarif dabei. Den API-Schlüssel findest du im Dashboard unter „API Keys“.
          </p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="upkey" className="label">API-Schlüssel</label>
              <input id="upkey" type="password" autoComplete="new-password" className="input" value={upKey} onChange={(e) => setUpKey(e.target.value)} placeholder={settings.hasUploadpost ? "•••••••• (nur zum Ändern ausfüllen)" : ""} />
            </div>
            <div>
              <label htmlFor="upuser" className="label">Profilname bei Upload-Post</label>
              <input id="upuser" className="input" value={s.uploadUser} onChange={(e) => set("uploadUser", e.target.value)} placeholder="seitz" autoComplete="off" />
            </div>
          </div>
        </div>

        <div className="border-t border-line pt-5">
          <h3 className="text-sm font-semibold">2. Stimme von ElevenLabs {settings.hasElevenlabs && <span className="ml-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs text-emerald-900">Schlüssel gespeichert</span>}</h3>
          <p className="mt-1 text-sm leading-6 text-ink-soft">
            Konto bei <a href="https://elevenlabs.io" target="_blank" rel="noopener noreferrer" className="underline">elevenlabs.io</a> anlegen (der Starter-Tarif reicht für rund 50 Videos im Monat), unter „Developers → API Keys“ einen Schlüssel erstellen und hier eintragen.
            Ohne Stimme werden die Videos nur mit Musik erstellt.
          </p>
          <div className="mt-3">
            <label htmlFor="elkey" className="label">API-Schlüssel</label>
            <input id="elkey" type="password" autoComplete="new-password" className="input" value={elKey} onChange={(e) => setElKey(e.target.value)} placeholder={settings.hasElevenlabs ? "•••••••• (nur zum Ändern ausfüllen)" : "sk_…"} />
          </div>
          <div className="mt-3 flex flex-wrap items-end gap-2">
            <div className="min-w-[14rem] flex-1">
              <label htmlFor="voice" className="label">Stimme</label>
              {voices.length ? (
                <select id="voice" className="input" value={s.voiceId} onChange={(e) => { const v = voices.find((x) => x.id === e.target.value); setS((x) => ({ ...x, voiceId: e.target.value, voiceName: v?.name ?? "" })); }}>
                  <option value="">– Stimme wählen –</option>
                  {voices.map((v) => <option key={v.id} value={v.id}>{v.name}{v.info ? ` (${v.info})` : ""}</option>)}
                </select>
              ) : (
                <div className="input flex items-center gap-2 text-ink-soft"><Mic className="h-4 w-4" aria-hidden />{s.voiceName || "noch keine gewählt"}</div>
              )}
            </div>
            <button type="button" onClick={loadVoices} disabled={!!busy || (!settings.hasElevenlabs && !elKey.trim())} className="inline-flex items-center gap-2 rounded-full border border-line px-4 py-3 text-sm font-semibold hover:border-navy disabled:opacity-40">
              {busy === "voices" ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <RefreshCw className="h-4 w-4" aria-hidden />} Stimmen laden
            </button>
            <button type="button" onClick={test} disabled={!!busy || !s.voiceId || !settings.hasElevenlabs} className="inline-flex items-center gap-2 rounded-full border border-line px-4 py-3 text-sm font-semibold hover:border-navy disabled:opacity-40">
              {busy === "test" ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Volume2 className="h-4 w-4" aria-hidden />} Probe hören
            </button>
          </div>
          <div className="mt-3">
            <label htmlFor="speed" className="label">Sprechtempo: {s.speed.toFixed(2).replace(".", ",")}×</label>
            <input id="speed" type="range" min={0.9} max={1.2} step={0.05} value={s.speed} onChange={(e) => set("speed", Number(e.target.value))} className="w-full accent-navy" />
          </div>
        </div>

        <div className="border-t border-line pt-5">
          <h3 className="text-sm font-semibold">3. Zeitplan</h3>
          <div className="mt-3 flex flex-wrap gap-2">
            {DAYS.map(({ d, l }) => (
              <button key={d} type="button" aria-pressed={s.days.includes(d)} onClick={() => toggleDay(d)}
                className={`h-10 w-12 rounded-lg border text-sm font-semibold transition ${s.days.includes(d) ? "border-navy bg-sun" : "border-line text-ink-soft hover:border-navy/40"}`}>{l}</button>
            ))}
            <input type="time" aria-label="Uhrzeit" className="input !w-32 !py-2" value={s.times[0] ?? "18:30"} onChange={(e) => set("times", [e.target.value || "18:30"])} />
          </div>
          <p className="mt-2 text-xs text-ink-muted">Abends zwischen 18 und 20 Uhr erreichst du die meisten Leute. Drei Videos pro Woche reichen für den Anfang.</p>
          <div className="mt-4 flex flex-wrap gap-4">
            {(Object.keys(PL) as Platform[]).map((p) => (
              <label key={p} className="flex cursor-pointer items-center gap-2 text-sm"><input type="checkbox" className="h-5 w-5 accent-navy" checked={s.platforms.includes(p)} onChange={() => togglePl(p)} />{PL[p]}</label>
            ))}
          </div>
          <div className="mt-4 space-y-3">
            <label className="flex cursor-pointer items-start gap-3 text-sm">
              <input type="checkbox" className="mt-0.5 h-5 w-5 shrink-0 accent-navy" checked={s.aiLabel} onChange={(e) => set("aiLabel", e.target.checked)} />
              <span>Als KI-erstellt kennzeichnen<span className="mt-0.5 block text-xs text-ink-muted">Die Stimme ist künstlich erzeugt. TikTok und Instagram verlangen dafür die Kennzeichnung – ohne riskierst du gesperrte Videos.</span></span>
            </label>
            <label className="flex cursor-pointer items-start gap-3 text-sm">
              <input type="checkbox" className="mt-0.5 h-5 w-5 shrink-0 accent-navy" checked={s.promo} onChange={(e) => set("promo", e.target.checked)} />
              <span>Auf TikTok als Werbung fürs eigene Unternehmen kennzeichnen<span className="mt-0.5 block text-xs text-ink-muted">Pflicht bei TikTok, wenn du für deine eigene Dienstleistung wirbst.</span></span>
            </label>
          </div>
        </div>
      </div>

      {msg && <p role="status" className={`mt-5 flex items-start gap-2 rounded-lg px-3 py-2.5 text-sm ${msg.ok ? "bg-emerald-50 text-emerald-900" : "bg-rose-50 text-rose-900"}`}>{msg.ok && <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />}{msg.text}</p>}
      <button type="button" onClick={save} disabled={!!busy} className="mt-6 inline-flex items-center gap-2 rounded-full bg-navy px-5 py-3 text-sm font-semibold text-white transition hover:bg-navy-800 disabled:opacity-40">
        {busy === "save" && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />} Einstellungen speichern
      </button>
    </section>
  );
}

/* ---------- Protokoll ---------- */
function Log({ entries }: { entries: LogEntry[] }) {
  if (!entries.length) return null;
  return (
    <section className="rounded-xl border border-line bg-white p-5 sm:p-7">
      <h2 className="text-lg font-semibold tracking-[-0.02em]">Protokoll</h2>
      <ul className="mt-3 space-y-1.5 text-sm">
        {entries.slice(0, 15).map((l, i) => (
          <li key={i} className="flex gap-3">
            <span className="w-24 shrink-0 tabular-nums text-ink-muted">{fmt(l.at)}</span>
            <span className={l.kind === "fehler" ? "text-rose-800" : l.kind === "post" ? "font-medium" : "text-ink-soft"}>{l.text}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

/* ---------- Vorschau ---------- */
function Preview({ ep, e, onClose }: { ep: Ep; e: EpState; onClose: () => void }) {
  const [copied, setCopied] = useState(false);
  useEffect(() => { const k = (ev: KeyboardEvent) => ev.key === "Escape" && onClose(); window.addEventListener("keydown", k); return () => window.removeEventListener("keydown", k); }, [onClose]);
  return (
    <div role="dialog" aria-modal="true" aria-label={ep.title} className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4" onClick={onClose}>
      <div className="flex max-h-full w-full max-w-3xl flex-col gap-4 overflow-y-auto rounded-2xl bg-white p-4 sm:flex-row sm:p-5" onClick={(ev) => ev.stopPropagation()}>
        <video src={`/api/admin/social/media/${e.video}?v=${encodeURIComponent(e.renderedAt ?? "")}`} poster={e.thumb ? `/api/admin/social/media/${e.thumb}?v=${encodeURIComponent(e.renderedAt ?? "")}` : undefined} controls autoPlay playsInline preload="metadata" className="mx-auto aspect-[9/16] max-h-[70vh] w-auto rounded-xl bg-black" />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <h3 className="font-semibold">{ep.title}</h3>
            <button type="button" onClick={onClose} aria-label="Schließen" className="rounded-full p-1 hover:bg-paper"><X className="h-5 w-5" aria-hidden /></button>
          </div>
          <p className="mt-1 text-xs text-ink-muted">{e.voiced ? "Mit Stimme" : "Ohne Stimme"} · {e.duration ? `${Math.round(e.duration)} s` : ""} · erstellt {fmt(e.renderedAt)}</p>
          <p className="mt-4 text-xs font-semibold text-ink-muted">Text zum Video</p>
          <p className="mt-1 whitespace-pre-line rounded-lg bg-paper p-3 text-sm leading-6">{ep.caption}</p>
          <button type="button" onClick={() => navigator.clipboard?.writeText(ep.caption).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); }).catch(() => undefined)}
            className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-xs font-medium hover:border-navy"><Copy className="h-3.5 w-3.5" aria-hidden />{copied ? "Kopiert" : "Text kopieren"}</button>
        </div>
      </div>
    </div>
  );
}
