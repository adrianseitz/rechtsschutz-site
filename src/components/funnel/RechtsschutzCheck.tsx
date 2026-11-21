"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, ArrowRight, Loader2, Lock, Minus, Plus } from "lucide-react";
import { AREAS, EINHEITEN_MAX, SITUATION, VERMIETER_ANLIEGEN } from "@/lib/funnel";
import { CONSENT_TEXTS, checkContactFormSchema, splitName } from "@/lib/schemas";
import { products, type ProductKey } from "@/lib/products";
import { getAttribution } from "@/lib/attribution";
import { currentTrackingConsent } from "@/lib/consent";
import { track } from "@/lib/tracking";
import { countEvent } from "@/lib/localEvents";
import { Icon3D } from "../ui/Icon3D";
import { StampOverlay } from "../ui/StampOverlay";
import { fireBurst } from "../ui/ClickBurst";

/**
 * Rechtsschutz-Check als EIN kurzes Formular – wie bei Vergleichsportalen und Maklern üblich:
 * eine Frage (Vermieter: Anzahl Wohnungen als Antipp-Buttons), Name, Telefon, Absenden.
 * Kein Weiterklicken, keine Pflicht-Checkbox (Hinweis direkt über dem Button).
 *
 * Vorauswahl aus Landingpage/Anzeige: ?bereich=arbeit&situation=angestellt · ?bereich=mehrere&auswahl=privat,verkehr
 * · ?bereich=vermieter&anliegen=mietausfall (Thema wird still mitgeschickt) · &einheiten=2 bzw. &ab=4
 */
type Preset = { bereich?: string; situation: string[]; einheiten?: number; anliegen?: string; answered: boolean };

const quickSchema = checkContactFormSchema.pick({ name: true, phone: true });
type QuickForm = { name: string; phone: string };
const UNIT_BUTTONS = [1, 2, 3, 4] as const;

function readPreset(params: URLSearchParams): Preset {
  const b = params.get("bereich");
  if (!b || !AREAS.some((a) => a.value === b)) return { situation: [], answered: false };
  if (b === "vermieter") {
    const num = (k: string) => { const n = Number.parseInt(params.get(k) ?? "", 10); return Number.isInteger(n) && n >= 1 && n <= EINHEITEN_MAX ? n : undefined; };
    const exact = num("einheiten");
    const a = params.get("anliegen");
    return { bereich: b, situation: [], einheiten: exact ?? num("ab"), anliegen: a && VERMIETER_ANLIEGEN.some((o) => o.value === a) ? a : undefined, answered: Boolean(exact) };
  }
  const q = SITUATION[b];
  const s = params.get("situation");
  const single = s && q && !q.multi && q.options.some((o) => o.value === s) ? [s] : [];
  const multi = q?.multi ? (params.get("auswahl") || "").split(",").filter((v) => q.options.some((o) => o.value === v)) : [];
  const situation = single.length ? single : multi;
  return { bereich: b, situation, answered: situation.length > 0 };
}

export function RechtsschutzCheck() {
  const params = useSearchParams();
  const router = useRouter();
  const [preset] = useState(() => readPreset(new URLSearchParams(params.toString())));
  const [bereich, setBereich] = useState<string | undefined>(preset.bereich);
  const [situation, setSituation] = useState<string[]>(preset.situation);
  const [einheiten, setEinheiten] = useState<number | undefined>(preset.einheiten);
  const [many, setMany] = useState((preset.einheiten ?? 0) >= 5);
  const [answerError, setAnswerError] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const [stamped, setStamped] = useState(false);
  const startedAt = useRef<number>(Date.now());
  const honeypot = useRef<HTMLInputElement>(null);
  const answersRef = useRef<HTMLDivElement>(null);
  const counted = useRef(new Set<string>());
  const runId = useRef("");

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<QuickForm>({
    resolver: zodResolver(quickSchema),
    defaultValues: { name: "", phone: "" },
    mode: "onTouched",
  });

  // Statistik im CRM wie bisher: gestartet → Frage beantwortet → Kontaktfelder → Anfrage
  const once = (key: string, fn: () => void) => { if (!counted.current.has(key)) { counted.current.add(key); fn(); } };
  const markStarted = (b?: string) => once("start", () => {
    track("funnel_started", { bereich: b ?? bereich ?? "" }, { dedupeKey: runId.current });
    countEvent("check_start");
  });
  const markAnswered = (b?: string) => {
    markStarted(b);
    const area = b ?? bereich;
    const step = area === "vermieter" ? "einheiten" : "situation";
    once(step, () => {
      countEvent(`step_${step}`);
      track("funnel_step_completed", { step_number: 2, step_name: step, bereich: area }, { dedupeKey: `${runId.current}:frage` });
    });
  };
  const markKontakt = () => { markStarted(); once("kontakt", () => countEvent("step_kontakt")); };

  useEffect(() => {
    runId.current = Math.random().toString(36).slice(2);
    if (preset.bereich) markStarted(preset.bereich);
    if (preset.answered) markAnswered(preset.bereich);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const question = bereich && bereich !== "vermieter" ? SITUATION[bereich] : undefined;
  const title = bereich && bereich in products ? `${products[bereich as ProductKey].name} prüfen` : "Rechtsschutz-Check";

  const pickUnits = (v: number) => { markAnswered(); setAnswerError(null); setMany(false); setEinheiten(v); };
  const pickMany = () => { markAnswered(); setAnswerError(null); setMany(true); setEinheiten((e) => (e && e >= 5 ? e : 5)); };
  const stepMany = (d: number) => setEinheiten((e) => Math.min(EINHEITEN_MAX, Math.max(5, (e ?? 5) + d)));
  const chooseArea = (value: string) => {
    markStarted(value);
    if (value !== bereich) setSituation([]);
    setBereich(value);
    setAnswerError(null);
  };
  const chooseSituation = (value: string) => {
    if (!question) return;
    markAnswered();
    setAnswerError(null);
    setSituation((s) => (question.multi ? (s.includes(value) ? s.filter((v) => v !== value) : [...s, value]) : [value]));
  };

  const missing = (): string | null => {
    if (!bereich) return "Bitte wähle aus, was du absichern möchtest.";
    if (bereich === "vermieter") return einheiten ? null : "Bitte wähle, wie viele Wohnungen du vermietest.";
    if (situation.length === 0) return "Bitte wähle eine Antwort aus.";
    return null;
  };

  const onSubmit = async (data: QuickForm) => {
    const miss = missing();
    if (miss) { setAnswerError(miss); answersRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }); return; }
    markAnswered();
    markKontakt();
    setServerError(null);
    const trackingConsent = currentTrackingConsent();
    const { firstName, lastName } = splitName(data.name);
    const answers = bereich === "vermieter"
      ? { bereich, situation: [], einheiten, ...(preset.anliegen ? { anliegen: preset.anliegen } : {}) }
      : { bereich, situation };
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          answers,
          contact: { firstName, lastName, email: "", phone: data.phone, contactMethod: "telefon", reachable: "", consentContact: true, consentMarketing: false },
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
  const submit = handleSubmit(onSubmit, () => { const miss = missing(); if (miss) setAnswerError(miss); });

  const option = (sel: boolean) =>
    `rounded-2xl border text-[15px] font-semibold transition active:scale-[0.97] ${sel ? "border-navy bg-sun text-navy" : "border-line bg-white text-navy hover:border-navy/40"}`;

  return (
    <div className="mx-auto w-full max-w-md">
      <h1 className="text-[1.65rem] font-semibold leading-[1.1] tracking-[-0.04em] text-navy sm:text-[2.2rem]">{title}</h1>
      <p className="mt-1 text-[15px] text-ink-soft">Kostenlos &amp; unverbindlich – ich rufe dich zurück.</p>

      <form onSubmit={submit} noValidate className="card mt-4 space-y-4 p-4 sm:p-6">
        <div ref={answersRef} className="scroll-mt-24">
          {!preset.bereich && (
            <fieldset className={bereich ? "mb-4" : ""}>
              <legend className="label">Was möchtest du absichern?</legend>
              <div className="grid grid-cols-2 gap-2">
                {AREAS.map((o, i) => (
                  <button key={o.value} type="button" aria-pressed={bereich === o.value} onClick={() => chooseArea(o.value)}
                    className={`flex min-h-[48px] items-center gap-2 px-2.5 py-2 text-left !text-[13.5px] leading-tight ${option(bereich === o.value)} ${i === AREAS.length - 1 ? "col-span-2" : ""}`}>
                    <Icon3D name={o.icon ?? "shield"} size={22} priority />{o.label}
                  </button>
                ))}
              </div>
            </fieldset>
          )}

          {bereich === "vermieter" && (
            <fieldset>
              <legend className="label">Wie viele Wohnungen vermietest du?</legend>
              <div className="grid grid-cols-5 gap-2">
                {UNIT_BUTTONS.map((v) => (
                  <button key={v} type="button" aria-pressed={!many && einheiten === v} onClick={() => pickUnits(v)} className={`h-12 ${option(!many && einheiten === v)}`}>{v}</button>
                ))}
                <button type="button" aria-pressed={many} onClick={pickMany} className={`h-12 ${option(many)}`}>5+</button>
              </div>
              {many && (
                <div className="mt-2 flex items-center justify-between rounded-2xl bg-paper px-3 py-2">
                  <label htmlFor="ck-einheiten" className="text-[14px] text-navy">Wie viele genau?</label>
                  <div className="flex items-center gap-1.5">
                    <button type="button" onClick={() => stepMany(-1)} disabled={(einheiten ?? 5) <= 5} aria-label="Eine weniger" className="grid h-9 w-9 place-items-center rounded-full border border-line bg-white text-navy disabled:opacity-35"><Minus className="h-4 w-4" aria-hidden /></button>
                    <input id="ck-einheiten" type="number" inputMode="numeric" min={5} max={EINHEITEN_MAX} value={einheiten ?? 5}
                      onChange={(e) => { const v = Number.parseInt(e.target.value.replace(/[^0-9]/g, "").slice(0, 3), 10); setEinheiten(Number.isInteger(v) ? Math.min(EINHEITEN_MAX, v) : undefined); }}
                      className="h-9 w-14 rounded-xl border border-line bg-white text-center text-base font-semibold tabular-nums text-navy [appearance:textfield] focus:border-navy focus:outline-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none" />
                    <button type="button" onClick={() => stepMany(1)} aria-label="Eine mehr" className="grid h-9 w-9 place-items-center rounded-full border border-line bg-white text-navy"><Plus className="h-4 w-4" aria-hidden /></button>
                  </div>
                </div>
              )}
            </fieldset>
          )}

          {question && (
            <fieldset>
              <legend className="label">{question.title}</legend>
              <div className="grid grid-cols-2 gap-2">
                {question.options.map((o) => (
                  <button key={o.value} type="button" aria-pressed={situation.includes(o.value)} onClick={() => chooseSituation(o.value)}
                    className={`min-h-[48px] px-3 py-2 text-left !text-[14px] leading-tight ${option(situation.includes(o.value))}`}>{o.label}</button>
                ))}
              </div>
            </fieldset>
          )}
          {answerError && <p role="alert" className="field-error">{answerError}</p>}
        </div>

        <div>
          <label htmlFor="ck-name" className="label">Name</label>
          <input id="ck-name" autoComplete="name" autoCapitalize="words" enterKeyHint="next" className="input !py-3" aria-invalid={!!errors.name} {...register("name")} onFocus={markKontakt} />
          {errors.name && <p className="field-error">{errors.name.message}</p>}
        </div>
        <div>
          <label htmlFor="ck-phone" className="label">Telefonnummer</label>
          <input id="ck-phone" type="tel" inputMode="tel" autoComplete="tel" enterKeyHint="send" className="input !py-3" aria-invalid={!!errors.phone} {...register("phone")} onFocus={markKontakt} />
          {errors.phone && <p className="field-error">{errors.phone.message}</p>}
        </div>

        {/* Honeypot gegen Bots – für Menschen unsichtbar */}
        <div aria-hidden className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
          <label htmlFor="website">Website</label>
          <input id="website" ref={honeypot} name="website" tabIndex={-1} autoComplete="off" defaultValue="" />
        </div>

        {serverError && (
          <div role="alert" className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden /> {serverError}
          </div>
        )}

        <div>
          <button type="submit" disabled={isSubmitting}
            className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-navy py-3.5 text-[16px] font-semibold text-white transition hover:bg-navy-800 disabled:opacity-60">
            {isSubmitting ? <><Loader2 className="h-5 w-5 animate-spin" aria-hidden /> Wird gesendet …</> : <>Kostenlosen Rückruf anfordern <ArrowRight className="h-4 w-4" aria-hidden /></>}
          </button>
          <p className="mt-2.5 text-center text-[11.5px] leading-[1.45] text-ink-muted">
            {/* Genau dieser Wortlaut wird mit der Anfrage gespeichert (CONSENT_TEXTS.contactButton). */}
            {CONSENT_TEXTS.contactButton.replace(" Es gelten die Datenschutzhinweise.", "")} Es gelten die{" "}
            <Link href="/datenschutz" target="_blank" className="underline underline-offset-2">Datenschutzhinweise</Link>.
          </p>
        </div>
      </form>

      <p className="mt-4 flex items-center justify-center gap-2 text-center text-xs text-ink-muted">
        <Lock className="h-3.5 w-3.5" aria-hidden /> Persönlich von Adrian Seitz, ARAG-Vertriebspartner – kein Callcenter
      </p>
      <StampOverlay show={stamped} />
    </div>
  );
}
