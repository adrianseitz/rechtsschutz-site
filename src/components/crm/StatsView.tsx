"use client";

import { useMemo, useState } from "react";
import { emptyDay, PAGE_LABEL, type StatsData } from "@/lib/stats";
import type { CrmLead } from "@/lib/crm";

const RANGES = [
  { days: 7, label: "7 Tage" },
  { days: 30, label: "30 Tage" },
  { days: 90, label: "90 Tage" },
] as const;

const dayKey = (d: Date) => d.toLocaleDateString("sv-SE", { timeZone: "Europe/Berlin" });
const shortDate = (k: string) => { const [, m, d] = k.split("-"); return `${d}.${m}.`; };
const weekday = (k: string) => new Date(`${k}T12:00:00`).toLocaleDateString("de-DE", { weekday: "short" });
const nf = new Intl.NumberFormat("de-DE");

function add(into: Record<string, number>, from: Record<string, number>) {
  for (const [k, v] of Object.entries(from)) into[k] = (into[k] ?? 0) + v;
}

export function StatsView({ stats, leads }: { stats: StatsData; leads: CrmLead[] }) {
  const [range, setRange] = useState<number>(30);

  const data = useMemo(() => {
    const days: string[] = [];
    for (let i = range - 1; i >= 0; i--) days.push(dayKey(new Date(Date.now() - i * 86400000)));
    const leadsPerDay: Record<string, number> = {};
    for (const l of leads) {
      const k = dayKey(new Date(l.createdAt));
      leadsPerDay[k] = (leadsPerDay[k] ?? 0) + 1;
    }
    const series = days.map((k) => ({ day: k, ...(stats[k] ?? emptyDay()), leads: leadsPerDay[k] ?? 0 }));
    const pages: Record<string, number> = {}, sources: Record<string, number> = {}, devices: Record<string, number> = {};
    let views = 0, visitors = 0, leadsSum = 0;
    for (const s of series) {
      views += s.views; visitors += s.visitors; leadsSum += s.leads;
      add(pages, s.pages); add(sources, s.sources); add(devices, s.devices);
    }
    const sort = (o: Record<string, number>) => Object.entries(o).sort((a, b) => b[1] - a[1]);
    const checkViews = pages["/rechtsschutz-check"] ?? 0;
    return { series, views, visitors, leads: leadsSum, pages: sort(pages), sources: sort(sources), devices: sort(devices), checkViews };
  }, [stats, leads, range]);

  const max = Math.max(1, ...data.series.map((s) => s.visitors));
  const rate = data.visitors > 0 ? (data.leads / data.visitors) * 100 : null;
  const hasData = data.views > 0;
  const tickEvery = range <= 7 ? 1 : range <= 30 ? 5 : 15;

  return (
    <div className="h-full overflow-y-auto px-4 pb-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-ink-muted">Besucher werden ohne Cookies und ohne Speicherung von IP-Adressen gezählt.</p>
        <div className="flex rounded-lg bg-white p-0.5 ring-1 ring-line" role="group" aria-label="Zeitraum">
          {RANGES.map((r) => (
            <button key={r.days} onClick={() => setRange(r.days)} aria-pressed={range === r.days}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${range === r.days ? "bg-navy text-white" : "text-ink-muted hover:text-navy"}`}>
              {r.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
        <Kpi label="Besucher" value={nf.format(data.visitors)} hint="eindeutig pro Tag" />
        <Kpi label="Seitenaufrufe" value={nf.format(data.views)} hint={data.visitors ? `${(data.views / data.visitors).toLocaleString("de-DE", { maximumFractionDigits: 1 })} pro Besucher` : undefined} />
        <Kpi label="Anfragen" value={nf.format(data.leads)} hint="Check + Kontaktformular" />
        <Kpi label="Anfragequote" value={rate === null ? "–" : `${rate.toLocaleString("de-DE", { maximumFractionDigits: 1 })} %`} hint="Anfragen je Besucher" accent />
      </div>

      {!hasData && (
        <p className="mt-4 rounded-xl border border-dashed border-line bg-white/70 px-4 py-6 text-center text-sm text-ink-muted">
          Für diesen Zeitraum gibt es noch keine Besucherdaten. Die Zählung läuft ab dem Update – schau morgen wieder rein.
        </p>
      )}

      {/* Verlauf */}
      <section className="mt-4 rounded-xl border border-line bg-white p-4 sm:p-5">
        <div className="flex items-baseline justify-between">
          <h2 className="text-sm font-semibold">Besucher pro Tag</h2>
          <span className="flex items-center gap-3 text-xs text-ink-muted">
            <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-navy" />Besucher</span>
            <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-sun ring-1 ring-navy/30" />Anfragen</span>
          </span>
        </div>
        <div className="mt-4 flex h-44 items-end gap-[3px]" role="img" aria-label={`Besucher pro Tag, letzte ${range} Tage`}>
          {data.series.map((s) => (
            <div key={s.day} className="group relative flex h-full min-w-0 flex-1 flex-col justify-end">
              <div className="w-full rounded-t-[3px] bg-navy/85 transition group-hover:bg-navy" style={{ height: `${(s.visitors / max) * 100}%`, minHeight: s.visitors ? 3 : 0 }} />
              {s.leads > 0 && <span className="absolute left-1/2 grid h-4 min-w-4 -translate-x-1/2 place-items-center rounded-full bg-sun px-1 text-[9px] font-bold text-navy ring-1 ring-navy/30" style={{ bottom: `calc(${(s.visitors / max) * 100}% + 4px)` }}>{s.leads}</span>}
              <span className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-6 hidden -translate-x-1/2 whitespace-nowrap rounded-md bg-navy px-2 py-1 text-[11px] text-white shadow group-hover:block">
                {weekday(s.day)} {shortDate(s.day)}: {s.visitors} Besucher · {s.views} Aufrufe{s.leads ? ` · ${s.leads} Anfrage${s.leads > 1 ? "n" : ""}` : ""}
              </span>
            </div>
          ))}
        </div>
        <div className="mt-1.5 flex gap-[3px] text-[10px] text-ink-muted">
          {data.series.map((s, i) => (
            <span key={s.day} className="min-w-0 flex-1 overflow-visible whitespace-nowrap text-center">{(data.series.length - 1 - i) % tickEvery === 0 ? shortDate(s.day) : ""}</span>
          ))}
        </div>
      </section>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <BarList title="Meistbesuchte Seiten" rows={data.pages.map(([k, v]) => [PAGE_LABEL[k] ?? k, v])} empty="Noch keine Aufrufe" />
        <BarList title="Woher die Besucher kommen" rows={data.sources} empty="Noch keine Besucher" />
        <div className="space-y-4">
          <BarList title="Gerät" rows={data.devices} empty="Noch keine Besucher" />
          <section className="rounded-xl border border-line bg-white p-4 sm:p-5">
            <h2 className="text-sm font-semibold">Weg zur Anfrage</h2>
            <Funnel steps={[
              ["Besucher", data.visitors],
              ["Check-Aufrufe", data.checkViews],
              ["Anfragen", data.leads],
            ]} />
          </section>
        </div>
      </div>
    </div>
  );
}

function Kpi({ label, value, hint, accent }: { label: string; value: string; hint?: string; accent?: boolean }) {
  return (
    <div className={`rounded-xl border bg-white px-4 py-3 ${accent ? "border-sun ring-1 ring-sun/60" : "border-line"}`}>
      <p className="text-xs text-ink-muted">{label}</p>
      <p className="mt-1 text-2xl font-semibold tracking-[-0.03em]">{value}</p>
      {hint && <p className="mt-0.5 text-[11px] text-ink-muted">{hint}</p>}
    </div>
  );
}

function BarList({ title, rows, empty }: { title: string; rows: [string, number][]; empty: string }) {
  const total = rows.reduce((a, [, v]) => a + v, 0);
  const max = Math.max(1, ...rows.map(([, v]) => v));
  return (
    <section className="rounded-xl border border-line bg-white p-4 sm:p-5">
      <h2 className="text-sm font-semibold">{title}</h2>
      {rows.length === 0 ? (
        <p className="mt-3 text-sm text-ink-muted">{empty}</p>
      ) : (
        <ul className="mt-3 space-y-2">
          {rows.slice(0, 8).map(([k, v]) => (
            <li key={k} className="relative overflow-hidden rounded-md">
              <span className="absolute inset-y-0 left-0 rounded-md bg-sun/35" style={{ width: `${(v / max) * 100}%` }} aria-hidden />
              <span className="relative flex items-center justify-between gap-3 px-2.5 py-1.5 text-sm">
                <span className="truncate">{k}</span>
                <span className="shrink-0 tabular-nums text-ink-soft">{nf.format(v)} <span className="text-xs text-ink-muted">({Math.round((v / total) * 100)} %)</span></span>
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function Funnel({ steps }: { steps: [string, number][] }) {
  const top = Math.max(1, steps[0][1]);
  return (
    <ol className="mt-3 space-y-2">
      {steps.map(([label, v], i) => (
        <li key={label}>
          <div className="flex items-baseline justify-between text-sm">
            <span>{label}</span>
            <span className="tabular-nums text-ink-soft">{nf.format(v)}{i > 0 && steps[0][1] > 0 ? <span className="ml-1 text-xs text-ink-muted">({Math.round((v / top) * 100)} %)</span> : null}</span>
          </div>
          <div className="mt-1 h-2 overflow-hidden rounded-full bg-paper">
            <div className="h-full rounded-full bg-navy" style={{ width: `${Math.min(100, (v / top) * 100)}%` }} />
          </div>
        </li>
      ))}
    </ol>
  );
}
