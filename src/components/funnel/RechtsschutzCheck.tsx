"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { AlertCircle, ArrowRight, Check, Loader2, Minus, Plus } from "lucide-react";
import { AREAS, EINHEITEN_MAX, SITUATION, VERMIETER_ANLIEGEN } from "@/lib/funnel";
import { CONSENT_TEXTS, phoneRegex, splitName } from "@/lib/schemas";
import { products, type ProductKey } from "@/lib/products";
import { getAttribution } from "@/lib/attribution";
import { currentTrackingConsent } from "@/lib/consent";
import { track } from "@/lib/tracking";
import { countEvent } from "@/lib/localEvents";
import { Icon3D } from "../ui/Icon3D";
import { AdvisorAvatar } from "../ui/AdvisorAvatar";
import { StampOverlay } from "../ui/StampOverlay";
import { fireBurst } from "../ui/ClickBurst";

/**
 * Rechtsschutz-Check als EIN kurzes Formular – kein Weiterklicken.
 * Vermieter: Wohneinheiten (Zahl mit Plus/Minus), Mietausfallschutz Ja/Nein, Vor- und Nachname, Telefon, E-Mail (optional).
 * Andere Bereiche: die eine passende Frage, Vor- und Nachname, Telefon, E-Mail (optional).
 *
 * Vorauswahl aus Landingpage/Anzeige: ?bereich=arbeit&situation=angestellt · ?bereich=mehrere&auswahl=privat,verkehr
 * · ?bereich=vermieter&anliegen=mietausfall (Thema wird still mitgeschickt) · &einheiten=2 bzw. &ab=4
 */
type Preset = { bereich?: string; situation: string[]; einheiten?: number; anliegen?: string; answered: boolean };

const fieldsSchema = z.object({
  name: z.string().trim().max(120),
  email: z.string().trim().max(160),
  phone: z.string().trim().max(30)
    .min(1, "Bitte gib deine Telefonnummer an.")
    .regex(phoneRegex, "Bitte prüfe die Telefonnummer."),
});
type Fields = z.infer<typeof fieldsSchema>;
const emailOk = (v: string) => z.string().email().safeParse(v).success;

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
  const [einheiten, setEinheiten] = useState(preset.einheiten ? String(preset.einheiten) : "");
  const [mietausfall, setMietausfall] = useState<"ja" | "nein" | undefined>();
  const [answerErrors, setAnswerErrors] = useState<{ bereich?: string; einheiten?: string; mietausfall?: string; situation?: string }>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [stamped, setStamped] = useState(false);
  const startedAt = useRef<number>(Date.now());
  const honeypot = useRef<HTMLInputElement>(null);
  const topRef = useRef<HTMLDivElement>(null);
  const counted = useRef(new Set<string>());
  const runId = useRef("");

  const { register, handleSubmit, setError, getValues, formState: { errors, isSubmitting } } = useForm<Fields>({
    resolver: zodResolver(fieldsSchema),
    defaultValues: { name: "", email: "", phone: "" },
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

  const vermieter = bereich === "vermieter";
  const question = bereich && !vermieter ? SITUATION[bereich] : undefined;
  const productName = bereich && bereich in products ? products[bereich as ProductKey].name : "Rechtsschutz";
  const units = Number.parseInt(einheiten, 10);
  const unitsValid = Number.isInteger(units) && units >= 1 && units <= EINHEITEN_MAX;

  /** Plus/Minus: leeres Feld startet bei 1 */
  const stepUnits = (d: number) => {
    markAnswered();
    setAnswerErrors((x) => ({ ...x, einheiten: undefined }));
    setEinheiten((v) => { const n = Number.parseInt(v, 10); return String(Number.isInteger(n) ? Math.min(EINHEITEN_MAX, Math.max(1, n + d)) : 1); });
  };
  const chooseArea = (value: string) => {
    markStarted(value);
    if (value !== bereich) setSituation([]);
    setBereich(value);
    setAnswerErrors({});
  };
  const chooseSituation = (value: string) => {
    if (!question) return;
    markAnswered();
    setAnswerErrors((e) => ({ ...e, situation: undefined }));
    setSituation((s) => (question.multi ? (s.includes(value) ? s.filter((v) => v !== value) : [...s, value]) : [value]));
  };

  /** Fragen oben prüfen; gibt true zurück, wenn alles da ist. */
  const checkAnswers = () => {
    const e: typeof answerErrors = {};
    if (!bereich) e.bereich = "Bitte wähle aus, was du absichern möchtest.";
    else if (vermieter) {
      if (!unitsValid) e.einheiten = einheiten ? `Bitte gib eine Zahl zwischen 1 und ${EINHEITEN_MAX} ein.` : "Bitte gib an, wie viele Wohneinheiten du vermietest.";
      if (!mietausfall) e.mietausfall = "Bitte wähle Ja oder Nein.";
    } else if (situation.length === 0) e.situation = "Bitte wähle eine Antwort aus.";
    setAnswerErrors(e);
    return Object.keys(e).length === 0;
  };

  /** Name und Telefon sind Pflicht; die E-Mail ist freiwillig (nur das Format wird geprüft, wenn eine da ist). */
  const checkContact = (data: Fields) => {
    let ok = true;
    if (data.email.trim() && !emailOk(data.email.trim())) { setError("email", { message: "Bitte prüfe die E-Mail-Adresse." }); ok = false; }
    if (data.name.trim().length < 2) { setError("name", { message: "Bitte gib deinen Vor- und Nachnamen an." }); ok = false; }
    return ok;
  };

  const onSubmit = async (data: Fields) => {
    const answersOk = checkAnswers();
    const contactOk = checkContact(data);
    if (!answersOk || !contactOk) { topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }); return; }
    markAnswered();
    markKontakt();
    setServerError(null);
    const trackingConsent = currentTrackingConsent();
    const { firstName, lastName } = splitName(data.name);
    const answers = vermieter
      ? { bereich, situation: [], einheiten: units, mietausfall, ...(preset.anliegen ? { anliegen: preset.anliegen } : {}) }
      : { bereich, situation };
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          answers,
          contact: { firstName, lastName, email: data.email, phone: data.phone, contactMethod: "telefon", reachable: "", consentContact: true, consentMarketing: false },
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
  const submit = handleSubmit(onSubmit, () => { checkAnswers(); checkContact(getValues()); });

  const price = bereich && bereich in products ? products[bereich as ProductKey].quick?.price : undefined;
  const heading = vermieter ? "Finde den passenden Rechtsschutz für deine Immobilie" : "Finde den passenden Rechtsschutz für dich";
  const subline = vermieter
    ? <>Individuelles Angebot für Vermieter – bereits ab <span className="whitespace-nowrap font-semibold text-navy">{price ?? "6,45"} €</span> monatlich.</>
    : <>Individuelles Angebot für {productName}{price ? <> – bereits ab <span className="whitespace-nowrap font-semibold text-navy">{price} €</span> monatlich</> : null}.</>;

  return (
    <div className="mx-auto w-full max-w-[440px]" ref={topRef}>
      {/* Kopf: ein Mensch statt Callcenter – Adrians Foto direkt neben der Überschrift */}
      <div className="flex items-start gap-3.5">
        <AdvisorAvatar size={44} className="mt-1 shadow-[0_8px_18px_-12px_rgba(11,11,10,0.6)]" />
        <div className="min-w-0">
          <h1 className="scroll-mt-24 text-balance text-[1.4rem] font-semibold leading-[1.08] tracking-[-0.04em] text-navy min-[400px]:text-[1.5rem] sm:text-[1.8rem]">{heading}</h1>
          <p className="mt-1.5 text-[14px] leading-snug text-ink-soft">{subline}</p>
        </div>
      </div>

      <form onSubmit={submit} noValidate
        className="mt-4 rounded-[26px] border border-navy/10 bg-white p-4 shadow-[0_30px_60px_-40px_rgba(11,11,10,0.45)] sm:p-6">
        {!preset.bereich && (
          <fieldset className="mb-5">
            <legend className="mb-2 text-[14px] font-semibold text-navy">Was möchtest du absichern?</legend>
            <div className="grid grid-cols-2 gap-2">
              {AREAS.map((o, i) => (
                <button key={o.value} type="button" aria-pressed={bereich === o.value} onClick={() => chooseArea(o.value)}
                  className={`flex min-h-[48px] items-center gap-2 rounded-2xl border px-2.5 py-2 text-left text-[13.5px] font-medium leading-tight transition ${bereich === o.value ? "border-navy bg-sun text-navy" : "border-line bg-white text-navy hover:border-navy/40"} ${i === AREAS.length - 1 ? "col-span-2" : ""}`}>
                  <Icon3D name={o.icon ?? "shield"} size={22} priority />{o.label}
                </button>
              ))}
            </div>
            {answerErrors.bereich && <p role="alert" className="field-error">{answerErrors.bereich}</p>}
          </fieldset>
        )}

        {vermieter && (
          <div className="space-y-4">
            <div>
              <label htmlFor="ck-einheiten" className="mb-2 block text-[14px] font-semibold text-navy">Wie viele Wohneinheiten vermietest du?</label>
              <div className="flex items-stretch gap-2.5">
                <div className={`flex h-[60px] min-w-0 flex-1 items-center rounded-2xl border bg-paper/60 transition focus-within:border-navy focus-within:bg-white focus-within:ring-4 focus-within:ring-sun/40 ${answerErrors.einheiten ? "border-red-400" : "border-line"}`}>
                  <button type="button" onClick={() => stepUnits(-1)} disabled={!unitsValid || units <= 1} aria-label="Eine Wohneinheit weniger"
                    className="grid h-full w-11 shrink-0 place-items-center rounded-l-2xl text-navy transition hover:bg-black/[0.03] disabled:opacity-30"><Minus className="h-4 w-4" aria-hidden /></button>
                  <input id="ck-einheiten" type="text" inputMode="numeric" pattern="[0-9]*" autoComplete="off" placeholder="Anzahl eingeben" value={einheiten}
                    onChange={(e) => { markAnswered(); setAnswerErrors((x) => ({ ...x, einheiten: undefined })); setEinheiten(e.target.value.replace(/[^0-9]/g, "").slice(0, 3)); }}
                    aria-invalid={!!answerErrors.einheiten}
                    className="h-full min-w-0 flex-1 bg-transparent text-center text-[1.75rem] font-semibold tabular-nums tracking-[-0.03em] text-navy placeholder:text-[14px] placeholder:font-normal placeholder:tracking-normal placeholder:text-ink-muted focus:outline-none" />
                  <button type="button" onClick={() => stepUnits(1)} disabled={unitsValid && units >= EINHEITEN_MAX} aria-label="Eine Wohneinheit mehr"
                    className="grid h-full w-11 shrink-0 place-items-center rounded-r-2xl text-navy transition hover:bg-black/[0.03] disabled:opacity-30"><Plus className="h-4 w-4" aria-hidden /></button>
                </div>
                <Klingelschild count={unitsValid ? units : 0} />
              </div>
              {answerErrors.einheiten && <p role="alert" className="field-error">{answerErrors.einheiten}</p>}
            </div>

            <fieldset>
              <legend className="mb-2 text-[14px] font-semibold leading-snug text-navy">Möchtest du abgesichert sein, wenn dein Mieter nicht zahlt?</legend>
              <div className="grid grid-cols-2 rounded-full border border-line bg-paper/60 p-1" role="radiogroup" aria-label="Möchtest du abgesichert sein, wenn dein Mieter nicht zahlt?">
                {(["ja", "nein"] as const).map((v) => (
                  <button key={v} type="button" role="radio" aria-checked={mietausfall === v}
                    onClick={() => { markStarted(); setAnswerErrors((x) => ({ ...x, mietausfall: undefined })); setMietausfall(v); }}
                    className={`h-10 rounded-full text-[15px] font-semibold transition ${mietausfall === v ? "bg-navy text-white shadow-sm" : "text-ink-soft hover:text-navy"}`}>
                    {v === "ja" ? "Ja" : "Nein"}
                  </button>
                ))}
              </div>
              <p className="mt-1.5 text-[12px] leading-snug text-ink-muted">Mietausfallschutz: je nach Tarif bis zu 12 Monatsmieten.</p>
              {answerErrors.mietausfall && <p role="alert" className="field-error">{answerErrors.mietausfall}</p>}
            </fieldset>
          </div>
        )}

        {question && (
          <fieldset>
            <legend className="mb-2 text-[14px] font-semibold text-navy">{question.title}</legend>
            <div className="grid grid-cols-2 gap-2">
              {question.options.map((o) => {
                const sel = situation.includes(o.value);
                return (
                  <button key={o.value} type="button" aria-pressed={sel} onClick={() => chooseSituation(o.value)}
                    className={`min-h-[48px] rounded-2xl border px-3 py-2 text-left text-[14px] font-medium leading-tight transition ${sel ? "border-navy bg-sun text-navy" : "border-line bg-white text-navy hover:border-navy/40"}`}>{o.label}</button>
                );
              })}
            </div>
            {answerErrors.situation && <p role="alert" className="field-error">{answerErrors.situation}</p>}
          </fieldset>
        )}

        {bereich && (
          <div className="mt-4 space-y-3 border-t border-dashed border-line pt-4">
            <Field id="ck-name" label="Vor- und Nachname" error={errors.name?.message}>
              <input id="ck-name" autoComplete="name" autoCapitalize="words" enterKeyHint="next" className={INPUT} aria-invalid={!!errors.name} {...register("name")} onFocus={markKontakt} />
            </Field>
            <Field id="ck-phone" label="Telefonnummer" error={errors.phone?.message}>
              <input id="ck-phone" type="tel" inputMode="tel" autoComplete="tel" enterKeyHint="next" className={INPUT} aria-invalid={!!errors.phone} {...register("phone")} onFocus={markKontakt} />
            </Field>
            <Field id="ck-email" label="E-Mail-Adresse" hint="optional" error={errors.email?.message}>
              <input id="ck-email" type="email" inputMode="email" autoComplete="email" enterKeyHint="send" className={INPUT} aria-invalid={!!errors.email} {...register("email")} onFocus={markKontakt} />
            </Field>
          </div>
        )}

        {/* Honeypot gegen Bots – für Menschen unsichtbar */}
        <div aria-hidden className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
          <label htmlFor="website">Website</label>
          <input id="website" ref={honeypot} name="website" tabIndex={-1} autoComplete="off" defaultValue="" />
        </div>

        {serverError && (
          <div role="alert" className="mt-4 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden /> {serverError}
          </div>
        )}

        <button type="submit" disabled={isSubmitting}
          className="mt-4 inline-flex h-[52px] w-full items-center justify-center gap-2 rounded-full bg-navy text-[16px] font-semibold text-white transition hover:bg-navy-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sun disabled:opacity-60">
          {isSubmitting ? <><Loader2 className="h-5 w-5 animate-spin" aria-hidden /> Wird gesendet …</> : <>Jetzt Angebot berechnen <ArrowRight className="h-4 w-4" aria-hidden /></>}
        </button>
        <ul className="mt-3 flex flex-col items-center gap-1 text-[13px] text-navy min-[420px]:flex-row min-[420px]:flex-wrap min-[420px]:justify-center min-[420px]:gap-x-4">
          {["Unverbindliche Anfrage", "Kostenlose Angebotserstellung", "Persönliche Beratung durch Adrian Seitz"].map((t) => (
            <li key={t} className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5 shrink-0" strokeWidth={3} aria-hidden />{t}</li>
          ))}
        </ul>
        <p className="mt-3 text-center text-[11.5px] leading-[1.5] text-ink-muted">
          {/* Genau dieser Wortlaut wird mit der Anfrage gespeichert (CONSENT_TEXTS.contactButton). */}
          {CONSENT_TEXTS.contactButton.replace(" Es gelten die Datenschutzhinweise.", "")} Es gelten die{" "}
          <Link href="/datenschutz" target="_blank" className="underline underline-offset-2">Datenschutzhinweise</Link>.
        </p>
      </form>
      <StampOverlay show={stamped} />
    </div>
  );
}

const INPUT = "block h-11 w-full rounded-xl border border-line bg-white px-4 text-base text-ink transition placeholder:text-ink-muted focus:border-navy focus:outline-none focus:ring-4 focus:ring-sun/40 aria-[invalid=true]:border-red-400";

function Field({ id, label, hint, error, children }: { id: string; label: string; hint?: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-[12.5px] font-medium text-ink-soft">{label}{hint && <span className="font-normal text-ink-muted"> ({hint})</span>}</label>
      {children}
      {error && <p className="field-error">{error}</p>}
    </div>
  );
}

/**
 * Klingelschild neben der Zahl: pro Wohneinheit eine Klingel (bis 6 sichtbar, darüber „+n“).
 * Reine Veranschaulichung – für Screenreader ausgeblendet, die Zahl steht im Eingabefeld.
 */
function Klingelschild({ count }: { count: number }) {
  const reduce = useReducedMotion();
  const shown = Math.min(count, 6);
  const rest = count - shown;
  return (
    <div aria-hidden className="relative grid h-[60px] w-[104px] shrink-0 grid-cols-2 content-center gap-x-2 gap-y-[6px] rounded-2xl border border-navy/15 bg-gradient-to-b from-white to-[#ECEBE5] px-3 shadow-[inset_0_1px_0_#fff,0_10px_22px_-16px_rgba(11,11,10,0.7)]">
      {Array.from({ length: 6 }).map((_, i) => (
        <span key={i} className="flex items-center gap-1.5">
          <AnimatePresence initial={false}>
            {i < shown ? (
              <motion.span key="on" className="h-2.5 w-2.5 shrink-0 rounded-full bg-sun ring-[1.5px] ring-navy/70"
                initial={reduce ? false : { scale: 0.2, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.2, opacity: 0 }}
                transition={{ type: "spring", stiffness: 520, damping: 22 }} />
            ) : (
              <span className="h-2.5 w-2.5 shrink-0 rounded-full border border-dashed border-navy/20" />
            )}
          </AnimatePresence>
          <span className={`h-[6px] flex-1 rounded-[3px] transition-colors ${i < shown ? "bg-navy/25" : "bg-navy/[0.06]"}`} />
        </span>
      ))}
      {rest > 0 && <span className="absolute -right-2 -top-2 rounded-full bg-navy px-1.5 py-0.5 text-[10px] font-semibold leading-none text-sun">+{rest}</span>}
    </div>
  );
}
