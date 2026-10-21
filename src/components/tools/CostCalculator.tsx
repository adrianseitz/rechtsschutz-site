"use client";

import { useEffect, useMemo, useState } from "react";
import { animate, motion, useMotionValue, useReducedMotion, useTransform } from "motion/react";
import { Info } from "lucide-react";
import { Scribble } from "../ui/Scribble";
import { costScenario, euro, MAX_VALUE, type CostMode } from "@/lib/costs";
import { ButtonLink } from "../ui/Button";

const PRESETS: Record<CostMode, { label: string; value: number }[]> = {
  zivil: [
    { label: "Streit um Online-Kauf", value: 800 },
    { label: "Mietkaution", value: 3000 },
    { label: "Mangelhafte Handwerkerleistung", value: 8000 },
    { label: "Schadenersatz", value: 20000 },
  ],
  arbeit: [
    { label: "2.500 € brutto", value: 2500 },
    { label: "3.500 € brutto", value: 3500 },
    { label: "5.000 € brutto", value: 5000 },
  ],
};

function AnimatedEuro({ value }: { value: number }) {
  const reduce = useReducedMotion();
  const mv = useMotionValue(value);
  const text = useTransform(mv, (v) => euro(v));
  useEffect(() => {
    if (reduce) { mv.set(value); return; }
    const c = animate(mv, value, { duration: 0.6, ease: "easeOut" });
    return () => c.stop();
  }, [value, mv, reduce]);
  return <motion.span>{text}</motion.span>;
}

export function CostCalculator({ defaultMode = "zivil", lockMode = false, ctaHref = "/rechtsschutz-check" }: { defaultMode?: CostMode; lockMode?: boolean; ctaHref?: string }) {
  const [mode, setMode] = useState<CostMode>(defaultMode);
  const [input, setInput] = useState(defaultMode === "arbeit" ? 3500 : 5000);

  const streitwert = mode === "arbeit" ? Math.min(input * 3, MAX_VALUE) : input;
  const r = useMemo(() => costScenario(streitwert, mode), [streitwert, mode]);
  const max = mode === "arbeit" ? 12000 : MAX_VALUE;
  const min = mode === "arbeit" ? 1500 : 500;
  const step = mode === "arbeit" ? 100 : 100;
  const segs = [
    { key: "own", label: "Eigene Anwaltskosten", value: r.own, color: "bg-teal" },
    { key: "opponent", label: "Anwaltskosten der Gegenseite", value: r.opponent, color: "bg-white" },
    { key: "court", label: "Gerichtskosten", value: r.court, color: "bg-white/30" },
  ].filter((s) => s.value > 0);

  const switchMode = (m: CostMode) => { setMode(m); setInput(m === "arbeit" ? 3500 : 5000); };

  return (
    <div className="noise relative grid overflow-hidden rounded-[32px] bg-navy text-white lg:grid-cols-[1.05fr_0.95fr]">
      <div className="relative p-6 sm:p-10">
        <Scribble kind="zigzag" className="pointer-events-none absolute bottom-8 right-8 hidden h-6 w-40 opacity-60 lg:block" color="#FFD60A" width={2} delay={0.5} />
        <div className="relative">
          <span className="eyebrow !text-white/55">Kostenrechner
          </span>
          <h2 className="mt-5 text-4xl font-semibold leading-[1.02] tracking-[-0.045em] text-white sm:text-5xl">Was kostet ein <span className="font-serif font-normal italic text-sun">Rechtsstreit?</span></h2>
          <p className="mt-3 max-w-md text-white/70">Eine vereinfachte Beispielrechnung für die erste Instanz – auf Basis der aktuellen gesetzlichen Gebührentabellen.</p>

          {!lockMode && (
            <div className="mt-7 inline-flex rounded-xl bg-white/[0.07] p-1" role="tablist" aria-label="Art des Streits">
              {([["zivil", "Zivilrecht"], ["arbeit", "Kündigungsschutz"]] as const).map(([m, l]) => (
                <button key={m} role="tab" aria-selected={mode === m} onClick={() => switchMode(m)}
                  className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${mode === m ? "bg-white text-navy" : "text-white/70 hover:text-white"}`}>{l}</button>
              ))}
            </div>
          )}

          <div className="mt-7">
            <div className="flex items-end justify-between gap-4">
              <label htmlFor="cost-range" className="text-sm font-medium text-white/80">{mode === "arbeit" ? "Bruttomonatsgehalt" : "Streitwert"}</label>
              <span className="font-mono text-2xl font-medium tabular-nums text-sun">{euro(input)}</span>
            </div>
            <input id="cost-range" type="range" min={min} max={max} step={step} value={input} onChange={(e) => setInput(Number(e.target.value))}
              className="range mt-4 w-full cursor-pointer" style={{ ["--fill" as string]: `${((input - min) / (max - min)) * 100}%`, ["--track" as string]: "rgba(255,255,255,0.15)", ["--fill-color" as string]: "#FFD60A" }} />
            {mode === "arbeit" && <p className="mt-2 text-xs text-white/55">Streitwert einer Kündigungsschutzklage: in der Regel drei Bruttomonatsgehälter (§ 42 Abs. 2 GKG) = {euro(streitwert)}</p>}
            <div className="mt-4 flex flex-wrap gap-2">
              {PRESETS[mode].map((p) => (
                <button key={p.label} onClick={() => setInput(p.value)} className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${input === p.value ? "border-teal bg-teal/15 text-teal-400" : "border-white/15 text-white/70 hover:border-white/40"}`}>{p.label}</button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="relative border-t border-white/10 bg-white/[0.04] p-6 sm:p-10 lg:border-l lg:border-t-0">
        <p className="text-sm font-medium text-white/70">{mode === "arbeit" ? "Deine Anwaltskosten – auch wenn du gewinnst" : "Kostenrisiko, wenn du den Prozess verlierst"}</p>
        <div className="mt-2 flex items-end justify-between gap-4">
          <p className="text-6xl font-semibold tracking-[-0.06em] text-white tabular-nums sm:text-7xl"><AnimatedEuro value={r.total} /></p>
          <span className="hidden -rotate-6 font-hand text-xl leading-tight text-sun sm:block">nur 1. Instanz¹</span>
        </div>

        <div className="mt-6 flex h-4 overflow-hidden rounded-full bg-white/10" aria-hidden>
          {segs.map((s) => (
            <motion.div key={s.key} className={`${s.color} h-full`} animate={{ width: `${(s.value / r.total) * 100}%` }} transition={{ type: "spring", stiffness: 140, damping: 22 }} />
          ))}
        </div>
        <ul className="mt-5 space-y-3">
          {segs.map((s) => (
            <li key={s.key} className="flex items-center justify-between gap-3 text-sm">
              <span className="flex items-center gap-2.5 text-white/80"><span className={`h-2.5 w-2.5 rounded-full ${s.color}`} />{s.label}</span>
              <span className="mx-2 mb-1 flex-1 self-end border-b border-dotted border-white/25" />
              <span className="font-mono tabular-nums">{euro(s.value)}</span>
            </li>
          ))}
        </ul>

        {mode === "arbeit" && (
          <p className="mt-5 rounded-xl bg-teal/10 p-3 text-sm leading-6 text-teal-400">Vor dem Arbeitsgericht trägt in der 1. Instanz jede Partei ihre eigenen Anwaltskosten – unabhängig vom Ausgang (§ 12a ArbGG).</p>
        )}

        <div className="mt-7">
          <ButtonLink href={ctaHref} variant="sun" arrow className="w-full sm:w-auto">Absicherung prüfen</ButtonLink>
        </div>
        <p className="mt-5 flex items-start gap-2 text-[11px] leading-5 text-white/45">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
          Vereinfachte Beispielrechnung, 1. Instanz mit Urteil, nach RVG und GKG (Stand 06/2025), inkl. 19 % USt. auf Anwaltskosten. Ohne Kosten für Zeugen, Gutachten oder weitere Instanzen. Tatsächliche Kosten können abweichen. Ob und in welchem Umfang ein Fall versichert ist, regelt der jeweilige Tarif.
        </p>
      </div>
    </div>
  );
}

export function CostCalculatorSection(props: Parameters<typeof CostCalculator>[0]) {
  return (
    <section className="py-20 sm:py-24" id="kostenrechner">
      <div className="container"><CostCalculator {...props} /></div>
    </section>
  );
}

