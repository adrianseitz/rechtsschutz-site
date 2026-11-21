"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, ArrowRight, Check, Loader2, Minus, Plus } from "lucide-react";
import { EINHEITEN_MAX, VERMIETER_ANLIEGEN } from "@/lib/funnel";
import { CONSENT_TEXTS, checkContactFormSchema, splitName, type CheckContactForm } from "@/lib/schemas";
import { getAttribution } from "@/lib/attribution";
import { currentTrackingConsent } from "@/lib/consent";
import { track } from "@/lib/tracking";
import { countEvent } from "@/lib/localEvents";
import { StampOverlay } from "../ui/StampOverlay";
import { fireBurst } from "../ui/ClickBurst";

/**
 * Vermieter-Anfrage auf einem Bildschirm: Wohneinheiten, Thema (freiwillig), Name, Telefon – ohne Weiterklicken.
 * Schickt dieselbe Anfrage wie der Rechtsschutz-Check (gleiche Schnittstelle, gleiches Tracking, gleiche Danke-Seite).
 */
export function VermieterSchnellCheck({ price }: { price?: string }) {
  const router = useRouter();
  const [einheiten, setEinheiten] = useState("1");
  const [anliegen, setAnliegen] = useState<string | undefined>();
  const [serverError, setServerError] = useState<string | null>(null);
  const [stamped, setStamped] = useState(false);
  const startedAt = useRef<number>(Date.now());
  const honeypot = useRef<HTMLInputElement>(null);
  const counted = useRef(new Set<string>());
  const runId = useRef("");

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<CheckContactForm>({
    resolver: zodResolver(checkContactFormSchema),
    defaultValues: { name: "", phone: "", email: "", reachable: "", consentMarketing: false },
    mode: "onTouched",
  });

  useEffect(() => { runId.current = Math.random().toString(36).slice(2); }, []);

  // Statistik im CRM: wie beim Check zählen (gestartet → Wohneinheiten → Kontaktfelder → Anfrage)
  const once = (key: string, fn: () => void) => { if (!counted.current.has(key)) { counted.current.add(key); fn(); } };
  const markStarted = () => once("start", () => {
    track("funnel_started", { bereich: "vermieter" }, { dedupeKey: runId.current });
    countEvent("check_start");
  });
  const markEinheiten = () => { markStarted(); once("einheiten", () => countEvent("step_einheiten")); };
  const markKontakt = () => { markStarted(); once("kontakt", () => countEvent("step_kontakt")); };

  const n = Number.parseInt(einheiten, 10);
  const valid = Number.isInteger(n) && n >= 1 && n <= EINHEITEN_MAX;
  const setN = (v: number) => { markEinheiten(); setEinheiten(String(Math.min(EINHEITEN_MAX, Math.max(1, v)))); };

  const onSubmit = async (data: CheckContactForm) => {
    if (!valid) return;
    markKontakt();
    setServerError(null);
    const trackingConsent = currentTrackingConsent();
    const { firstName, lastName } = splitName(data.name);
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          answers: { bereich: "vermieter", situation: [], einheiten: n, ...(anliegen ? { anliegen } : {}) },
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
      track("lead_submitted", { bereich: "vermieter" }, { dedupeKey: leadId, eventId: leadId });
      countEvent("lead");
      try { sessionStorage.setItem("rs_last_submission", JSON.stringify({ type: "check", bereich: "vermieter" })); } catch {}
      setStamped(true);
      fireBurst(window.innerWidth / 2, window.innerHeight / 2, true);
      setTimeout(() => router.push("/vielen-dank?typ=check"), 1100);
    } catch {
      setServerError("Keine Verbindung. Bitte prüfe deine Internetverbindung und versuche es erneut.");
    }
  };

  return (
    <form id="anfrage" onSubmit={handleSubmit(onSubmit)} onFocusCapture={markStarted} noValidate
      className="hero-fade scroll-mt-24 rounded-[26px] border border-navy/15 bg-white p-4 shadow-[0_24px_60px_-34px_rgba(11,11,10,0.55)] sm:p-6"
      style={{ animationDelay: "0.15s" }} aria-labelledby="anfrage-titel">
      <div className="flex items-baseline justify-between gap-3">
        <h2 id="anfrage-titel" className="text-[1.15rem] font-semibold leading-tight tracking-[-0.03em] text-navy sm:text-[1.4rem]">Kostenlos prüfen</h2>
        {price && <p className="shrink-0 text-[13px] text-ink-soft">ab <strong className="text-navy">{price} €</strong>/Monat</p>}
      </div>

      {/* Wohneinheiten */}
      <div className="mt-3 flex items-center justify-between gap-3 rounded-2xl bg-paper px-3 py-2">
        <label htmlFor="sc-einheiten" className="text-[14px] font-medium leading-tight text-navy"><span className="sm:hidden">Vermietete Wohnungen</span><span className="max-sm:hidden">Wie viele Wohnungen vermietest du?</span></label>
        <div className="flex shrink-0 items-center gap-1.5">
          <button type="button" onClick={() => setN((valid ? n : 1) - 1)} disabled={valid && n <= 1} aria-label="Eine Wohnung weniger"
            className="grid h-10 w-10 place-items-center rounded-full border border-line bg-white text-navy transition hover:border-navy disabled:opacity-35">
            <Minus className="h-4 w-4" aria-hidden />
          </button>
          <input id="sc-einheiten" type="number" inputMode="numeric" min={1} max={EINHEITEN_MAX} value={einheiten}
            onChange={(e) => { markEinheiten(); setEinheiten(e.target.value.replace(/[^0-9]/g, "").slice(0, 3)); }}
            aria-invalid={!valid}
            className="h-10 w-12 rounded-xl border border-line bg-white text-center text-lg font-semibold tabular-nums text-navy [appearance:textfield] focus:border-navy focus:outline-none focus:ring-4 focus:ring-sun/40 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none" />
          <button type="button" onClick={() => setN((valid ? n : 0) + 1)} disabled={valid && n >= EINHEITEN_MAX} aria-label="Eine Wohnung mehr"
            className="grid h-10 w-10 place-items-center rounded-full border border-line bg-white text-navy transition hover:border-navy disabled:opacity-35">
            <Plus className="h-4 w-4" aria-hidden />
          </button>
        </div>
      </div>
      {!valid && <p className="field-error">Bitte gib eine Zahl zwischen 1 und {EINHEITEN_MAX} ein.</p>}

      {/* Thema (freiwillig) */}
      <fieldset className="mt-3">
        <legend className="text-[13px] font-medium text-ink-soft">Worum geht es dir? <span className="font-normal text-ink-muted">(freiwillig)</span></legend>
        <div className="mt-2 grid grid-cols-2 gap-2">
          {VERMIETER_ANLIEGEN.map((o) => {
            const sel = anliegen === o.value;
            return (
              <button key={o.value} type="button" aria-pressed={sel}
                onClick={() => { markStarted(); setAnliegen(sel ? undefined : o.value); }}
                className={`flex min-h-[44px] items-center gap-2 rounded-xl border px-3 py-2 text-left text-[13.5px] font-medium leading-tight transition ${sel ? "border-navy bg-sun text-navy" : "border-line bg-white text-ink-soft hover:border-navy/40"}`}>
                <span className={`grid h-4 w-4 shrink-0 place-items-center rounded-full border ${sel ? "border-navy bg-navy text-sun" : "border-line"}`}>
                  {sel && <Check className="h-2.5 w-2.5" strokeWidth={3.5} aria-hidden />}
                </span>
                {o.label}
              </button>
            );
          })}
        </div>
      </fieldset>

      {/* Kontakt */}
      <div className="mt-3 grid grid-cols-2 gap-2">
        <div>
          <label htmlFor="sc-name" className="sr-only">Dein Name</label>
          <input id="sc-name" autoComplete="name" autoCapitalize="words" enterKeyHint="next" placeholder="Dein Name" className="input !py-3"
            aria-invalid={!!errors.name} {...register("name")} onFocus={markKontakt} />
          {errors.name && <p className="field-error">{errors.name.message}</p>}
        </div>
        <div>
          <label htmlFor="sc-phone" className="sr-only">Telefonnummer</label>
          <input id="sc-phone" type="tel" inputMode="tel" autoComplete="tel" enterKeyHint="send" placeholder="Telefonnummer" className="input !py-3"
            aria-invalid={!!errors.phone} {...register("phone")} onFocus={markKontakt} />
          {errors.phone && <p className="field-error">{errors.phone.message}</p>}
        </div>
      </div>

      {/* Honeypot gegen Bots – für Menschen unsichtbar */}
      <div aria-hidden className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label htmlFor="sc-website">Website</label>
        <input id="sc-website" ref={honeypot} name="website" tabIndex={-1} autoComplete="off" defaultValue="" />
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

      <button type="submit" disabled={isSubmitting || !valid}
        className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-full bg-navy py-3.5 text-[16px] font-semibold text-white transition hover:bg-navy-800 disabled:opacity-60">
        {isSubmitting ? <><Loader2 className="h-5 w-5 animate-spin" aria-hidden /> Wird gesendet …</> : <>Kostenlosen Rückruf anfordern <ArrowRight className="h-4 w-4" aria-hidden /></>}
      </button>
      <p className="mt-2 text-center text-[12px] text-ink-muted">Unverbindlich · keine Kosten · Adrian Seitz ruft dich persönlich an</p>
      <label className="mt-3 flex cursor-pointer items-start gap-2.5 border-t border-line pt-3 text-[11.5px] leading-[1.4] text-ink-muted">
        <input type="checkbox" className="mt-0.5 h-4 w-4 shrink-0 rounded border-line accent-teal" {...register("consentMarketing")} />
        <span>{CONSENT_TEXTS.marketing}</span>
      </label>
      <StampOverlay show={stamped} />
    </form>
  );
}
