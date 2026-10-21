"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { ArrowUpRight } from "lucide-react";
import { productList } from "@/lib/products";
import { SectionHeading } from "../ui/SectionHeading";
import { DocKlage, DocKuendigung, DocNebenkosten, DocPaket, KeyTag } from "../art/Documents";
import { Polaroid } from "../art/Polaroid";

const STYLE: Record<string, { span: string; tone: string; text: string; chip: string; dark?: boolean }> = {
  arbeit: { span: "lg:col-span-7 lg:row-span-2", tone: "bg-sun", text: "text-navy/75", chip: "bg-white/60 text-navy" },
  privat: { span: "lg:col-span-5", tone: "bg-paper", text: "text-ink-soft", chip: "bg-white text-navy" },
  vermieter: { span: "lg:col-span-5", tone: "bg-paper", text: "text-ink-soft", chip: "bg-white text-navy" },
  firma: { span: "lg:col-span-12", tone: "bg-navy", text: "text-white/65", chip: "bg-white/10 text-white", dark: true },
};

function Art({ k }: { k: string }) {
  const hover = "transition duration-700 ease-[cubic-bezier(.22,1,.36,1)]";
  if (k === "arbeit")
    return (
      <div className={`pointer-events-none absolute -right-6 top-20 origin-top-right scale-[0.82] sm:right-6 sm:scale-100 lg:top-24 ${hover} group-hover:-translate-y-4 group-hover:rotate-[-2deg]`}>
        <div className="absolute -left-8 top-8 h-[380px] w-[300px] rotate-[6deg] rounded-[3px] bg-[#F2EEE2] shadow-lg" aria-hidden />
        <DocKuendigung rotate={-5} />
        <div className="absolute -bottom-36 -left-28 hidden sm:block"><Polaroid photo="arbeit" caption="Karton gepackt – und jetzt?" rotate={-8} width={230} interactive={false} /></div>
      </div>
    );
  if (k === "privat")
    return <div className={`pointer-events-none absolute -right-10 -top-6 origin-top-right scale-[0.5] sm:scale-[0.62] ${hover} group-hover:-translate-y-3 group-hover:rotate-[4deg]`}><DocPaket rotate={8} /></div>;
  if (k === "vermieter")
    return (
      <div className={`pointer-events-none absolute -right-12 -top-16 origin-top-right scale-[0.5] sm:scale-[0.6] ${hover} group-hover:-translate-y-3`}>
        <DocNebenkosten rotate={6} />
        <KeyTag className="absolute -bottom-6 left-0 hidden rotate-[-12deg] scale-[1.3] sm:block" />
      </div>
    );
  return <>
    <div className="pointer-events-none absolute right-[34%] top-8 hidden lg:block"><Polaroid photo="firma" caption="Unser Laden, unser Risiko." rotate={-6} width={210} interactive={false} /></div>
    <div className={`pointer-events-none absolute -right-16 top-4 origin-top-right scale-[0.5] sm:-bottom-40 sm:right-6 sm:top-auto sm:origin-center sm:scale-[0.95] lg:right-20 ${hover} group-hover:-translate-y-8 group-hover:rotate-[-1deg]`}><DocKlage rotate={-4} /></div>
  </>;
}

export function ProductCards() {
  return (
    <section id="bereiche" className="py-24 sm:py-32">
      <div className="container">
        <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <SectionHeading eyebrow="Absicherungsbereiche" title="Welcher Rechtsschutz passt zu dir?" emphasis="dir?" />
          <p className="max-w-sm text-ink-soft lg:pb-2">Vier Bereiche, ein Ansprechpartner. Wähle aus, was zu deiner Situation passt – oder kombiniere mehrere Bausteine.</p>
        </div>

        <div className="mt-14 grid gap-4 lg:grid-cols-12">
          {productList.map((p, i) => {
            const st = STYLE[p.key];
            const big = p.key === "arbeit";
            return (
              <motion.div key={p.key} className={`min-w-0 ${st.span}`} initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-80px" }} transition={{ duration: 0.8, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }}>
                <Link href={p.slug} data-cursor="Ansehen" className={`group relative flex h-full min-h-[440px] flex-col overflow-hidden rounded-[28px] p-7 sm:p-9 ${st.tone} ${big ? "min-h-[620px] lg:min-h-[896px]" : ""} ${p.key === "firma" ? "lg:min-h-[340px]" : ""}`}>
                  <Art k={p.key} />
                  <div className="relative z-10 flex items-start justify-between">
                    <span className={`font-mono text-xs uppercase tracking-[0.14em] ${st.dark ? "text-white/50" : "text-navy/50"}`}>0{i + 1} — {p.short}</span>
                  </div>
                  <div className={`relative z-10 mt-auto ${p.key === "firma" ? "lg:max-w-xl" : ""}`}>
                    <h3 className={`font-semibold leading-[1] tracking-[-0.045em] ${big ? "text-[2.5rem] sm:text-6xl" : "text-[2rem] sm:text-4xl"} ${st.dark ? "text-white" : "text-navy"}`}>
                      {p.name.replace("rechtsschutz", "")}<span className="font-serif font-normal italic tracking-[-0.01em]">rechtsschutz</span>
                    </h3>
                    <p className={`mt-4 max-w-md text-[17px] leading-7 ${st.text}`}>{p.cardText}</p>
                    <div className="mt-6 flex flex-wrap items-center gap-2">
                      {p.cardTopics.map((t) => <span key={t} className={`rounded-full px-3.5 py-1.5 text-[13px] font-medium backdrop-blur ${st.chip}`}>{t}</span>)}
                      <span className={`ml-auto grid h-12 w-12 place-items-center rounded-full transition duration-500 group-hover:rotate-45 ${st.dark ? "bg-sun text-navy" : "bg-navy text-white"}`}>
                        <ArrowUpRight className="h-5 w-5" aria-hidden />
                      </span>
                    </div>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
