"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, ArrowLeft, ArrowRight, Check, Loader2, Lock } from "lucide-react";
import { AREAS, BEGINN, BESTAND, CONTACT_METHODS, SITUATION, type Question } from "@/lib/funnel";
import { CONSENT_TEXTS, contactFieldsSchema, type ContactFields } from "@/lib/schemas";
import { getAttribution } from "@/lib/attribution";
import { currentTrackingConsent } from "@/lib/consent";
import { track } from "@/lib/tracking";
import { Icon3D } from "../ui/Icon3D";
import { StampOverlay } from "../ui/StampOverlay";
import { fireBurst } from "../ui/ClickBurst";

type Answers = { bereich?: string; situation: string[]; beginn?: string; bestand?: string };
type StepId = "bereich" | "situation" | "beginn" | "bestand" | "kontakt";
const STEPS: StepId[] = ["bereich", "situation", "beginn", "bestand", "kontakt"];

const BEREICH_Q: Question = { id: "bereich", title: "Welchen Bereich möchtest du absichern?", options: AREAS };

export function RechtsschutzCheck() {
  const params = useSearchParams();
  const router = useRouter();
  const reduce = useReducedMotion();
  // Vorauswahl aus Landingpage/Anzeige direkt beim ersten Rendern übernehmen:
  // ?bereich=arbeit&situation=angestellt  bzw.  ?bereich=mehrere&auswahl=privat,verkehr
  const [preset] = useState(() => {
    const b = params.get("bereich");
    if (!b || !AREAS.some((a) => a.value === b)) return { answers: { situation: [] } as Answers, step: 0 };
    const q = SITUATION[b];
    const s = params.get("situation");
    const validS = s && q && !q.multi && q.options.some((o) => o.value === s) ? s : null;
    const auswahl = q?.multi ? (params.get("auswahl") || "").split(",").filter((v) => q.options.some((o) => o.value === v)) : [];
    const situation = validS ? [validS] : auswahl;
    return { answers: { bereich: b, situation } as Answers, step: situation.length > 0 ? 2 : 1 };
  });
  const [answers, setAnswers] = useState<Answers>(preset.answers);
  const [step, setStep] = useState(preset.step);
  const [dir, setDir] = useState(1);
  const [stamped, setStamped] = useState(false);
  const started = useRef(false);
  const startedAt = useRef<number>(Date.now());
  const runId = useRef<string>("");
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    runId.current = Math.random().toString(36).slice(2);
    if (preset.answers.bereich) markStarted(preset.answers.bereich);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    headingRef.current?.focus({ preventScroll: true });
    window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
  }, [step, reduce]);

  const markStarted = (bereich: string) => {
    if (started.current) return;
    started.current = true;
    track("funnel_started", { bereich }, { dedupeKey: runId.current });
  };

  const stepId = STEPS[step];
  const question: Question | null = useMemo(() => {
    if (stepId === "bereich") return BEREICH_Q;
    if (stepId === "situation") return answers.bereich ? SITUATION[answers.bereich] : null;
    if (stepId === "beginn") return BEGINN;
    if (stepId === "bestand") return BESTAND;
    return null;
  }, [stepId, answers.bereich]);

  const go = useCallback((to: number) => {
    setDir(to > step ? 1 : -1);
    setStep(to);
  }, [step]);

  const completeStep = (id: StepId, bereich?: string) => {
    track("funnel_step_completed", { step_number: step + 1, step_name: id, bereich: bereich ?? answers.bereich }, { dedupeKey: `${runId.current}:${id}` });
  };

  const select = (value: string) => {
    if (!question) return;
    if (question.id === "bereich") {
      markStarted(value);
      setAnswers((a) => ({ ...a, bereich: value, situation: a.bereich === value ? a.situation : [] }));
      completeStep("bereich", value);
    } else if (question.id === "situation") {
      if (question.multi) {
        setAnswers((a) => ({ ...a, situation: a.situation.includes(value) ? a.situation.filter((v) => v !== value) : [...a.situation, value] }));
        return; // Mehrfachauswahl: Weiter-Button
      }
      setAnswers((a) => ({ ...a, situation: [value] }));
      completeStep("situation");
    } else if (question.id === "beginn") {
      setAnswers((a) => ({ ...a, beginn: value }));
      completeStep("beginn");
    } else if (question.id === "bestand") {
      setAnswers((a) => ({ ...a, bestand: value }));
      completeStep("bestand");
    }
    window.setTimeout(() => go(step + 1), reduce ? 0 : 260);
  };

  const isSelected = (value: string) => {
    if (!question) return false;
    if (question.id === "bereich") return answers.bereich === value;
    if (question.id === "situation") return answers.situation.includes(value);
    if (question.id === "beginn") return answers.beginn === value;
    if (question.id === "bestand") return answers.bestand === value;
    return false;
  };

  const progress = Math.round(((step + (stepId === "kontakt" ? 0.6 : 0)) / (STEPS.length - 0.4)) * 100);
  const variants = {
    enter: (d: number) => ({ opacity: 0, x: reduce ? 0 : d * 40 }),
    center: { opacity: 1, x: 0 },
    exit: (d: number) => ({ opacity: 0, x: reduce ? 0 : d * -40 }),
  };

  return (
    <div className="mx-auto w-full max-w-xl">
      <div className="mb-6 sm:mb-8">
        <div className="flex items-center justify-between text-sm">
          {step > 0 ? (
            <button onClick={() => go(step - 1)} className="-ml-2 inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 font-medium text-ink-soft hover:bg-white hover:text-navy">
              <ArrowLeft className="h-4 w-4" aria-hidden /> Zurück
            </button>
          ) : (
            <span className="font-medium text-ink-soft">Rechtsschutz-Check</span>
          )}
          <span className="font-medium text-ink-muted">Schritt {step + 1} von {STEPS.length}</span>
        </div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-white shadow-inner" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress} aria-label="Fortschritt">
          <motion.div className="h-full rounded-full bg-gradient-to-r from-teal-600 to-teal" animate={{ width: `${Math.max(progress, 6)}%` }} transition={{ type: "spring", stiffness: 120, damping: 20 }} />
        </div>
      </div>

      <AnimatePresence mode="wait" custom={dir} initial={false}>
        <motion.div key={stepId} custom={dir} variants={variants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}>
          {question ? (
            <fieldset>
              <legend className="w-full">
                <h1 ref={headingRef} tabIndex={-1} className="text-[2rem] font-semibold leading-[1.05] tracking-[-0.04em] outline-none sm:text-[2.75rem]">{question.title}</h1>
                {question.subtitle && <p className="mt-2 text-ink-soft">{question.subtitle}</p>}
              </legend>
              <div className={`mt-7 grid gap-3 ${question.options.length > 4 && question.id !== "bereich" ? "sm:grid-cols-2" : ""}`}>
                {question.options.map((o) => {
                  const sel = isSelected(o.value);
                  return (
                    <button
                      key={o.value}
                      type="button"
                      onClick={() => select(o.value)}
                      aria-pressed={sel}
                      className={`group relative flex min-h-[72px] w-full items-center gap-4 overflow-hidden rounded-3xl border p-3.5 pr-5 text-left transition duration-300 active:scale-[0.98] ${sel ? "border-navy bg-sun" : "border-line bg-white hover:border-navy/40 hover:shadow-lift"}`}
                    >
                      {sel && (
                        <motion.span aria-hidden className="pointer-events-none absolute right-14 top-1/2 -translate-y-1/2 rounded-md border-[2.5px] border-navy px-2 py-0.5 font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-navy mix-blend-multiply"
                          initial={{ scale: 2.6, opacity: 0, rotate: -30 }} animate={{ scale: 1, opacity: 0.85, rotate: -12 }} transition={{ type: "spring", stiffness: 600, damping: 18 }}>
                          Notiert
                        </motion.span>
                      )}
                      <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl transition duration-300 ${sel ? "bg-white" : "bg-paper group-hover:bg-sun-wash"}`}>
                        <Icon3D name={o.icon ?? "shield"} size={32} priority className={`transition duration-300 ${sel ? "scale-110 -rotate-6" : "group-hover:scale-110"}`} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-[16px] font-semibold text-navy">{o.label}</span>
                        {o.hint && <span className={`mt-0.5 block text-sm ${sel ? "text-navy/70" : "text-ink-muted"}`}>{o.hint}</span>}
                      </span>
                      <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-full border transition ${sel ? "border-navy bg-navy text-sun" : "border-line"}`}>
                        {sel && <Check className="h-3.5 w-3.5" strokeWidth={3} aria-hidden />}
                      </span>
                    </button>
                  );
                })}
              </div>
              {question.multi && (
                <button
                  type="button"
                  disabled={answers.situation.length === 0}
                  onClick={() => { completeStep("situation"); go(step + 1); }}
                  className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-navy py-4 text-base font-medium text-white transition hover:bg-navy-800 disabled:opacity-40"
                >
                  Weiter <ArrowRight className="h-4 w-4" aria-hidden />
                </button>
              )}
            </fieldset>
          ) : stepId === "kontakt" ? (
            <ContactStep
              headingRef={headingRef}
              answers={answers}
              startedAt={startedAt.current}
              onSuccess={(leadId) => {
                track("lead_submitted", { bereich: answers.bereich, beginn: answers.beginn }, { dedupeKey: leadId, eventId: leadId });
                try { sessionStorage.setItem("rs_last_submission", JSON.stringify({ type: "check", bereich: answers.bereich })); } catch {}
                setStamped(true);
                fireBurst(window.innerWidth / 2, window.innerHeight / 2, true);
                setTimeout(() => router.push("/vielen-dank?typ=check"), 1100);
              }}
            />
          ) : (
            <div className="card p-6">
              <p>Bitte wähle zuerst einen Bereich.</p>
              <button className="mt-4 font-semibold text-teal-700" onClick={() => go(0)}>Zum ersten Schritt</button>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      <StampOverlay show={stamped} />
      <p className="mt-8 flex items-center justify-center gap-2 text-center text-xs text-ink-muted">
        <Lock className="h-3.5 w-3.5" aria-hidden /> Verschlüsselte Übertragung · Kostenlos & unverbindlich
      </p>
    </div>
  );
}

function ContactStep({ answers, startedAt, onSuccess, headingRef }: {
  answers: Answers; startedAt: number; onSuccess: (leadId: string) => void; headingRef: React.RefObject<HTMLHeadingElement | null>;
}) {
  const [serverError, setServerError] = useState<string | null>(null);
  const honeypot = useRef<HTMLInputElement>(null);
  const { register, handleSubmit, watch, setValue, formState: { errors, isSubmitting } } = useForm<ContactFields>({
    resolver: zodResolver(contactFieldsSchema),
    defaultValues: { firstName: "", lastName: "", email: "", phone: "", contactMethod: "email", consentMarketing: false },
    mode: "onTouched",
  });
  const method = watch("contactMethod");

  const onSubmit = async (data: ContactFields) => {
    setServerError(null);
    const trackingConsent = currentTrackingConsent();
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          answers,
          contact: data,
          attribution: getAttribution(trackingConsent.marketing),
          trackingConsent,
          spam: { website: honeypot.current?.value ?? "", startedAt },
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.ok) {
        setServerError(json.error || "Deine Anfrage konnte leider nicht übermittelt werden. Bitte versuche es erneut.");
        return;
      }
      onSuccess(json.leadId as string);
    } catch {
      setServerError("Keine Verbindung. Bitte prüfe deine Internetverbindung und versuche es erneut.");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <h1 ref={headingRef} tabIndex={-1} className="text-[2rem] font-semibold leading-[1.05] tracking-[-0.04em] outline-none sm:text-[2.75rem]">Fast geschafft! Erhalte jetzt deine persönliche Beratung.</h1>
      <p className="mt-2 text-ink-soft">Wohin darf ich dir meine Empfehlung schicken?</p>

      <div className="card mt-7 space-y-4 p-5 sm:p-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="firstName" className="label">Vorname</label>
            <input id="firstName" autoComplete="given-name" className="input" aria-invalid={!!errors.firstName} {...register("firstName")} />
            {errors.firstName && <p className="field-error">{errors.firstName.message}</p>}
          </div>
          <div>
            <label htmlFor="lastName" className="label">Nachname</label>
            <input id="lastName" autoComplete="family-name" className="input" aria-invalid={!!errors.lastName} {...register("lastName")} />
            {errors.lastName && <p className="field-error">{errors.lastName.message}</p>}
          </div>
        </div>
        <div>
          <label htmlFor="email" className="label">E-Mail-Adresse</label>
          <input id="email" type="email" inputMode="email" autoComplete="email" className="input" aria-invalid={!!errors.email} {...register("email")} />
          {errors.email && <p className="field-error">{errors.email.message}</p>}
        </div>

        <div>
          <span className="label" id="method-label">Bevorzugter Kontaktweg</span>
          <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-labelledby="method-label">
            {CONTACT_METHODS.map((m) => (
              <button key={m.value} type="button" role="radio" aria-checked={method === m.value}
                onClick={() => setValue("contactMethod", m.value, { shouldValidate: true })}
                className={`rounded-full border py-3 text-[15px] font-medium transition ${method === m.value ? "border-navy bg-sun text-navy" : "border-line bg-white text-ink-soft hover:border-navy/40"}`}>
                {m.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label htmlFor="phone" className="label">Telefonnummer {method === "email" && <span className="font-normal text-ink-muted">(optional)</span>}</label>
          <input id="phone" type="tel" inputMode="tel" autoComplete="tel" placeholder="z. B. 0170 1234567" className="input" aria-invalid={!!errors.phone} {...register("phone")} />
          {errors.phone && <p className="field-error">{errors.phone.message}</p>}
        </div>

        {/* Honeypot gegen Bots – für Menschen unsichtbar */}
        <div aria-hidden className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
          <label htmlFor="website">Website</label>
          <input id="website" ref={honeypot} name="website" tabIndex={-1} autoComplete="off" defaultValue="" />
        </div>

        <div className="space-y-3 border-t border-line pt-4">
          <label className="flex cursor-pointer items-start gap-3 text-sm leading-6 text-ink-soft">
            <input type="checkbox" className="mt-1 h-5 w-5 shrink-0 rounded border-line accent-teal" {...register("consentContact")} />
            <span>
              {CONSENT_TEXTS.contact.replace(" Die Datenschutzhinweise habe ich zur Kenntnis genommen.", "")}{" "}
              Die <Link href="/datenschutz" target="_blank" className="font-medium text-teal-700 underline underline-offset-2">Datenschutzhinweise</Link> habe ich zur Kenntnis genommen. <span className="text-red-600">*</span>
            </span>
          </label>
          {errors.consentContact && <p className="field-error !mt-0 pl-8">{errors.consentContact.message}</p>}
          <label className="flex cursor-pointer items-start gap-3 text-sm leading-6 text-ink-soft">
            <input type="checkbox" className="mt-1 h-5 w-5 shrink-0 rounded border-line accent-teal" {...register("consentMarketing")} />
            <span>{CONSENT_TEXTS.marketing}</span>
          </label>
        </div>
      </div>

      {serverError && (
        <div role="alert" className="mt-4 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden /> {serverError}
        </div>
      )}

      <button type="submit" disabled={isSubmitting} className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-navy py-4 text-base font-medium text-white transition hover:bg-navy-800 disabled:opacity-60">
        {isSubmitting ? <><Loader2 className="h-5 w-5 animate-spin" aria-hidden /> Wird gesendet …</> : <>Kostenlose Beratung anfordern <ArrowRight className="h-4 w-4" aria-hidden /></>}
      </button>
      <p className="mt-3 text-center text-xs text-ink-muted">Unverbindlich – es entsteht kein Vertrag und keine Kosten.</p>
    </form>
  );
}
