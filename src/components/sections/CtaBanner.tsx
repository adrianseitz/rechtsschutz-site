import { ButtonLink } from "../ui/Button";
import { RotatingBadge } from "../ui/RotatingBadge";
import { Scribble } from "../ui/Scribble";
import { Magnetic } from "../ui/Magnetic";
import { Emph } from "../ui/SectionHeading";
import { site } from "@/lib/site";

export function CtaBanner({ title = "Finde heraus, welcher Rechtsschutz zu dir passt.", emphasis = "passt.", text = "Kostenlos, unverbindlich und in rund 60 Sekunden erledigt.", href = "/rechtsschutz-check", label = "Jetzt Rechtsschutz-Check starten" }: { title?: string; emphasis?: string; text?: string; href?: string; label?: string }) {
  const secondary = site.bookingUrl || "/kontakt?anliegen=termin";
  return (
    <section className="px-3 pb-3">
      <div className="noise relative mx-auto max-w-[1400px] overflow-hidden rounded-[36px] bg-navy px-6 py-20 sm:px-12 sm:py-28">
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1.5 bg-sun" aria-hidden />
        <div className="pointer-events-none absolute left-[6%] top-12 hidden md:block"><RotatingBadge size={128} /></div>
        <p className="pointer-events-none absolute bottom-16 right-[8%] hidden rotate-[-6deg] font-hand text-[26px] leading-tight text-sun lg:block">dauert nur ca.<br />60 Sekunden!</p>
        <Scribble kind="arrowLeft" className="pointer-events-none absolute bottom-24 right-[19%] hidden h-20 w-28 lg:block" color="#FFD60A" width={2.5} delay={0.6} />
        <div className="relative mx-auto max-w-4xl text-center">
          <h2 className="relative z-0 text-[2.6rem] font-semibold leading-[1] tracking-[-0.05em] text-white sm:text-7xl [&_.bg-sun]:hidden [&_.font-serif]:text-sun">
            <Emph text={title} word={emphasis} />
          </h2>
          <p className="mx-auto mt-6 max-w-xl text-lg text-white/65">{text}</p>
          <div className="mt-10 flex flex-col justify-center gap-3 sm:flex-row">
            <Magnetic><ButtonLink href={href} variant="sun" arrow>{label}</ButtonLink></Magnetic>
            <ButtonLink href={secondary} variant="light">Beratungstermin anfragen</ButtonLink>
          </div>
        </div>
      </div>
    </section>
  );
}
