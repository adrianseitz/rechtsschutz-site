"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import { ArrowUpRight } from "lucide-react";
import { DocBescheid, DocKlage, DocKuendigung, DocNebenkosten, DocPaket, DocUnfall } from "../art/Documents";
import { PHOTOS, type PhotoKey } from "@/lib/photos";
import { SectionHeading } from "../ui/SectionHeading";

const items = [
  { icon: "envelope", tag: "Arbeit", href: "/arbeitsrechtsschutz", title: "Die Kündigung liegt im Briefkasten", text: "Du hältst sie für unwirksam und willst sie prüfen lassen – für eine Kündigungsschutzklage bleiben nur drei Wochen." },
  { icon: "package", tag: "Privat", href: "/privatrechtsschutz", title: "Das bestellte Sofa kommt beschädigt an", text: "Der Händler verweigert Rücknahme und Erstattung. Ohne Unterstützung bleibst du auf dem Schaden sitzen." },
  { icon: "receipt", tag: "Vermieter", href: "/vermieterrechtsschutz", title: "Streit um die Nebenkostenabrechnung", text: "Dein Mieter zahlt die Nachforderung nicht und bestreitet einzelne Positionen der Abrechnung." },
  { icon: "car", tag: "Verkehr", href: "/rechtsschutz-check?bereich=mehrere&auswahl=verkehr", title: "Unfall ohne klare Schuldfrage", text: "Die gegnerische Versicherung will nur einen Teil zahlen. Wer ist im Recht – und wer trägt die Kosten?" },
  { icon: "worker", tag: "Firma", href: "/firmenrechtsschutz", title: "Ein ehemaliger Mitarbeiter klagt", text: "Als Arbeitgeber musst du dich vor dem Arbeitsgericht verteidigen – mit eigenen Anwaltskosten." },
  { icon: "authority", tag: "Privat", href: "/privatrechtsschutz", title: "Ärger mit einer Behörde", text: "Ein Bescheid der Sozialversicherung erscheint dir falsch, und du möchtest dagegen vorgehen." },
];

const PHOTO_OF: Record<string, PhotoKey> = { envelope: "arbeit", package: "privat", receipt: "vermieter", car: "verkehr", worker: "firma", authority: "behoerde" };

const DOCS: Record<string, (p: { rotate?: number }) => React.ReactElement> = {
  envelope: (p) => <DocKuendigung {...p} />,
  package: (p) => <DocPaket {...p} />,
  receipt: (p) => <DocNebenkosten {...p} />,
  car: (p) => <DocUnfall {...p} />,
  worker: (p) => <DocKlage {...p} />,
  authority: (p) => <DocBescheid {...p} />,
};

function Card({ it, i }: { it: (typeof items)[number]; i: number }) {
  return (
    <Link href={it.href} data-cursor="Ansehen" className={`group relative flex h-[500px] w-[82vw] max-w-[400px] shrink-0 snap-start flex-col overflow-hidden rounded-[28px] border p-7 transition duration-500 sm:w-[400px] ${i % 3 === 1 ? "border-navy bg-navy text-white" : "border-line bg-white hover:border-navy/30"}`}>
      <div className="flex items-center justify-between">
        <span className={`rounded-full px-3 py-1 font-mono text-[11px] uppercase tracking-[0.12em] ${i % 3 === 1 ? "bg-white/10 text-white/70" : "bg-paper text-ink-muted"}`}>{it.tag}</span>
        <span className="font-mono text-xs text-ink-muted">0{i + 1}/0{items.length}</span>
      </div>
      <div className="relative -mx-7 mt-5 h-[210px] overflow-hidden">
        <picture>
          <source srcSet={`${PHOTOS[PHOTO_OF[it.icon]].src}.webp`} type="image/webp" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={`${PHOTOS[PHOTO_OF[it.icon]].src}.jpg`} alt={PHOTOS[PHOTO_OF[it.icon]].alt} loading="lazy" decoding="async"
            className="h-full w-full object-cover transition duration-[1.2s] ease-[cubic-bezier(.22,1,.36,1)] group-hover:scale-[1.06]" style={{ objectPosition: PHOTOS[PHOTO_OF[it.icon]].pos }} />
        </picture>
        <span className="absolute left-3 top-3 rounded-sm bg-black/45 px-1.5 py-0.5 font-mono text-[8px] uppercase tracking-[0.12em] text-white/85">Symbolbild</span>
        <div className="pointer-events-none absolute -bottom-24 -right-16 origin-top-left scale-[0.42] transition duration-700 ease-[cubic-bezier(.22,1,.36,1)] group-hover:-translate-y-10 group-hover:rotate-[-3deg]">
          {DOCS[it.icon]({ rotate: i % 2 ? 6 : -6 })}
        </div>
      </div>
      <h3 className={`mt-auto text-2xl font-semibold leading-tight tracking-[-0.035em] ${i % 3 === 1 ? "text-white" : "text-navy"}`}>{it.title}</h3>
      <p className={`mt-3 text-[15px] leading-6 ${i % 3 === 1 ? "text-white/65" : "text-ink-soft"}`}>{it.text}</p>
      <span className={`mt-5 inline-flex items-center gap-1.5 text-sm font-medium ${i % 3 === 1 ? "text-sun" : "text-navy"}`}>
        Passende Absicherung <ArrowUpRight className="h-4 w-4 transition group-hover:rotate-45" aria-hidden />
      </span>
    </Link>
  );
}

export function Situations() {
  const target = useRef<HTMLElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const [pinned, setPinned] = useState(false);
  const [dist, setDist] = useState(0);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const update = () => {
      setPinned(mq.matches && !reduce);
      if (track.current) setDist(Math.max(0, track.current.scrollWidth - window.innerWidth + 80));
    };
    update();
    mq.addEventListener("change", update);
    window.addEventListener("resize", update);
    return () => { mq.removeEventListener("change", update); window.removeEventListener("resize", update); };
  }, [reduce]);

  const { scrollYProgress } = useScroll({ target, offset: ["start start", "end end"] });
  const x = useTransform(scrollYProgress, [0.05, 0.95], [0, -dist]);
  const bar = useTransform(scrollYProgress, [0.05, 0.95], ["0%", "100%"]);

  return (
    <section ref={target} className="relative bg-surface" style={pinned ? { height: `calc(100vh + ${dist}px)` } : undefined}>
      <div className={pinned ? "sticky top-0 flex h-screen flex-col justify-center overflow-hidden" : "py-24"}>
        <div className="container">
          <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
            <SectionHeading eyebrow="Aus dem Leben" title="Ein Rechtsstreit passiert schneller als gedacht." emphasis="schneller" />
            <p className="max-w-sm text-sm leading-6 text-ink-muted lg:pb-2">Beispielsituationen zur Veranschaulichung – keine Kundenfälle. Versichert ist ein Fall nur im Rahmen des Tarifs und nach Ablauf der Wartezeit.</p>
          </div>
        </div>
        <motion.div ref={track} style={pinned ? { x } : undefined}
          className={`mt-12 flex gap-5 px-5 md:px-[max(2rem,calc((100vw-1200px)/2+2rem))] ${pinned ? "" : "snap-x snap-mandatory overflow-x-auto pb-4 [scrollbar-width:none]"}`}>
          {items.map((it, i) => <Card key={it.title} it={it} i={i} />)}
        </motion.div>
        {pinned && (
          <div className="container mt-10">
            <div className="h-[2px] w-full overflow-hidden rounded-full bg-line"><motion.div className="h-full bg-navy" style={{ width: bar }} /></div>
          </div>
        )}
      </div>
    </section>
  );
}
