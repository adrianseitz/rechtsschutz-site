import type { Metadata } from "next";
import { Suspense } from "react";
import { CalendarCheck, Mail, Phone } from "lucide-react";
import { ContactForm } from "@/components/ContactForm";
import { ButtonLink } from "@/components/ui/Button";
import { site, isPlaceholder } from "@/lib/site";

export const metadata: Metadata = {
  title: "Kontakt & Beratungstermin",
  description: "Beratungstermin vereinbaren, Rückruf anfordern oder eine Frage stellen – persönlich und unverbindlich.",
  alternates: { canonical: "/kontakt" },
};

export default function KontaktPage() {
  return (
    <section className="py-12 sm:py-20">
      <div className="container grid gap-10 lg:grid-cols-[0.85fr_1.15fr]">
        <div>
          <span className="eyebrow">Kontakt</span>
          <h1 className="mt-4 text-4xl font-extrabold leading-tight tracking-tightest sm:text-5xl">Lass uns sprechen.</h1>
          <p className="mt-4 text-lg leading-8 text-ink-soft">Vereinbare einen kostenlosen Beratungstermin, fordere einen Rückruf an oder stell mir deine Frage. Ich melde mich persönlich bei dir.</p>
          <div className="mt-8 space-y-3">
            {site.bookingUrl && (
              <div className="card flex items-center gap-4 p-5">
                <CalendarCheck className="h-6 w-6 text-teal-700" aria-hidden />
                <div className="flex-1"><p className="font-semibold text-navy">Direkt online buchen</p><p className="text-sm text-ink-muted">Freien Termin im Kalender wählen</p></div>
                <ButtonLink href={site.bookingUrl} variant="secondary" className="!py-2.5 !text-sm">Termin buchen</ButtonLink>
              </div>
            )}
            {!isPlaceholder(site.email) && (
              <a href={`mailto:${site.email}`} className="card flex items-center gap-4 p-5 hover:shadow-lift"><Mail className="h-6 w-6 text-teal-700" aria-hidden /><span><span className="block font-semibold text-navy">E-Mail</span><span className="text-sm text-ink-muted">{site.email}</span></span></a>
            )}
            {!isPlaceholder(site.phone) && (
              <a href={`tel:${site.phone.replace(/[^+0-9]/g, "")}`} className="card flex items-center gap-4 p-5 hover:shadow-lift"><Phone className="h-6 w-6 text-teal-700" aria-hidden /><span><span className="block font-semibold text-navy">Telefon</span><span className="text-sm text-ink-muted">{site.phone}</span></span></a>
            )}
          </div>
          <p className="mt-8 text-sm leading-6 text-ink-muted">{site.owner} · {site.role}</p>
        </div>
        <Suspense fallback={<div className="card h-[600px] animate-pulse" />}>
          <ContactForm />
        </Suspense>
      </div>
    </section>
  );
}
