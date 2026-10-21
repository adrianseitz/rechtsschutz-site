"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform, type MotionValue } from "motion/react";
import { Scribble } from "../ui/Scribble";
import { ButtonLink } from "../ui/Button";
import { Polaroid } from "../art/Polaroid";
import { SectionHeading } from "../ui/SectionHeading";

const steps = [
  { icon: "check", title: "Bedarf auswählen", text: "Wähle aus, welchen Bereich deines Lebens du absichern möchtest – Beruf, Privatleben, Vermietung oder Unternehmen.", tone: "bg-white" },
  { icon: "memo", title: "Kurzen Check durchführen", text: "Ein paar Fragen zu deiner Situation, eine Frage pro Bildschirm. In rund 60 Sekunden erledigt.", tone: "bg-paper" },
  { icon: "handshake", title: "Persönliches Angebot erhalten", text: "Ich melde mich auf deinem Wunschweg mit einer passenden, unverbindlichen Empfehlung.", tone: "bg-sun" },
];

function StepCard({ s, i, progress }: { s: (typeof steps)[number]; i: number; progress: MotionValue<number> }) {
  const scale = useTransform(progress, [i / steps.length, 1], [1, 1 - (steps.length - 1 - i) * 0.04]);
  return (
    <div className="sticky" style={{ top: `calc(7rem + ${i * 28}px)` }}>
      <motion.div style={{ scale }} className={`origin-top rounded-[28px] border border-line p-7 shadow-[0_-12px_40px_-24px_rgba(11,11,10,0.25)] sm:p-10 ${s.tone}`}>
        <div className="flex items-start justify-between gap-6">
          <div>
            <span className="font-mono text-xs uppercase tracking-[0.14em] text-navy/50">Schritt 0{i + 1}</span>
            <h3 className="mt-4 text-3xl font-semibold tracking-[-0.04em] text-navy sm:text-4xl">{s.title}</h3>
            <p className="mt-4 max-w-md text-[17px] leading-7 text-ink-soft">{s.text}</p>
          </div>
          <span className="relative shrink-0 font-serif text-[5.5rem] italic leading-[0.8] text-navy/90 sm:text-[7rem]">
            {i + 1}
            {i === steps.length - 1 && <Scribble kind="circle" className="absolute -inset-4 h-[calc(100%+32px)] w-[calc(100%+32px)]" width={2.5} delay={0.3} />}
          </span>
        </div>
      </motion.div>
    </div>
  );
}

export function HowItWorks({ ctaHref = "/rechtsschutz-check", ctaLabel = "Jetzt Rechtsschutz-Check starten" }: { ctaHref?: string; ctaLabel?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  return (
    <section className="py-24 sm:py-32">
      <div className="container grid gap-12 lg:grid-cols-[0.85fr_1.15fr]">
        <div className="lg:sticky lg:top-32 lg:self-start">
          <SectionHeading eyebrow="So funktioniert es" title="In drei Schritten zur passenden Absicherung." emphasis="drei" />
          <div className="mt-10"><ButtonLink href={ctaHref} arrow>{ctaLabel}</ButtonLink></div>
          <div className="mt-14 hidden pl-4 lg:block"><Polaroid photo="beratung" caption="Beratung, wie sie sein sollte: entspannt." rotate={-3} width={330} /></div>
        </div>
        <div ref={ref} className="space-y-6 pb-8">
          {steps.map((s, i) => <StepCard key={s.title} s={s} i={i} progress={scrollYProgress} />)}
        </div>
      </div>
    </section>
  );
}
