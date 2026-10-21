"use client";

import Link from "next/link";
import { useRef } from "react";
import { motion, useMotionValue, useReducedMotion, useSpring, useTransform, type MotionValue } from "motion/react";
import { ArrowUpRight, Check } from "lucide-react";
import { ShieldScene } from "../three/ShieldScene";
import { RotatingBadge } from "../ui/RotatingBadge";
import { Polaroid } from "../art/Polaroid";
import type { PhotoKey } from "@/lib/photos";
import { Scribble } from "../ui/Scribble";
import { Magnetic } from "../ui/Magnetic";
import { ButtonLink } from "../ui/Button";

export type HeroChip = { label: string; href: string; icon: string };
export type FloatCard =
  | { type: "note"; text: string; sign?: string; pos: string; depth: number; rotate?: number }
  | { type: "receipt"; title: string; rows: [string, string][]; total: [string, string]; foot?: string; pos: string; depth: number; rotate?: number }
  | { type: "badge"; pos: string; depth: number }
  | { type: "photo"; photo: PhotoKey; caption: string; pos: string; depth: number; rotate?: number; width?: number };

const EASE = [0.22, 1, 0.36, 1] as const;

function Headline({ title, emphasis }: { title: string; emphasis?: string }) {
  const reduce = useReducedMotion();
  const words = title.split(" ");
  return (
    <h1 className={`text-balance font-semibold leading-[0.98] tracking-[-0.05em] text-navy ${title.length > 60 ? "text-[2.4rem] sm:text-[3.6rem] lg:text-[4.2rem]" : "text-[2.9rem] sm:text-[4.4rem] lg:text-[5.4rem]"}`} >
      {words.map((w, i) => {
        const clean = w.replace(/[.,!?]/g, "");
        const isEm = emphasis && clean === emphasis;
        const punct = w.slice(clean.length);
        return (
          <span key={i}>
          <span className="inline-block overflow-hidden pb-[0.08em] align-bottom">
            <motion.span className="relative inline-block" initial={reduce ? false : { y: "110%" }} animate={{ y: "0%" }} transition={{ duration: 0.9, delay: 0.08 + i * 0.07, ease: EASE }}>
              {isEm ? (
                <>
                  <motion.span aria-hidden className="absolute -left-[0.06em] bottom-[0.1em] right-[-0.06em] -z-10 h-[0.42em] origin-left rounded-[0.12em] bg-sun"
                    initial={reduce ? false : { scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: 0.8, delay: 0.8 + i * 0.07, ease: EASE }} />
                  <span className="font-serif font-normal italic tracking-[-0.02em]">{clean}</span>{punct}
                </>
              ) : w}
            </motion.span>
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
      className="relative -mt-[76px] overflow-hidden bg-white pb-16 pt-32 md:pb-24 md:pt-40"
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

      <div className="container relative grid items-center gap-8 lg:grid-cols-[1.12fr_0.88fr]">
        <div>
          {eyebrow && (
            <motion.span initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="eyebrow">{eyebrow}</motion.span>
          )}
          <div className="mt-6"><Headline title={title} emphasis={emphasis} /></div>
          <motion.p initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.55, ease: EASE }}
            className="mt-7 max-w-xl text-lg leading-8 text-ink-soft sm:text-xl sm:leading-9">
            {subtitle}
          </motion.p>

          <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.7, ease: EASE }} className="mt-10">
            <div className="flex items-end gap-3">
              <p className="font-hand text-[22px] leading-none text-navy">{chipsLabel}</p>
              <Scribble kind="arrow" className="mb-[-14px] hidden h-10 w-14 sm:block" width={2} delay={1.4} />
            </div>
            <div className="mt-3 flex flex-wrap gap-2.5">
              {chips.map((c, i) => (
                <Link key={c.href} href={c.href} className="group relative inline-flex items-center gap-3 overflow-hidden rounded-full border border-navy/15 bg-white py-2.5 pl-4 pr-3 text-[15px] font-medium text-navy transition duration-300 hover:border-navy">
                  <span aria-hidden className="absolute inset-0 -z-0 origin-left scale-x-0 bg-sun transition-transform duration-500 ease-[cubic-bezier(.22,1,.36,1)] group-hover:scale-x-100" />
                  <span className="relative font-mono text-[11px] text-navy/45">{String(i + 1).padStart(2, "0")}</span>
                  <span className="relative">{c.label}</span>
                  <span className="relative grid h-6 w-6 place-items-center rounded-full bg-navy text-white transition duration-300 group-hover:rotate-45"><ArrowUpRight className="h-3.5 w-3.5" aria-hidden /></span>
                </Link>
              ))}
            </div>
            {secondary && (
              <div className="mt-6 flex flex-wrap items-center gap-4">
                <Magnetic><ButtonLink href={secondary.href} variant="primary" arrow>{secondary.label}</ButtonLink></Magnetic>
              </div>
            )}
          </motion.div>

          <motion.ul initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8, delay: 0.9 }} className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-ink-soft">
            {bullets.map((b) => (
              <li key={b} className="flex items-center gap-2"><Check className="h-4 w-4 text-navy" strokeWidth={2.5} aria-hidden />{b}</li>
            ))}
          </motion.ul>
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
