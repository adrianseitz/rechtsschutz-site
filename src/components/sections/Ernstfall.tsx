"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import type { ProductKey } from "@/lib/products";
import { DocKlage, DocKuendigung, DocNebenkosten, DocPaket } from "../art/Documents";
import { SectionHeading } from "../ui/SectionHeading";
import { Scribble } from "../ui/Scribble";
import { Polaroid } from "../art/Polaroid";
import type { PhotoKey } from "@/lib/photos";

const CONTENT: Record<ProductKey, { title: string; emphasis: string; doc: React.ReactElement; points: { k: string; t: string }[] }> = {
  arbeit: {
    title: "Wenn dieser Brief kommt, zählt jeder Tag.",
    emphasis: "jeder",
    doc: <DocKuendigung rotate={-4} />,
    points: [
      { k: "3 Wochen", t: "Klagefrist: Eine Kündigungsschutzklage muss innerhalb von drei Wochen nach Zugang erhoben werden (§ 4 KSchG)." },
      { k: "§ 12a ArbGG", t: "In der 1. Instanz trägst du deine Anwaltskosten selbst – auch wenn du gewinnst." },
      { k: "Wartezeit", t: "Versichert ist der Fall nur, wenn die Ursache nach Vertragsbeginn und Ablauf der Wartezeit liegt." },
    ],
  },
  privat: {
    title: "Ärger mit dem Händler? Erst dokumentieren, dann handeln.",
    emphasis: "dokumentieren,",
    doc: <DocPaket rotate={4} />,
    points: [
      { k: "Belege", t: "Fotos, Lieferschein und Schriftverkehr sichern – sie sind im Streitfall entscheidend." },
      { k: "2 Jahre", t: "Gewährleistung bei neuen Sachen beträgt in der Regel zwei Jahre (§ 438 BGB)." },
      { k: "Tarif", t: "Rechtsschutz übernimmt – je nach Tarif – Anwalts- und Gerichtskosten, nicht den Kaufpreis selbst." },
    ],
  },
  vermieter: {
    title: "Nebenkosten: Fristen gelten für beide Seiten.",
    emphasis: "beide",
    doc: <DocNebenkosten rotate={-3} />,
    points: [
      { k: "12 Monate", t: "Die Abrechnung muss dem Mieter spätestens zwölf Monate nach Ende des Abrechnungszeitraums zugehen (§ 556 Abs. 3 BGB)." },
      { k: "Einwände", t: "Mieter können Einwendungen bis zum Ende des zwölften Monats nach Zugang erheben." },
      { k: "Wartezeit", t: "Für Mietangelegenheiten gilt meist eine Wartezeit – bestehende Streitigkeiten sind nicht versicherbar." },
    ],
  },
  firma: {
    title: "Post vom Arbeitsgericht – und jetzt?",
    emphasis: "jetzt?",
    doc: <DocKlage rotate={-3} />,
    points: [
      { k: "Gütetermin", t: "Das Verfahren vor dem Arbeitsgericht beginnt mit einer Güteverhandlung (§ 54 ArbGG)." },
      { k: "§ 12a ArbGG", t: "Auch als Arbeitgeber trägst du deine Anwaltskosten in der 1. Instanz selbst." },
      { k: "Bausteine", t: "Arbeitgeber-Rechtsschutz ist je nach Tarif enthalten; Vertragsstreitigkeiten oft nur als Zusatzbaustein." },
    ],
  },
};

const ANSWER: Record<ProductKey, string> = {
  arbeit: "Mit Rechtsschutz: Anwalt fürs Kündigungsschutzverfahren – Kosten je nach Tarif versichert.",
  privat: "Mit Rechtsschutz: Anwalt & Gericht – je nach Tarif übernimmt das die Versicherung.",
  vermieter: "Mit Rechtsschutz: Streit um die Abrechnung? Anwaltskosten je nach Tarif versichert.",
  firma: "Mit Firmenrechtsschutz: Anwaltskosten vor dem Arbeitsgericht – je nach Tarif versichert.",
};

export function Ernstfall({ product }: { product: ProductKey }) {
  const c = CONTENT[product];
  const [open, setOpen] = useState(false);
  const [stamps, setStamps] = useState<{ id: number; x: number; y: number; r: number }[]>([]);
  return (
    <section className="overflow-hidden bg-paper py-24 sm:py-32">
      <div className="container grid items-center gap-16 lg:grid-cols-2">
        <div className="relative mx-auto">
          <motion.button type="button" aria-expanded={open} aria-label="Was Rechtsschutz hier leisten kann" onClick={(e) => {
              setOpen((o) => !o);
              // Stempel genau dort, wo getippt wurde (max. 4 Stück)
              const r = e.currentTarget.getBoundingClientRect();
              const sx = r.width / e.currentTarget.offsetWidth || 1;
              const x = (e.clientX - r.left) / sx, y = (e.clientY - r.top) / sx;
              setStamps((st) => [...st.slice(-3), { id: Date.now(), x, y, r: -18 + Math.random() * 24 }]);
            }} data-cursor="Antippen" data-burst-strong
            initial={{ opacity: 0, y: 60, rotate: -12 }} whileInView={{ opacity: 1, y: 0, rotate: 0 }} viewport={{ once: true, margin: "-100px" }} whileTap={{ scale: 0.97, rotate: -2 }}
            transition={{ type: "spring", stiffness: 90, damping: 16 }}
            className="relative block origin-bottom scale-[1.05] cursor-pointer text-left sm:scale-[1.3]">
            {c.doc}
            {stamps.map((st) => (
              <motion.span key={st.id} aria-hidden className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-1/2 whitespace-nowrap rounded-[6px] border-[3px] border-navy bg-sun/85 px-2.5 py-1 font-mono text-[13px] font-bold uppercase tracking-[0.14em] text-navy mix-blend-multiply"
                style={{ left: st.x, top: st.y }}
                initial={{ scale: 2.6, opacity: 0, rotate: st.r - 14 }} animate={{ scale: 1, opacity: 1, rotate: st.r }} transition={{ type: "spring", stiffness: 620, damping: 20 }}>
                Abgesichert
              </motion.span>
            ))}
            <AnimatePresence>
              {open && (
                <motion.div initial={{ opacity: 0, scale: 0.6, rotate: -20, y: 20 }} animate={{ opacity: 1, scale: 1, rotate: 5, y: 0 }} exit={{ opacity: 0, scale: 0.8, rotate: 12 }}
                  transition={{ type: "spring", stiffness: 300, damping: 16 }}
                  className="absolute -right-8 top-10 z-20 w-[200px] bg-[#FFE45C] p-4 pt-5 shadow-[0_18px_30px_-16px_rgba(11,11,10,0.5)]">
                  <span aria-hidden className="absolute -top-2.5 left-1/2 h-5 w-16 -translate-x-1/2 rotate-[-4deg] bg-white/60" />
                  <p className="font-hand text-[19px] leading-[1.12] text-navy">{ANSWER[product]}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.button>
          <p className="mt-6 text-center font-hand text-xl text-navy/70 sm:mt-16">{open ? "nochmal tippen zum Schließen" : "↑ tipp aufs Dokument"}</p>
          <div className="absolute -bottom-20 -left-6 z-10 sm:-bottom-24 sm:-left-28"><Polaroid photo={(product === "arbeit" ? "brief" : product) as PhotoKey} caption={product === "arbeit" ? "Und dann liegt er da." : undefined} rotate={-7} width={190} /></div>
          <p className="absolute -left-4 -top-10 -rotate-6 font-hand text-[26px] text-navy sm:-left-16">Beispiel, fiktiv</p>
          <Scribble kind="arrow" className="absolute -left-2 -top-2 h-12 w-16 sm:-left-10" width={2} delay={0.4} />
        </div>
        <div>
          <SectionHeading eyebrow="Der Ernstfall" title={c.title} emphasis={c.emphasis} />
          <ol className="mt-10 space-y-0 border-t border-navy">
            {c.points.map((p, i) => (
              <motion.li key={p.k} initial={{ opacity: 0, x: 24 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.6, delay: 0.15 * i }}
                className="grid grid-cols-[auto_1fr] gap-x-6 border-b border-line py-6 sm:grid-cols-[140px_1fr]">
                <span className="font-serif text-2xl italic leading-tight text-navy">{p.k}</span>
                <span className="text-[16px] leading-7 text-ink-soft">{p.t}</span>
              </motion.li>
            ))}
          </ol>
          <p className="mt-5 text-xs text-ink-muted">Allgemeine Informationen, keine Rechtsberatung.</p>
        </div>
      </div>
    </section>
  );
}
