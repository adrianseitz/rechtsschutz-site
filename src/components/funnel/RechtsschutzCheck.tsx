"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, ArrowRight, Check, Loader2, Lock, Minus, Plus } from "lucide-react";
import { AREAS, EINHEITEN_MAX, SITUATION, VERMIETER_ANLIEGEN } from "@/lib/funnel";
import { CONSENT_TEXTS, checkContactFormSchema, splitName, type CheckContactForm } from "@/lib/schemas";
import { getAttribution } from "@/lib/attribution";
import { currentTrackingConsent } from "@/lib/consent";
import { track } from "@/lib/tracking";
import { countEvent } from "@/lib/localEvents";
import { legal } from "@/lib/site";
import { Icon3D } from "../ui/Icon3D";
import { StampOverlay } from "../ui/StampOverlay";
import { fireBurst } from "../ui/ClickBurst";

/**
 * Rechtsschutz-Check auf EINEM Bildschirm: Bereich, die eine passende Frage (bzw. Wohnungen bei Vermietern),
 * Name, Telefon und Absenden – kein Weiterklicken durch mehrere Schritte.
 *
 * Vorauswahl aus Landingpage/Anzeige wird übernommen:
 *   ?bereich=arbeit&situation=angestellt  ·  ?bereich=mehrere&auswahl=privat,verkehr
 *   ?bereich=vermieter&anliegen=mietausfall  ·  &einheiten=2 bzw. &ab=4
 */
type Preset = { bereich?: string; situation: string[]; einheiten?: number; anliegen?: string; einheitenFromUrl: boolean };

function readPreset(params: URLSearchParams): Preset {
  const b = params.get("bereich");
  if (!b || !AREAS.some((a) => a.value === b)) return { situation: [], einheitenFromUrl: false };
  if (b === "vermieter") {
    const num = (k: string) => { const n = Number.parseInt(params.get(k) ?? "", 10); return Number.isInteger(n) && n >= 1 && n <= EINHEITEN_MAX ? n : undefined; };
    const exact = num("einheiten");
    const a = params.get("anliegen");
    return { bereich: b, situation: [], einheiten: exact ?? num("ab"), anliegen: a && VERMIETER_ANLIEGEN.some((o) => o.value === a) ? a : undefined, einheitenFromUrl: Boolean(exact) };
  }
  const q = SITUATION[b];
  const s = params.get("situation");
  const single = s && q && !q.multi && q.options.some((o) => o.value === s) ? [s] : [];
  const multi = q?.multi ? (params.get("auswahl") || "").split(",").filter((v) => q.options.some((o) => o.value === v)) : [];
  return { bereich: b, situation: single.length ? single : multi, einheitenFromUrl: false };
}

export function RechtsschutzCheck() {
  const params = useSearchParams();
  const router = useRouter();
  const [preset] = useState(() => readPreset(new URLSearchParams(params.toString())));
  const [bereich, setBereich] = useState<string | undefined>(preset.bereich);
  const [pickArea, setPickArea] = useState(!preset.bereich);
  const [situation, setSituation] = useState<string[]>(preset.situation);
  const [einheiten, setEinheiten] = useState(String(preset.einheiten ?? 1));
  const [anliegen, setAnliegen] = useState<string | undefined>(preset.anliegen);
  const [answerError, setAnswerError] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const [stamped, setStamped] = useState(false);
  const startedAt = useRef<number>(Date.now());
  const honeypot = useRef<HTMLInputElement>(null);
  const answersRef = useRef<HTMLDivElement>(null);
  const counted = useRef(new Set<string>());
  const runId = useRef("");

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<CheckContactForm>({
    resolver: zodResolver(checkContactFormSchema),
    defaultValues: { name: "", phone: "", email: "", reachable: "", consentMarketing: false },
    mode: "onTouched",
  });

  // Statistik im CRM wie bisher: gestartet → erste Frage beantwortet → Kontaktfelder → Anfrage
  const once = (key: string, fn: () => void) => { if (!counted.current.has(key)) { counted.current.add(key); fn(); } };
  const markStarted = (b?: string) => once("start", () => {
    track("funnel_started", { bereich: b ?? bereich ?? "" }, { dedupeKey: runId.current });
    countEvent("check_start");
  });
  const markAnswered = (b?: string) => {
    markStarted(b);
    const area = b ?? bereich;
    once(area === "vermieter" ? "einheiten" : "situation", () => {
      countEvent(area === "vermieter" ? "step_einheiten" : "step_situation");
      track("funnel_step_completed", { step_number: 2, step_name: area === "vermieter" ? "einheiten" : "situation", bereich: area }, { dedupeKey: `${runId.current}:frage` });
    });
  };
  const markKontakt = () => { markStarted(); once("kontakt", () => countEvent("step_kontakt")); };

  useEffect(() => {
    runId.current = Math.random().toString(36).slice(2);
    if (preset.bereich) markStarted(preset.bereich);
    // Auf der Landingpage schon beantwortet: zählt als beantwortet, sonst stimmt die Statistik nicht.
    if (preset.situation.length > 0 || preset.einheitenFromUrl) markAnswered(preset.bereich);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const area = AREAS.find((a) => a.value === bereich);
  const question = bereich && bereich !== "vermieter" ? SITUATION[bereich] : undefined;
  const n = Number.parseInt(einheiten, 10);
  const einheitenValid = Number.isInteger(n) && n >= 1 && n <= EINHEITEN_MAX;
  const setN = (v: number) => { markAnswered(); setAnswerError(null); setEinheiten(String(Math.min(EINHEITEN_MAX, Math.max(1, v)))); };

  const chooseArea = (value: string) => {
    markStarted(value);
    if (value !== bereich) { setSituation([]); if (value !== "vermieter") setAnliegen(undefined); }
    setBereich(value);
    setPickArea(false);
    setAnswerError(null);
  };
  const chooseSituation = (value: string) => {
    if (!question) return;
    markAnswered();
    setAnswerError(null);
    setSituation((s) => question.multi ? (s.includes(value) ? s.filter((v) => v !== value) : [...s, value]) : [value]);
  };

  /** Fehlt bei den Fragen oben noch etwas? */
  const missing = (): string | null => {
    if (!bereich) return "Bitte wähle zuerst aus, was du absichern möchtest.";
    if (bereich === "vermieter") return einheitenValid ? null : `Bitte gib eine Zahl zwischen 1 und ${EINHEITEN_MAX} ein.`;
    if (situation.length === 0) return question?.multi ? "Bitte wähle mindestens einen Bereich aus." : "Bitte wähle eine Antwort aus.";
    return null;
  };

  const onSubmit = async (data: CheckContactForm) => {
    const miss = missing();
    if (miss) {
      setAnswerError(miss);
      answersRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    markAnswered();
    markKontakt();
    setServerError(null);
    const trackingConsent = currentTrackingConsent();
    const { firstName, lastName } = splitName(data.name);
    const answers = bereich === "vermieter"
      ? { bereich, situation: [], einheiten: n, ...(anliegen ? { anliegen } : {}) }
      : { bereich, situation };
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          answers,
          contact: {
            firstName, lastName, email: data.email, phone: data.phone, contactMethod: "telefon",
            reachable: data.reachable, consentContact: data.consentContact, consentMarketing: data.consentMarketing,
          },
          attribution: getAttribution(trackingConsent.marketing),
          trackingConsent,
          spam: { website: honeypot.current?.value ?? "", startedAt: startedAt.current },
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.ok) {
        setServerError(json.error || "Deine Anfrage konnte leider nicht übermittelt werden. Bitte versuche es erneut.");
        return;
      }
      const leadId = json.leadId as string;
      track("lead_submitted", { bereich }, { dedupeKey: leadId, eventId: leadId });
      countEvent("lead");
      try { sessionStorage.setItem("rs_last_submission", JSON.stringify({ type: "check", bereich })); } catch {}
      setStamped(true);
      fireBurst(window.innerWidth / 2, window.innerHeight / 2, true);
      setTimeout(() => router.push("/vielen-dank?typ=check"), 1100);
    } catch {
      setServerError("Keine Verbindung. Bitte prüfe deine Internetverbindung und versuche es erneut.");
    }
  };

  // Formular nicht abschicken, wenn oben noch etwas fehlt – auch wenn die Kontaktfelder schon stimmen.
  const submit = handleSubmit(onSubmit, () => { const miss = missing(); if (miss) setAnswerError(miss); });

  return (
    <div className="mx-auto w-full max-w-xl">
      <h1 className="text-[1.6rem] font-semibold leading-[1.1] tracking-[-0.04em] text-navy min-[400px]:text-[1.85rem] sm:text-[2.4rem]">Dein kostenloser Check</h1>
      <p className="mt-1 text-[15px] leading-snug text-ink-soft sm:text-base">Kurz ausfüllen – ich rufe dich zurück.</p>

      <form onSubmit={submit} noValidate className="card mt-4 p-4 sm:mt-6 sm:p-6">
        <div ref={answersRef} className="scroll-mt-24">
          {/* Bereich */}
          {bereich && !pickArea ? (
            <div className="flex items-center justify-between gap-3">
              <p className="flex min-w-0 items-center gap-2.5 text-[15px] font-semibold text-navy">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-sun"><Icon3D name={area?.icon ?? "shield"} size={22} priority /></span>
                <span className="truncate">{area?.label}</span>
              </p>
              <button type="button" onClick={() => setPickArea(true)} className="shrink-0 text-[13px] font-medium text-ink-soft underline decoration-ink-muted/40 underline-offset-4 hover:text-navy">ändern</button>
            </div>
          ) : (
            <fieldset>
              <legend className="text-[15px] font-semibold text-navy">Was möchtest du absichern?</legend>
              <div className="mt-2.5 grid grid-cols-2 gap-2">
                {AREAS.map((o, i) => {
                  const sel = bereich === o.value;
                  return (
                    <button key={o.value} type="button" aria-pressed={sel} onClick={() => chooseArea(o.value)}
                      className={`flex min-h-[52px] items-center gap-2.5 rounded-2xl border p-2 pr-3 text-left text-[13.5px] font-medium leading-tight transition active:scale-[0.98] ${i === AREAS.length - 1 ? "col-span-2" : ""} ${sel ? "border-navy bg-sun text-navy" : "border-line bg-white text-navy hover:border-navy/40"}`}>
                      <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${sel ? "bg-white" : "bg-paper"}`}><Icon3D name={o.icon ?? "shield"} size={22} priority /></span>
                      {o.label}
                    </button>
                  );
                })}
              </div>
            </fieldset>
          )}

          {/* Die eine passende Frage zum Bereich */}
          {bereich === "vermieter" && (
            <>
              <div className="mt-3.5 flex items-center justify-between gap-3 rounded-2xl bg-paper px-3 py-2">
                <label htmlFor="ck-einheiten" className="text-[14px] font-medium leading-tight text-navy">Vermietete Wohnungen</label>
                <div className="flex shrink-0 items-center gap-1.5">
                  <button type="button" onClick={() => setN((einheitenValid ? n : 1) - 1)} disabled={einheitenValid && n <= 1} aria-label="Eine Wohnung weniger"
                    className="grid h-10 w-10 place-items-center rounded-full border border-line bg-white text-navy transition hover:border-navy disabled:opacity-35">
                    <Minus className="h-4 w-4" aria-hidden />
                  </button>
                  <input id="ck-einheiten" type="number" inputMode="numeric" min={1} max={EINHEITEN_MAX} value={einheiten}
                    onChange={(e) => { markAnswered(); setAnswerError(null); setEinheiten(e.target.value.replace(/[^0-9]/g, "").slice(0, 3)); }}
                    aria-invalid={!einheitenValid}
                    className="h-10 w-12 rounded-xl border border-line bg-white text-center text-lg font-semibold tabular-nums text-navy [appearance:textfield] focus:border-navy focus:outline-none focus:ring-4 focus:ring-sun/40 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none" />
                  <button type="button" onClick={() => setN((einheitenValid ? n : 0) + 1)} disabled={einheitenValid && n >= EINHEITEN_MAX} aria-label="Eine Wohnung mehr"
                    className="grid h-10 w-10 place-items-center rounded-full border border-line bg-white text-navy transition hover:border-navy disabled:opacity-35">
                    <Plus className="h-4 w-4" aria-hidden />
                  </button>
                </div>
              </div>
              <fieldset className="mt-3">
                <legend className="text-[13px] font-medium text-ink-soft">Worum geht es dir? <span className="font-normal text-ink-muted">(freiwillig)</span></legend>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  {VERMIETER_ANLIEGEN.map((o) => (
                    <Chip key={o.value} label={o.label} selected={anliegen === o.value} onClick={() => { markStarted(); setAnliegen(anliegen === o.value ? undefined : o.value); }} />
                  ))}
                </div>
              </fieldset>
            </>
          )}
          {question && (
            <fieldset className="mt-3.5">
              <legend className="text-[14px] font-semibold text-navy">{question.title} {question.subtitle && <span className="font-normal text-ink-muted">({question.subtitle.replace(/\.$/, "")})</span>}</legend>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {question.options.map((o) => (
                  <Chip key={o.value} label={o.label} selected={situation.includes(o.value)} multi={question.multi} onClick={() => chooseSituation(o.value)} />
                ))}
              </div>
            </fieldset>
          )}
          {answerError && <p role="alert" className="field-error">{answerError}</p>}
        </div>

        {/* Kontakt */}
        <div className="mt-3.5 grid grid-cols-2 gap-2">
          <div>
            <label htmlFor="ck-name" className="sr-only">Dein Name</label>
            <input id="ck-name" autoComplete="name" autoCapitalize="words" enterKeyHint="next" placeholder="Dein Name" className="input !py-3"
              aria-invalid={!!errors.name} {...register("name")} onFocus={markKontakt} />
            {errors.name && <p className="field-error">{errors.name.message}</p>}
          </div>
          <div>
            <label htmlFor="ck-phone" className="sr-only">Telefonnummer</label>
            <input id="ck-phone" type="tel" inputMode="tel" autoComplete="tel" enterKeyHint="send" placeholder="Telefonnummer" className="input !py-3"
              aria-invalid={!!errors.phone} {...register("phone")} onFocus={markKontakt} />
            {errors.phone && <p className="field-error">{errors.phone.message}</p>}
          </div>
        </div>

        {/* Honeypot gegen Bots – für Menschen unsichtbar */}
        <div aria-hidden className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
          <label htmlFor="website">Website</label>
          <input id="website" ref={honeypot} name="website" tabIndex={-1} autoComplete="off" defaultValue="" />
        </div>

        <label className="mt-3 flex cursor-pointer items-start gap-2.5 text-[12.5px] leading-[1.45] text-ink-soft">
          <input type="checkbox" className="mt-0.5 h-[18px] w-[18px] shrink-0 rounded border-line accent-teal" {...register("consentContact")} />
          <span>
            {CONSENT_TEXTS.contact.replace(" Die Datenschutzhinweise habe ich gelesen.", "")}{" "}
            Die <Link href="/datenschutz" target="_blank" className="font-medium text-navy underline underline-offset-2">Datenschutzhinweise</Link> habe ich gelesen. <span className="text-red-600">*</span>
          </span>
        </label>
        {errors.consentContact && <p className="field-error !mt-1 pl-7">{errors.consentContact.message}</p>}

        {serverError && (
          <div role="alert" className="mt-3 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden /> {serverError}
          </div>
        )}

        <button type="submit" disabled={isSubmitting}
          className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-full bg-navy py-3.5 text-[16px] font-semibold text-white transition hover:bg-navy-800 disabled:opacity-60">
          {isSubmitting ? <><Loader2 className="h-5 w-5 animate-spin" aria-hidden /> Wird gesendet …</> : <>Kostenlosen Rückruf anfordern <ArrowRight className="h-4 w-4" aria-hidden /></>}
        </button>
        <p className="mt-2 text-center text-[12px] text-ink-muted">Unverbindlich – es entsteht kein Vertrag und keine Kosten.</p>
        <label className="mt-3 flex cursor-pointer items-start gap-2.5 border-t border-line pt-3 text-[11.5px] leading-[1.4] text-ink-muted">
          <input type="checkbox" className="mt-0.5 h-4 w-4 shrink-0 rounded border-line accent-teal" {...register("consentMarketing")} />
          <span>{CONSENT_TEXTS.marketing}</span>
        </label>
      </form>

      <p className="mx-auto mt-4 max-w-md rounded-2xl bg-white px-4 py-3 text-center text-xs leading-5 text-ink-soft">
        Deine Anfrage landet direkt bei mir, nicht in einem Callcenter: <strong className="text-navy">{legal.name}</strong>, eingetragener Versicherungsvertreter (Vermittlerregister-Nr.&nbsp;<span className="whitespace-nowrap">{legal.registerNumber}</span>).
      </p>
      <p className="mt-4 flex items-center justify-center gap-2 text-center text-xs text-ink-muted">
        <Lock className="h-3.5 w-3.5" aria-hidden /> Verschlüsselte Übertragung · Kostenlos & unverbindlich
      </p>
      <StampOverlay show={stamped} />
    </div>
  );
}

function Chip({ label, selected, multi, onClick }: { label: string; selected: boolean; multi?: boolean; onClick: () => void }) {
  return (
    <button type="button" aria-pressed={selected} onClick={onClick}
      className={`flex min-h-[44px] items-center gap-2 rounded-xl border px-3 py-2 text-left text-[13.5px] font-medium leading-tight transition ${selected ? "border-navy bg-sun text-navy" : "border-line bg-white text-ink-soft hover:border-navy/40"}`}>
      <span className={`grid h-4 w-4 shrink-0 place-items-center border ${multi ? "rounded" : "rounded-full"} ${selected ? "border-navy bg-navy text-sun" : "border-line"}`}>
        {selected && <Check className="h-2.5 w-2.5" strokeWidth={3.5} aria-hidden />}
      </span>
      {label}
    </button>
  );
}
