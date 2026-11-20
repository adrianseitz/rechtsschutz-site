"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { CheckCircle2, ChevronLeft, ChevronRight, CircleAlert, Clapperboard, Copy, Download, ExternalLink, Loader2, Mic, Pause, Play, RefreshCw, Send, Sparkles, Square, Trash2, Undo2, Upload, Volume2, X } from "lucide-react";

/* Video-Automatik: TikTok, Instagram Reels, YouTube Shorts.
   Der Worker auf dem Server erstellt die Videos und postet sie zum Termin; hier wird eingerichtet und überwacht. */

type Platform = "tiktok" | "instagram" | "youtube";
type VoiceSample = { file: string; at: string; seconds: number; bytes: number };
type Settings = {
  enabled: boolean; days: number[]; times: string[]; platforms: Platform[]; uploadUser: string; voiceEngine: "own" | "elevenlabs"; voiceSample?: VoiceSample;
  voiceId: string; voiceName: string; speed: number; aiLabel: boolean; promo: boolean; repeat: boolean; disabled: string[];
  hasElevenlabs: boolean; hasUploadpost: boolean; hasHuggingface: boolean; hasInstagram: boolean; updatedAt?: string;
  postVia: "direkt" | "uploadpost"; onlyUploads: boolean; karussell: boolean;
  tiktokClientKey: string; tiktokMode: "entwurf" | "direkt"; hasTiktokSecret: boolean; hasTiktok: boolean; tiktokUser?: { name: string; scope: string; at: string };
  cfAccount: string; hasCloudflare: boolean; figurFoto?: { file: string; at: string; bytes: number };
};
type FigurState = { status: "läuft" | "auswahl" | "wartet" | "fertig" | "fehler"; phase?: string; schritt?: string | null; fertig?: string[]; at: string; error?: string | null; weiterAb?: string | null; hinweise?: string[]; nutzbar?: boolean; version?: number };
type ProbeState = { status: "läuft" | "fertig" | "fehler"; at: string; error?: string; file?: string; voiced?: boolean; figur?: boolean; duration?: number; took?: number };
type Keys = { elevenlabs?: string; uploadpost?: string; huggingface?: string; cloudflare?: string; instagram?: string; tiktokSecret?: string };
type VoiceTest = { status: "läuft" | "fertig" | "fehler"; at: string; error?: string; file?: string; took?: number };
type ReelJob = { status: "läuft" | "fertig" | "fehler"; at: string; error?: string; file?: string; reels?: number; beats?: number; took?: number };
type Ep = { id: string; order: number; title: string; topic: string; style: "whiteboard" | "cartoon" | "studio3d" | "eigen" | "bilder"; caption: string; beats: number; kind?: "karussell" };
type EpState = {
  status?: string; video?: string | null; slides?: string[]; hinweis?: string | null; thumb?: string; duration?: number; voiced?: boolean; upload?: boolean; renderedAt?: string; postedAt?: string; error?: string | null;
  platforms?: Record<string, { status: string; url?: string | null; inbox?: boolean; message?: string }>;
};
type State = {
  heartbeat?: string; busy?: string | null; library?: Ep[]; episodes?: Record<string, EpState>; queue?: string[];
  nextSlot?: { key: string; label: string } | null; cycle?: number; credits?: { used?: number | null; limit?: number | null; error?: string };
  voiceTest?: VoiceTest; voiceBlocked?: { at: string; error: string }; figur?: FigurState; probe?: ProbeState; reelStimmen?: ReelJob;
};
type LogEntry = { at: string; kind: string; text: string };

const PL: Record<Platform, string> = { tiktok: "TikTok", instagram: "Instagram", youtube: "YouTube" };
const DAYS = [{ d: 1, l: "Mo" }, { d: 2, l: "Di" }, { d: 3, l: "Mi" }, { d: 4, l: "Do" }, { d: 5, l: "Fr" }, { d: 6, l: "Sa" }, { d: 0, l: "So" }];
const TOPIC: Record<string, string> = { vermieter: "Vermieter", firma: "Firma", arbeit: "Arbeit", privat: "Privat", allgemein: "Allgemein", eigen: "Eigenes Video" };
const STYLE: Record<string, string> = { whiteboard: "Whiteboard", cartoon: "Cartoon", studio3d: "3D", eigen: "hochgeladen", bilder: "Bilder-Post" };
const isK = (ep: Ep) => ep.kind === "karussell";
const hasMedia = (e?: EpState) => Boolean(e?.video || e?.slides?.length);
/** Kann gerade gepostet werden? (direkt: Instagram verbunden; sonst Upload-Post) */
const directTargets = (s: Settings): Platform[] => [...(s.hasInstagram && s.platforms.includes("instagram") ? ["instagram" as const] : []), ...(s.hasTiktok && s.platforms.includes("tiktok") ? ["tiktok" as const] : [])];
const canPostWith = (s: Settings) => (s.postVia === "uploadpost" ? s.hasUploadpost && !!s.uploadUser : directTargets(s).length > 0);
const targetNames = (s: Settings) => (s.postVia === "uploadpost" ? s.platforms : directTargets(s)).map((p) => PL[p]).join(", ") || "–";
const TT_PRIVACY: Record<string, string> = { PUBLIC_TO_EVERYONE: "Öffentlich", MUTUAL_FOLLOW_FRIENDS: "Freunde", FOLLOWER_OF_CREATOR: "Follower", SELF_ONLY: "Nur ich" };
type TiktokStatus = { ready: boolean; connected: boolean; redirectUri: string; scope?: string; error?: string; creator?: { creator_username?: string; creator_nickname?: string; privacy_level_options: string[]; comment_disabled: boolean; duet_disabled: boolean; stitch_disabled: boolean } };
type TiktokOpts = { privacy: string; comments: boolean; duet: boolean; stitch: boolean; aigc: boolean; ownBrand: boolean };
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
    const { hasElevenlabs, hasUploadpost, hasHuggingface, hasCloudflare, hasInstagram, hasTiktokSecret, hasTiktok, tiktokUser, voiceSample, figurFoto, updatedAt, disabled, ...rest } = next; void hasElevenlabs; void hasUploadpost; void hasHuggingface; void hasCloudflare; void hasInstagram; void hasTiktokSecret; void hasTiktok; void tiktokUser; void voiceSample; void figurFoto; void updatedAt; void disabled;
    const j = await post("/api/admin/social", { ...rest, keys });
    setSettings(j.settings);
    return j.settings as Settings;
  }

  async function action(type: string, id?: string) {
    setNote(null);
    try {
      await post("/api/admin/social/action", { type, id });
      if (type === "on" || type === "off") setSettings((s) => s && { ...s, disabled: type === "off" ? [...s.disabled, id!] : s.disabled.filter((x) => x !== id) });
      setNote({ ok: true, text: type === "post" ? "Auftrag erteilt – das Video wird in der nächsten Minute veröffentlicht." : type === "render" ? "Auftrag erteilt – das Video wird neu erstellt (dauert ein paar Minuten)." : type === "reset" ? "Video ist wieder in der Warteschlange." : type === "reelstimmen" ? "Auftrag erteilt – die Reel-Texte werden mit deiner Stimme eingesprochen (dauert ein paar Minuten)." : "Gespeichert." });
      setTimeout(load, 1500);
    } catch (e) {
      setNote({ ok: false, text: e instanceof Error ? e.message : "Fehler" });
    }
  }

  if (!settings) return <div className="grid h-full place-items-center text-sm text-ink-muted"><Loader2 className="h-5 w-5 animate-spin" aria-label="Lädt" /></div>;

  const online = state.heartbeat ? Date.now() - Date.parse(state.heartbeat) < 4 * 60_000 : false;
  const steps = [
    settings.postVia === "uploadpost"
      ? { done: settings.hasUploadpost && !!settings.uploadUser, text: "Upload-Post verbinden (postet auf TikTok, Instagram und YouTube)" }
      : { done: settings.hasInstagram || settings.hasTiktok, text: "Instagram und/oder TikTok verbinden (kostenlos, ohne Zusatzdienst)" },
    settings.onlyUploads
      ? { done: (state.library ?? []).some((ep) => ep.style === "eigen"), text: "Erstes Video hochladen" }
      : { done: settings.voiceEngine === "elevenlabs" ? settings.hasElevenlabs && !!settings.voiceId : settings.hasHuggingface && !!settings.voiceSample, text: settings.voiceEngine === "elevenlabs" ? "ElevenLabs-Stimme wählen" : "Deine Stimme einrichten (kostenlos)" },
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
                {settings.enabled ? (state.nextSlot ? <>Nächstes Video: <b>{state.nextSlot.label}</b> auf {targetNames(settings)}.</> : "Die Automatik ist an – der nächste Termin erscheint in einer Minute.") : settings.onlyUploads ? "Lade deine Videos hoch. Gepostet wird erst, wenn die Automatik eingeschaltet ist." : "Die Videos werden vorab erstellt. Gepostet wird erst, wenn die Automatik eingeschaltet ist."}
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

        <UploadPanel settings={settings} onDone={(t) => { setNote({ ok: true, text: t }); setTimeout(load, 1500); }} />
        <Queue settings={settings} state={state} onPreview={setPreview} onAction={action} onChanged={load} />
        <Setup settings={settings} onSave={saveAll} voiceTest={state.voiceTest} onSettings={setSettings} onRefresh={load} />
        {!settings.onlyUploads && <ReelVoices settings={settings} job={state.reelStimmen} onAction={action} />}
        {!settings.onlyUploads && <FigurPanel settings={settings} figur={state.figur} probe={state.probe} onSave={saveAll} onSettings={setSettings} onRefresh={load} />}
        <Log entries={log} />
      </div>
      {preview && <Preview ep={preview.ep} e={preview.e} onClose={() => setPreview(null)} />}
    </div>
  );
}

/* ---------- Eigenes Video hochladen ---------- */
function UploadPanel({ settings, onDone }: { settings: Settings; onDone: (text: string) => void }) {
  const [file, setFile] = useState<File | null>(null);
  const ttDirect = settings.postVia === "direkt" && settings.hasTiktok && settings.tiktokMode === "direkt" && settings.platforms.includes("tiktok");
  const [tt, setTt] = useState<TiktokStatus | null>(null);
  const [ttOpts, setTtOpts] = useState<TiktokOpts>({ privacy: "PUBLIC_TO_EVERYONE", comments: true, duet: true, stitch: true, aigc: false, ownBrand: true });
  // TikTok verlangt, dass die Auswahl aus den aktuellen Konto-Einstellungen kommt – beim Öffnen des Formulars abfragen
  useEffect(() => {
    if (!ttDirect || !file) return;
    fetch("/api/admin/social/tiktok", { cache: "no-store" }).then((r) => r.json()).then((j: TiktokStatus) => {
      setTt(j);
      const opts = j.creator?.privacy_level_options ?? [];
      if (opts.length && !opts.includes(ttOpts.privacy)) setTtOpts((o) => ({ ...o, privacy: opts.includes("PUBLIC_TO_EVERYONE") ? "PUBLIC_TO_EVERYONE" : opts[0] }));
    }).catch(() => setTt(null));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ttDirect, file]);
  const [title, setTitle] = useState("");
  const [caption, setCaption] = useState("");
  const [progress, setProgress] = useState<number | null>(null);
  const [err, setErr] = useState("");
  const input = useRef<HTMLInputElement | null>(null);

  function pick(f: File | null) {
    setErr("");
    if (!f) return;
    if (f.type !== "video/mp4") { setErr("Bitte ein MP4-Video wählen (so wie die fertigen Reels)."); return; }
    if (f.size > 250 * 1024 * 1024) { setErr("Das Video ist zu groß (höchstens 250 MB)."); return; }
    setFile(f);
    if (!title) setTitle(f.name.replace(/\.mp4$/i, "").replace(/[-_]+/g, " ").slice(0, 120));
  }
  function upload() {
    if (!file) return;
    if (!title.trim()) { setErr("Bitte einen kurzen Namen angeben."); return; }
    setErr(""); setProgress(0);
    const fd = new FormData();
    fd.append("video", file); fd.append("title", title.trim()); fd.append("caption", caption.trim());
    if (ttDirect) fd.append("tiktok", JSON.stringify(ttOpts));
    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/admin/social/uploads");
    xhr.upload.onprogress = (ev) => { if (ev.lengthComputable) setProgress(Math.round((ev.loaded / ev.total) * 100)); };
    xhr.onload = () => {
      setProgress(null);
      let j: { ok?: boolean; error?: string } = {};
      try { j = JSON.parse(xhr.responseText); } catch { /* leer */ }
      if (xhr.status >= 200 && xhr.status < 300 && j.ok) {
        setFile(null); setTitle(""); setCaption(""); if (input.current) input.current.value = "";
        onDone("Hochgeladen – das Video steht in der Warteschlange und wird zum nächsten Termin gepostet.");
      } else setErr(j.error || "Hochladen fehlgeschlagen.");
    };
    xhr.onerror = () => { setProgress(null); setErr("Keine Verbindung – bitte noch einmal versuchen."); };
    xhr.send(fd);
  }
  return (
    <section className="rounded-xl border border-line bg-white p-5 sm:p-7">
      <h2 className="text-lg font-semibold tracking-[-0.02em]">Video hochladen</h2>
      <p className="mt-1 text-sm leading-6 text-ink-soft">Fertiges Reel (MP4, Hochformat) mit dem Text dazu. Es kommt hinten in die Warteschlange und wird zu deinen Zeiten automatisch gepostet.</p>
      <div className="mt-4 space-y-3">
        <div>
          <input ref={input} id="up-file" type="file" accept="video/mp4" className="sr-only" onChange={(e) => pick(e.target.files?.[0] ?? null)} />
          <label htmlFor="up-file" className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-line px-4 py-3 text-sm font-semibold hover:border-navy">
            <Upload className="h-4 w-4" aria-hidden /> {file ? "Anderes Video wählen" : "Video wählen"}
          </label>
          {file && <span className="ml-3 text-sm text-ink-soft">{file.name} · {(file.size / 1024 / 1024).toFixed(1)} MB</span>}
        </div>
        {file && (
          <>
            <div>
              <label htmlFor="up-title" className="label">Name (nur für dich im CRM)</label>
              <input id="up-title" className="input" value={title} maxLength={120} onChange={(e) => setTitle(e.target.value)} placeholder="z. B. Mieter zahlt nicht" />
            </div>
            <div>
              <label htmlFor="up-caption" className="label">Text zum Video (Bildunterschrift auf Instagram)</label>
              <textarea id="up-caption" className="input min-h-[140px]" value={caption} maxLength={2200} onChange={(e) => setCaption(e.target.value)}
                placeholder={"Dein Mieter zahlt nicht mehr? …\n\nKostenloser Check über den Link in der Bio.\n\n#vermieter #mietausfall #rechtsschutz"} />
              <p className="mt-1 text-xs text-ink-muted">{caption.length} / 2.200 Zeichen</p>
            </div>
            {ttDirect && (
              <fieldset className="rounded-xl border border-line p-4">
                <legend className="px-1 text-sm font-semibold">TikTok{tt?.creator?.creator_nickname ? ` · ${tt.creator.creator_nickname}` : ""}</legend>
                {tt?.error && <p className="mb-2 text-xs text-rose-800">{tt.error}</p>}
                <label htmlFor="tt-privacy" className="label">Wer darf das Video sehen?</label>
                <select id="tt-privacy" className="input" value={ttOpts.privacy} onChange={(e) => setTtOpts((o) => ({ ...o, privacy: e.target.value }))}>
                  {(tt?.creator?.privacy_level_options ?? ["PUBLIC_TO_EVERYONE", "SELF_ONLY"]).map((v) => <option key={v} value={v}>{TT_PRIVACY[v] ?? v}</option>)}
                </select>
                <div className="mt-3 flex flex-wrap gap-4 text-sm">
                  {([["comments", "Kommentare", tt?.creator?.comment_disabled], ["duet", "Duett", tt?.creator?.duet_disabled], ["stitch", "Stitch", tt?.creator?.stitch_disabled]] as const).map(([k, l, off]) => (
                    <label key={k} className={`flex items-center gap-2 ${off ? "opacity-40" : "cursor-pointer"}`}>
                      <input type="checkbox" className="h-5 w-5 accent-navy" disabled={!!off} checked={!off && ttOpts[k]} onChange={(e) => setTtOpts((o) => ({ ...o, [k]: e.target.checked }))} />{l} erlauben
                    </label>
                  ))}
                </div>
                <label className="mt-3 flex cursor-pointer items-start gap-2 text-sm">
                  <input type="checkbox" className="mt-0.5 h-5 w-5 shrink-0 accent-navy" checked={ttOpts.ownBrand} onChange={(e) => setTtOpts((o) => ({ ...o, ownBrand: e.target.checked }))} />
                  <span>Wirbt für mein eigenes Unternehmen<span className="block text-xs text-ink-muted">Pflichtangabe bei TikTok – das Video wird als „Werbeinhalt“ gekennzeichnet.</span></span>
                </label>
                <label className="mt-2 flex cursor-pointer items-start gap-2 text-sm">
                  <input type="checkbox" className="mt-0.5 h-5 w-5 shrink-0 accent-navy" checked={ttOpts.aigc} onChange={(e) => setTtOpts((o) => ({ ...o, aigc: e.target.checked }))} />
                  <span>Als KI-generiert kennzeichnen<span className="block text-xs text-ink-muted">An, wenn eine künstliche Stimme oder KI-Bilder drin sind.</span></span>
                </label>
                <p className="mt-3 text-xs leading-5 text-ink-muted">Mit dem Posten stimmst du der <a href="https://www.tiktok.com/legal/page/global/music-usage-confirmation/en" target="_blank" rel="noopener noreferrer" className="underline">Musiknutzungsbestätigung von TikTok</a> zu. Das Video wird zum nächsten Termin mit diesen Einstellungen veröffentlicht.</p>
              </fieldset>
            )}
            <button type="button" onClick={upload} disabled={progress !== null}
              className="inline-flex items-center gap-2 rounded-full bg-navy px-5 py-3 text-sm font-semibold text-white hover:bg-navy-800 disabled:opacity-40">
              {progress !== null ? <><Loader2 className="h-4 w-4 animate-spin" aria-hidden /> Lädt hoch … {progress} %</> : <><Upload className="h-4 w-4" aria-hidden /> Hochladen</>}
            </button>
          </>
        )}
        {err && <p role="alert" className="rounded-lg bg-rose-50 px-3 py-2.5 text-sm text-rose-900">{err}</p>}
      </div>
    </section>
  );
}

/* ---------- Warteschlange ---------- */
function statusOf(e: EpState | undefined, off: boolean) {
  if (off) return { label: "Aus", cls: "bg-paper text-ink-muted" };
  switch (e?.status) {
    case "rendert": return { label: "Wird erstellt", cls: "bg-sky-100 text-sky-900" };
    case "bereit": return { label: e.upload ? "Bereit" : e.voiced ? "Bereit · mit Stimme" : "Bereit · ohne Stimme", cls: "bg-emerald-100 text-emerald-900" };
    case "wird gepostet": return { label: "Wird veröffentlicht", cls: "bg-amber-100 text-amber-900" };
    case "gepostet": return { label: `Veröffentlicht ${fmt(e.postedAt)}`, cls: "bg-navy text-white" };
    case "fehler": return { label: "Fehler", cls: "bg-rose-100 text-rose-900" };
    default: return { label: "Wartet", cls: "bg-paper text-ink-muted" };
  }
}

function Queue({ settings, state, onPreview, onAction, onChanged }: { settings: Settings; state: State; onPreview: (p: { ep: Ep; e: EpState }) => void; onAction: (t: string, id?: string) => void; onChanged: () => void }) {
  const lib = state.library ?? [];
  const queue = state.queue ?? [];
  const canPost = canPostWith(settings) && settings.platforms.length > 0;
  async function remove(ep: Ep) {
    if (!window.confirm(`„${ep.title}“ löschen? Das Video wird vom Server entfernt.`)) return;
    await fetch(`/api/admin/social/uploads?id=${encodeURIComponent(ep.id)}`, { method: "DELETE" }).catch(() => undefined);
    setTimeout(onChanged, 300);
  }
  const left = queue.length;
  return (
    <section className="rounded-xl border border-line bg-white p-5 sm:p-7">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-lg font-semibold tracking-[-0.02em]">Videos</h2>
        <span className="text-xs text-ink-muted">{left} in der Warteschlange · {settings.days.length * settings.times.length} pro Woche{settings.repeat && !settings.onlyUploads ? ` · Runde ${(state.cycle ?? 0) + 1}` : ""}</span>
      </div>
      {settings.onlyUploads && left === 0 && lib.length > 0 && <p className="mt-3 flex items-start gap-2 rounded-lg bg-amber-50 px-3 py-2.5 text-sm text-amber-950"><CircleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />Alle Videos sind gepostet – lade neue hoch, sonst fällt der nächste Termin aus.</p>}
      {left > 0 && left <= 3 && (settings.onlyUploads || !settings.repeat) && <p className="mt-3 flex items-start gap-2 rounded-lg bg-amber-50 px-3 py-2.5 text-sm text-amber-950"><CircleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />Nur noch {left} Videos übrig – Zeit für neue Themen.</p>}
      {!lib.length && <p className="mt-4 text-sm text-ink-muted">{settings.onlyUploads ? "Noch keine Videos – lade oben dein erstes Video hoch." : "Noch keine Videos – der Server-Dienst liest die Themen beim Start ein."}</p>}
      <ul className="mt-4 divide-y divide-line">
        {lib.map((ep) => {
          const e = state.episodes?.[ep.id];
          const off = settings.disabled.includes(ep.id);
          const st = statusOf(e, off);
          const pos = queue.indexOf(ep.id);
          const posted = e?.status === "gepostet";
          return (
            <li key={ep.id} className="flex gap-3 py-3">
              <button type="button" onClick={() => e && hasMedia(e) && onPreview({ ep, e })} disabled={!hasMedia(e)} aria-label={`Vorschau: ${ep.title}`}
                className={`relative shrink-0 overflow-hidden rounded-md bg-paper ring-1 ring-line disabled:cursor-default ${isK(ep) ? "h-[86px] w-[69px]" : "h-[86px] w-[48px]"}`}>
                {e?.thumb ? <img src={`/api/admin/social/media/${e.thumb}?v=${encodeURIComponent(e.renderedAt ?? "")}`} alt="" className="h-full w-full object-cover" /> : <Clapperboard className="mx-auto mt-7 h-4 w-4 text-ink-muted" aria-hidden />}
                {hasMedia(e) && <span className="absolute inset-0 grid place-items-center bg-black/0 text-white opacity-0 transition hover:bg-black/30 hover:opacity-100"><Play className="h-4 w-4" aria-hidden /></span>}
              </button>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-1.5">
                  {pos >= 0 && !off && <span className="text-xs font-semibold text-ink-muted">#{pos + 1}</span>}
                  <span className="truncate text-sm font-semibold">{ep.title}</span>
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs">
                  <span className={`rounded-full px-2 py-0.5 font-semibold ${st.cls}`}>{e?.status === "rendert" && <Loader2 className="mr-1 inline h-3 w-3 animate-spin" aria-hidden />}{st.label}</span>
                  <span className="text-ink-muted">{TOPIC[ep.topic] ?? ep.topic}{ep.style !== "eigen" ? ` · ${STYLE[ep.style] ?? ep.style}` : ""}{isK(ep) ? ` · ${ep.beats} Bilder · nur Instagram` : e?.duration ? ` · ${Math.round(e.duration)} s` : ""}</span>
                </div>
                {e?.error && <p className="mt-1 text-xs text-rose-800">{e.error}</p>}
                {e?.hinweis && !e.error && <p className="mt-1 text-xs text-amber-800">{e.hinweis}</p>}
                {e?.platforms && (posted || e.status === "wird gepostet" || e.status === "fehler") && (
                  <div className="mt-1.5 flex flex-wrap gap-1.5 text-xs">
                    {Object.entries(e.platforms).map(([p, r]) => (
                      r.url ? <a key={p} href={r.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 rounded-full border border-line px-2 py-0.5 hover:border-navy">{PL[p as Platform] ?? p}<ExternalLink className="h-3 w-3" aria-hidden /></a>
                        : <span key={p} title={r.message} className={`rounded-full px-2 py-0.5 ${r.status === "failed" ? "bg-rose-50 text-rose-900" : r.status === "completed" ? "bg-emerald-50 text-emerald-900" : "bg-paper text-ink-muted"}`}>{PL[p as Platform] ?? p}: {r.status === "completed" ? (r.inbox ? "im Postfach der App" : "online") : r.status === "failed" ? "fehlgeschlagen" : r.status === "skipped" ? "nicht verbunden" : "läuft"}</span>
                    ))}
                  </div>
                )}
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {e && hasMedia(e) && <Small onClick={() => onPreview({ ep, e })}><Play className="h-3.5 w-3.5" aria-hidden />Ansehen</Small>}
                  {!posted && <Small onClick={() => onAction(off ? "on" : "off", ep.id)}>{off ? "Einschalten" : "Nicht posten"}</Small>}
                  {!posted && !off && (isK(ep) ? settings.hasInstagram && settings.platforms.includes("instagram") : canPost) && e?.status !== "wird gepostet" && (
                    <Small onClick={() => { if (window.confirm(`„${ep.title}“ jetzt sofort auf ${isK(ep) ? "Instagram" : targetNames(settings)} veröffentlichen?`)) onAction("post", ep.id); }}><Send className="h-3.5 w-3.5" aria-hidden />Jetzt posten</Small>
                  )}
                  {ep.style !== "eigen" && (hasMedia(e) || e?.status === "fehler") && e?.status !== "rendert" && e?.status !== "wird gepostet" && <Small onClick={() => onAction("render", ep.id)}><RefreshCw className="h-3.5 w-3.5" aria-hidden />Neu erstellen</Small>}
                  {ep.style === "eigen" && e?.status !== "wird gepostet" && <Small onClick={() => remove(ep)}><Trash2 className="h-3.5 w-3.5" aria-hidden />Löschen</Small>}
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
  const [igKey, setIgKey] = useState("");
  const [igCheck, setIgCheck] = useState<{ ok: boolean; text: string } | null>(null);
  const [ttSecret, setTtSecret] = useState("");
  const [ttStatus, setTtStatus] = useState<TiktokStatus | null>(null);
  useEffect(() => { fetch("/api/admin/social/tiktok", { cache: "no-store" }).then((r) => r.json()).then(setTtStatus).catch(() => undefined); }, [settings.hasTiktok, settings.hasTiktokSecret, settings.tiktokClientKey]);
  const [testAsked, setTestAsked] = useState("");
  const [voices, setVoices] = useState<{ id: string; name: string; info: string; category: string }[]>([]);
  const [busy, setBusy] = useState<"" | "save" | "voices" | "test">("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const audio = useRef<HTMLAudioElement | null>(null);
  useEffect(() => { setS((cur) => ({ ...cur, hasElevenlabs: settings.hasElevenlabs, hasUploadpost: settings.hasUploadpost, hasHuggingface: settings.hasHuggingface, hasCloudflare: settings.hasCloudflare, hasInstagram: settings.hasInstagram, hasTiktok: settings.hasTiktok, hasTiktokSecret: settings.hasTiktokSecret, tiktokUser: settings.tiktokUser, cfAccount: settings.cfAccount, figurFoto: settings.figurFoto, voiceSample: settings.voiceSample, enabled: settings.enabled, disabled: settings.disabled })); }, [settings]);
  const set = <K extends keyof Settings>(k: K, v: Settings[K]) => setS((x) => ({ ...x, [k]: v }));

  async function save() {
    setBusy("save"); setMsg(null);
    try {
      const next = await onSave(s.voiceEngine === "own" ? { ...s, aiLabel: true } : s, { uploadpost: upKey.trim() || undefined, elevenlabs: elKey.trim() || undefined, huggingface: hfKey.trim() || undefined, instagram: igKey.replace(/\s+/g, "") || undefined, tiktokSecret: ttSecret.trim() || undefined });
      setS(next); setUpKey(""); setElKey(""); setHfKey(""); setIgKey(""); setTtSecret("");
      setMsg({ ok: true, text: "Gespeichert. Der Server-Dienst übernimmt die Änderungen in der nächsten Minute." });
      return true;
    } catch (e) { setMsg({ ok: false, text: e instanceof Error ? e.message : "Speichern fehlgeschlagen." }); return false; }
    finally { setBusy(""); }
  }
  async function connectTiktok() {
    if ((ttSecret.trim() || s.tiktokClientKey !== settings.tiktokClientKey || s.tiktokMode !== settings.tiktokMode) && !(await save())) return;
    window.location.href = "/api/admin/social/tiktok/connect";
  }
  async function disconnectTiktok() {
    if (!window.confirm("TikTok-Verbindung trennen?")) return;
    await fetch("/api/admin/social/tiktok", { method: "DELETE" }).catch(() => undefined);
    onRefresh();
  }
  async function checkInstagram() {
    if (igKey.trim() && !(await save())) return;
    setIgCheck(null);
    try {
      const r = await fetch("/api/admin/social/instagram", { cache: "no-store" });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "Prüfen fehlgeschlagen.");
      setIgCheck({ ok: true, text: `Verbunden mit @${j.username}${j.accountType ? ` (${j.accountType === "BUSINESS" ? "Unternehmenskonto" : j.accountType === "MEDIA_CREATOR" ? "Creator-Konto" : j.accountType})` : ""}.` });
    } catch (e) { setIgCheck({ ok: false, text: e instanceof Error ? e.message : "Prüfen fehlgeschlagen." }); }
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
          <h3 className="text-sm font-semibold">1. Posten</h3>
          <div role="radiogroup" aria-label="Posten über" className="mt-3 grid gap-2 sm:grid-cols-2">
            {([["direkt", "Direkt von deinem Server", "Kostenlos, ohne Zusatzdienst: Instagram und TikTok, YouTube folgt."], ["uploadpost", "Über Upload-Post", "Zusatzdienst mit eigenem Konto, TikTok nur im Bezahltarif."]] as const).map(([v, t, d]) => (
              <button key={v} type="button" role="radio" aria-checked={s.postVia === v} onClick={() => set("postVia", v)}
                className={`rounded-xl border p-3.5 text-left transition ${s.postVia === v ? "border-navy bg-sun/30 ring-1 ring-navy" : "border-line hover:border-navy/40"}`}>
                <span className="block text-sm font-semibold">{t}</span><span className="mt-0.5 block text-xs text-ink-muted">{d}</span>
              </button>
            ))}
          </div>

          {s.postVia === "direkt" ? (
            <div className="mt-4">
              <h4 className="text-sm font-semibold">Instagram verbinden {settings.hasInstagram && <span className="ml-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs text-emerald-900">Zugang gespeichert</span>}</h4>
              <p className="mt-1 text-sm leading-6 text-ink-soft">Einmalig, kostenlos. Instagram erlaubt automatisches Posten nur über eine eigene App bei Meta – die legst du in ein paar Minuten an, sie bleibt privat und nur für dein Konto:</p>
              <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm leading-6 text-ink-soft">
                <li>In der Instagram-App: <b>Einstellungen → Kontoart und Tools → Zu professionellem Konto wechseln</b> (Unternehmen oder Creator). Falls schon erledigt: weiter.</li>
                <li>Auf <a href="https://developers.facebook.com/apps" target="_blank" rel="noopener noreferrer" className="underline">developers.facebook.com/apps</a> mit Facebook anmelden → <b>App erstellen</b> → Anwendungsfall <b>„Nachrichten und Inhalte auf Instagram verwalten“</b> → Namen eingeben (z. B. „Seitz Reels“) → erstellen.</li>
                <li>In der App links <b>Instagram → API-Einrichtung mit Instagram-Login</b> → bei <b>„Zugriffsschlüssel generieren“</b> auf <b>„Konto hinzufügen“</b> und mit deinem Instagram-Konto anmelden. Zeigt Instagram eine Tester-Einladung: in der Instagram-App unter <b>Einstellungen → Apps und Websites</b> annehmen.</li>
                <li>Den angezeigten Zugriffsschlüssel kopieren und hier einfügen, dann <b>Speichern und prüfen</b>. Er wird verschlüsselt gespeichert und vom Server alle paar Tage automatisch verlängert.</li>
              </ol>
              <div className="mt-3 flex flex-wrap items-end gap-2">
                <div className="min-w-[14rem] flex-1">
                  <label htmlFor="igkey" className="label">Instagram-Zugriffsschlüssel</label>
                  <input id="igkey" type="password" autoComplete="new-password" className="input" value={igKey} onChange={(e) => setIgKey(e.target.value)} placeholder={settings.hasInstagram ? "•••••••• (nur zum Ändern ausfüllen)" : "IGAA…"} />
                </div>
                <button type="button" onClick={checkInstagram} disabled={!!busy || (!igKey.trim() && !settings.hasInstagram)}
                  className="inline-flex items-center gap-2 rounded-full border border-line px-4 py-3 text-sm font-semibold hover:border-navy disabled:opacity-40">
                  <CheckCircle2 className="h-4 w-4" aria-hidden /> {igKey.trim() ? "Speichern und prüfen" : "Verbindung prüfen"}
                </button>
              </div>
              {igCheck && <p role="status" className={`mt-3 rounded-lg px-3 py-2.5 text-sm ${igCheck.ok ? "bg-emerald-50 text-emerald-900" : "bg-rose-50 text-rose-900"}`}>{igCheck.text}</p>}
              <div className="mt-6 border-t border-line pt-5">
                <h4 className="text-sm font-semibold">TikTok verbinden {settings.hasTiktok && <span className="ml-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs text-emerald-900">verbunden{settings.tiktokUser?.name ? ` als ${settings.tiktokUser.name}` : ""}</span>}</h4>
                <p className="mt-1 text-sm leading-6 text-ink-soft">Einmalig, kostenlos. TikTok erlaubt Posten nur über eine eigene App im TikTok-Entwicklerportal:</p>
                <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm leading-6 text-ink-soft">
                  <li>Auf <a href="https://developers.tiktok.com/apps" target="_blank" rel="noopener noreferrer" className="underline">developers.tiktok.com</a> mit deinem TikTok-Konto anmelden → <b>Manage apps → Connect an app</b>. Als Website, Datenschutz und Nutzungsbedingungen eintragen: <code className="text-xs">seitz-rechtsschutz.de</code>, <code className="text-xs">…/datenschutz</code>, <code className="text-xs">…/nutzungsbedingungen</code>.</li>
                  <li>Produkte hinzufügen: <b>Login Kit</b> (Plattform Web, Redirect URI siehe unten) und <b>Content Posting API</b> (Upload und Direct Post an). Berechtigungen: <code className="text-xs">user.info.basic</code>, <code className="text-xs">video.upload</code>, <code className="text-xs">video.publish</code>.</li>
                  <li>Unter <b>Sandbox</b> dein TikTok-Konto als <b>Target user</b> hinzufügen – damit klappt es sofort für dein Konto. Für den Dauerbetrieb die App mit <b>Submit for review</b> zur Prüfung schicken.</li>
                  <li><b>Client Key</b> und <b>Client Secret</b> hier eintragen, dann <b>Mit TikTok verbinden</b> und bei TikTok erlauben.</li>
                </ol>
                {ttStatus?.redirectUri && (
                  <p className="mt-3 break-all rounded-lg bg-paper px-3 py-2 text-xs">Redirect URI: <code>{ttStatus.redirectUri}</code>{" "}
                    <button type="button" className="ml-1 underline" onClick={() => navigator.clipboard?.writeText(ttStatus.redirectUri).catch(() => undefined)}>kopieren</button>
                  </p>
                )}
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <div>
                    <label htmlFor="ttkey" className="label">Client Key</label>
                    <input id="ttkey" className="input" value={s.tiktokClientKey} onChange={(e) => set("tiktokClientKey", e.target.value.trim())} autoComplete="off" />
                  </div>
                  <div>
                    <label htmlFor="ttsecret" className="label">Client Secret</label>
                    <input id="ttsecret" type="password" autoComplete="new-password" className="input" value={ttSecret} onChange={(e) => setTtSecret(e.target.value)} placeholder={settings.hasTiktokSecret ? "•••••••• (nur zum Ändern ausfüllen)" : ""} />
                  </div>
                </div>
                <div role="radiogroup" aria-label="TikTok-Modus" className="mt-3 grid gap-2 sm:grid-cols-2">
                  {([["entwurf", "Als Entwurf ins TikTok-Postfach", "Du bekommst eine Mitteilung in der TikTok-App und tippst auf „Posten“. Klappt sofort."], ["direkt", "Direkt veröffentlichen", "Voll automatisch – öffentlich erst, wenn TikTok die App geprüft hat (dauert Wochen), vorher nur privat."]] as const).map(([v, t, d]) => (
                    <button key={v} type="button" role="radio" aria-checked={s.tiktokMode === v} onClick={() => set("tiktokMode", v)}
                      className={`rounded-xl border p-3.5 text-left transition ${s.tiktokMode === v ? "border-navy bg-sun/30 ring-1 ring-navy" : "border-line hover:border-navy/40"}`}>
                      <span className="block text-sm font-semibold">{t}</span><span className="mt-0.5 block text-xs text-ink-muted">{d}</span>
                    </button>
                  ))}
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button type="button" onClick={connectTiktok} disabled={!!busy || !s.tiktokClientKey || (!ttSecret.trim() && !settings.hasTiktokSecret)}
                    className="inline-flex items-center gap-2 rounded-full bg-navy px-4 py-3 text-sm font-semibold text-white hover:bg-navy-800 disabled:opacity-40">
                    <ExternalLink className="h-4 w-4" aria-hidden /> {settings.hasTiktok ? "Neu mit TikTok verbinden" : "Mit TikTok verbinden"}
                  </button>
                  {settings.hasTiktok && <button type="button" onClick={disconnectTiktok} className="rounded-full border border-line px-4 py-3 text-sm font-semibold hover:border-navy">Trennen</button>}
                </div>
                {ttStatus?.error && <p role="alert" className="mt-3 rounded-lg bg-rose-50 px-3 py-2.5 text-sm text-rose-900">TikTok: {ttStatus.error}</p>}
              </div>
              <p className="mt-4 text-xs leading-5 text-ink-muted">YouTube Shorts kommt als Nächstes dazu.</p>
            </div>
          ) : (
            <div className="mt-4">
              <h4 className="text-sm font-semibold">Upload-Post {settings.hasUploadpost && <span className="ml-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs text-emerald-900">Schlüssel gespeichert</span>}</h4>
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
          )}
        </div>

        {!s.onlyUploads && <div className="border-t border-line pt-5">
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
        </div>}

        <div className="border-t border-line pt-5">
          <h3 className="text-sm font-semibold">{s.onlyUploads ? "2." : "3."} Zeitplan</h3>
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
            <input type="checkbox" className="mt-0.5 h-5 w-5 shrink-0 accent-navy" checked={s.onlyUploads} onChange={(e) => set("onlyUploads", e.target.checked)} />
            <span>Nur meine hochgeladenen Videos posten<span className="mt-0.5 block text-xs text-ink-muted">Die automatisch erstellten Videos bleiben aus. Abgehakt: Es werden nur die Videos gepostet, die du oben hochlädst (und die Bilder-Posts, falls unten eingeschaltet).</span></span>
          </label>
          <label className="mt-4 flex cursor-pointer items-start gap-3 text-sm">
            <input type="checkbox" className="mt-0.5 h-5 w-5 shrink-0 accent-navy" checked={s.karussell} onChange={(e) => set("karussell", e.target.checked)} />
            <span>Bilder-Posts auf Instagram mit posten<span className="mt-0.5 block text-xs text-ink-muted">Karussells zum Durchwischen (1080 × 1350): erste Seite die Frage, dahinter Kosten, Lösung, Wartezeit und Beratung. Laufen in derselben Warteschlange wie die Videos, aber nur auf Instagram – TikTok wird dabei übersprungen.</span></span>
          </label>
{!s.onlyUploads && (
          <label className="mt-4 flex cursor-pointer items-start gap-3 text-sm">
            <input type="checkbox" className="mt-0.5 h-5 w-5 shrink-0 accent-navy" checked={s.repeat} onChange={(e) => set("repeat", e.target.checked)} />
            <span>Dauerbetrieb: Wenn alle Videos gepostet sind, von vorn beginnen<span className="mt-0.5 block text-xs text-ink-muted">Die nächste Runde läuft im jeweils anderen Stil (Whiteboard ↔ Cartoon), damit es kein Doppel-Post ist. Die Stimme wird wiederverwendet und kostet nichts extra.</span></span>
          </label>
          )}
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

/* ---------- Deine Figur: aus dem Foto mit Cloudflare (FLUX.2), kostenlos im Tageskontingent ---------- */
const FIG_NAMES: [string, string][] = [["basis", "Grundbild"], ["mund-halb", "Mund halb"], ["mund-offen", "Mund offen"], ["augen-zu", "Augen zu"], ["zeigt", "zeigt"], ["daumen", "Daumen hoch"], ["erschrocken", "erschrocken"], ["nachdenklich", "nachdenklich"], ["winkt", "winkt"]];
const media = (name: string, v?: number | string) => `/api/admin/social/media/${name}${v ? `?v=${encodeURIComponent(String(v))}` : ""}`;

function FigurPanel({ settings, figur, probe, onSave, onSettings, onRefresh }: {
  settings: Settings; figur?: FigurState; probe?: ProbeState; onSave: (s: Settings, keys?: Keys) => Promise<Settings>; onSettings: (s: Settings) => void; onRefresh: () => void;
}) {
  const [account, setAccount] = useState(settings.cfAccount || "");
  const [token, setToken] = useState("");
  const [busy, setBusy] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [asked, setAsked] = useState<{ what: "figur" | "probe"; at: string } | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);
  useEffect(() => { setAccount((a) => a || settings.cfAccount || ""); }, [settings.cfAccount]);

  const access = settings.hasCloudflare && !!settings.cfAccount;
  async function saveAccess() {
    setBusy("zugang"); setMsg(null);
    try {
      const next = await onSave({ ...settings, cfAccount: account.trim().toLowerCase() }, { cloudflare: token.trim() || undefined });
      setToken(""); onSettings(next);
      setMsg({ ok: true, text: "Cloudflare-Zugang gespeichert." });
      return true;
    } catch (e) { setMsg({ ok: false, text: e instanceof Error ? e.message : "Speichern fehlgeschlagen." }); return false; }
    finally { setBusy(""); }
  }
  async function upload(file: File) {
    setBusy("foto"); setMsg(null);
    try {
      const f = new FormData(); f.append("foto", file, file.name);
      const res = await fetch("/api/admin/social/figur-foto", { method: "POST", body: f });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error || "Hochladen fehlgeschlagen.");
      onSettings(j.settings); setMsg({ ok: true, text: "Foto gespeichert." });
    } catch (e) { setMsg({ ok: false, text: e instanceof Error ? e.message : "Hochladen fehlgeschlagen." }); }
    finally { setBusy(""); }
  }
  async function job(type: "figur" | "probe", id?: "neu" | "weiter") {
    if (type === "figur" && (token.trim() || account.trim().toLowerCase() !== (settings.cfAccount || "")) && !(await saveAccess())) return;
    if (type === "figur" && id === "neu" && figur?.status === "fertig" && !confirm("Neue Figur erstellen? Die bisherige wird ersetzt, sobald die neue fertig ist.")) return;
    setBusy(type); setMsg(null);
    try {
      await post("/api/admin/social/action", { type, ...(id ? { id } : {}) });
      setAsked({ what: type, at: new Date().toISOString() });
      setTimeout(onRefresh, 1500);
    } catch (e) { setMsg({ ok: false, text: e instanceof Error ? e.message : "Auftrag fehlgeschlagen." }); }
    finally { setBusy(""); }
  }
  const waitingFigur = asked?.what === "figur" && (!figur || figur.at < asked.at);
  const waitingProbe = asked?.what === "probe" && (!probe || probe.at < asked.at);
  const running = waitingFigur || figur?.status === "läuft";
  const done = new Set(figur?.fertig || []);
  const v = figur?.version;

  return (
    <section aria-labelledby="figur-h" className="rounded-xl border border-line bg-white p-5 sm:p-7">
      <h2 id="figur-h" className="flex items-center gap-2 text-lg font-semibold tracking-[-0.02em]"><Sparkles className="h-5 w-5" aria-hidden /> Deine Figur</h2>
      <p className="mt-1 text-sm leading-6 text-ink-soft">
        Aus deinem Foto entsteht eine 3D-Figur, die in den Videos mit deiner Stimme spricht. Das erledigt das Bildmodell FLUX.2 bei Cloudflare,
        kostenlos im Rahmen von etwa 6 Bildern pro Tag. Die ganze Figur hat 9 Bilder; nach dem 4. ist sie schon nutzbar, der Rest kommt am nächsten Tag von selbst.
      </p>

      <div className="mt-5 grid gap-6 lg:grid-cols-2">
        <div>
          <h3 className="text-sm font-semibold">1. Zugang zu Cloudflare {access && <span className="ml-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs text-emerald-900">gespeichert</span>}</h3>
          <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm leading-6 text-ink-soft">
            <li>Kostenloses Konto bei <a href="https://dash.cloudflare.com/sign-up" target="_blank" rel="noopener noreferrer" className="underline">dash.cloudflare.com</a> anlegen und die E-Mail bestätigen.</li>
            <li><b>Account-ID</b>: die 32-stellige Zeichenfolge in der Adresszeile direkt nach <i>dash.cloudflare.com/</i> (steht auch unter „Workers &amp; Pages“ rechts).</li>
            <li><b>API-Token</b>: oben rechts Profil → API-Token → Token erstellen → Vorlage „Workers AI“ → Token erstellen → kopieren.</li>
          </ol>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <div><label htmlFor="cfacc" className="label">Account-ID</label><input id="cfacc" className="input font-mono" value={account} onChange={(e) => setAccount(e.target.value)} placeholder="32 Zeichen" spellCheck={false} /></div>
            <div><label htmlFor="cftok" className="label">API-Token</label><input id="cftok" type="password" autoComplete="new-password" className="input" value={token} onChange={(e) => setToken(e.target.value)} placeholder={settings.hasCloudflare ? "•••••••• (nur zum Ändern)" : "Token einfügen"} /></div>
          </div>
          <button type="button" onClick={saveAccess} disabled={!!busy || (!token.trim() && account.trim().toLowerCase() === (settings.cfAccount || ""))} className="mt-3 inline-flex items-center gap-2 rounded-full border border-line px-4 py-2.5 text-sm font-semibold hover:border-navy disabled:opacity-40">
            {busy === "zugang" && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />} Zugang speichern
          </button>
        </div>

        <div>
          <h3 className="text-sm font-semibold">2. Dein Foto</h3>
          <p className="mt-1 text-sm leading-6 text-ink-soft">Ein scharfes Porträt von vorn, gut ausgeleuchtet, wie ein Bewerbungsfoto. Es bleibt auf deinem Server; nur eine verkleinerte Kopie geht zum Erstellen an Cloudflare.</p>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            {settings.figurFoto && <span className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-900"><CheckCircle2 className="h-4 w-4" aria-hidden /> Foto vom {fmt(settings.figurFoto.at)}</span>}
            <button type="button" onClick={() => fileRef.current?.click()} disabled={!!busy} className="inline-flex items-center gap-2 rounded-full border border-line px-4 py-2.5 text-sm font-semibold hover:border-navy disabled:opacity-40">
              {busy === "foto" ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Upload className="h-4 w-4" aria-hidden />} {settings.figurFoto ? "Anderes Foto" : "Foto hochladen"}
            </button>
            <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ""; if (f) upload(f); }} />
          </div>
          <h3 className="mt-5 text-sm font-semibold">3. Figur erstellen</h3>
          <button type="button" onClick={() => job("figur", "neu")} disabled={!!busy || running || !settings.figurFoto || (!access && !(token.trim() && account.trim()))}
            className="mt-2 inline-flex items-center gap-2 rounded-full bg-navy px-5 py-3 text-sm font-semibold text-white hover:bg-navy-800 disabled:opacity-40">
            <Sparkles className="h-4 w-4" aria-hidden /> {figur ? "Neues Grundbild erstellen" : "Figur erstellen"}
          </button>
        </div>
      </div>

      {(waitingFigur || figur) && (
        <div className="mt-6 border-t border-line pt-5" aria-live="polite">
          {waitingFigur ? <p className="inline-flex items-center gap-2 text-sm text-ink-soft"><Loader2 className="h-4 w-4 animate-spin" aria-hidden /> Auftrag ist beim Server – er startet in der nächsten Minute.</p>
            : figur?.status === "läuft" ? <p className="inline-flex items-center gap-2 text-sm text-ink-soft"><Loader2 className="h-4 w-4 animate-spin" aria-hidden /> Erstellt gerade: {figur.schritt || "…"} ({done.size} von 9 Bildern fertig)</p>
            : figur?.status === "wartet" ? <p className="rounded-lg bg-amber-50 px-3 py-2.5 text-sm text-amber-900">{figur.error} Geht weiter ab {fmt(figur.weiterAb || undefined)} Uhr. ({done.size} von 9 Bildern fertig)</p>
            : figur?.status === "fehler" ? (
              <div className="flex flex-wrap items-center gap-3 rounded-lg bg-rose-50 px-3 py-2.5 text-sm text-rose-900"><CircleAlert className="h-4 w-4" aria-hidden /><span className="flex-1">{figur.error}</span>
                <button type="button" onClick={() => job("figur", figur.phase === "weiter" ? "weiter" : "neu")} className="inline-flex items-center gap-1.5 rounded-full border border-rose-200 bg-white px-3 py-1.5 text-xs font-semibold"><RefreshCw className="h-3.5 w-3.5" aria-hidden /> Nochmal versuchen</button>
              </div>)
            : null}

          {figur?.status === "auswahl" && !waitingFigur && (
            <div className="mt-2 flex flex-wrap items-end gap-5">
              <img src={media("figur-basis.jpg", v)} alt="Grundbild deiner Figur" width={240} height={240} className="rounded-xl border border-line bg-paper" />
              <div className="max-w-sm">
                <p className="text-sm font-semibold">Gefällt dir die Figur?</p>
                <p className="mt-1 text-sm leading-6 text-ink-soft">Wenn ja, erstellt der Server die Varianten zum Sprechen und die Gesten. Wenn nicht, erzeugt er ein neues Grundbild (kostet ein Bild vom Tageskontingent).</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button type="button" onClick={() => job("figur", "weiter")} disabled={!!busy} className="inline-flex items-center gap-2 rounded-full bg-navy px-5 py-3 text-sm font-semibold text-white hover:bg-navy-800 disabled:opacity-40"><CheckCircle2 className="h-4 w-4" aria-hidden /> Gefällt mir – weiter</button>
                  <button type="button" onClick={() => job("figur", "neu")} disabled={!!busy} className="inline-flex items-center gap-2 rounded-full border border-line px-4 py-3 text-sm font-semibold hover:border-navy disabled:opacity-40"><RefreshCw className="h-4 w-4" aria-hidden /> Neues Grundbild</button>
                </div>
              </div>
            </div>
          )}

          {figur && figur.status !== "auswahl" && done.size > 0 && (
            <ul className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-5 lg:grid-cols-9">
              {FIG_NAMES.map(([n, label]) => (
                <li key={n} className="text-center">
                  {done.has(n) ? <img src={media(`figur-${n}.jpg`, v)} alt={label} width={120} height={120} loading="lazy" className="aspect-square w-full rounded-lg border border-line bg-paper object-cover" />
                    : <span className="grid aspect-square w-full place-items-center rounded-lg border border-dashed border-line text-xs text-ink-muted">offen</span>}
                  <span className="mt-1 block text-xs text-ink-muted">{label}</span>
                </li>
              ))}
            </ul>
          )}
          {!!figur?.hinweise?.length && <ul className="mt-3 space-y-1 text-sm text-amber-900">{figur.hinweise.map((h) => <li key={h}>Hinweis: {h}</li>)}</ul>}

          {figur?.nutzbar && (
            <div className="mt-5">
              <h3 className="text-sm font-semibold">4. Probevideo</h3>
              <p className="mt-1 text-sm leading-6 text-ink-soft">Ein Video mit deiner Figur{settings.voiceSample && settings.hasHuggingface ? " und deiner Stimme" : " (ohne Stimme, bis du sie oben eingerichtet hast)"}. Das dauert auf dem Server etwa 15 bis 25 Minuten.</p>
              <button type="button" onClick={() => job("probe")} disabled={!!busy || waitingProbe || probe?.status === "läuft"} className="mt-3 inline-flex items-center gap-2 rounded-full border border-line px-4 py-3 text-sm font-semibold hover:border-navy disabled:opacity-40">
                <Clapperboard className="h-4 w-4" aria-hidden /> Probevideo erstellen
              </button>
              {waitingProbe ? <p className="mt-3 inline-flex items-center gap-2 text-sm text-ink-soft"><Loader2 className="h-4 w-4 animate-spin" aria-hidden /> Auftrag ist beim Server – er startet, sobald das aktuelle Video fertig ist.</p>
                : probe?.status === "läuft" ? <p className="mt-3 inline-flex items-center gap-2 text-sm text-ink-soft"><Loader2 className="h-4 w-4 animate-spin" aria-hidden /> Probevideo wird erstellt …</p>
                : probe?.status === "fehler" ? <p role="alert" className="mt-3 rounded-lg bg-rose-50 px-3 py-2.5 text-sm text-rose-900">Probevideo fehlgeschlagen: {probe.error}</p>
                : probe?.status === "fertig" ? (
                  <div className="mt-3 max-w-xs">
                    <video controls playsInline preload="metadata" src={media("probe-3d.mp4", probe.at)} className="aspect-[9/16] w-full rounded-xl bg-black" />
                    <p className="mt-1 text-xs text-ink-muted">vom {fmt(probe.at)} · {probe.voiced ? "mit deiner Stimme" : "ohne Stimme"}</p>
                  </div>)
                : null}
            </div>
          )}
        </div>
      )}
      {msg && <p role={msg.ok ? "status" : "alert"} className={`mt-4 rounded-lg px-3 py-2.5 text-sm ${msg.ok ? "bg-emerald-50 text-emerald-900" : "bg-rose-50 text-rose-900"}`}>{msg.text}</p>}
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

/* ---------- Stimmen für die neuen Reels ---------- */
function ReelVoices({ settings, job, onAction }: { settings: Settings; job?: ReelJob; onAction: (type: string) => void | Promise<void> }) {
  const [asked, setAsked] = useState("");
  const el = settings.voiceEngine === "elevenlabs";
  const ready = el ? settings.hasElevenlabs && !!settings.voiceId : settings.hasHuggingface && !!settings.voiceSample;
  const waiting = !!asked && (!job || job.at < asked);
  return (
    <section className="rounded-xl border border-line bg-white p-5 sm:p-7">
      <h2 className="text-lg font-semibold tracking-[-0.02em]">Stimmen für die neuen Reels</h2>
      <p className="mt-1 text-sm leading-6 text-ink-soft">
        Spricht alle Texte der neuen Reels mit deiner eingestellten Stimme ein ({el ? settings.voiceName || "ElevenLabs" : "deine eigene Stimme"}).
        Die ZIP-Datei lädst du herunter und gibst sie Claude – daraus entstehen die fertigen Videos.
      </p>
      {!ready && <p className="mt-3 rounded-lg bg-paper px-3 py-2.5 text-sm text-ink-soft">Richte zuerst oben unter „2. Stimme“ deine Stimme ein.</p>}
      <button type="button" disabled={!ready || waiting || job?.status === "läuft"} onClick={() => { setAsked(new Date().toISOString()); void onAction("reelstimmen"); }}
        className="mt-4 inline-flex items-center gap-2 rounded-full bg-navy px-5 py-3 text-sm font-semibold text-white hover:bg-navy-800 disabled:opacity-40">
        <Mic className="h-4 w-4" aria-hidden /> Reel-Stimmen erzeugen
      </button>
      {waiting ? <p className="mt-3 inline-flex items-center gap-2 text-sm text-ink-soft"><Loader2 className="h-4 w-4 animate-spin" aria-hidden /> Auftrag ist beim Server – er startet in der nächsten Minute.</p>
        : job?.status === "läuft" ? <p className="mt-3 inline-flex items-center gap-2 text-sm text-ink-soft"><Loader2 className="h-4 w-4 animate-spin" aria-hidden /> Wird eingesprochen …</p>
        : job?.status === "fehler" ? <p role="alert" className="mt-3 rounded-lg bg-rose-50 px-3 py-2.5 text-sm text-rose-900">Hat nicht geklappt: {job.error}</p>
        : job?.status === "fertig" ? (
          <div className="mt-3 rounded-xl border border-line p-3">
            <p className="text-sm font-medium">Fertig am {fmt(job.at)} · {job.reels} Reels, {job.beats} Abschnitte</p>
            <a href={`/api/admin/social/media/reel-stimmen.zip?v=${encodeURIComponent(job.at)}`} download
              className="mt-2 inline-flex items-center gap-2 rounded-full border border-line px-4 py-2.5 text-sm font-semibold hover:border-navy">
              <Download className="h-4 w-4" aria-hidden /> ZIP herunterladen
            </a>
          </div>
        ) : null}
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
  const [nr, setNr] = useState(0);
  const slides = e.slides ?? [];
  useEffect(() => { const k = (ev: KeyboardEvent) => ev.key === "Escape" && onClose(); window.addEventListener("keydown", k); return () => window.removeEventListener("keydown", k); }, [onClose]);
  return (
    <div role="dialog" aria-modal="true" aria-label={ep.title} className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4" onClick={onClose}>
      <div className="flex max-h-full w-full max-w-3xl flex-col gap-4 overflow-y-auto rounded-2xl bg-white p-4 sm:flex-row sm:p-5" onClick={(ev) => ev.stopPropagation()}>
        {slides.length ? (
          <div className="mx-auto w-full max-w-[420px] shrink-0 sm:w-[380px]">
            <div className="relative">
              <img src={`/api/admin/social/media/${slides[nr]}?v=${encodeURIComponent(e.renderedAt ?? "")}`} alt={`Bild ${nr + 1} von ${slides.length}`} className="aspect-[4/5] w-full rounded-xl bg-paper object-cover ring-1 ring-line" />
              {nr > 0 && <button type="button" onClick={() => setNr(nr - 1)} aria-label="Vorheriges Bild" className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-2 shadow"><ChevronLeft className="h-5 w-5" aria-hidden /></button>}
              {nr < slides.length - 1 && <button type="button" onClick={() => setNr(nr + 1)} aria-label="Nächstes Bild" className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-2 shadow"><ChevronRight className="h-5 w-5" aria-hidden /></button>}
            </div>
            <div className="mt-2 flex justify-center gap-1.5">
              {slides.map((f, i) => <button key={f} type="button" onClick={() => setNr(i)} aria-label={`Bild ${i + 1}`} className={`h-2 rounded-full transition-all ${i === nr ? "w-5 bg-navy" : "w-2 bg-line"}`} />)}
            </div>
          </div>
        ) : (
          <video src={`/api/admin/social/media/${e.video}?v=${encodeURIComponent(e.renderedAt ?? "")}`} poster={e.thumb ? `/api/admin/social/media/${e.thumb}?v=${encodeURIComponent(e.renderedAt ?? "")}` : undefined} controls autoPlay playsInline preload="metadata" className="mx-auto aspect-[9/16] max-h-[70vh] w-auto rounded-xl bg-black" />
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <h3 className="font-semibold">{ep.title}</h3>
            <button type="button" onClick={onClose} aria-label="Schließen" className="rounded-full p-1 hover:bg-paper"><X className="h-5 w-5" aria-hidden /></button>
          </div>
          <p className="mt-1 text-xs text-ink-muted">{slides.length ? `Bilder-Post · ${slides.length} Bilder · nur Instagram` : `${e.voiced ? "Mit Stimme" : "Ohne Stimme"} · ${e.duration ? `${Math.round(e.duration)} s` : ""}`} · erstellt {fmt(e.renderedAt)}</p>
          <p className="mt-4 text-xs font-semibold text-ink-muted">{slides.length ? "Text zum Post" : "Text zum Video"}</p>
          <p className="mt-1 whitespace-pre-line rounded-lg bg-paper p-3 text-sm leading-6">{ep.caption}</p>
          <button type="button" onClick={() => navigator.clipboard?.writeText(ep.caption).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); }).catch(() => undefined)}
            className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-xs font-medium hover:border-navy"><Copy className="h-3.5 w-3.5" aria-hidden />{copied ? "Kopiert" : "Text kopieren"}</button>
        </div>
      </div>
    </div>
  );
}
