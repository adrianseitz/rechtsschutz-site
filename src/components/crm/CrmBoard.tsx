"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import {
  AlertCircle, BarChart3, Check, Columns3, Download, List, LogOut, Settings, Mail, Phone, RefreshCw, RotateCcw, Search, Trash2, X,
} from "lucide-react";
import { STATUSES, type CrmLead, type LeadStatus } from "@/lib/crm";
import type { StatsData } from "@/lib/stats";
import { StatsView } from "./StatsView";
import { SettingsView } from "./SettingsView";

const fmt = (iso: string) =>
  new Date(iso).toLocaleString("de-DE", { timeZone: "Europe/Berlin", day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
const statusOf = (v: LeadStatus) => STATUSES.find((s) => s.value === v)!;
const STAGES = STATUSES.filter((s) => s.stage);

function ago(iso: string) {
  const m = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (m < 60) return `${Math.max(1, m)} Min.`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} Std.`;
  const d = Math.round(h / 24);
  return `${d} ${d === 1 ? "Tag" : "Tage"}`;
}

const initials = (name: string) =>
  name.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join("") || "?";

/** Neue Anfrage, die länger als 24 Stunden unbearbeitet ist. */
/** Keine Abschluss-Anfrage, seit über 12 Monaten ohne Aktivität → laut Datenschutzerklärung zu löschen. */
const retentionDue = (l: CrmLead) =>
  l.status !== "abschluss" && Date.now() - new Date(l.statusUpdatedAt ?? l.createdAt).getTime() > 365 * 24 * 3600 * 1000;

const overdue = (l: CrmLead) => l.status === "neu" && Date.now() - new Date(l.createdAt).getTime() > 24 * 3600 * 1000;

const channelShort = (c: string) =>
  c.startsWith("Google Ads") ? "Google Ads" : c.startsWith("Meta Ads") ? "Meta Ads" : c.startsWith("Kampagne") ? "Kampagne" : c.startsWith("Suchmaschine") ? "Google organisch" : c.startsWith("Social") ? "Social" : c.startsWith("Verweis") ? "Verweis" : "Direkt";

type View = "pipeline" | "liste" | "statistik" | "einstellungen";
const VIEWS: { v: View; label: string }[] = [{ v: "pipeline", label: "Pipeline" }, { v: "liste", label: "Liste" }, { v: "statistik", label: "Statistik" }, { v: "einstellungen", label: "Einstellungen" }];
const ViewIcon = ({ v }: { v: View }) => (v === "pipeline" ? <Columns3 className="h-4 w-4" aria-hidden /> : v === "liste" ? <List className="h-4 w-4" aria-hidden /> : v === "statistik" ? <BarChart3 className="h-4 w-4" aria-hidden /> : <Settings className="h-4 w-4" aria-hidden />);

export function CrmBoard({ initial, storage, error, stats: traffic = {} }: { initial: CrmLead[]; storage: boolean; error: string; stats?: StatsData }) {
  const router = useRouter();
  const [leads, setLeads] = useState(initial);
  const [view, setView] = useState<View>("pipeline");
  const [q, setQ] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);
  const [toast, setToast] = useState("");
  const [dragId, setDragId] = useState<string | null>(null);
  const [overCol, setOverCol] = useState<LeadStatus | null>(null);

  useEffect(() => setLeads(initial), [initial]);
  useEffect(() => {
    try {
      const v = localStorage.getItem("rs_crm_view");
      if (v === "liste" || v === "pipeline" || v === "statistik" || v === "einstellungen") setView(v);
    } catch { /* */ }
  }, []);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 3500);
    return () => clearTimeout(t);
  }, [toast]);

  const switchView = (v: View) => {
    setView(v);
    try { localStorage.setItem("rs_crm_view", v); } catch { /* */ }
  };

  const filtered = useMemo(() => {
    const n = q.trim().toLowerCase();
    if (!n) return leads;
    return leads.filter((l) => [l.name, l.email, l.phone, l.productLabel, l.situation, l.message, l.channel].some((v) => v?.toLowerCase().includes(n)));
  }, [leads, q]);

  const stats = useMemo(() => {
    const weekAgo = Date.now() - 7 * 24 * 3600 * 1000;
    const won = leads.filter((l) => l.status === "abschluss").length;
    const lost = leads.filter((l) => l.status === "verloren").length;
    return {
      open: leads.filter((l) => statusOf(l.status).stage).length,
      week: leads.filter((l) => new Date(l.createdAt).getTime() > weekAgo).length,
      overdue: leads.filter(overdue).length,
      won,
      rate: won + lost > 0 ? Math.round((won / (won + lost)) * 100) : null,
    };
  }, [leads]);

  const current = leads.find((l) => l.id === openId) ?? null;

  async function changeStatus(id: string, status: LeadStatus) {
    const lead = leads.find((l) => l.id === id);
    if (!lead || lead.status === status) return;
    const before = leads;
    const at = new Date().toISOString();
    setLeads((ls) => ls.map((l) => (l.id === id ? { ...l, status, statusUpdatedAt: at, history: [...l.history, { status, at }] } : l)));
    try {
      const res = await fetch("/api/admin/status", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, status }) });
      if (res.status === 401) return router.replace("/admin/login");
      if (!res.ok) throw new Error();
      setToast(`${lead.name} → ${statusOf(status).label}`);
    } catch {
      setLeads(before);
      setToast("Speichern fehlgeschlagen – bitte erneut versuchen.");
    }
  }

  async function remove(id: string) {
    try {
      const res = await fetch("/api/admin/delete", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
      if (res.status === 401) return router.replace("/admin/login");
      if (!res.ok) throw new Error();
      setLeads((ls) => ls.filter((l) => l.id !== id));
      setOpenId(null);
      setToast("Anfrage gelöscht.");
    } catch {
      setToast("Löschen fehlgeschlagen – bitte erneut versuchen.");
    }
  }

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" }).catch(() => undefined);
    router.replace("/admin/login");
    router.refresh();
  }

  return (
    <div className="flex h-[100dvh] overflow-hidden bg-[#F6F6F2] text-navy">
      {/* Seitenleiste */}
      <aside className="hidden w-[68px] shrink-0 flex-col items-center gap-2 bg-navy py-4 md:flex">
        <span className="mb-3 grid h-10 w-10 place-items-center rounded-xl bg-sun font-serif text-xl italic text-navy" aria-hidden>§</span>
        <NavBtn label="Pipeline" active={view === "pipeline"} onClick={() => switchView("pipeline")}><Columns3 className="h-5 w-5" /></NavBtn>
        <NavBtn label="Liste" active={view === "liste"} onClick={() => switchView("liste")}><List className="h-5 w-5" /></NavBtn>
        <NavBtn label="Statistik" active={view === "statistik"} onClick={() => switchView("statistik")}><BarChart3 className="h-5 w-5" /></NavBtn>
        <NavBtn label="Einstellungen" active={view === "einstellungen"} onClick={() => switchView("einstellungen")}><Settings className="h-5 w-5" /></NavBtn>
        <div className="flex-1" />
        <a href="/api/admin/leads?format=csv" className="grid h-11 w-11 place-items-center rounded-xl text-white/60 transition hover:bg-white/10 hover:text-white" aria-label="Als CSV exportieren" title="Export (CSV)"><Download className="h-5 w-5" /></a>
        <button onClick={logout} className="grid h-11 w-11 place-items-center rounded-xl text-white/60 transition hover:bg-white/10 hover:text-white" aria-label="Abmelden" title="Abmelden"><LogOut className="h-5 w-5" /></button>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Kopfzeile */}
        <header className="flex shrink-0 flex-wrap items-center gap-3 border-b border-line bg-white px-4 py-3 md:h-16 md:flex-nowrap md:py-0">
          <h1 className="text-lg font-semibold tracking-[-0.02em]">{view === "statistik" ? "Statistik" : view === "einstellungen" ? "Einstellungen" : "Anfragen"}</h1>
          <div className="flex rounded-lg bg-paper p-0.5" role="tablist" aria-label="Ansicht">
            {VIEWS.map(({ v, label }) => (
              <button key={v} role="tab" aria-selected={view === v} aria-label={label} onClick={() => switchView(v)}
                className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition ${view === v ? "bg-white text-navy shadow-sm" : "text-ink-muted hover:text-navy"}`}>
                <ViewIcon v={v} />
                <span className="hidden sm:inline">{label}</span>
              </button>
            ))}
          </div>
          <label className={`relative order-last w-full md:order-none md:ml-4 md:w-auto md:max-w-sm md:flex-1 ${view === "statistik" || view === "einstellungen" ? "hidden" : ""}`}>
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" aria-hidden />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Suchen: Name, E-Mail, Telefon …" aria-label="Suchen"
              className="h-10 w-full rounded-lg border border-line bg-[#F6F6F2] pl-9 pr-3 text-sm placeholder:text-ink-muted focus:border-navy focus:bg-white focus:outline-none" />
          </label>
          <div className="ml-auto flex items-center gap-1.5">
            <IconBtn label="Aktualisieren" onClick={() => router.refresh()}><RefreshCw className="h-4 w-4" /></IconBtn>
            <a href="/api/admin/leads?format=csv" className="grid h-10 w-10 place-items-center rounded-lg text-ink-soft transition hover:bg-paper hover:text-navy md:hidden" aria-label="Als CSV exportieren"><Download className="h-4 w-4" /></a>
            <IconBtn label="Abmelden" onClick={logout} className="md:hidden"><LogOut className="h-4 w-4" /></IconBtn>
          </div>
        </header>

        {/* Kennzahlen */}
        {view !== "statistik" && view !== "einstellungen" && (
          <div className="flex shrink-0 gap-2 overflow-x-auto px-4 pt-3 [scrollbar-width:none] sm:grid sm:grid-cols-4 sm:gap-3 sm:overflow-visible sm:pt-4">
            <Stat label="Offen in der Pipeline" value={stats.open} />
            <Stat label="Neu (7 Tage)" value={stats.week} />
            <Stat label="Unbearbeitet > 24 Std." value={stats.overdue} warn={stats.overdue > 0} />
            <Stat label="Abschlussquote" value={stats.rate === null ? "–" : `${stats.rate} %`} sub={`${stats.won} gewonnen`} />
          </div>
        )}

        {(!storage || error) && (
          <div className="mx-4 mt-3 rounded-lg border border-orange-200 bg-orange-50 px-4 py-3 text-sm text-orange-900">
            {!storage ? <>Die Speicherung ist ausgeschaltet (<code className="font-mono">LEAD_STORAGE=none</code>). Das CRM braucht einen Server mit dauerhaftem Speicher.</> : <>Anfragen konnten nicht gelesen werden: {error}</>}
          </div>
        )}

        {/* Inhalt */}
        <div className="min-h-0 flex-1 pt-4">
          {view === "einstellungen" ? (
            <SettingsView />
          ) : view === "statistik" ? (
            <StatsView stats={traffic} leads={leads} />
          ) : view === "pipeline" ? (
            <div className="flex h-full snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-4 md:snap-none">
              {STATUSES.map((col) => {
                const items = filtered.filter((l) => l.status === col.value);
                const isOver = overCol === col.value && dragId !== null;
                return (
                  <section key={col.value} aria-label={col.label}
                    onDragOver={(e) => { e.preventDefault(); if (overCol !== col.value) setOverCol(col.value); }}
                    onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setOverCol(null); }}
                    onDrop={(e) => { e.preventDefault(); const id = e.dataTransfer.getData("text/plain"); setOverCol(null); setDragId(null); if (id) changeStatus(id, col.value); }}
                    className={`flex w-[84vw] max-w-[300px] shrink-0 snap-start flex-col rounded-xl transition md:w-auto md:min-w-[200px] md:max-w-none md:flex-1 ${isOver ? "bg-sun/25 ring-2 ring-sun" : col.stage ? "bg-[#ECEBE5]" : "bg-[#ECEBE5]/60"}`}>
                    <div className="shrink-0 px-3 pb-2 pt-3">
                      <div className="h-[3px] w-full rounded-full" style={{ background: col.dot }} />
                      <div className="mt-2.5 flex items-baseline justify-between">
                        <h2 className="text-sm font-semibold">{col.label}</h2>
                        <span className="font-mono text-xs text-ink-muted">{items.length}</span>
                      </div>
                    </div>
                    <div className="min-h-0 flex-1 space-y-2 overflow-y-auto px-2 pb-3">
                      <AnimatePresence initial={false}>
                        {items.map((l) => (
                          <motion.div layout key={l.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: dragId === l.id ? 0.4 : 1, y: 0 }} exit={{ opacity: 0, scale: 0.96 }} transition={{ duration: 0.18 }}>
                          <button type="button" draggable data-lead={l.id}
                            onDragStart={(e) => { e.dataTransfer.setData("text/plain", l.id); e.dataTransfer.effectAllowed = "move"; setDragId(l.id); }}
                            onDragEnd={() => { setDragId(null); setOverCol(null); }}
                            onClick={() => setOpenId(l.id)}
                            className="group block w-full cursor-grab rounded-lg border border-black/[0.06] bg-white p-3 text-left shadow-[0_1px_2px_rgba(11,11,10,0.06)] transition hover:border-black/15 hover:shadow-[0_4px_14px_-6px_rgba(11,11,10,0.25)] active:cursor-grabbing">
                            <div className="flex items-start gap-2.5">
                              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-[11px] font-semibold" style={{ background: `${col.dot}33`, color: "#0B0B0A" }}>{initials(l.name)}</span>
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-[14px] font-semibold leading-tight">{l.name}</p>
                                <p className="mt-0.5 truncate text-xs text-ink-soft">{l.productLabel}</p>
                              </div>
                              {overdue(l) && <AlertCircle className="h-4 w-4 shrink-0 text-rose-500" aria-label="Seit über 24 Stunden unbearbeitet" />}
                              {retentionDue(l) && <Trash2 className="h-4 w-4 shrink-0 text-neutral-500" aria-label="Löschfrist erreicht" />}
                            </div>
                            {(l.situation || l.requestType) && <p className="mt-2 line-clamp-2 text-xs leading-snug text-ink-muted">{l.situation ?? l.requestType}{l.einheiten ? ` · ${l.einheiten}` : ""}</p>}
                            <div className="mt-2.5 flex items-center gap-2 text-[11px] text-ink-muted">
                              <span className="truncate whitespace-nowrap rounded bg-paper px-1.5 py-0.5 font-medium text-ink-soft">{channelShort(l.channel)}</span>
                              <span className="hidden whitespace-nowrap rounded bg-paper px-1.5 py-0.5 2xl:inline">{l.type === "lead" ? "Check" : "Kontakt"}</span>
                              <span className="ml-auto flex shrink-0 items-center gap-1.5 whitespace-nowrap">
                                <Phone className={`h-3 w-3 ${l.phone ? "text-navy" : "opacity-30"}`} aria-hidden />
                                <span title={fmt(l.createdAt)}>{ago(l.createdAt)}</span>
                              </span>
                            </div>
                          </button>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                      {items.length === 0 && (
                        <p className={`rounded-lg border border-dashed px-3 py-6 text-center text-xs ${isOver ? "border-navy/40 text-navy" : "border-black/10 text-ink-muted"}`}>
                          {isOver ? "Hier ablegen" : "Keine Anfragen"}
                        </p>
                      )}
                    </div>
                  </section>
                );
              })}
            </div>
          ) : (
            <div className="h-full overflow-auto px-4 pb-6">
              <table className="w-full min-w-[720px] border-separate border-spacing-0 overflow-hidden rounded-xl border border-line bg-white text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-[0.08em] text-ink-muted">
                    {["Name", "Bereich", "Phase", "Quelle", "Kontakt", "Eingang"].map((h) => <th key={h} className="sticky top-0 border-b border-line bg-[#FAFAF7] px-4 py-3 font-medium">{h}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 && <tr><td colSpan={6} className="px-4 py-12 text-center text-ink-muted">{leads.length === 0 ? "Noch keine Anfragen." : "Keine Treffer."}</td></tr>}
                  {filtered.map((l) => {
                    const s = statusOf(l.status);
                    return (
                      <tr key={l.id} onClick={() => setOpenId(l.id)} className="cursor-pointer transition hover:bg-[#FAFAF7]">
                        <td className="border-b border-line px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-[11px] font-semibold" style={{ background: `${s.dot}33` }}>{initials(l.name)}</span>
                            <span className="font-semibold">{l.name}</span>
                            {overdue(l) && <AlertCircle className="h-4 w-4 text-rose-500" aria-label="Unbearbeitet" />}
                          </div>
                        </td>
                        <td className="border-b border-line px-4 py-3 text-ink-soft">{l.productLabel}</td>
                        <td className="border-b border-line px-4 py-3"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${s.cls}`}>{s.label}</span></td>
                        <td className="border-b border-line px-4 py-3 text-ink-soft">{channelShort(l.channel)}</td>
                        <td className="border-b border-line px-4 py-3 text-ink-soft">{l.phone ?? l.email}</td>
                        <td className="border-b border-line px-4 py-3 text-ink-muted" title={fmt(l.createdAt)}>vor {ago(l.createdAt)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Detailansicht */}
      <AnimatePresence>
        {current && <Drawer key={current.id} lead={current} onClose={() => setOpenId(null)} onStatus={(s) => changeStatus(current.id, s)} onDelete={() => remove(current.id)} />}
      </AnimatePresence>

      <AnimatePresence>
        {toast && (
          <motion.div role="status" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 16 }}
            className="fixed bottom-5 left-1/2 z-[80] -translate-x-1/2 rounded-full bg-navy px-5 py-2.5 text-sm font-medium text-white shadow-lg">
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Drawer({ lead: l, onClose, onStatus, onDelete }: { lead: CrmLead; onClose: () => void; onStatus: (s: LeadStatus) => void; onDelete: () => void }) {
  const [confirm, setConfirm] = useState(false);
  const s = statusOf(l.status);
  const stageIdx = STAGES.findIndex((x) => x.value === l.status);
  const closed = !s.stage;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <>
      <motion.div className="fixed inset-0 z-[60] bg-navy/30" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} aria-hidden />
      <motion.aside role="dialog" aria-modal="true" aria-label={`Anfrage von ${l.name}`}
        initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", stiffness: 380, damping: 38 }}
        className="fixed inset-y-0 right-0 z-[70] flex w-full flex-col bg-white shadow-2xl sm:w-[460px]">
        <div className="flex shrink-0 items-start gap-3 border-b border-line px-5 pb-4 pt-5">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full text-sm font-semibold" style={{ background: `${s.dot}40` }}>{initials(l.name)}</span>
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-xl font-semibold tracking-[-0.02em]">{l.name}</h2>
            <p className="truncate text-sm text-ink-soft">{l.productLabel} · {l.type === "lead" ? "Rechtsschutz-Check" : "Kontaktformular"}</p>
          </div>
          <button onClick={onClose} className="grid h-9 w-9 place-items-center rounded-lg text-ink-soft hover:bg-paper hover:text-navy" aria-label="Schließen"><X className="h-5 w-5" /></button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
          {/* Phasenleiste */}
          <div className="px-5 pt-5">
            <div className="flex" role="group" aria-label="Phase">
              {STAGES.map((st, i) => {
                const done = !closed && i <= stageIdx;
                const active = !closed && i === stageIdx;
                return (
                  <button key={st.value} onClick={() => onStatus(st.value)} title={st.label} aria-pressed={active}
                    className={`relative h-9 flex-1 text-[11px] font-semibold transition sm:text-xs ${active ? "bg-sun text-navy" : done ? "bg-navy text-white" : "bg-[#ECEBE5] text-ink-muted hover:bg-[#E2E1DA]"} ${i === 0 ? "rounded-l-md" : "-ml-px"} ${i === STAGES.length - 1 ? "rounded-r-md" : ""}`}
                    style={{ clipPath: i === STAGES.length - 1 ? (i === 0 ? undefined : "polygon(0 0,100% 0,100% 100%,0 100%,9px 50%)") : i === 0 ? "polygon(0 0,calc(100% - 9px) 0,100% 50%,calc(100% - 9px) 100%,0 100%)" : "polygon(0 0,calc(100% - 9px) 0,100% 50%,calc(100% - 9px) 100%,0 100%,9px 50%)" }}>
                    {st.label}
                  </button>
                );
              })}
            </div>
            <div className="mt-3 flex items-center gap-2">
              {closed ? (
                <>
                  <span className={`rounded-full px-3 py-1.5 text-sm font-semibold ${s.cls}`}>{s.label}</span>
                  <button onClick={() => onStatus("angebot")} className="ml-auto inline-flex items-center gap-1.5 rounded-lg border border-line px-3 py-2 text-sm font-medium hover:border-navy"><RotateCcw className="h-4 w-4" aria-hidden />Wieder öffnen</button>
                </>
              ) : (
                <>
                  <span className="text-xs text-ink-muted">Seit {ago(l.statusUpdatedAt ?? l.createdAt)} in „{s.label}“</span>
                  <button onClick={() => onStatus("abschluss")} className="ml-auto inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-2 text-sm font-semibold text-white hover:bg-emerald-700"><Check className="h-4 w-4" aria-hidden />Gewonnen</button>
                  <button onClick={() => onStatus("verloren")} className="inline-flex items-center gap-1.5 rounded-lg bg-rose-600 px-3.5 py-2 text-sm font-semibold text-white hover:bg-rose-700"><X className="h-4 w-4" aria-hidden />Verloren</button>
                </>
              )}
            </div>
          </div>

          {/* Schnellaktionen */}
          <div className="grid grid-cols-2 gap-2 px-5 pt-5">
            {l.phone ? (
              <a href={`tel:${l.phone.replace(/[^+0-9]/g, "")}`} className="flex items-center justify-center gap-2 rounded-lg bg-sun py-3 text-sm font-semibold text-navy hover:brightness-95"><Phone className="h-4 w-4" aria-hidden />Anrufen</a>
            ) : (
              <span className="flex items-center justify-center gap-2 rounded-lg bg-paper py-3 text-sm text-ink-muted">Keine Telefonnummer</span>
            )}
            <a href={`mailto:${l.email}?subject=${encodeURIComponent("Ihre Anfrage zum " + l.productLabel)}`} className="flex items-center justify-center gap-2 rounded-lg border border-line py-3 text-sm font-semibold hover:border-navy"><Mail className="h-4 w-4" aria-hidden />E-Mail</a>
          </div>

          {retentionDue(l) && (
            <p className="mx-5 mt-4 flex items-center gap-2 rounded-lg bg-neutral-100 px-3 py-2.5 text-sm text-neutral-800"><Trash2 className="h-4 w-4 shrink-0" aria-hidden />Seit über 12 Monaten ohne Aktivität – laut Datenschutzerklärung jetzt löschen.</p>
          )}
          {overdue(l) && (
            <p className="mx-5 mt-4 flex items-center gap-2 rounded-lg bg-rose-50 px-3 py-2.5 text-sm text-rose-800"><AlertCircle className="h-4 w-4 shrink-0" aria-hidden />Seit {ago(l.createdAt)} unbearbeitet – am besten heute melden.</p>
          )}

          <Section title="Kontakt">
            <Field k="E-Mail" v={l.email} wide />
            <Field k="Telefon" v={l.phone} />
            <Field k="Gewünschter Kontaktweg" v={l.contactMethod === "telefon" ? "Telefon" : l.contactMethod === "email" ? "E-Mail" : l.contactMethod} />
          </Section>
          <Section title="Anfrage">
            <Field k="Situation" v={l.situation} />
            <Field k="Wohneinheiten" v={l.einheiten} />
            <Field k="Gewünschter Beginn" v={l.beginn} />
            <Field k="Bestehender Rechtsschutz" v={l.bestand} />
            <Field k="Anliegen" v={l.requestType} />
            <Field k="Wunschzeit" v={l.preferredTime} />
            {l.message && <div className="col-span-2"><dt className="text-xs text-ink-muted">Nachricht</dt><dd className="mt-1 whitespace-pre-wrap rounded-lg bg-[#FAFAF7] p-3 text-sm">{l.message}</dd></div>}
          </Section>
          <Section title="Herkunft">
            <Field k="Quelle" v={l.channel} />
            <Field k="Kampagne" v={l.campaign} />
            <Field k="Einstiegsseite" v={l.landingPage} />
            <Field k="Werbe-Einwilligung" v={l.marketingConsent ? "Ja" : "Nein"} />
          </Section>

          <div className="px-5 pb-6 pt-5">
            <h3 className="text-xs font-semibold uppercase tracking-[0.1em] text-ink-muted">Verlauf</h3>
            <ol className="mt-3 space-y-3 border-l border-line pl-4">
              {[...l.history].reverse().map((h, i) => (
                <li key={i} className="relative text-sm">
                  <span className="absolute -left-[21px] top-1.5 h-2.5 w-2.5 rounded-full ring-2 ring-white" style={{ background: statusOf(h.status).dot }} />
                  Phase <b>{statusOf(h.status).label}</b>
                  <span className="block text-xs text-ink-muted">{fmt(h.at)}</span>
                </li>
              ))}
              <li className="relative text-sm">
                <span className="absolute -left-[21px] top-1.5 h-2.5 w-2.5 rounded-full bg-navy ring-2 ring-white" />
                Anfrage eingegangen
                <span className="block text-xs text-ink-muted">{fmt(l.createdAt)}</span>
              </li>
            </ol>
          </div>
        </div>

        <div className="shrink-0 border-t border-line px-5 py-3">
          {confirm ? (
            <div className="flex flex-wrap items-center gap-2">
              <span className="mr-auto text-sm text-rose-800">Endgültig löschen?</span>
              <button onClick={() => setConfirm(false)} className="rounded-lg border border-line px-3 py-2 text-sm font-medium">Abbrechen</button>
              <button onClick={onDelete} className="rounded-lg bg-rose-700 px-3 py-2 text-sm font-semibold text-white hover:bg-rose-800">Ja, löschen</button>
            </div>
          ) : (
            <button onClick={() => setConfirm(true)} className="inline-flex items-center gap-2 text-sm font-medium text-rose-700 hover:underline"><Trash2 className="h-4 w-4" aria-hidden />Anfrage löschen</button>
          )}
        </div>
      </motion.aside>
    </>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="px-5 pt-5">
      <h3 className="text-xs font-semibold uppercase tracking-[0.1em] text-ink-muted">{title}</h3>
      <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-3 rounded-xl border border-line p-4">{children}</dl>
    </div>
  );
}

function Field({ k, v, wide }: { k: string; v?: string; wide?: boolean }) {
  if (!v) return null;
  return (
    <div className={`min-w-0 ${wide ? "col-span-2" : ""}`}>
      <dt className="text-xs text-ink-muted">{k}</dt>
      <dd className="mt-0.5 break-words text-sm">{v}</dd>
    </div>
  );
}

function Stat({ label, value, sub, warn }: { label: string; value: number | string; sub?: string; warn?: boolean }) {
  return (
    <div className={`min-w-[140px] shrink-0 rounded-xl border bg-white px-3.5 py-2.5 sm:min-w-0 sm:px-4 sm:py-3 ${warn ? "border-rose-200" : "border-line"}`}>
      <p className="whitespace-nowrap text-[11px] text-ink-muted sm:text-xs">{label}</p>
      <p className={`mt-0.5 whitespace-nowrap text-xl font-semibold tracking-[-0.03em] sm:mt-1 sm:text-2xl ${warn ? "text-rose-600" : ""}`}>
        {value}
        {sub && <span className="ml-2 text-xs font-normal text-ink-muted">{sub}</span>}
      </p>
    </div>
  );
}

function NavBtn({ label, active, onClick, children }: { label: string; active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} aria-label={label} title={label} aria-current={active ? "page" : undefined}
      className={`grid h-11 w-11 place-items-center rounded-xl transition ${active ? "bg-sun text-navy" : "text-white/60 hover:bg-white/10 hover:text-white"}`}>
      {children}
    </button>
  );
}

function IconBtn({ label, onClick, children, className = "" }: { label: string; onClick: () => void; children: React.ReactNode; className?: string }) {
  return (
    <button onClick={onClick} aria-label={label} title={label} className={`grid h-10 w-10 place-items-center rounded-lg text-ink-soft transition hover:bg-paper hover:text-navy ${className}`}>
      {children}
    </button>
  );
}
