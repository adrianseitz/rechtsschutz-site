"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Check, Plus } from "lucide-react";
import { Icon3D } from "../ui/Icon3D";
import { ButtonLink } from "../ui/Button";
import { SectionHeading } from "../ui/SectionHeading";

const MODULES = [
  { value: "privat", label: "Privat", icon: "Shield", text: "Verträge, Einkäufe, Schadenersatz, Behörden" },
  { value: "arbeit", label: "Beruf", icon: "Briefcase", text: "Kündigung, Abmahnung, Zeugnis, Gehalt" },
  { value: "verkehr", label: "Verkehr", icon: "Car", text: "Unfall, Bußgeld, Fahrzeugkauf" },
  { value: "wohnen", label: "Wohnen", icon: "KeyRound", text: "Selbst genutzte Wohnung – als Mieter oder Eigentümer" },
  { value: "vermieter", label: "Vermietung", icon: "House", text: "Mietstreit, Betriebskosten, Räumung" },
  { value: "firma", label: "Unternehmen", icon: "Building2", text: "Gewerbliche Tätigkeit, Arbeitgeber-Themen" },
] as const;

const COLORS = ["#0B0B0A", "#FFD60A", "#26395F", "#FFE14D", "#3A4F7A", "#E6BE00"];

export function CoverageBuilder() {
  const [sel, setSel] = useState<string[]>(["privat", "arbeit"]);
  const toggle = (v: string) => setSel((s) => (s.includes(v) ? s.filter((x) => x !== v) : [...s, v]));
  const href = useMemo(() => {
    if (sel.length === 0) return "/rechtsschutz-check";
    const single = sel.length === 1 && ["privat", "arbeit", "vermieter", "firma"].includes(sel[0]);
    return single ? `/rechtsschutz-check?bereich=${sel[0]}` : `/rechtsschutz-check?bereich=mehrere&auswahl=${sel.join(",")}`;
  }, [sel]);

  return (
    <section className="py-24 sm:py-32">
      <div className="container">
        <SectionHeading eyebrow="Baukasten" title="Stell dir deine Absicherung zusammen." emphasis="zusammen." text="Rechtsschutz ist modular. Wähle die Bereiche, die zu deinem Leben passen – ich prüfe anschließend, welche Kombination sinnvoll ist." />
        <div className="mt-12 grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-start">
          <div className="grid gap-3 sm:grid-cols-2">
            {MODULES.map((m) => {
              const on = sel.includes(m.value);
              return (
                <button key={m.value} type="button" aria-pressed={on} onClick={() => toggle(m.value)}
                  className={`group flex items-start gap-4 rounded-3xl border p-5 text-left transition duration-300 ${on ? "border-navy bg-sun" : "border-line bg-white hover:border-navy/40"}`}>
                  <span className={`grid h-14 w-14 shrink-0 place-items-center rounded-2xl transition duration-500 ${on ? "bg-white" : "bg-paper"}`}><Icon3D name={m.icon} size={38} className={`transition duration-500 ${on ? "scale-110 -rotate-6" : ""}`} /></span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-semibold text-navy">{m.label}</span>
                    <span className={`mt-0.5 block text-sm leading-6 ${on ? "text-navy/70" : "text-ink-muted"}`}>{m.text}</span>
                  </span>
                  <span className={`mt-1 grid h-7 w-7 shrink-0 place-items-center rounded-full transition ${on ? "bg-navy text-sun" : "border border-line text-ink-muted"}`}>
                    {on ? <Check className="h-3.5 w-3.5" strokeWidth={3} /> : <Plus className="h-3.5 w-3.5" strokeWidth={3} />}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="sticky top-28 overflow-hidden rounded-[28px] bg-navy p-6 text-white sm:p-8">
            <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-white/50">Deine Auswahl</p>
            {/* Schild aus Schichten */}
            <div className="relative mx-auto mt-4 h-48 w-40" aria-hidden>
              <svg viewBox="0 0 160 192" className="absolute inset-0 h-full w-full">
                <path d="M80 8 18 32v52c0 44 26 78 62 96 36-18 62-52 62-96V32Z" fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.12)" strokeWidth="2" />
              </svg>
              <AnimatePresence>
                {sel.map((v, i) => (
                  <motion.svg key={v} viewBox="0 0 160 192" className="absolute inset-0 h-full w-full" initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1 - i * 0.12, opacity: 1 }} exit={{ scale: 0.6, opacity: 0 }} transition={{ type: "spring", stiffness: 260, damping: 22 }}>
                    <path d="M80 8 18 32v52c0 44 26 78 62 96 36-18 62-52 62-96V32Z" fill={COLORS[i % COLORS.length]} />
                  </motion.svg>
                ))}
              </AnimatePresence>
              {sel.length > 0 && (
                <svg viewBox="0 0 160 192" className="absolute inset-0 h-full w-full"><path d="m58 96 16 16 30-32" stroke={(sel.length - 1) % 2 === 0 ? "#0B0B0A" : "#FFD60A"} strokeWidth="9" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>
              )}
            </div>
            <ul className="mt-5 min-h-[3rem] space-y-2">
              <AnimatePresence initial={false}>
                {sel.map((v) => {
                  const m = MODULES.find((x) => x.value === v)!;
                  return (
                    <motion.li key={v} layout initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex items-center gap-2 text-[15px] font-medium text-white">
                      <Check className="h-4 w-4 text-sun" strokeWidth={3} aria-hidden /> {m.label}
                    </motion.li>
                  );
                })}
              </AnimatePresence>
              {sel.length === 0 && <li className="text-sm text-white/50">Wähle mindestens einen Bereich.</li>}
            </ul>
            <ButtonLink href={href} variant="sun" arrow className="mt-6 w-full">Diese Kombination prüfen</ButtonLink>
            <p className="mt-3 text-center text-xs text-white/45">Welche Bausteine kombinierbar sind, hängt vom Tarif ab.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
