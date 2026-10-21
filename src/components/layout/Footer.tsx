"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Logo } from "./Logo";
import { site } from "@/lib/site";
import { productList } from "@/lib/products";
import { useConsent } from "../consent/ConsentManager";

export function Footer() {
  const { openSettings } = useConsent();
  return (
    <footer className="px-3 pb-3 pt-3">
      <div className="mx-auto max-w-[1400px] overflow-hidden rounded-[36px] bg-navy text-white/60">
        <div className="px-6 pt-16 sm:px-12">
          <div className="grid gap-12 md:grid-cols-[1.4fr_1fr_1fr]">
            <div>
              <Logo light />
              <p className="mt-5 max-w-sm text-sm leading-6">
                {site.owner} · {site.role}. Diese Website ist kein offizielles Angebot der ARAG und kein unabhängiges Vergleichsportal.
              </p>
              <Link href="/rechtsschutz-check" className="group mt-8 inline-flex items-center gap-3 rounded-full bg-sun py-2 pl-5 pr-2 text-sm font-medium text-navy">
                Rechtsschutz-Check starten
                <span className="grid h-8 w-8 place-items-center rounded-full bg-navy text-sun"><ArrowUpRight className="h-4 w-4 transition group-hover:rotate-45" aria-hidden /></span>
              </Link>
            </div>
            <div>
              <h3 className="font-mono text-[11px] font-normal uppercase tracking-[0.14em] text-white/40">Rechtsschutz</h3>
              <ul className="mt-5 space-y-3 text-[15px]">
                {productList.map((p) => <li key={p.key}><Link href={p.slug} className="text-white/80 transition hover:text-sun">{p.name}</Link></li>)}
              </ul>
            </div>
            <div>
              <h3 className="font-mono text-[11px] font-normal uppercase tracking-[0.14em] text-white/40">Service</h3>
              <ul className="mt-5 space-y-3 text-[15px]">
                <li><Link href="/kontakt" className="text-white/80 transition hover:text-sun">Kontakt & Termin</Link></li>
                <li><Link href="/impressum" className="text-white/80 transition hover:text-sun">Impressum & Vermittlerangaben</Link></li>
                <li><Link href="/datenschutz" className="text-white/80 transition hover:text-sun">Datenschutz</Link></li>
                <li><button onClick={openSettings} className="text-left text-white/80 transition hover:text-sun">Cookie-Einstellungen</button></li>
              </ul>
            </div>
          </div>
          <p className="mt-14 border-t border-white/10 pt-6 text-xs leading-5 text-white/40">
            Hinweis zur Vermittlerrolle: {site.owner} ist als selbstständiger Versicherungsvermittler für die ARAG tätig und wird bei erfolgreicher Vermittlung vom Versicherer vergütet. Eine Beratung erfolgt nicht als unabhängiger Makler. Alle Angaben zu Leistungen sind allgemeine Informationen; maßgeblich sind die jeweiligen Versicherungsbedingungen. Fotos: Unsplash (Symbolbilder, <Link href="/impressum" className="underline">Bildnachweise</Link>). 3D-Icons: Microsoft Fluent Emoji (MIT). © {new Date().getFullYear()} {site.owner}
          </p>
        </div>
        <div aria-hidden className="select-none overflow-hidden px-4 pt-6 text-center">
          <p className="translate-y-[18%] whitespace-nowrap text-[17vw] font-semibold leading-[0.8] tracking-[-0.07em] text-white/[0.06] lg:text-[15.5rem]">
            {site.brandShort}<span className="font-serif font-normal italic text-sun/90">.</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
