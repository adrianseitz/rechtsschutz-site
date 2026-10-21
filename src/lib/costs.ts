/**
 * Vereinfachte Prozesskosten-Beispielrechnung, 1. Instanz, mit streitigem Urteil.
 * Grundlage: § 13 RVG und Anlage 2 zu § 34 GKG in der seit 01.06.2025 geltenden
 * Fassung (KostBRÄG 2025). Gültig für Streitwerte bis 50.000 €.
 * Nicht enthalten: Zeugen, Sachverständige, Reisekosten, Vergleichsgebühren.
 */

type Step = { upTo: number; per: number; add: number };

const RVG = { base: 51.5, steps: [
  { upTo: 2000, per: 500, add: 41.5 },
  { upTo: 10000, per: 1000, add: 59.5 },
  { upTo: 25000, per: 3000, add: 55 },
  { upTo: 50000, per: 5000, add: 86 },
] as Step[] };

const GKG = { base: 40, steps: [
  { upTo: 2000, per: 500, add: 21 },
  { upTo: 10000, per: 1000, add: 22.5 },
  { upTo: 25000, per: 3000, add: 30.5 },
  { upTo: 50000, per: 5000, add: 40.5 },
] as Step[] };

export const MAX_VALUE = 50000;

function fee(table: { base: number; steps: Step[] }, value: number): number {
  const v = Math.min(Math.max(value, 1), MAX_VALUE);
  let f = table.base;
  let lower = 500;
  for (const s of table.steps) {
    if (v <= lower) break;
    const span = Math.min(v, s.upTo) - lower;
    f += Math.ceil(span / s.per) * s.add;
    lower = s.upTo;
  }
  return f;
}

export const rvgFee = (v: number) => fee(RVG, v);
export const gkgFee = (v: number) => fee(GKG, v);

/** Anwaltskosten einer Partei: 1,3 Verfahrens- + 1,2 Terminsgebühr + Pauschale (max. 20 €) + 19 % USt. */
export function lawyerCost(value: number) {
  const net = 2.5 * rvgFee(value);
  const pauschale = Math.min(20, 0.2 * net);
  return round((net + pauschale) * 1.19);
}

/** Gerichtskosten Zivilprozess 1. Instanz: 3,0 Gebühren (KV 1210 GKG). */
export const courtCostCivil = (value: number) => round(3 * gkgFee(value));

const round = (n: number) => Math.round(n * 100) / 100;

export type CostMode = "zivil" | "arbeit";

export function costScenario(value: number, mode: CostMode) {
  const own = lawyerCost(value);
  if (mode === "arbeit") {
    // § 12a ArbGG: in der 1. Instanz trägt jede Partei ihre Anwaltskosten selbst.
    return { own, opponent: 0, court: 0, total: own };
  }
  const opponent = own;
  const court = courtCostCivil(value);
  return { own, opponent, court, total: round(own + opponent + court) };
}

export const euro = (n: number) => n.toLocaleString("de-DE", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });
