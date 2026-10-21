import fs from "node:fs";
import path from "node:path";
import Image from "next/image";
import { ButtonLink } from "../ui/Button";
import { RotatingBadge } from "../ui/RotatingBadge";
import { StickyNote } from "../ui/StickyNote";
import { Reveal } from "../ui/Reveal";
import { site } from "@/lib/site";

/** Lege ein Porträt unter public/images/adrian.jpg ab – es wird automatisch verwendet. */
const PORTRAIT = "/images/adrian.jpg";
const hasPortrait = fs.existsSync(path.join(process.cwd(), "public", PORTRAIT));

const values = [
  { icon: "chat", title: "Verständlich", text: "Bedingungen, Wartezeiten und Grenzen in klaren Worten." },
  { icon: "scale", title: "Ehrlich", text: "Wenn ein Baustein für dich keinen Sinn ergibt, sage ich es." },
  { icon: "phone", title: "Erreichbar", text: "Ein fester Ansprechpartner – vor und nach dem Abschluss." },
];

export function AboutAdvisor() {
  return (
    <section className="relative overflow-hidden bg-sun py-24 sm:py-32">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-navy/15" aria-hidden />
      <div className="container relative grid items-center gap-14 lg:grid-cols-[1.1fr_0.9fr]">
        <div>
          <span className="eyebrow !text-navy/60 before:!bg-navy before:!shadow-none">Dein Ansprechpartner</span>
          <p className="mt-6 text-[2.4rem] font-semibold leading-[1.02] tracking-[-0.045em] text-navy sm:text-6xl">
            Kein Callcenter. Kein Vergleichsportal. <span className="font-serif font-normal italic">Ein Mensch,</span> der deine Situation versteht.
          </p>
          <p className="mt-8 max-w-xl text-lg leading-8 text-navy/75">
            Ich bin Adrian Seitz, selbstständiger Vertriebspartner der ARAG. Ich berate dich persönlich zu Rechtsschutz – vom ersten Check bis zur fertigen Absicherung.
          </p>
          <div className="mt-10 flex flex-col gap-3 sm:flex-row">
            <ButtonLink href={site.bookingUrl || "/kontakt?anliegen=termin"} arrow>Beratungstermin anfragen</ButtonLink>
            <ButtonLink href="/kontakt?anliegen=rueckruf" variant="secondary" className="!border-navy/20 !bg-transparent hover:!bg-white/40">Rückruf anfordern</ButtonLink>
          </div>
        </div>

        <Reveal>
          <div className="relative mx-auto max-w-md">
            {hasPortrait ? (
              <div className="relative aspect-[4/5] overflow-hidden rounded-[32px] border-[6px] border-navy">
                <Image src={PORTRAIT} alt="Adrian Seitz, Versicherungsvermittler" fill sizes="(min-width: 1024px) 28rem, 90vw" className="object-cover" />
              </div>
            ) : (
              <div className="relative rounded-[32px] bg-navy p-8 text-white">
                <div className="flex items-center gap-4">
                  <span className="grid h-16 w-16 place-items-center rounded-2xl bg-sun font-serif text-3xl italic text-navy">AS</span>
                  <div>
                    <p className="text-xl font-semibold tracking-tight">Adrian Seitz</p>
                    <p className="text-sm text-white/60">Vertriebspartner der ARAG</p>
                  </div>
                </div>
                <div className="mt-8 space-y-3">
                  {values.map((v) => (
                    <div key={v.title} className="flex items-center gap-4 rounded-2xl bg-white/[0.06] p-4">
                      <span className="w-8 shrink-0 font-serif text-3xl italic leading-none text-sun">{values.indexOf(v) + 1}</span>
                      <div>
                        <p className="font-semibold">{v.title}</p>
                        <p className="text-sm text-white/60">{v.text}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-6 flex flex-wrap gap-2 font-mono text-[11px] uppercase tracking-[0.12em] text-white/50">
                  <span className="rounded-full border border-white/15 px-3 py-1">Telefon</span>
                  <span className="rounded-full border border-white/15 px-3 py-1">Video-Call</span>
                  <span className="rounded-full border border-white/15 px-3 py-1">E-Mail</span>
                </div>
              </div>
            )}
            <div className="absolute -right-4 -top-12 sm:-right-12"><RotatingBadge dark size={120} text="Ein Ansprechpartner · Kein Callcenter · " /></div>
            <StickyNote className="absolute -bottom-16 -left-6 hidden sm:block" rotate={-6} sign="Adrian" delay={0.4}>Ich melde mich persönlich bei dir – nicht irgendein Callcenter.</StickyNote>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
