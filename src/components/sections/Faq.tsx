"use client";

import { useId, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Plus } from "lucide-react";
import { SectionHeading } from "../ui/SectionHeading";
import { ButtonLink } from "../ui/Button";

export type FaqItem = { q: string; a: string };

export function Faq({ items, title = "Häufige Fragen", eyebrow = "FAQ" }: { items: FaqItem[]; title?: string; eyebrow?: string }) {
  const [open, setOpen] = useState<number | null>(0);
  const base = useId();
  const jsonLd = { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: items.map((i) => ({ "@type": "Question", name: i.q, acceptedAnswer: { "@type": "Answer", text: i.a } })) };
  return (
    <section className="py-24 sm:py-32">
      <div className="container grid gap-12 lg:grid-cols-[0.8fr_1.2fr]">
        <div className="lg:sticky lg:top-32 lg:self-start">
          <SectionHeading eyebrow={eyebrow} title={title} emphasis={title.split(" ").slice(-1)[0]} text="Sachlich erklärt. Deine individuelle Frage beantworte ich gern persönlich." />
          <div className="mt-8"><ButtonLink href="/kontakt?anliegen=frage" variant="secondary" arrow>Frage stellen</ButtonLink></div>
        </div>
        <div className="border-t border-navy">
          {items.map((it, i) => {
            const isOpen = open === i;
            const id = `${base}-${i}`;
            return (
              <div key={it.q} className="border-b border-line">
                <h3>
                  <button className="group flex w-full items-start gap-5 py-6 text-left" aria-expanded={isOpen} aria-controls={id} onClick={() => setOpen(isOpen ? null : i)}>
                    <span className="mt-1.5 font-mono text-xs text-ink-muted">{String(i + 1).padStart(2, "0")}</span>
                    <span className="flex-1 text-xl font-medium tracking-[-0.025em] text-navy sm:text-[22px]">{it.q}</span>
                    <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-full border transition duration-300 ${isOpen ? "rotate-45 border-navy bg-sun" : "border-line group-hover:border-navy"}`}>
                      <Plus className="h-4 w-4 text-navy" aria-hidden />
                    </span>
                  </button>
                </h3>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div id={id} role="region" initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }} className="overflow-hidden">
                      <p className="max-w-2xl pb-7 pl-9 text-[17px] leading-8 text-ink-soft">{it.a}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    </section>
  );
}
