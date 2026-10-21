"use client";

import { motion, useReducedMotion } from "motion/react";
import { Scribble } from "../ui/Scribble";

/**
 * Detailreiche, fiktive Dokument-Illustrationen (reines HTML/SVG).
 * Alle Namen, Adressen und Aktenzeichen sind erfunden und als Muster erkennbar.
 */

const RED = "#C2410C";

function Paper({ children, className = "", rotate = 0, fold = true, tone = "#FFFEFA" }: { children: React.ReactNode; className?: string; rotate?: number; fold?: boolean; tone?: string }) {
  return (
    <div
      className={`relative w-[300px] select-none text-left text-[9px] leading-[1.45] text-[#2A2A26] ${className}`}
      style={{ transform: `rotate(${rotate}deg)` }}
      aria-hidden
    >
      <div
        className="relative overflow-hidden rounded-[3px] p-5 shadow-[0_1px_1px_rgba(11,11,10,0.06),0_14px_28px_-12px_rgba(11,11,10,0.35),0_40px_60px_-40px_rgba(11,11,10,0.4)]"
        style={{ background: `linear-gradient(180deg, ${tone} 0%, #F8F6EE 100%)`, clipPath: fold ? "polygon(0 0, calc(100% - 26px) 0, 100% 26px, 100% 100%, 0 100%)" : undefined }}
      >
        {/* Papierstruktur */}
        <div className="pointer-events-none absolute inset-0 opacity-[0.35] mix-blend-multiply" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2'/%3E%3CfeColorMatrix values='0 0 0 0 .5 0 0 0 0 .48 0 0 0 0 .42 0 0 0 .18 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")" }} />
        <div className="relative">{children}</div>
      </div>
      {fold && <div className="absolute right-0 top-0 h-[26px] w-[26px] rounded-bl-[4px] bg-gradient-to-bl from-[#E9E5D8] to-[#D9D4C4] shadow-[-2px_2px_3px_rgba(11,11,10,0.12)]" />}
    </div>
  );
}

function Lines({ n, widths = [] }: { n: number; widths?: number[] }) {
  return (
    <div className="space-y-[5px]">
      {Array.from({ length: n }).map((_, i) => (
        <div key={i} className="h-[3px] rounded-full bg-[#2A2A26]/[0.13]" style={{ width: `${widths[i] ?? (i === n - 1 ? 55 : 92 + ((i * 7) % 8))}%` }} />
      ))}
    </div>
  );
}

function Stamp({ text, sub, color = RED, rotate = -14, className = "", delay = 0.4 }: { text: string; sub?: string; color?: string; rotate?: number; className?: string; delay?: number }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={`absolute rounded-[4px] border-[2.5px] px-2.5 py-1 text-center font-mono font-bold uppercase tracking-[0.12em] ${className}`}
      style={{ color, borderColor: color, opacity: 0.82, mixBlendMode: "multiply" }}
      initial={reduce ? false : { scale: 2.4, opacity: 0, rotate: rotate - 10 }}
      whileInView={{ scale: 1, opacity: 0.82, rotate }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ type: "spring", stiffness: 420, damping: 18, delay }}
    >
      <span className="block text-[11px] leading-tight">{text}</span>
      {sub && <span className="block text-[7px] font-medium tracking-[0.18em]">{sub}</span>}
    </motion.div>
  );
}

function Barcode({ className = "" }: { className?: string }) {
  const bars = [3, 1, 2, 1, 1, 3, 1, 2, 2, 1, 3, 1, 1, 2, 1, 3, 2, 1, 1, 2, 3, 1, 2, 1, 1, 3, 1, 1, 2, 2, 1, 3, 1, 2, 1, 1, 2, 3, 1, 2];
  return (
    <div className={`flex h-9 items-stretch gap-[1.5px] ${className}`}>
      {bars.map((w, i) => <span key={i} className="bg-[#1A1A17]" style={{ width: w }} />)}
    </div>
  );
}

/* ───────────── Kündigung ───────────── */
export function DocKuendigung({ className = "", rotate = -3 }: { className?: string; rotate?: number }) {
  return (
    <Paper className={className} rotate={rotate}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[10px] font-bold tracking-[0.08em] text-[#1A1A17]">MUSTER LOGISTIK GMBH</p>
          <p className="text-[7px] text-[#2A2A26]/60">Beispielallee 4 · 12345 Musterstadt</p>
        </div>
        <svg width="26" height="26" viewBox="0 0 26 26"><rect width="26" height="26" rx="5" fill="#1A1A17" /><path d="M7 18V8l6 6 6-6v10" stroke="#FFFEFA" strokeWidth="2" fill="none" /></svg>
      </div>
      <p className="mt-4 text-[7px] text-[#2A2A26]/55 underline decoration-[#2A2A26]/20">Muster Logistik GmbH · Beispielallee 4 · 12345 Musterstadt</p>
      <p className="mt-1 leading-[1.4]">Frau Erika Beispiel<br />Musterweg 12<br />12345 Musterstadt</p>
      <p className="mt-3 text-right text-[8px]">Musterstadt, 14. März</p>
      <p className="mt-2 text-[10.5px] font-bold text-[#1A1A17]">Kündigung des Arbeitsverhältnisses</p>
      <p className="mt-2">Sehr geehrte Frau Beispiel,</p>
      <p className="mt-1">hiermit kündigen wir das mit Ihnen bestehende Arbeitsverhältnis ordentlich und fristgerecht zum <span className="relative inline-block font-semibold">30.04.<Scribble kind="underline" className="absolute -bottom-1 left-0 h-2 w-full" color={RED} width={1.6} delay={0.9} /></span></p>
      <div className="mt-2"><Lines n={3} /></div>
      <p className="mt-3">Mit freundlichen Grüßen</p>
      <p className="-mt-0.5 font-hand text-[22px] leading-none text-[#1F3A8A]">i.A. Weber</p>
      <Stamp text="Einschreiben" sub="Rückschein" className="bottom-5 right-3" rotate={-12} delay={0.6} />
    </Paper>
  );
}

/* ───────────── Paketschein ───────────── */
export function DocPaket({ className = "", rotate = 3 }: { className?: string; rotate?: number }) {
  return (
    <div className={`relative w-[300px] ${className}`} style={{ transform: `rotate(${rotate}deg)` }} aria-hidden>
      {/* Karton */}
      <div className="relative h-[220px] overflow-hidden rounded-[6px] bg-gradient-to-br from-[#D9B27C] via-[#CFA36A] to-[#BC8E55] shadow-[0_24px_40px_-18px_rgba(60,40,10,0.55)]">
        <div className="absolute inset-0 opacity-30" style={{ backgroundImage: "repeating-linear-gradient(90deg, rgba(0,0,0,0.06) 0 1px, transparent 1px 7px)" }} />
        <div className="absolute inset-x-0 top-[46%] h-9 bg-[#E8D3A8]/80 shadow-inner">
          <p className="pt-2.5 text-center font-mono text-[9px] font-bold uppercase tracking-[0.4em] text-[#8A5A1F]/80">Vorsicht · Zerbrechlich · Vorsicht</p>
        </div>
        {/* Label */}
        <div className="absolute left-4 top-4 w-[176px] rotate-[-2deg] rounded-[2px] bg-[#FFFEFA] p-3 text-[8px] leading-[1.35] text-[#1A1A17] shadow-md">
          <p className="font-mono text-[7px] uppercase tracking-[0.2em] text-[#1A1A17]/60">Paket · 31,5 kg max.</p>
          <p className="mt-1.5 font-semibold">An: Erika Beispiel</p>
          <p>Musterweg 12, 12345 Musterstadt</p>
          <Barcode className="mt-2" />
          <p className="mt-1 font-mono text-[7px] tracking-[0.18em]">00340 4342 1123 8857</p>
        </div>
        {/* Delle */}
        <svg className="absolute bottom-3 right-5 h-20 w-24" viewBox="0 0 100 80"><path d="M10 60 C30 30, 50 70, 70 34 S96 50, 92 18" stroke="#7A4E1A" strokeWidth="2" fill="none" opacity="0.55" /><path d="M16 66 L30 52 M44 70 L52 56 M70 50 L80 40" stroke="#7A4E1A" strokeWidth="1.5" opacity="0.4" /></svg>
      </div>
      <div className="absolute -right-5 bottom-[104px] rotate-[8deg] rounded-full bg-white px-3 py-1.5 font-hand text-[19px] leading-none text-[#1A1A17] shadow-md">beschädigt!</div>
      <Scribble kind="circle" className="absolute bottom-2 right-1 h-24 w-36" color={RED} width={2.2} delay={0.6} />
    </div>
  );
}

/* ───────────── Nebenkostenabrechnung ───────────── */
export function DocNebenkosten({ className = "", rotate = -2 }: { className?: string; rotate?: number }) {
  const rows: [string, string][] = [["Heizung & Warmwasser", "1.284,60"], ["Kaltwasser / Abwasser", "412,18"], ["Müllabfuhr", "196,40"], ["Grundsteuer", "238,00"], ["Hausmeister", "355,02"]];
  return (
    <Paper className={className} rotate={rotate}>
      <div className="flex items-baseline justify-between">
        <p className="text-[10.5px] font-bold text-[#1A1A17]">Betriebskostenabrechnung</p>
        <p className="font-mono text-[7px] text-[#2A2A26]/60">01.01.–31.12.</p>
      </div>
      <p className="text-[7.5px] text-[#2A2A26]/60">Objekt: Musterweg 12, 2. OG links · Wohnfläche 68 m²</p>
      <div className="mt-3 border-y border-[#2A2A26]/20 py-1.5">
        {rows.map(([k, v]) => (
          <div key={k} className="flex items-baseline gap-1 py-[2px]">
            <span>{k}</span><span className="mb-[2px] flex-1 border-b border-dotted border-[#2A2A26]/35" /><span className="font-mono tabular-nums">{v} €</span>
          </div>
        ))}
      </div>
      <div className="mt-1.5 flex items-baseline gap-1"><span>Summe Kosten</span><span className="flex-1" /><span className="font-mono tabular-nums">2.486,20 €</span></div>
      <div className="flex items-baseline gap-1"><span>./. Vorauszahlungen</span><span className="flex-1" /><span className="font-mono tabular-nums">2.000,00 €</span></div>
      <div className="relative mt-2 flex items-baseline gap-1 text-[11px] font-bold text-[#1A1A17]">
        <span>Nachzahlung</span><span className="flex-1" />
        <span className="relative font-mono tabular-nums">486,20 €<Scribble kind="circle" className="absolute -inset-x-4 -inset-y-3 h-[calc(100%+24px)] w-[calc(100%+32px)]" color={RED} width={1.8} delay={0.7} /></span>
      </div>
      <p className="mt-3 text-[7.5px] text-[#2A2A26]/60">Zahlbar binnen 30 Tagen nach Zugang.</p>
      <p className="absolute bottom-0 right-1 -rotate-6 font-hand text-[17px] leading-none text-[#1F3A8A]">wirklich so viel?</p>
    </Paper>
  );
}

/* ───────────── Unfallbericht ───────────── */
export function DocUnfall({ className = "", rotate = 2 }: { className?: string; rotate?: number }) {
  return (
    <Paper className={className} rotate={rotate} tone="#FFFDF2">
      <div className="flex items-center justify-between border-b border-[#2A2A26]/25 pb-1.5">
        <p className="text-[9.5px] font-bold uppercase tracking-[0.06em] text-[#1A1A17]">Unfallbericht</p>
        <p className="font-mono text-[7px] text-[#2A2A26]/60">Blatt 1/2</p>
      </div>
      <div className="mt-2 grid grid-cols-2 gap-2">
        {(["A", "B"] as const).map((v) => (
          <div key={v} className={`rounded-[2px] border p-1.5 ${v === "A" ? "border-[#1F3A8A]/40 bg-[#1F3A8A]/[0.04]" : "border-[#B45309]/40 bg-[#FFD60A]/[0.10]"}`}>
            <p className="font-mono text-[7px] font-bold">Fahrzeug {v}</p>
            <div className="mt-1 space-y-1">{[1, 2, 3].map((i) => <div key={i} className="flex items-center gap-1"><span className="h-[7px] w-[7px] border border-[#2A2A26]/50">{i === 2 && v === "A" ? <span className="block h-full w-full bg-[#1A1A17]" /> : null}</span><span className="h-[3px] flex-1 rounded bg-[#2A2A26]/12" /></div>)}</div>
          </div>
        ))}
      </div>
      <p className="mt-2 font-mono text-[7px] uppercase tracking-[0.12em] text-[#2A2A26]/60">Skizze des Unfallhergangs</p>
      <svg viewBox="0 0 260 96" className="mt-1 w-full rounded-[2px] border border-dashed border-[#2A2A26]/30 bg-white/60">
        <path d="M0 48 H260 M130 0 V96" stroke="#2A2A26" strokeOpacity="0.15" strokeWidth="18" />
        <path d="M0 48 H260" stroke="#2A2A26" strokeOpacity="0.35" strokeDasharray="6 6" />
        <g transform="translate(70 34)"><rect width="34" height="16" rx="4" fill="#1F3A8A" opacity="0.85" /><path d="M36 8 h18" stroke="#1F3A8A" strokeWidth="1.5" markerEnd="url(#ar)" /></g>
        <g transform="translate(122 66) rotate(-90)"><rect width="34" height="16" rx="4" fill="#E6BE00" /></g>
        <defs><marker id="ar" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0 0 L6 3 L0 6Z" fill="#1F3A8A" /></marker></defs>
        <text x="72" y="30" fontSize="9" fontFamily="monospace" fill="#1F3A8A">A</text>
        <text x="146" y="80" fontSize="9" fontFamily="monospace" fill="#8A6D00">B</text>
        <path d="M118 40 l8 8 m0 -8 l-8 8" stroke={RED} strokeWidth="2" />
      </svg>
      <div className="mt-2 flex items-end justify-between">
        <div><p className="text-[7px] text-[#2A2A26]/60">Unterschrift A</p><p className="font-hand text-[18px] leading-none text-[#1F3A8A]">E. Beispiel</p></div>
        <div className="text-right"><p className="text-[7px] text-[#2A2A26]/60">Unterschrift B</p><p className="font-hand text-[18px] leading-none text-[#2A2A26]/30">— fehlt —</p></div>
      </div>
    </Paper>
  );
}

/* ───────────── Klageschrift (Arbeitsgericht) ───────────── */
export function DocKlage({ className = "", rotate = -2 }: { className?: string; rotate?: number }) {
  return (
    <Paper className={className} rotate={rotate}>
      <div className="flex items-center gap-2 border-b border-[#2A2A26]/25 pb-2">
        <svg width="22" height="22" viewBox="0 0 24 24"><circle cx="12" cy="12" r="11" fill="none" stroke="#1A1A17" strokeWidth="1" /><path d="M12 5v14M7 9h10M7 9l-2.5 5h5zM17 9l-2.5 5h5z" stroke="#1A1A17" strokeWidth="1" fill="none" /></svg>
        <div><p className="text-[9.5px] font-bold tracking-[0.06em] text-[#1A1A17]">ARBEITSGERICHT MUSTERSTADT</p><p className="text-[7px] text-[#2A2A26]/60">Geschäftsstelle · Kammer 3</p></div>
      </div>
      <div className="mt-3 flex justify-between font-mono text-[7.5px]"><span>Az.: 3 Ca 1234/26</span><span>Zustellung gegen EB</span></div>
      <p className="mt-3 text-[11px] font-bold text-[#1A1A17]">Klage</p>
      <p className="mt-1">in Sachen <span className="font-semibold">Max Mustermann</span> – Kläger –</p>
      <p>gegen <span className="relative inline-block font-semibold">Ihr Unternehmen<span className="absolute inset-x-0 bottom-[1px] -z-10 h-[5px] bg-[#FFD60A]" /></span> – Beklagte –</p>
      <p className="mt-2">wegen: Kündigungsschutz, Vergütung</p>
      <div className="mt-2"><Lines n={4} /></div>
      <div className="mt-3 rounded-[2px] border border-[#2A2A26]/20 bg-[#2A2A26]/[0.03] p-2">
        <p className="font-mono text-[7px] uppercase tracking-[0.12em] text-[#2A2A26]/60">Gütetermin</p>
        <p className="mt-0.5 text-[9px] font-semibold">Mittwoch, 10:30 Uhr · Saal 2.14</p>
      </div>
      <Stamp text="Eingang" sub="Beglaubigte Abschrift" color="#1F3A8A" className="bottom-14 right-2" rotate={9} />
    </Paper>
  );
}

/* ───────────── Bescheid (Behörde) ───────────── */
export function DocBescheid({ className = "", rotate = 2 }: { className?: string; rotate?: number }) {
  return (
    <Paper className={className} rotate={rotate}>
      <div className="flex items-start justify-between">
        <div><p className="text-[9px] font-bold text-[#1A1A17]">Sozialversicherungsträger Musterland</p><p className="text-[7px] text-[#2A2A26]/60">Postfach 10 00 00 · 12345 Musterstadt</p></div>
        <div className="grid h-7 w-7 place-items-center rounded-full border border-[#1A1A17]"><span className="font-serif text-[13px] italic">§</span></div>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-1 font-mono text-[7px] text-[#2A2A26]/70">
        <span>Vers.-Nr. 12 345678 B 000</span><span className="text-right">Datum: 02.06.</span>
      </div>
      <p className="mt-3 text-[11px] font-bold text-[#1A1A17]">Bescheid</p>
      <p className="mt-1">Ihr Antrag vom 12.04. wird <span className="relative font-bold">abgelehnt.<Scribble kind="underline" className="absolute -bottom-1 left-0 h-2 w-full" color={RED} width={1.6} delay={0.8} /></span></p>
      <div className="mt-2"><Lines n={4} /></div>
      <div className="mt-3 border-t border-[#2A2A26]/20 pt-2">
        <p className="text-[7px] font-bold uppercase tracking-[0.12em]">Rechtsbehelfsbelehrung</p>
        <p className="mt-0.5 text-[7.5px] text-[#2A2A26]/75">Gegen diesen Bescheid kann innerhalb eines Monats nach Bekanntgabe Widerspruch erhoben werden.</p>
      </div>
      <p className="absolute -right-1 top-[58px] rotate-[-8deg] font-hand text-[18px] leading-none text-[#1F3A8A]">Frist notieren!</p>
    </Paper>
  );
}

/* ───────────── Schlüsselanhänger (Vermietung) ───────────── */
export function KeyTag({ className = "", label = "Whg. 2 OG li." }: { className?: string; label?: string }) {
  return (
    <div className={`relative ${className}`} aria-hidden>
      <svg width="150" height="120" viewBox="0 0 150 120">
        <circle cx="30" cy="30" r="18" fill="none" stroke="#9A9A92" strokeWidth="4" />
        <path d="M44 40 L70 64" stroke="#9A9A92" strokeWidth="3" />
        <g transform="translate(66 58) rotate(38)">
          <rect x="0" y="-14" width="58" height="28" rx="14" fill="#FFD60A" stroke="#0B0B0A" strokeWidth="1.5" />
          <circle cx="12" cy="0" r="4" fill="#FFFEFA" stroke="#0B0B0A" strokeWidth="1.2" />
        </g>
        <g transform="translate(14 36) rotate(70)">
          <path d="M0 0 h46 l4 4 -4 4 h-6 v5 h-5 v-5 h-6 v6 h-5 v-6 H0z" fill="#C9C9C0" stroke="#7A7A72" strokeWidth="1" />
        </g>
      </svg>
      <span className="absolute left-[78px] top-[62px] rotate-[38deg] font-hand text-[13px] font-semibold text-navy">{label}</span>
    </div>
  );
}
