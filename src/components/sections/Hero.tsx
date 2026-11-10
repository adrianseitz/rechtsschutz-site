"use client";

import Link from "next/link";
import { useRef } from "react";
import { motion, useMotionValue, useReducedMotion, useSpring, useTransform, type MotionValue } from "motion/react";
import { ArrowUpRight, Check, Phone } from "lucide-react";
import { ShieldScene } from "../three/ShieldScene";
import { RotatingBadge } from "../ui/RotatingBadge";
import { Polaroid } from "../art/Polaroid";
import type { PhotoKey } from "@/lib/photos";
import { Scribble } from "../ui/Scribble";
import { CallLink } from "../ui/CallLink";
import { site } from "@/lib/site";

export type HeroChip = { label: string; href: string; icon: string };
export type FloatCard =
  | { type: "note"; text: string; sign?: string; pos: string; depth: number; rotate?: number }
  | { type: "receipt"; title: string; rows: [string, string][]; total: [string, string]; foot?: string; pos: string; depth: number; rotate?: number }
  | { type: "badge"; pos: string; depth: number }
  | { type: "photo"; photo: PhotoKey; caption: string; pos: string; depth: number; rotate?: number; width?: number };


function Headline({ title, emphasis }: { title: string; emphasis?: string }) {
  const words = title.split(" ");
  // Lange Wörter wie „Vermieterrechtsschutz“ müssen in eine Zeile passen – die Schriftgröße richtet sich nach dem längsten Wort.
  const longest = Math.max(...words.map((w) => w.length));
  const size = longest >= 21 ? "text-[7.8vw] sm:text-[3.2rem] lg:text-[min(3.85rem,4.25vw)]"
    : longest >= 18 ? "text-[9.2vw] sm:text-[3.6rem] lg:text-[min(4.4rem,4.9vw)]"
    : title.length > 60 ? "text-[2.05rem] min-[400px]:text-[2.3rem] sm:text-[3.6rem] lg:text-[4.2rem]"
    : "text-[2.3rem] min-[400px]:text-[2.6rem] sm:text-[4.4rem] lg:text-[5.4rem]";
  return (
    <h1 className={`text-balance font-semibold leading-[0.98] tracking-[-0.05em] text-navy [hyphens:manual] ${size}`} >
      {words.map((w, i) => {
        const clean = w.replace(/[.,!?]/g, "");
        const isEm = emphasis && clean === emphasis;
        const punct = w.slice(clean.length);
        return (
          <span key={i}>
          <span className="inline-block overflow-hidden pb-[0.08em] align-bottom">
            <span className="hero-rise relative inline-block" style={{ animationDelay: `${0.03 + i * 0.045}s` }}>
              {isEm ? (
                <>
                  <span aria-hidden className="hero-grow absolute -left-[0.06em] bottom-[0.1em] right-[-0.06em] -z-10 h-[0.42em] origin-left rounded-[0.12em] bg-sun" style={{ animationDelay: `${0.5 + i * 0.045}s` }} />
                  <span className="font-serif font-normal italic tracking-[-0.02em]">{clean}</span>{punct}
                </>
              ) : w}
            </span>
          </span>
          {i < words.length - 1 ? " " : ""}
          </span>
        );
      })}
    </h1>
  );
}

function Floater({ card, mx, my, delay }: { card: FloatCard; mx: MotionValue<number>; my: MotionValue<number>; delay: number }) {
  const x = useTransform(mx, (v) => v * card.depth * 30);
  const y = useTransform(my, (v) => v * card.depth * 30);
  const rotate = "rotate" in card && card.rotate !== undefined ? card.rotate : 0;
  return (
    <motion.div style={{ x, y }} className={`absolute z-20 ${card.pos}`}>
      {/* Auf dem Handy etwas kleiner, damit sich die Zettel nicht gegenseitig verdecken. */}
      <div className={`max-sm:scale-[0.8] ${/(^|\s)-?left-/.test(card.pos) ? "max-sm:origin-top-left" : /bottom-/.test(card.pos) ? "max-sm:origin-bottom-right" : "max-sm:origin-top-right"}`}>
      <motion.div initial={{ opacity: 0, y: 30, rotate: rotate - 10, scale: 0.9 }} animate={{ opacity: 1, y: 0, rotate, scale: 1 }}
        transition={{ type: "spring", stiffness: 140, damping: 16, delay }} whileHover={{ rotate: rotate * -0.5, scale: 1.03 }} whileTap={{ rotate: rotate * 2.2, scale: 0.94 }} data-burst>
        {card.type === "badge" && <RotatingBadge size={118} />}
        {card.type === "photo" && <Polaroid photo={card.photo} caption={card.caption} rotate={0} width={card.width ?? 200} priority interactive={false} />}
        {card.type === "note" && (
          <div className="relative w-[190px] bg-[#FFE45C] p-4 pt-6 shadow-[0_18px_30px_-16px_rgba(11,11,10,0.45)]" style={{ clipPath: "polygon(0 0, 100% 0, 100% 90%, 92% 100%, 0 100%)" }}>
            <span aria-hidden className="absolute -top-2.5 left-1/2 h-5 w-16 -translate-x-1/2 rotate-[-4deg] bg-white/60" />
            <p className="font-hand text-[20px] leading-[1.12] text-navy">{card.text}</p>
            {card.sign && <p className="mt-2 text-right font-hand text-base text-navy/70">– {card.sign}</p>}
          </div>
        )}
        {card.type === "receipt" && (
          <div className="relative w-[210px] bg-[#FFFEFA] px-4 pb-5 pt-4 font-mono text-[10.5px] text-navy shadow-[0_20px_36px_-18px_rgba(11,11,10,0.45)]"
            style={{ maskImage: "radial-gradient(circle at 6px 100%, transparent 5px, #000 5.5px) -6px 0 / 12px 100% repeat-x" }}>
            <p className="text-center text-[9px] uppercase tracking-[0.25em] text-navy/50">{card.title}</p>
            <div className="mt-2 border-t border-dashed border-navy/25 pt-2">
              {card.rows.map(([k, v]) => (
                <div key={k} className="flex items-baseline gap-1"><span>{k}</span><span className="mb-[3px] flex-1 border-b border-dotted border-navy/30" /><span className="tabular-nums">{v}</span></div>
              ))}
            </div>
            <div className="mt-2 flex items-baseline justify-between border-t border-navy pt-2 text-[12px] font-semibold"><span>{card.total[0]}</span><span className="tabular-nums">{card.total[1]}</span></div>
            {card.foot && <p className="mt-2 text-[8.5px] leading-snug text-navy/50">{card.foot}</p>}
          </div>
        )}
      </motion.div>
      </div>
    </motion.div>
  );
}

export function Hero({ eyebrow, title, emphasis, subtitle, chipsLabel, chips, secondary, cards, bullets = ["Kostenlos & unverbindlich", "Ca. 60 Sekunden", "Persönlicher Ansprechpartner"] }: {
  eyebrow?: string; title: string; emphasis?: string; subtitle: string;
  chipsLabel: string; chips: HeroChip[]; secondary?: { href: string; label: string }; cards: FloatCard[]; bullets?: string[];
}) {
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);
  const mx = useSpring(rawX, { stiffness: 60, damping: 18 });
  const my = useSpring(rawY, { stiffness: 60, damping: 18 });

  return (
    <section
      ref={ref}
      className="relative -mt-[76px] overflow-hidden bg-white pb-16 pt-[104px] sm:pt-32 md:pb-24 md:pt-40"
      onPointerMove={(e) => {
        if (reduce || e.pointerType !== "mouse") return;
        const r = ref.current!.getBoundingClientRect();
        rawX.set((e.clientX - r.left) / r.width - 0.5);
        rawY.set((e.clientY - r.top) / r.height - 0.5);
      }}
    >
      <div className="pointer-events-none absolute right-0 top-0 hidden h-full w-[44%] bg-paper lg:block" aria-hidden>
        <div className="absolute inset-y-0 left-0 w-px bg-line" />
        <span className="absolute bottom-10 right-8 font-mono text-[10px] uppercase tracking-[0.2em] text-navy/35">Abb. 1 — Rechtsschutz, modular</span>
      </div>

      <div className="container relative grid items-center gap-8 lg:grid-cols-[minmax(0,1.12fr)_minmax(0,0.88fr)]">
        <div className="min-w-0">
          {eyebrow && (
            <span className="hero-fade eyebrow">{eyebrow.split(" · ")[0]}{eyebrow.includes(" · ") && <span className="hidden sm:inline">· {eyebrow.split(" · ").slice(1).join(" · ")}</span>}</span>
          )}
          <div className="mt-4 sm:mt-6"><Headline title={title} emphasis={emphasis} /></div>

          {/* Handy: Auswahl direkt unter der Überschrift (ohne Scrollen sichtbar), Erklärtext danach. */}
          <div className="flex flex-col">
          <p className="hero-fade order-2 mt-7 max-w-xl text-[17px] leading-7 text-ink-soft sm:order-1 sm:text-xl sm:leading-9" style={{ animationDelay: "0.25s" }}>
            {subtitle}
          </p>

          {/* Bewusst per CSS eingeblendet: sichtbar und antippbar, bevor das JavaScript geladen ist. */}
          <div className="hero-fade order-1 mt-6 sm:order-2 sm:mt-10" style={{ animationDelay: "0.3s" }}>
            <div className="flex items-end gap-3">
              <p className="font-hand text-[22px] leading-none text-navy">{chipsLabel}</p>
              <Scribble kind="arrow" className="mb-[-14px] hidden h-10 w-14 sm:block" width={2} delay={1.1} />
            </div>
            <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:gap-2.5">
              {chips.map((c) => (
                <Link key={c.href} href={c.href} className="group relative flex min-h-[48px] items-center gap-3 overflow-hidden rounded-full border border-navy/15 bg-white py-2.5 pl-5 pr-3 text-[16px] font-medium text-navy transition duration-300 hover:border-navy active:bg-sun sm:inline-flex sm:min-h-0 sm:text-[15px]">
                  <span aria-hidden className="absolute inset-0 -z-0 origin-left scale-x-0 bg-sun transition-transform duration-500 ease-[cubic-bezier(.22,1,.36,1)] group-hover:scale-x-100" />
                  <span className="relative flex-1 sm:flex-none">{c.label}</span>
                  <span className="relative grid h-7 w-7 place-items-center rounded-full bg-navy text-white transition duration-300 group-hover:rotate-45 sm:h-6 sm:w-6"><ArrowUpRight className="h-3.5 w-3.5" aria-hidden /></span>
                </Link>
              ))}
            </div>
            <p className="mt-2.5 text-[13px] text-ink-muted sm:hidden">Kostenlos &amp; unverbindlich · dauert ca. 60 Sekunden</p>
          </div>
          </div>

          {secondary && (
            <div className="hero-fade mt-7 flex flex-wrap items-center gap-x-3 gap-y-2 text-[15px] text-ink-soft" style={{ animationDelay: "0.4s" }}>
              <span>Lieber direkt sprechen?</span>
              <CallLink className="inline-flex items-center gap-2 rounded-full border border-navy/20 bg-white px-4 py-2 font-semibold text-navy transition hover:border-navy">
                <Phone className="h-4 w-4" aria-hidden />{site.phone}
              </CallLink>
              <Link href={secondary.href} className="font-medium text-navy underline decoration-navy/30 underline-offset-4 transition hover:decoration-navy">{secondary.label}</Link>
            </div>
          )}

          <ul className="hero-fade mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-ink-soft" style={{ animationDelay: "0.5s" }}>
            {bullets.map((b) => (
              <li key={b} className="flex items-center gap-2"><Check className="h-4 w-4 text-navy" strokeWidth={2.5} aria-hidden />{b}</li>
            ))}
          </ul>
        </div>

        <div className="relative mx-auto h-[380px] w-full max-w-[560px] sm:h-[480px] lg:h-[580px]">
          <ShieldScene className="absolute inset-0" />
          <p className="pointer-events-none absolute bottom-[22%] left-[30%] z-10 hidden -rotate-6 font-hand text-[19px] text-navy/70 lg:block">tipp mich an!</p>
          {cards.map((c, i) => <Floater key={`${c.type}-${i}`} card={c} mx={mx} my={my} delay={1 + i * 0.15} />)}
        </div>
      </div>
    </section>
  );
}
