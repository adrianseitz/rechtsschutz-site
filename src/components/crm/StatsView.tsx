"use client";

import { useMemo, useState } from "react";
import { Download } from "lucide-react";
import { emptyDay, PAGE_LABEL, type StatsData } from "@/lib/stats";
import { channelShort, reachedAppointment, type CrmLead } from "@/lib/crm";

const RANGES = [
  { days: 7, label: "7 Tage" },
  { days: 30, label: "30 Tage" },
  { days: 90, label: "90 Tage" },
] as const;

const dayKey = (d: Date) => d.toLocaleDateString("sv-SE", { timeZone: "Europe/Berlin" });
const shortDate = (k: string) => { const [, m, d] = k.split("-"); return `${d}.${m}.`; };
const weekday = (k: string) => new Date(`${k}T12:00:00`).toLocaleDateString("de-DE", { weekday: "short" });
const nf = new Intl.NumberFormat("de-DE");
const eur = new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });

function duration(ms: number) {
  const m = Math.round(ms / 60000);
  if (m < 60) return `${Math.max(1, m)} Min.`;
  const h = m / 60;
  if (h < 48) return `${h.toLocaleString("de-DE", { maximumFractionDigits: 1 })} Std.`;
  return `${Math.round(h / 24)} Tage`;
}

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
    const events: Record<string, number> = {};
    for (const s of series) add(events, s.events ?? {});
    const sort = (o: Record<string, number>) => Object.entries(o).sort((a, b) => b[1] - a[1]);
    const checkViews = pages["/rechtsschutz-check"] ?? 0;

    // Auswertung der Anfragen im Zeitraum: Was bringt welche Quelle / welcher Suchbegriff?
    const since = Date.now() - range * 86400000;
    const inRange = leads.filter((l) => new Date(l.createdAt).getTime() >= since);
    type Row = { key: string; leads: number; appointments: number; won: number; value: number };
    const group = (keyOf: (l: CrmLead) => string | undefined) => {
      const m = new Map<string, Row>();
      for (const l of inRange) {
        const key = keyOf(l);
        if (!key) continue;
        const r = m.get(key) ?? { key, leads: 0, appointments: 0, won: 0, value: 0 };
        r.leads++;
        if (reachedAppointment(l)) r.appointments++;
        if (l.status === "abschluss") { r.won++; r.value += l.value ?? 0; }
        m.set(key, r);
      }
      return [...m.values()].sort((a, b) => b.leads - a.leads);
    };
    const responses = inRange.filter((l) => l.firstResponseAt).map((l) => new Date(l.firstResponseAt!).getTime() - new Date(l.createdAt).getTime()).filter((ms) => ms >= 0).sort((a, b) => a - b);
    const median = responses.length ? responses[Math.floor((responses.length - 1) / 2)] : null;
    const wonLeads = inRange.filter((l) => l.status === "abschluss");
    return {
      series, views, visitors, leads: leadsSum, pages: sort(pages), sources: sort(sources), devices: sort(devices), checkViews, events,
      bySource: group((l) => channelShort(l.channel)), byKeyword: group((l) => l.keyword?.toLowerCase()),
      median, waiting: leads.filter((l) => l.status === "neu" && !l.firstResponseAt).length,
      won: wonLeads.length, wonValue: wonLeads.reduce((a, l) => a + (l.value ?? 0), 0),
      clickIds: { termin: leads.filter((l) => l.hasClickId && reachedAppointment(l)).length, abschluss: leads.filter((l) => l.hasClickId && l.status === "abschluss").length },
    };
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

      <div className="mt-2 grid grid-cols-2 gap-2 sm:mt-3 sm:grid-cols-4 sm:gap-3">
        <Kpi label="Reaktionszeit (Mittel)" value={data.median === null ? "–" : duration(data.median)} hint="bis zum ersten Kontaktversuch" />
        <Kpi label="Noch nicht kontaktiert" value={nf.format(data.waiting)} hint={data.waiting ? "am besten sofort anrufen" : "alles erledigt"} />
        <Kpi label="Gewonnen" value={nf.format(data.won)} hint={data.leads ? `${Math.round((data.won / Math.max(1, data.leads)) * 100)} % der Anfragen` : undefined} />
        <Kpi label="Jahresbeiträge gewonnen" value={data.wonValue ? eur.format(data.wonValue) : "–"} hint="laut deinen Einträgen" />
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

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <ResultTable title="Was jede Quelle bringt" first="Quelle" rows={data.bySource} empty="Im Zeitraum gibt es noch keine Anfragen." />
        <ResultTable title="Suchbegriffe aus Anzeigen" first="Suchbegriff" rows={data.byKeyword}
          empty="Noch keine Suchbegriffe erfasst. Trage dafür in Google Ads das URL-Suffix aus den Einstellungen ein – dann siehst du hier, welches Keyword Anfragen bringt." />
        <section className="rounded-xl border border-line bg-white p-4 sm:p-5">
          <h2 className="text-sm font-semibold">Wo Besucher im Check aussteigen</h2>
          {(data.events.check_start ?? 0) === 0 ? (
            <p className="mt-3 text-sm text-ink-muted">Noch keine Daten – die Zählung läuft ab diesem Update.</p>
          ) : (
            <Funnel steps={[
              ["Check gestartet", data.events.check_start ?? 0],
              ["Situation gewählt", data.events.step_situation ?? 0],
              ["Beginn gewählt", data.events.step_beginn ?? 0],
              ["Kontaktformular erreicht", data.events.step_bestand ?? 0],
              ["Anfrage abgeschickt", data.events.lead ?? 0],
            ]} />
          )}
          <p className="mt-4 flex items-baseline justify-between border-t border-line pt-3 text-sm">
            <span>Klicks auf „Anrufen“</span><span className="tabular-nums font-semibold">{nf.format(data.events.call ?? 0)}</span>
          </p>
        </section>
      </div>

      <section className="mt-4 rounded-xl border border-line bg-white p-4 sm:p-5">
        <h2 className="text-sm font-semibold">Google Ads zeigen, welche Anfragen gut waren</h2>
        <p className="mt-1.5 max-w-3xl text-sm leading-6 text-ink-soft">
          Lade die Liste herunter und importiere sie in Google Ads unter <b>Zielvorhaben → Conversions → Uploads</b>. Google lernt dann, nach Besuchern zu suchen, die deinen echten Kunden ähneln.
          Enthalten sind nur die Klick-Kennung von Google, das Datum und der Wert – keine Namen oder Kontaktdaten. Erfasst werden nur Anfragen von Besuchern, die der Werbe-Messung zugestimmt haben.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <ExportLink href="/api/admin/ads-export?kind=termin" label={`Termine & Angebote (${data.clickIds.termin})`} disabled={data.clickIds.termin === 0} />
          <ExportLink href="/api/admin/ads-export?kind=abschluss" label={`Abschlüsse (${data.clickIds.abschluss})`} disabled={data.clickIds.abschluss === 0} />
        </div>
        <p className="mt-2.5 text-xs text-ink-muted">Dafür legst du in Google Ads einmalig zwei Conversion-Aktionen vom Typ „Import“ an, mit genau diesen Namen: <code className="font-mono">CRM Termin</code> und <code className="font-mono">CRM Abschluss</code>.</p>
      </section>
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

type ResultRow = { key: string; leads: number; appointments: number; won: number; value: number };
function ResultTable({ title, first, rows, empty }: { title: string; first: string; rows: ResultRow[]; empty: string }) {
  return (
    <section className="rounded-xl border border-line bg-white p-4 sm:p-5">
      <h2 className="text-sm font-semibold">{title}</h2>
      {rows.length === 0 ? (
        <p className="mt-3 text-sm leading-6 text-ink-muted">{empty}</p>
      ) : (
        <table className="mt-3 w-full text-sm">
          <thead>
            <tr className="text-left text-[11px] uppercase tracking-[0.06em] text-ink-muted">
              <th className="pb-2 font-medium">{first}</th>
              <th className="pb-2 text-right font-medium">Anfragen</th>
              <th className="pb-2 text-right font-medium">Termine</th>
              <th className="pb-2 text-right font-medium">Gewonnen</th>
            </tr>
          </thead>
          <tbody>
            {rows.slice(0, 8).map((r) => (
              <tr key={r.key} className="border-t border-line">
                <td className="max-w-[9rem] truncate py-2 pr-2" title={r.key}>{r.key}</td>
                <td className="py-2 text-right tabular-nums">{r.leads}</td>
                <td className="py-2 text-right tabular-nums text-ink-soft">{r.appointments}</td>
                <td className="py-2 text-right tabular-nums">
                  <span className={r.won ? "font-semibold text-emerald-700" : "text-ink-muted"}>{r.won}</span>
                  {r.value > 0 && <span className="block text-[11px] text-ink-muted">{eur.format(r.value)}</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}

function ExportLink({ href, label, disabled }: { href: string; label: string; disabled?: boolean }) {
  if (disabled) return <span className="inline-flex items-center gap-2 rounded-full border border-line px-4 py-2.5 text-sm text-ink-muted"><Download className="h-4 w-4" aria-hidden />{label}</span>;
  return <a href={href} className="inline-flex items-center gap-2 rounded-full bg-navy px-4 py-2.5 text-sm font-semibold text-white hover:bg-navy-800"><Download className="h-4 w-4" aria-hidden />{label}</a>;
}
