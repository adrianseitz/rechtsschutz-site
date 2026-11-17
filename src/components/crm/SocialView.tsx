"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { CheckCircle2, CircleAlert, Clapperboard, Copy, ExternalLink, Loader2, Mic, Pause, Play, RefreshCw, Send, Square, Trash2, Undo2, Upload, Volume2, X } from "lucide-react";

/* Video-Automatik: TikTok, Instagram Reels, YouTube Shorts.
   Der Worker auf dem Server erstellt die Videos und postet sie zum Termin; hier wird eingerichtet und überwacht. */

type Platform = "tiktok" | "instagram" | "youtube";
type VoiceSample = { file: string; at: string; seconds: number; bytes: number };
type Settings = {
  enabled: boolean; days: number[]; times: string[]; platforms: Platform[]; uploadUser: string; voiceEngine: "own" | "elevenlabs"; voiceSample?: VoiceSample;
  voiceId: string; voiceName: string; speed: number; aiLabel: boolean; promo: boolean; repeat: boolean; disabled: string[];
  hasElevenlabs: boolean; hasUploadpost: boolean; hasHuggingface: boolean; updatedAt?: string;
};
type Keys = { elevenlabs?: string; uploadpost?: string; huggingface?: string };
type VoiceTest = { status: "läuft" | "fertig" | "fehler"; at: string; error?: string; file?: string; took?: number };
type Ep = { id: string; order: number; title: string; topic: string; style: "whiteboard" | "cartoon"; caption: string; beats: number };
type EpState = {
  status?: string; video?: string; thumb?: string; duration?: number; voiced?: boolean; renderedAt?: string; postedAt?: string; error?: string | null;
  platforms?: Record<string, { status: string; url?: string | null; inbox?: boolean; message?: string }>;
};
type State = {
  heartbeat?: string; busy?: string | null; library?: Ep[]; episodes?: Record<string, EpState>; queue?: string[];
  nextSlot?: { key: string; label: string } | null; cycle?: number; credits?: { used?: number | null; limit?: number | null; error?: string };
  voiceTest?: VoiceTest; voiceBlocked?: { at: string; error: string };
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

  async function saveAll(next: Settings, keys?: Keys) {
    const { hasElevenlabs, hasUploadpost, hasHuggingface, voiceSample, updatedAt, disabled, ...rest } = next; void hasElevenlabs; void hasUploadpost; void hasHuggingface; void voiceSample; void updatedAt; void disabled;
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
    { done: settings.voiceEngine === "elevenlabs" ? settings.hasElevenlabs && !!settings.voiceId : settings.hasHuggingface && !!settings.voiceSample, text: settings.voiceEngine === "elevenlabs" ? "ElevenLabs-Stimme wählen" : "Deine Stimme einrichten (kostenlos)" },
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
            {state.voiceBlocked && <span className="inline-flex items-center gap-1.5 text-rose-700"><CircleAlert className="h-3 w-3" aria-hidden />Stimme pausiert: {state.voiceBlocked.error}</span>}
            {settings.voiceEngine === "elevenlabs" && state.credits?.limit ? <span>Stimme: {(state.credits.used ?? 0).toLocaleString("de-DE")} von {state.credits.limit.toLocaleString("de-DE")} Zeichen diesen Monat</span> : null}
          </div>
          {note && <p role="status" className={`mt-4 rounded-lg px-3 py-2.5 text-sm ${note.ok ? "bg-emerald-50 text-emerald-900" : "bg-rose-50 text-rose-900"}`}>{note.text}</p>}
        </section>

        <Queue settings={settings} state={state} onPreview={setPreview} onAction={action} />
        <Setup settings={settings} onSave={saveAll} voiceTest={state.voiceTest} onSettings={setSettings} onRefresh={load} />
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
        <span className="text-xs text-ink-muted">{left} in der Warteschlange · {settings.days.length * settings.times.length} pro Woche{settings.repeat ? ` · Runde ${(state.cycle ?? 0) + 1}` : ""}</span>
      </div>
      {left > 0 && left <= 3 && !settings.repeat && <p className="mt-3 flex items-start gap-2 rounded-lg bg-amber-50 px-3 py-2.5 text-sm text-amber-950"><CircleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />Nur noch {left} Videos übrig – Zeit für neue Themen.</p>}
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
function Setup({ settings, onSave, voiceTest, onSettings, onRefresh }: {
  settings: Settings; onSave: (s: Settings, keys?: Keys) => Promise<Settings>; voiceTest?: VoiceTest; onSettings: (s: Settings) => void; onRefresh: () => void;
}) {
  const [s, setS] = useState<Settings>(settings);
  const [upKey, setUpKey] = useState("");
  const [elKey, setElKey] = useState("");
  const [hfKey, setHfKey] = useState("");
  const [testAsked, setTestAsked] = useState("");
  const [voices, setVoices] = useState<{ id: string; name: string; info: string; category: string }[]>([]);
  const [busy, setBusy] = useState<"" | "save" | "voices" | "test">("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const audio = useRef<HTMLAudioElement | null>(null);
  useEffect(() => { setS((cur) => ({ ...cur, hasElevenlabs: settings.hasElevenlabs, hasUploadpost: settings.hasUploadpost, hasHuggingface: settings.hasHuggingface, voiceSample: settings.voiceSample, enabled: settings.enabled, disabled: settings.disabled })); }, [settings]);
  const set = <K extends keyof Settings>(k: K, v: Settings[K]) => setS((x) => ({ ...x, [k]: v }));

  async function save() {
    setBusy("save"); setMsg(null);
    try {
      const next = await onSave(s.voiceEngine === "own" ? { ...s, aiLabel: true } : s, { uploadpost: upKey.trim() || undefined, elevenlabs: elKey.trim() || undefined, huggingface: hfKey.trim() || undefined });
      setS(next); setUpKey(""); setElKey(""); setHfKey("");
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
  async function ownTest() {
    if ((hfKey.trim() || s.voiceEngine !== settings.voiceEngine || s.speed !== settings.speed) && !(await save())) return;
    setMsg(null);
    try {
      await post("/api/admin/social/action", { type: "voicetest" });
      setTestAsked(new Date().toISOString());
      setTimeout(onRefresh, 1500);
    } catch (e) { setMsg({ ok: false, text: e instanceof Error ? e.message : "Auftrag fehlgeschlagen." }); }
  }
  const own = s.voiceEngine === "own";
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
          <h3 className="text-sm font-semibold">2. Stimme</h3>
          <div role="radiogroup" aria-label="Stimme" className="mt-3 grid gap-2 sm:grid-cols-2">
            {([["own", "Deine eigene Stimme", "Kostenlos. Läuft auf deinem Server, kein Abo."], ["elevenlabs", "ElevenLabs", "Kostenpflichtig, ab ca. 6 $ im Monat."]] as const).map(([v, t, d]) => (
              <button key={v} type="button" role="radio" aria-checked={s.voiceEngine === v} onClick={() => set("voiceEngine", v)}
                className={`rounded-xl border p-3.5 text-left transition ${s.voiceEngine === v ? "border-navy bg-sun/30 ring-1 ring-navy" : "border-line hover:border-navy/40"}`}>
                <span className="block text-sm font-semibold">{t}</span><span className="mt-0.5 block text-xs text-ink-muted">{d}</span>
              </button>
            ))}
          </div>

          {own ? (
            <div className="mt-4 space-y-5">
              <div>
                <h4 className="text-sm font-semibold">a) Zugang zum Stimm-Modell {settings.hasHuggingface && <span className="ml-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs text-emerald-900">Token gespeichert</span>}</h4>
                <p className="mt-1 text-sm leading-6 text-ink-soft">Deine Stimme entsteht mit Kyutai Pocket TTS, einem freien Sprachmodell. Es ist kostenlos, Kyutai verlangt nur einmal eine Zustimmung:</p>
                <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm leading-6 text-ink-soft">
                  <li>Kostenloses Konto bei <a href="https://huggingface.co/join" target="_blank" rel="noopener noreferrer" className="underline">huggingface.co</a> anlegen.</li>
                  <li><a href="https://huggingface.co/kyutai/pocket-tts" target="_blank" rel="noopener noreferrer" className="underline">huggingface.co/kyutai/pocket-tts</a> öffnen und den Bedingungen zustimmen. Darin sagst du zu, nur deine eigene Stimme zu klonen.</li>
                  <li>Unter <b>Settings → Access Tokens</b> einen Token mit der Berechtigung <b>Read</b> erstellen und hier einfügen.</li>
                </ol>
                <div className="mt-3">
                  <label htmlFor="hfkey" className="label">HuggingFace-Token</label>
                  <input id="hfkey" type="password" autoComplete="new-password" className="input" value={hfKey} onChange={(e) => setHfKey(e.target.value)} placeholder={settings.hasHuggingface ? "•••••••• (nur zum Ändern ausfüllen)" : "hf_…"} />
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold">b) Deine Aufnahme</h4>
                <Recorder sample={settings.voiceSample} onSaved={onSettings} />
              </div>

              <div>
                <h4 className="text-sm font-semibold">c) Probe hören</h4>
                <p className="mt-1 text-sm leading-6 text-ink-soft">Der Server spricht einen Beispielsatz mit deiner Stimme. Beim ersten Mal lädt er das Sprachmodell (ca. 400 MB), das dauert ein paar Minuten.</p>
                <button type="button" onClick={ownTest} disabled={!!busy || (!settings.hasHuggingface && !hfKey.trim()) || !settings.voiceSample || (voiceTest?.status === "läuft") || (!!testAsked && (!voiceTest || voiceTest.at < testAsked))}
                  className="mt-3 inline-flex items-center gap-2 rounded-full border border-line px-4 py-3 text-sm font-semibold hover:border-navy disabled:opacity-40">
                  <Volume2 className="h-4 w-4" aria-hidden /> Probe mit meiner Stimme erstellen
                </button>
                <VoiceTestStatus test={voiceTest} asked={testAsked} />
              </div>
            </div>
          ) : (
            <div className="mt-4">
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
            </div>
          )}
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
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {s.times.map((tm, i) => (
              <span key={i} className="inline-flex items-center gap-1">
                <input type="time" aria-label={`Uhrzeit ${i + 1}`} className="input !w-32 !py-2" value={tm} onChange={(e) => set("times", s.times.map((x, j) => (j === i ? e.target.value || x : x)))} />
                {s.times.length > 1 && <button type="button" aria-label={`Uhrzeit ${i + 1} entfernen`} onClick={() => set("times", s.times.filter((_, j) => j !== i))} className="rounded-full p-1.5 text-ink-muted hover:bg-paper hover:text-ink"><X className="h-4 w-4" aria-hidden /></button>}
              </span>
            ))}
            {s.times.length < 6 && <button type="button" onClick={() => set("times", [...s.times, ["12:15", "18:30", "20:30", "07:30", "16:00", "21:30"].find((x) => !s.times.includes(x)) ?? "12:00"])} className="rounded-full border border-line px-3 py-2 text-sm font-medium hover:border-navy">+ Uhrzeit</button>}
          </div>
          <p className="mt-2 text-xs text-ink-muted">
            {s.days.length * s.times.length} Videos pro Woche. Gute Zeiten: mittags (12–13 Uhr) und abends (18–21 Uhr). Zwei pro Tag sind ein guter Rhythmus – mehr bringt selten mehr, weil sich die Themen dann schneller wiederholen.
          </p>
          <label className="mt-4 flex cursor-pointer items-start gap-3 text-sm">
            <input type="checkbox" className="mt-0.5 h-5 w-5 shrink-0 accent-navy" checked={s.repeat} onChange={(e) => set("repeat", e.target.checked)} />
            <span>Dauerbetrieb: Wenn alle Videos gepostet sind, von vorn beginnen<span className="mt-0.5 block text-xs text-ink-muted">Die nächste Runde läuft im jeweils anderen Stil (Whiteboard ↔ Cartoon), damit es kein Doppel-Post ist. Die Stimme wird wiederverwendet und kostet nichts extra.</span></span>
          </label>
          <div className="mt-4 flex flex-wrap gap-4">
            {(Object.keys(PL) as Platform[]).map((p) => (
              <label key={p} className="flex cursor-pointer items-center gap-2 text-sm"><input type="checkbox" className="h-5 w-5 accent-navy" checked={s.platforms.includes(p)} onChange={() => togglePl(p)} />{PL[p]}</label>
            ))}
          </div>
          <div className="mt-4 space-y-3">
            <label className="flex cursor-pointer items-start gap-3 text-sm">
              <input type="checkbox" className="mt-0.5 h-5 w-5 shrink-0 accent-navy" checked={own || s.aiLabel} disabled={own} onChange={(e) => set("aiLabel", e.target.checked)} />
              <span>Als KI-erstellt kennzeichnen<span className="mt-0.5 block text-xs text-ink-muted">{own ? "Bei deiner geklonten Stimme immer an: Kyutai erlaubt das Klonen nur mit Kennzeichnung, TikTok und Instagram verlangen sie ebenfalls." : "Die Stimme ist künstlich erzeugt. TikTok und Instagram verlangen dafür die Kennzeichnung – ohne riskierst du gesperrte Videos."}</span></span>
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

/* ---------- Eigene Stimme: Aufnahme ---------- */
const READ_TEXT = "Hallo, ich bin Adrian Seitz. Ich berate Vermieter, Selbstständige und Familien rund um den Rechtsschutz. Viele merken erst im Streit, was ein Anwalt wirklich kostet: ein Brief vom Mieter, eine Kündigung oder eine Rechnung, die einfach nicht bezahlt wird. Genau dafür gibt es den Rechtsschutz. Ich erkläre dir in einfachen Worten, worauf es ankommt, und zeige dir, wie du dich absicherst, bevor der Ärger da ist.";
const EXT_TYPE: Record<string, string> = { m4a: "audio/mp4", mp4: "audio/mp4", mp3: "audio/mpeg", wav: "audio/wav", webm: "audio/webm", ogg: "audio/ogg", aac: "audio/aac" };
const mmss = (sec: number) => `${Math.floor(sec / 60)}:${String(Math.floor(sec % 60)).padStart(2, "0")}`;

function Recorder({ sample, onSaved }: { sample?: VoiceSample; onSaved: (s: Settings) => void }) {
  const [phase, setPhase] = useState<"idle" | "rec" | "done" | "upload">("idle");
  const [sec, setSec] = useState(0);
  const [take, setTake] = useState<{ blob: Blob; url: string; seconds: number } | null>(null);
  const [err, setErr] = useState("");
  const rec = useRef<MediaRecorder | null>(null);
  const stream = useRef<MediaStream | null>(null);
  const timer = useRef<number | undefined>(undefined);
  const t0 = useRef(0);
  const fileInput = useRef<HTMLInputElement | null>(null);
  useEffect(() => () => { stream.current?.getTracks().forEach((t) => t.stop()); window.clearInterval(timer.current); }, []);
  useEffect(() => () => { if (take) URL.revokeObjectURL(take.url); }, [take]);

  function stop() {
    window.clearInterval(timer.current);
    if (rec.current?.state === "recording") rec.current.stop();
  }
  async function start() {
    setErr("");
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      setErr("Dieser Browser kann hier nicht aufnehmen. Nimm den Text mit der Sprachmemo-App auf und lade die Datei hoch.");
      return;
    }
    try {
      const st = await navigator.mediaDevices.getUserMedia({ audio: { channelCount: 1, echoCancellation: false, noiseSuppression: true, autoGainControl: true } });
      stream.current = st;
      const type = ["audio/webm;codecs=opus", "audio/mp4", "audio/ogg;codecs=opus", "audio/webm"].find((t) => MediaRecorder.isTypeSupported(t));
      const r = new MediaRecorder(st, type ? { mimeType: type, audioBitsPerSecond: 128000 } : undefined);
      const chunks: Blob[] = [];
      r.ondataavailable = (e) => { if (e.data.size) chunks.push(e.data); };
      r.onstop = () => {
        st.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunks, { type: (r.mimeType || type || "audio/webm").split(";")[0] });
        setTake({ blob, url: URL.createObjectURL(blob), seconds: (Date.now() - t0.current) / 1000 });
        setPhase("done");
      };
      rec.current = r;
      r.start(250);
      t0.current = Date.now(); setSec(0); setTake(null); setPhase("rec");
      timer.current = window.setInterval(() => { const x = (Date.now() - t0.current) / 1000; setSec(x); if (x >= 60) stop(); }, 200);
    } catch {
      setErr("Kein Zugriff aufs Mikrofon. Erlaube den Zugriff (Symbol in der Adressleiste) und versuche es noch einmal.");
    }
  }
  async function upload(blob: Blob, seconds: number, name: string) {
    setErr("");
    if (seconds && seconds < 12) { setErr("Die Aufnahme ist zu kurz. Bitte den ganzen Text vorlesen (mindestens 15 Sekunden)."); return; }
    setPhase("upload");
    try {
      const f = new FormData();
      f.append("audio", blob, name);
      f.append("seconds", String(Math.round(seconds)));
      const res = await fetch("/api/admin/social/voice-sample", { method: "POST", body: f });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error || "Hochladen fehlgeschlagen.");
      onSaved(j.settings);
      setTake(null); setPhase("idle");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Hochladen fehlgeschlagen.");
      setPhase(take ? "done" : "idle");
    }
  }
  async function pickFile(file: File) {
    const ext = (file.name.split(".").pop() || "").toLowerCase();
    const typed = file.type ? file : new File([file], file.name, { type: EXT_TYPE[ext] || "" });
    const url = URL.createObjectURL(typed);
    const seconds = await new Promise<number>((resolve) => {
      const a = new Audio(); a.preload = "metadata";
      a.onloadedmetadata = () => resolve(Number.isFinite(a.duration) ? a.duration : 0);
      a.onerror = () => resolve(0);
      a.src = url;
    });
    URL.revokeObjectURL(url);
    await upload(typed, seconds, file.name);
  }
  async function remove() {
    try {
      const res = await fetch("/api/admin/social/voice-sample", { method: "DELETE" });
      const j = await res.json().catch(() => ({}));
      if (res.ok) onSaved(j.settings);
    } catch { /* bleibt */ }
  }

  const goal = Math.min(1, sec / 30);
  return (
    <div className="mt-2">
      {sample && phase === "idle" && (
        <div className="mb-3 flex flex-wrap items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2.5 text-sm text-emerald-900">
          <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden />
          <span className="flex-1">Aufnahme gespeichert{sample.seconds ? ` · ${sample.seconds} s` : ""} · {fmt(sample.at)}</span>
          <button type="button" onClick={remove} className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold hover:bg-emerald-100"><Trash2 className="h-3.5 w-3.5" aria-hidden /> Löschen</button>
        </div>
      )}
      <p className="text-sm leading-6 text-ink-soft">Lies diesen Text ruhig und natürlich vor, so wie du mit einem Kunden sprichst. Ruhiger Raum, keine Musik, Handy etwa eine Handbreit vor dem Mund. Gebraucht werden die ersten 20 Sekunden.</p>
      <blockquote className="mt-3 rounded-xl border border-line bg-paper px-4 py-3.5 text-[15px] leading-7">{READ_TEXT}</blockquote>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        {phase === "rec" ? (
          <button type="button" onClick={stop} className="inline-flex items-center gap-2 rounded-full bg-rose-600 px-5 py-3 text-sm font-semibold text-white hover:bg-rose-700">
            <Square className="h-4 w-4" aria-hidden /> Stopp
          </button>
        ) : (
          <button type="button" onClick={start} disabled={phase === "upload"} className="inline-flex items-center gap-2 rounded-full bg-navy px-5 py-3 text-sm font-semibold text-white hover:bg-navy-800 disabled:opacity-40">
            <Mic className="h-4 w-4" aria-hidden /> {take || sample ? "Neu aufnehmen" : "Aufnahme starten"}
          </button>
        )}
        {phase === "rec" && (
          <div className="flex min-w-[10rem] flex-1 items-center gap-3" aria-live="polite">
            <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-rose-600" aria-hidden />
            <span className="font-mono text-sm tabular-nums">{mmss(sec)}</span>
            <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-paper"><span className={`block h-full rounded-full ${sec >= 20 ? "bg-emerald-500" : "bg-navy"}`} style={{ width: `${goal * 100}%` }} /></span>
          </div>
        )}
        {phase !== "rec" && (
          <>
            <button type="button" onClick={() => fileInput.current?.click()} disabled={phase === "upload"} className="inline-flex items-center gap-2 rounded-full border border-line px-4 py-3 text-sm font-semibold hover:border-navy disabled:opacity-40">
              <Upload className="h-4 w-4" aria-hidden /> Datei hochladen
            </button>
            <input ref={fileInput} type="file" accept="audio/*,.m4a,.mp3,.wav" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ""; if (f) pickFile(f); }} />
          </>
        )}
      </div>
      {take && phase !== "rec" && (
        <div className="mt-3 rounded-xl border border-line p-3">
          <p className="text-sm font-medium">Anhören und prüfen ({Math.round(take.seconds)} s):</p>
          <audio controls src={take.url} className="mt-2 w-full" />
          <button type="button" onClick={() => upload(take.blob, take.seconds, `aufnahme.${take.blob.type.includes("mp4") ? "m4a" : take.blob.type.includes("ogg") ? "ogg" : "webm"}`)} disabled={phase === "upload"}
            className="mt-3 inline-flex items-center gap-2 rounded-full bg-navy px-5 py-3 text-sm font-semibold text-white hover:bg-navy-800 disabled:opacity-40">
            {phase === "upload" ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <CheckCircle2 className="h-4 w-4" aria-hidden />} Diese Aufnahme verwenden
          </button>
        </div>
      )}
      {phase === "upload" && !take && <p className="mt-3 inline-flex items-center gap-2 text-sm text-ink-soft"><Loader2 className="h-4 w-4 animate-spin" aria-hidden /> Wird hochgeladen …</p>}
      {err && <p role="alert" className="mt-3 rounded-lg bg-rose-50 px-3 py-2.5 text-sm text-rose-900">{err}</p>}
    </div>
  );
}

function VoiceTestStatus({ test, asked }: { test?: VoiceTest; asked: string }) {
  if (asked && (!test || test.at < asked)) return <p className="mt-3 inline-flex items-center gap-2 text-sm text-ink-soft"><Loader2 className="h-4 w-4 animate-spin" aria-hidden /> Auftrag ist beim Server – er startet in der nächsten Minute.</p>;
  if (!test) return null;
  if (test.status === "läuft") return <p className="mt-3 inline-flex items-center gap-2 text-sm text-ink-soft"><Loader2 className="h-4 w-4 animate-spin" aria-hidden /> Deine Stimme spricht gerade … (beim ersten Mal lädt der Server das Sprachmodell)</p>;
  if (test.status === "fehler") return <p role="alert" className="mt-3 rounded-lg bg-rose-50 px-3 py-2.5 text-sm text-rose-900">Hörprobe fehlgeschlagen: {test.error}</p>;
  return (
    <div className="mt-3 rounded-xl border border-line p-3">
      <p className="text-sm font-medium">Hörprobe vom {fmt(test.at)}{test.took ? ` · ${test.took} s Rechenzeit` : ""}</p>
      <audio controls src={`/api/admin/social/media/voice-test.mp3?v=${encodeURIComponent(test.at)}`} className="mt-2 w-full" />
      <p className="mt-2 text-xs text-ink-muted">Klingt es nicht nach dir? Meist hilft eine neue Aufnahme in einem ruhigeren Raum. Das Tempo stellst du unten ein.</p>
    </div>
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
