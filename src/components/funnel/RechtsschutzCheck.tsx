"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AlertCircle, ArrowRight, Loader2, Lock } from "lucide-react";
import { AREAS, EINHEITEN_MAX, SITUATION, VERMIETER_ANLIEGEN } from "@/lib/funnel";
import { CONSENT_TEXTS, phoneRegex, splitName } from "@/lib/schemas";
import { products, type ProductKey } from "@/lib/products";
import { getAttribution } from "@/lib/attribution";
import { currentTrackingConsent } from "@/lib/consent";
import { track } from "@/lib/tracking";
import { countEvent } from "@/lib/localEvents";
import { Icon3D } from "../ui/Icon3D";
import { StampOverlay } from "../ui/StampOverlay";
import { fireBurst } from "../ui/ClickBurst";

/**
 * Rechtsschutz-Check als EIN kurzes Formular – kein Weiterklicken.
 * Vermieter: Wohneinheiten (Zahl), Mietausfallschutz gewünscht (Ja/Nein), Name, E-Mail, Telefonnummer.
 * Andere Bereiche: die eine passende Frage, Name, Telefonnummer.
 *
 * Vorauswahl aus Landingpage/Anzeige: ?bereich=arbeit&situation=angestellt · ?bereich=mehrere&auswahl=privat,verkehr
 * · ?bereich=vermieter&anliegen=mietausfall (Thema wird still mitgeschickt) · &einheiten=2 bzw. &ab=4
 */
type Preset = { bereich?: string; situation: string[]; einheiten?: number; anliegen?: string; answered: boolean };

const fieldsSchema = z.object({
  name: z.string().trim().max(120),
  email: z.string().trim().max(160),
  phone: z.string().trim().max(30)
    .min(1, "Bitte gib deine Telefonnummer an, damit ich dich zurückrufen kann.")
    .regex(phoneRegex, "Bitte gib eine gültige Telefonnummer an."),
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
  const title = bereich && bereich in products ? `${products[bereich as ProductKey].name} prüfen` : "Rechtsschutz-Check";
  const units = Number.parseInt(einheiten, 10);
  const unitsValid = Number.isInteger(units) && units >= 1 && units <= EINHEITEN_MAX;

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

  /** Name immer Pflicht, E-Mail zusätzlich beim Vermieter-Formular. */
  const checkContact = (data: Fields) => {
    let ok = true;
    if (vermieter && !emailOk(data.email.trim())) { setError("email", { message: data.email.trim() ? "Bitte gib eine gültige E-Mail-Adresse an." : "Bitte gib deine E-Mail-Adresse an." }); ok = false; }
    if (data.name.trim().length < 2) { setError("name", { message: "Bitte gib deinen Namen an." }); ok = false; }
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

  const choice = (sel: boolean) =>
    `rounded-xl border text-[15px] font-semibold transition ${sel ? "border-navy bg-sun text-navy" : "border-line bg-white text-navy hover:border-navy/40"}`;

  return (
    <div className="mx-auto w-full max-w-md" ref={topRef}>
      <h1 className="scroll-mt-24 text-[1.65rem] font-semibold leading-[1.1] tracking-[-0.04em] text-navy sm:text-[2.2rem]">{title}</h1>
      <p className="mt-1 text-[15px] text-ink-soft">Kostenlos &amp; unverbindlich.</p>

      <form onSubmit={submit} noValidate className="card mt-4 space-y-4 p-4 sm:p-6">
        {!preset.bereich && (
          <fieldset>
            <legend className="label">Was möchtest du absichern?</legend>
            <div className="grid grid-cols-2 gap-2">
              {AREAS.map((o, i) => (
                <button key={o.value} type="button" aria-pressed={bereich === o.value} onClick={() => chooseArea(o.value)}
                  className={`flex min-h-[48px] items-center gap-2 px-2.5 py-2 text-left !text-[13.5px] leading-tight ${choice(bereich === o.value)} ${i === AREAS.length - 1 ? "col-span-2" : ""}`}>
                  <Icon3D name={o.icon ?? "shield"} size={22} priority />{o.label}
                </button>
              ))}
            </div>
            {answerErrors.bereich && <p role="alert" className="field-error">{answerErrors.bereich}</p>}
          </fieldset>
        )}

        {vermieter && (
          <>
            <div>
              <label htmlFor="ck-einheiten" className="label">Wie viele Wohneinheiten vermietest du?</label>
              <input id="ck-einheiten" type="text" inputMode="numeric" pattern="[0-9]*" autoComplete="off" placeholder="z. B. 2" value={einheiten}
                onChange={(e) => { markAnswered(); setAnswerErrors((x) => ({ ...x, einheiten: undefined })); setEinheiten(e.target.value.replace(/[^0-9]/g, "").slice(0, 3)); }}
                aria-invalid={!!answerErrors.einheiten} className="input !py-3" />
              {answerErrors.einheiten && <p role="alert" className="field-error">{answerErrors.einheiten}</p>}
            </div>
            <fieldset>
              <legend className="label">Mietausfallschutz gewünscht?</legend>
              <div className="grid grid-cols-2 gap-2">
                {(["ja", "nein"] as const).map((v) => (
                  <button key={v} type="button" aria-pressed={mietausfall === v}
                    onClick={() => { markStarted(); setAnswerErrors((x) => ({ ...x, mietausfall: undefined })); setMietausfall(v); }}
                    className={`h-12 ${choice(mietausfall === v)}`}>{v === "ja" ? "Ja" : "Nein"}</button>
                ))}
              </div>
              {answerErrors.mietausfall && <p role="alert" className="field-error">{answerErrors.mietausfall}</p>}
            </fieldset>
            <div>
              <label htmlFor="ck-name" className="label">Name</label>
              <input id="ck-name" autoComplete="name" autoCapitalize="words" enterKeyHint="next" className="input !py-3" aria-invalid={!!errors.name} {...register("name")} onFocus={markKontakt} />
              {errors.name && <p className="field-error">{errors.name.message}</p>}
            </div>
            <div>
              <label htmlFor="ck-email" className="label">E-Mail</label>
              <input id="ck-email" type="email" inputMode="email" autoComplete="email" enterKeyHint="next" className="input !py-3" aria-invalid={!!errors.email} {...register("email")} onFocus={markKontakt} />
              {errors.email && <p className="field-error">{errors.email.message}</p>}
            </div>
          </>
        )}

        {question && (
          <>
            <fieldset>
              <legend className="label">{question.title}</legend>
              <div className="grid grid-cols-2 gap-2">
                {question.options.map((o) => (
                  <button key={o.value} type="button" aria-pressed={situation.includes(o.value)} onClick={() => chooseSituation(o.value)}
                    className={`min-h-[48px] px-3 py-2 text-left !text-[14px] leading-tight ${choice(situation.includes(o.value))}`}>{o.label}</button>
                ))}
              </div>
              {answerErrors.situation && <p role="alert" className="field-error">{answerErrors.situation}</p>}
            </fieldset>
            <div>
              <label htmlFor="ck-name" className="label">Name</label>
              <input id="ck-name" autoComplete="name" autoCapitalize="words" enterKeyHint="next" className="input !py-3" aria-invalid={!!errors.name} {...register("name")} onFocus={markKontakt} />
              {errors.name && <p className="field-error">{errors.name.message}</p>}
            </div>
          </>
        )}

        {bereich && (
          <div>
            <label htmlFor="ck-phone" className="label">Telefonnummer</label>
            <input id="ck-phone" type="tel" inputMode="tel" autoComplete="tel" enterKeyHint="send" className="input !py-3" aria-invalid={!!errors.phone} {...register("phone")} onFocus={markKontakt} />
            {errors.phone && <p className="field-error">{errors.phone.message}</p>}
          </div>
        )}

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
