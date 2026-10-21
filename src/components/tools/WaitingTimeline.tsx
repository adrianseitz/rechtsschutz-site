"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { CircleCheck, Clock, XCircle } from "lucide-react";
import { SectionHeading } from "../ui/SectionHeading";
import { StickyNote } from "../ui/StickyNote";

/** Interaktive Erklärung: Wartezeit und Zeitpunkt des Konflikts. Monat 0 = Vertragsbeginn. */
const MIN = -3;
const MAX = 9;
const WAIT = 3;

export function WaitingTimeline({ area = "z. B. im Arbeits-, Vertrags- oder Mietrecht" }: { area?: string }) {
  const [m, setM] = useState(5);
  const pct = (v: number) => ((v - MIN) / (MAX - MIN)) * 100;
  const status = m < 0 ? "before" : m < WAIT ? "wait" : "covered";
  const info = {
    before: { icon: XCircle, cls: "bg-red-50 text-red-700 border-red-200", title: "Nicht versichert", text: "Der Konflikt ist vor Vertragsbeginn entstanden. Bestehende oder absehbare Streitigkeiten können nicht nachträglich versichert werden." },
    wait: { icon: Clock, cls: "bg-amber-50 text-amber-800 border-amber-200", title: "In der Wartezeit", text: `In vielen Bereichen (${area}) gilt eine Wartezeit, häufig drei Monate. Entsteht der Konflikt in dieser Zeit, besteht dafür meist kein Schutz.` },
    covered: { icon: CircleCheck, cls: "bg-teal-50 text-teal-700 border-teal-100", title: "Grundsätzlich versichert", text: "Der Konflikt entsteht nach Ablauf der Wartezeit. Dann greift der Schutz – im Rahmen deines Tarifs und der Versicherungsbedingungen." },
  }[status];
  const I = info.icon;

  return (
    <section className="bg-surface py-24 sm:py-32">
      <div className="container">
        <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
          <SectionHeading eyebrow="Wartezeit verstehen" title="Warum frühzeitig absichern?" emphasis="frühzeitig" text="Entscheidend ist, wann die Ursache eines Streits entsteht. Probier es aus: Verschiebe den Zeitpunkt des Konflikts." />
          <div className="relative rounded-[28px] border border-line bg-white p-6 sm:p-10">
            <StickyNote className="absolute -right-4 -top-16 hidden !w-[170px] !p-3 !pt-5 sm:block [&_div]:!text-[18px]" rotate={6}>Probier den Regler aus ↓</StickyNote>
            <div className="relative pt-10">
              {/* Zeitstrahl */}
              <div className="relative h-3 rounded-full bg-line">
                <div className="absolute inset-y-0 rounded-l-full bg-red-200" style={{ left: 0, width: `${pct(0)}%` }} />
                <div className="absolute inset-y-0 bg-amber-200" style={{ left: `${pct(0)}%`, width: `${pct(WAIT) - pct(0)}%` }} />
                <div className="absolute inset-y-0 rounded-r-full bg-sun" style={{ left: `${pct(WAIT)}%`, right: 0 }} />
                <motion.div className="absolute -top-9 -translate-x-1/2" animate={{ left: `${pct(m)}%` }} transition={{ type: "spring", stiffness: 300, damping: 26 }}>
                  <span className="whitespace-nowrap rounded-full bg-navy px-3 py-1 font-mono text-[11px] uppercase tracking-[0.1em] text-white">Konflikt</span>
                  <span className="mx-auto mt-1 block h-4 w-0.5 bg-navy" />
                </motion.div>
              </div>
              <div className="relative mt-3 h-10 text-xs font-medium text-ink-muted">
                <span className="absolute -translate-x-1/2 text-center" style={{ left: `${pct(0)}%` }}>Vertrags&shy;beginn</span>
                <span className="absolute -translate-x-1/2 text-center" style={{ left: `${pct(WAIT)}%` }}>nach ca. 3 Mon.</span>
              </div>
              <label htmlFor="tl" className="sr-only">Zeitpunkt des Konflikts in Monaten relativ zum Vertragsbeginn</label>
              <input id="tl" type="range" min={MIN} max={MAX} step={1} value={m} onChange={(e) => setM(Number(e.target.value))} className="range w-full cursor-pointer" style={{ ["--fill" as string]: `${pct(m)}%` }} />
              <p className="mt-1 text-center text-sm text-ink-soft">
                {m === 0 ? "Am Tag des Vertragsbeginns" : m < 0 ? `${-m} ${m === -1 ? "Monat" : "Monate"} vor Vertragsbeginn` : `${m} ${m === 1 ? "Monat" : "Monate"} nach Vertragsbeginn`}
              </p>
            </div>
            <motion.div key={status} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className={`mt-6 flex items-start gap-3 rounded-2xl border p-4 ${info.cls}`}>
              <I className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />
              <div><p className="font-semibold">{info.title}</p><p className="mt-1 text-sm leading-6 opacity-90">{info.text}</p></div>
            </motion.div>
            <p className="mt-4 text-xs leading-5 text-ink-muted">Vereinfachte Darstellung. Einige Bereiche (z. B. Schadenersatz-Rechtsschutz) sind häufig ohne Wartezeit versichert. Maßgeblich sind die Bedingungen des jeweiligen Tarifs.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
