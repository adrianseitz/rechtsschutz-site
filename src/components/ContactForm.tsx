"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, ArrowRight, Loader2 } from "lucide-react";
import { contactFormSchema, REQUEST_TYPES, type ContactFormInput } from "@/lib/schemas";
import { getAttribution } from "@/lib/attribution";
import { currentTrackingConsent } from "@/lib/consent";
import { track } from "@/lib/tracking";
import { StampOverlay } from "./ui/StampOverlay";
import { fireBurst } from "./ui/ClickBurst";

const TOPICS = [
  { value: "allgemein", label: "Noch unsicher / allgemein" },
  { value: "privat", label: "Privatrechtsschutz" },
  { value: "arbeit", label: "Arbeitsrechtsschutz" },
  { value: "vermieter", label: "Vermieterrechtsschutz" },
  { value: "firma", label: "Firmenrechtsschutz" },
] as const;

export function ContactForm() {
  const params = useSearchParams();
  const router = useRouter();
  const startedAt = useRef(Date.now());
  const honeypot = useRef<HTMLInputElement>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const [stamped, setStamped] = useState(false);

  const initialType = (REQUEST_TYPES.find((r) => r.value === params.get("anliegen"))?.value ?? "termin") as ContactFormInput["requestType"];
  const initialTopic = (TOPICS.find((t) => t.value === params.get("thema"))?.value ?? "allgemein") as ContactFormInput["topic"];

  const { register, handleSubmit, watch, setValue, formState: { errors, isSubmitting } } = useForm<ContactFormInput>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: { requestType: initialType, topic: initialTopic, name: "", email: "", phone: "", preferredTime: "", message: "" },
    mode: "onTouched",
  });
  const type = watch("requestType");

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
        setServerError(json.error || "Deine Nachricht konnte nicht gesendet werden. Bitte versuche es erneut.");
        return;
      }
      const event = form.requestType === "termin" ? "appointment_requested" : "contact_form_submitted";
      track(event, { topic: form.topic, request_type: form.requestType }, { dedupeKey: json.leadId, eventId: json.leadId });
      try { sessionStorage.setItem("rs_last_submission", JSON.stringify({ type: form.requestType })); } catch {}
      setStamped(true);
      fireBurst(window.innerWidth / 2, window.innerHeight / 2, true);
      setTimeout(() => router.push(`/vielen-dank?typ=${form.requestType}`), 1100);
    } catch {
      setServerError("Keine Verbindung. Bitte prüfe deine Internetverbindung.");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="card space-y-5 p-5 sm:p-8">
      <StampOverlay show={stamped} text={"Notiert"} sub="Ich melde mich bei dir" />
      <div>
        <span className="label" id="type-label">Worum geht es?</span>
        <div className="grid gap-2 sm:grid-cols-3" role="radiogroup" aria-labelledby="type-label">
          {REQUEST_TYPES.map((r) => (
            <button key={r.value} type="button" role="radio" aria-checked={type === r.value} onClick={() => setValue("requestType", r.value, { shouldValidate: false })}
              className={`rounded-full border px-3 py-3 text-sm font-medium transition ${type === r.value ? "border-navy bg-sun text-navy" : "border-line bg-white text-ink-soft hover:border-navy/40"}`}>
              {r.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label htmlFor="topic" className="label">Thema</label>
        <select id="topic" className="input appearance-none" {...register("topic")}>
          {TOPICS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="name" className="label">Name</label>
          <input id="name" autoComplete="name" className="input" aria-invalid={!!errors.name} {...register("name")} />
          {errors.name && <p className="field-error">{errors.name.message}</p>}
        </div>
        <div>
          <label htmlFor="c-email" className="label">E-Mail-Adresse</label>
          <input id="c-email" type="email" inputMode="email" autoComplete="email" className="input" aria-invalid={!!errors.email} {...register("email")} />
          {errors.email && <p className="field-error">{errors.email.message}</p>}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="c-phone" className="label">Telefon {type !== "rueckruf" && <span className="font-normal text-ink-muted">(optional)</span>}</label>
          <input id="c-phone" type="tel" inputMode="tel" autoComplete="tel" className="input" aria-invalid={!!errors.phone} {...register("phone")} />
          {errors.phone && <p className="field-error">{errors.phone.message}</p>}
        </div>
        {type !== "frage" && (
          <div>
            <label htmlFor="time" className="label">Wunschzeitraum <span className="font-normal text-ink-muted">(optional)</span></label>
            <input id="time" placeholder="z. B. werktags ab 17 Uhr" className="input" {...register("preferredTime")} />
          </div>
        )}
      </div>

      <div>
        <label htmlFor="message" className="label">Nachricht {type !== "frage" && <span className="font-normal text-ink-muted">(optional)</span>}</label>
        <textarea id="message" rows={4} className="input resize-y" aria-invalid={!!errors.message} {...register("message")} />
        {errors.message && <p className="field-error">{errors.message.message}</p>}
        <p className="mt-1.5 text-xs text-ink-muted">Bitte keine sensiblen Details zu laufenden Rechtsstreitigkeiten oder Gesundheitsdaten.</p>
      </div>

      <div aria-hidden className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label htmlFor="c-website">Website</label>
        <input id="c-website" ref={honeypot} tabIndex={-1} autoComplete="off" defaultValue="" />
      </div>

      <label className="flex cursor-pointer items-start gap-3 border-t border-line pt-5 text-sm leading-6 text-ink-soft">
        <input type="checkbox" className="mt-1 h-5 w-5 shrink-0 accent-teal" {...register("consentContact")} />
        <span>Ich bin damit einverstanden, dass Adrian Seitz mich zur Bearbeitung meiner Anfrage kontaktiert. Die <Link href="/datenschutz" target="_blank" className="font-medium text-teal-700 underline underline-offset-2">Datenschutzhinweise</Link> habe ich zur Kenntnis genommen. <span className="text-red-600">*</span></span>
      </label>
      {errors.consentContact && <p className="field-error !mt-1 pl-8">{errors.consentContact.message}</p>}

      {serverError && (
        <div role="alert" className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden /> {serverError}
        </div>
      )}

      <button type="submit" disabled={isSubmitting} className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-navy py-4 text-base font-medium text-white transition hover:bg-navy-800 disabled:opacity-60">
        {isSubmitting ? <><Loader2 className="h-5 w-5 animate-spin" aria-hidden /> Wird gesendet …</> : <>Anfrage senden <ArrowRight className="h-4 w-4" aria-hidden /></>}
      </button>
    </form>
  );
}
