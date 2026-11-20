"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, ArrowRight, Loader2 } from "lucide-react";
import { contactFormSchema, type ContactFormInput } from "@/lib/schemas";
import { REACHABLE } from "@/lib/funnel";
import { getAttribution } from "@/lib/attribution";
import { currentTrackingConsent } from "@/lib/consent";
import { track } from "@/lib/tracking";
import { ButtonLink } from "../ui/Button";
import { StampOverlay } from "../ui/StampOverlay";
import { fireBurst } from "../ui/ClickBurst";
import { AdvisorAvatar } from "../ui/AdvisorAvatar";

type Topic = ContactFormInput["topic"];

/**
 * Zwei Wege nach dem Lesen: der Check (2–3 kurze Fragen) oder ein Rückruf mit nur Name und Telefonnummer.
 * Für Besucher aus Anzeigen ist der Rückruf oft die kleinere Hürde.
 */
export function QuickCallback({ topic, checkHref, checkLabel, text }: { topic: Topic; checkHref: string; checkLabel: string; text: string }) {
  const router = useRouter();
  const startedAt = useRef(Date.now());
  const honeypot = useRef<HTMLInputElement>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const [stamped, setStamped] = useState(false);

  const { register, handleSubmit, watch, setValue, formState: { errors, isSubmitting } } = useForm<ContactFormInput>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: { requestType: "rueckruf", topic, name: "", email: "", phone: "", preferredTime: "", message: "" },
    mode: "onTouched",
  });
  const time = watch("preferredTime");

  const onSubmit = async (form: ContactFormInput) => {
    setServerError(null);
    const trackingConsent = currentTrackingConsent();
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ form, attribution: getAttribution(trackingConsent.marketing), trackingConsent, spam: { website: honeypot.current?.value ?? "", startedAt: startedAt.current } }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.ok) {
        setServerError(json.error || "Deine Anfrage konnte nicht gesendet werden. Bitte versuche es erneut.");
        return;
      }
      track("contact_form_submitted", { topic: form.topic, request_type: "rueckruf" }, { dedupeKey: json.leadId, eventId: json.leadId });
      try { sessionStorage.setItem("rs_last_submission", JSON.stringify({ type: "rueckruf" })); } catch {}
      setStamped(true);
      fireBurst(window.innerWidth / 2, window.innerHeight / 2, true);
      setTimeout(() => router.push("/vielen-dank?typ=rueckruf"), 1100);
    } catch {
      setServerError("Keine Verbindung. Bitte prüfe deine Internetverbindung.");
    }
  };

  return (
    <section id="rueckruf" className="scroll-mt-24 pb-6">
      <div className="container">
        <div className="relative grid gap-8 overflow-hidden rounded-[28px] border border-navy bg-sun px-6 py-7 sm:px-9 sm:py-9 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-12">
          <StampOverlay show={stamped} text="Notiert" sub="Ich rufe dich zurück" />
          <div className="flex flex-col justify-between gap-6">
            <div>
              <p className="text-[1.45rem] font-semibold leading-tight tracking-[-0.03em] text-navy sm:text-[1.9rem]">{text}</p>
              <p className="mt-2 max-w-md text-[15px] leading-6 text-navy/75">
                Mach den kurzen Check – oder lass dich einfach zurückrufen. Ich erkläre dir am Telefon, was in deiner Situation abgesichert werden kann.
              </p>
            </div>
            <div>
              <ButtonLink href={checkHref} arrow>{checkLabel}</ButtonLink>
              <p className="mt-2 text-[13px] text-navy/60">Ein paar kurze Fragen · kostenlos &amp; unverbindlich</p>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} noValidate className="rounded-[22px] bg-white p-5 shadow-[0_18px_40px_-24px_rgba(11,11,10,0.5)] sm:p-6">
            <p className="flex items-center gap-2 text-[17px] font-semibold tracking-[-0.02em] text-navy">
              <a href="#ansprechpartner" aria-label="Mehr über Adrian Seitz" className="shrink-0"><AdvisorAvatar size={40} /></a>
              Lieber kurz sprechen? Ich rufe dich an.
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div>
                <label htmlFor="qc-name" className="label">Name</label>
                <input id="qc-name" autoComplete="name" className="input" aria-invalid={!!errors.name} {...register("name")} />
                {errors.name && <p className="field-error">{errors.name.message}</p>}
              </div>
              <div>
                <label htmlFor="qc-phone" className="label">Telefonnummer</label>
                <input id="qc-phone" type="tel" inputMode="tel" autoComplete="tel" placeholder="z. B. 0170 1234567" className="input" aria-invalid={!!errors.phone} {...register("phone")} />
                {errors.phone && <p className="field-error">{errors.phone.message}</p>}
              </div>
            </div>

            <div className="mt-3">
              <span className="label" id="qc-time">Wann passt es dir? <span className="font-normal text-ink-muted">(optional)</span></span>
              <div className="flex flex-wrap gap-2" role="radiogroup" aria-labelledby="qc-time">
                {REACHABLE.map((r) => (
                  <button key={r.value} type="button" role="radio" aria-checked={time === r.label}
                    onClick={() => setValue("preferredTime", time === r.label ? "" : r.label)}
                    className={`rounded-full border px-3.5 py-2 text-sm font-medium transition ${time === r.label ? "border-navy bg-sun text-navy" : "border-line bg-white text-ink-soft hover:border-navy/40"}`}>
                    {r.label}
                  </button>
                ))}
              </div>
            </div>

            <div aria-hidden className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
              <label htmlFor="qc-website">Website</label>
              <input id="qc-website" ref={honeypot} tabIndex={-1} autoComplete="off" defaultValue="" />
            </div>

            <label className="mt-4 flex cursor-pointer items-start gap-3 text-[13px] leading-5 text-ink-soft">
              <input type="checkbox" className="mt-0.5 h-5 w-5 shrink-0 accent-teal" {...register("consentContact")} />
              <span>Adrian Seitz darf mich zu meiner Anfrage kontaktieren. Die <Link href="/datenschutz" target="_blank" className="font-medium text-teal-700 underline underline-offset-2">Datenschutzhinweise</Link> habe ich gelesen. <span className="text-red-600">*</span></span>
            </label>
            {errors.consentContact && <p className="field-error pl-8">{errors.consentContact.message}</p>}

            {serverError && (
              <div role="alert" className="mt-3 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden /> {serverError}
              </div>
            )}

            <button type="submit" disabled={isSubmitting} className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full bg-navy py-3.5 text-[15px] font-semibold text-white transition hover:bg-navy-800 disabled:opacity-60">
              {isSubmitting ? <><Loader2 className="h-5 w-5 animate-spin" aria-hidden /> Wird gesendet …</> : <>Rückruf anfordern <ArrowRight className="h-4 w-4" aria-hidden /></>}
            </button>
            <p className="mt-2 text-center text-xs text-ink-muted">Keine E-Mail nötig · kein Callcenter</p>
          </form>
        </div>
      </div>
    </section>
  );
}
