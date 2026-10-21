"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowUpRight, Menu, X } from "lucide-react";
import { Logo } from "./Logo";
import { nav } from "@/lib/site";

const LONG: Record<string, string> = { Privat: "Privatrechtsschutz", Arbeit: "Arbeitsrechtsschutz", Vermieter: "Vermieterrechtsschutz", Firma: "Firmenrechtsschutz", Kontakt: "Kontakt" };

export function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const minimal = pathname === "/rechtsschutz-check";

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  useEffect(() => setOpen(false), [pathname]);

  return (
    <header className="sticky top-0 z-50 px-3 pt-3">
      <div className={`mx-auto flex h-14 max-w-[1240px] items-center justify-between gap-6 rounded-full pl-4 pr-2 transition-all duration-500 md:h-16 md:pl-6 ${scrolled || open ? "border border-line bg-white/80 shadow-[0_8px_30px_-12px_rgba(11,11,10,0.18)] backdrop-blur-xl" : "border border-transparent bg-transparent"}`}>
        <Logo />
        {!minimal && (
          <nav aria-label="Hauptnavigation" className="hidden items-center gap-1 md:flex">
            {nav.map((n) => {
              const active = pathname === n.href;
              return (
                <Link key={n.href} href={n.href} className={`relative rounded-full px-4 py-2 text-[14px] font-medium transition ${active ? "text-navy" : "text-ink-soft hover:text-navy"}`}>
                  {active && <motion.span layoutId="nav-pill" className="absolute inset-0 -z-10 rounded-full bg-sun" transition={{ type: "spring", stiffness: 400, damping: 32 }} />}
                  {n.label}
                </Link>
              );
            })}
          </nav>
        )}
        <div className="flex items-center gap-2">
          {!minimal && (
            <Link href="/rechtsschutz-check" className="group hidden items-center gap-2 rounded-full bg-navy py-2 pl-5 pr-2 text-sm font-medium text-white transition hover:bg-navy-800 sm:inline-flex">
              Rechtsschutz-Check
              <span className="grid h-8 w-8 place-items-center rounded-full bg-sun text-navy"><ArrowUpRight className="h-4 w-4 transition group-hover:rotate-45" aria-hidden /></span>
            </Link>
          )}
          {minimal ? (
            <Link href="/" className="rounded-full px-4 py-2 text-sm font-medium text-ink-soft hover:bg-navy-50 hover:text-navy">Abbrechen</Link>
          ) : (
            <button className="grid h-11 w-11 place-items-center rounded-full bg-navy text-white md:hidden" aria-label={open ? "Menü schließen" : "Menü öffnen"} aria-expanded={open} onClick={() => setOpen((o) => !o)}>
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          )}
        </div>
      </div>
      <AnimatePresence>
        {open && (
          <motion.nav aria-label="Mobile Navigation" initial={{ opacity: 0, y: -8, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -8, scale: 0.98 }} transition={{ duration: 0.2 }}
            className="mx-auto mt-2 max-w-[1240px] overflow-hidden rounded-3xl border border-line bg-white p-3 shadow-lift md:hidden">
            {nav.map((n, i) => (
              <motion.div key={n.href} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.04 * i }}>
                <Link href={n.href} className="flex items-center justify-between rounded-2xl px-4 py-4 text-lg font-medium tracking-tight text-navy hover:bg-surface">
                  {LONG[n.label] ?? n.label} <ArrowUpRight className="h-4 w-4 text-ink-muted" aria-hidden />
                </Link>
              </motion.div>
            ))}
            <Link href="/rechtsschutz-check" className="mt-2 flex items-center justify-center gap-2 rounded-full bg-sun py-4 text-base font-semibold text-navy">Jetzt Rechtsschutz-Check starten</Link>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}
