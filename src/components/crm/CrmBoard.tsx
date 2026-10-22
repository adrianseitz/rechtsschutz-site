"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, Download, LogOut, Mail, Phone, RefreshCw, Search } from "lucide-react";
import { STATUSES, type CrmLead, type LeadStatus } from "@/lib/crm";

const fmt = (iso: string) => new Date(iso).toLocaleString("de-DE", { timeZone: "Europe/Berlin", day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit" });
const statusOf = (v: LeadStatus) => STATUSES.find((s) => s.value === v)!;

function ago(iso: string) {
  const m = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (m < 60) return `vor ${Math.max(1, m)} Min.`;
  const h = Math.round(m / 60);
  if (h < 24) return `vor ${h} Std.`;
  const d = Math.round(h / 24);
  return `vor ${d} ${d === 1 ? "Tag" : "Tagen"}`;
}

export function CrmBoard({ initial, storage, error }: { initial: CrmLead[]; storage: boolean; error: string }) {
  const router = useRouter();
  const [leads, setLeads] = useState(initial);
  const [filter, setFilter] = useState<LeadStatus | "alle">("alle");
  const [q, setQ] = useState("");
  const [open, setOpen] = useState<string | null>(null);
  const [saveError, setSaveError] = useState("");

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const l of leads) c[l.status] = (c[l.status] ?? 0) + 1;
    return c;
  }, [leads]);

  const shown = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return leads.filter(
      (l) =>
        (filter === "alle" || l.status === filter) &&
        (!needle || [l.name, l.email, l.phone, l.productLabel, l.situation, l.message].some((v) => v?.toLowerCase().includes(needle)))
    );
  }, [leads, filter, q]);

  async function changeStatus(id: string, status: LeadStatus) {
    const before = leads;
    setSaveError("");
    setLeads((ls) => ls.map((l) => (l.id === id ? { ...l, status, statusUpdatedAt: new Date().toISOString(), history: [...l.history, { status, at: new Date().toISOString() }] } : l)));
    try {
      const res = await fetch("/api/admin/status", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, status }) });
      if (res.status === 401) return router.replace("/admin/login");
      if (!res.ok) throw new Error();
    } catch {
      setLeads(before);
      setSaveError("Status konnte nicht gespeichert werden. Bitte erneut versuchen.");
    }
  }

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" }).catch(() => undefined);
    router.replace("/admin/login");
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-5xl px-4 pb-24 pt-6 sm:px-6 sm:pt-10">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-muted">§ Seitz Rechtsschutz · CRM</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-[-0.04em] text-navy sm:text-4xl">Anfragen <span className="font-serif font-normal italic text-ink-muted">{leads.length}</span></h1>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => router.refresh()} className="grid h-10 w-10 place-items-center rounded-full border border-line bg-white text-navy hover:border-navy" aria-label="Aktualisieren"><RefreshCw className="h-4 w-4" aria-hidden /></button>
          <a href="/api/admin/leads?format=csv" className="grid h-10 w-10 place-items-center rounded-full border border-line bg-white text-navy hover:border-navy" aria-label="Als CSV herunterladen"><Download className="h-4 w-4" aria-hidden /></a>
          <button onClick={logout} className="inline-flex h-10 items-center gap-2 rounded-full bg-navy px-4 text-sm font-medium text-white hover:bg-navy-800"><LogOut className="h-4 w-4" aria-hidden />Abmelden</button>
        </div>
      </header>

      {!storage && (
        <p className="mt-6 rounded-xl border border-orange-200 bg-orange-50 p-4 text-sm text-orange-900">
          Die Speicherung ist ausgeschaltet (<code className="font-mono">LEAD_STORAGE=none</code>). Das CRM braucht <code className="font-mono">LEAD_STORAGE=file</code> auf einem Server mit dauerhaftem Speicher.
        </p>
      )}
      {error && <p className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">Anfragen konnten nicht gelesen werden: {error}</p>}

      <div className="mt-6 flex gap-2 overflow-x-auto pb-2 [scrollbar-width:none]">
        <button onClick={() => setFilter("alle")} className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition ${filter === "alle" ? "bg-navy text-white" : "border border-line bg-white text-navy"}`}>
          Alle <span className="ml-1 opacity-60">{leads.length}</span>
        </button>
        {STATUSES.map((s) => (
          <button key={s.value} onClick={() => setFilter(s.value)} className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition ${filter === s.value ? "bg-navy text-white" : "border border-line bg-white text-navy"}`}>
            {s.label} <span className="ml-1 opacity-60">{counts[s.value] ?? 0}</span>
          </button>
        ))}
      </div>

      <label className="relative mt-3 block">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" aria-hidden />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Name, E-Mail, Telefon, Bereich …" className="input pl-11" aria-label="Suchen" />
      </label>

      {saveError && <p className="mt-3 text-sm text-red-700" role="alert">{saveError}</p>}

      <ul className="mt-5 space-y-3">
        {shown.length === 0 && (
          <li className="rounded-2xl border border-dashed border-line bg-white/60 p-10 text-center text-ink-muted">
            {leads.length === 0 ? "Noch keine Anfragen. Neue Leads aus dem Check und dem Kontaktformular erscheinen hier automatisch." : "Keine Anfrage passt zu Filter oder Suche."}
          </li>
        )}
        {shown.map((l) => {
          const s = statusOf(l.status);
          const isOpen = open === l.id;
          return (
            <li key={l.id} className="card overflow-hidden">
              <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:gap-5 sm:p-5">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${s.cls}`}>{s.label}</span>
                    <span className="rounded-full bg-paper px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.12em] text-ink-muted">{l.type === "lead" ? "Check" : "Kontakt"}</span>
                    <span className="text-xs text-ink-muted" title={fmt(l.createdAt)}>{ago(l.createdAt)}</span>
                  </div>
                  <p className="mt-1.5 truncate text-lg font-semibold tracking-[-0.02em] text-navy">{l.name}</p>
                  <p className="truncate text-sm text-ink-soft">
                    {l.productLabel}
                    {l.situation ? ` · ${l.situation}` : l.requestType ? ` · ${l.requestType}` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {l.phone && (
                    <a href={`tel:${l.phone.replace(/[^+0-9]/g, "")}`} className="grid h-10 w-10 place-items-center rounded-full bg-sun text-navy" aria-label={`${l.name} anrufen`}><Phone className="h-4 w-4" aria-hidden /></a>
                  )}
                  <a href={`mailto:${l.email}`} className="grid h-10 w-10 place-items-center rounded-full border border-line bg-white text-navy" aria-label={`${l.name} eine E-Mail schreiben`}><Mail className="h-4 w-4" aria-hidden /></a>
                  <select
                    value={l.status}
                    onChange={(e) => changeStatus(l.id, e.target.value as LeadStatus)}
                    className="h-10 rounded-full border border-line bg-white pl-3 pr-8 text-sm font-medium text-navy focus:border-navy focus:outline-none"
                    aria-label="Status ändern"
                  >
                    {STATUSES.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                  <button onClick={() => setOpen(isOpen ? null : l.id)} className="grid h-10 w-10 place-items-center rounded-full border border-line bg-white text-navy" aria-expanded={isOpen} aria-label="Details">
                    <ChevronDown className={`h-4 w-4 transition ${isOpen ? "rotate-180" : ""}`} aria-hidden />
                  </button>
                </div>
              </div>
              {isOpen && (
                <dl className="grid gap-x-6 gap-y-3 border-t border-line bg-surface p-4 text-sm sm:grid-cols-2 sm:p-5">
                  <Row k="Eingang" v={fmt(l.createdAt)} />
                  <Row k="E-Mail" v={l.email} />
                  <Row k="Telefon" v={l.phone} />
                  <Row k="Gewünschter Kontakt" v={l.contactMethod} />
                  <Row k="Situation" v={l.situation} />
                  <Row k="Beginn" v={l.beginn} />
                  <Row k="Bestehender Rechtsschutz" v={l.bestand} />
                  <Row k="Anliegen" v={l.requestType} />
                  <Row k="Wunschzeit" v={l.preferredTime} />
                  <Row k="Quelle" v={l.channel + (l.campaign ? ` · ${l.campaign}` : "")} />
                  <Row k="Einstiegsseite" v={l.landingPage} />
                  <Row k="Werbe-Einwilligung" v={l.marketingConsent ? "ja" : "nein"} />
                  {l.message && <div className="sm:col-span-2"><dt className="text-ink-muted">Nachricht</dt><dd className="mt-0.5 whitespace-pre-wrap text-navy">{l.message}</dd></div>}
                  {l.history.length > 0 && (
                    <div className="sm:col-span-2">
                      <dt className="text-ink-muted">Verlauf</dt>
                      <dd className="mt-1 flex flex-wrap gap-2">
                        {l.history.map((h, i) => <span key={i} className="rounded-full bg-white px-2.5 py-1 text-xs text-ink-soft ring-1 ring-line">{statusOf(h.status).label} · {fmt(h.at)}</span>)}
                      </dd>
                    </div>
                  )}
                </dl>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function Row({ k, v }: { k: string; v?: string }) {
  if (!v) return null;
  return (
    <div className="min-w-0">
      <dt className="text-ink-muted">{k}</dt>
      <dd className="mt-0.5 break-words text-navy">{v}</dd>
    </div>
  );
}
