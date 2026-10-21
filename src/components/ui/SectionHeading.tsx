"use client";

import { motion, useReducedMotion } from "motion/react";
import { Scribble } from "./Scribble";

const EASE = [0.22, 1, 0.36, 1] as const;

/** Text mit hervorgehobenem Wort: Serif kursiv + handgezeichneter gelber Strich. */
const word = {
  hidden: { y: "110%", rotate: 4 },
  show: (i: number) => ({ y: "0%", rotate: 0, transition: { duration: 0.85, delay: i * 0.045, ease: EASE } }),
};

export function Emph({ text, word: emWord, animate = true }: { text: string; word?: string; animate?: boolean }) {
  const reduce = useReducedMotion();
  const words = text.split(" ");
  const items = words.map((w, i) => {
    const isEm = !!emWord && (w === emWord || w.replace(/[.,!?]/g, "") === emWord.replace(/[.,!?]/g, ""));
    const inner = isEm ? (
      <span className="relative inline-block">
        <span className="relative z-10 font-serif font-normal italic tracking-[-0.01em]">{w}</span>
        <Scribble kind="underline" className="absolute -bottom-[0.08em] left-[-4%] z-0 h-[0.32em] w-[108%]" color="#FFD60A" width={9} delay={0.5 + i * 0.05} duration={0.8} controlled={animate && !reduce} />
      </span>
    ) : w;
    if (!animate || reduce) return <span key={i}>{inner}{i < words.length - 1 ? " " : ""}</span>;
    return (
      <span key={i}>
        <span className="-mb-[0.14em] inline-block overflow-hidden pb-[0.24em] align-bottom">
          <motion.span className="inline-block" variants={word} custom={i}>{inner}</motion.span>
        </span>
        {i < words.length - 1 ? " " : ""}
      </span>
    );
  });
  if (!animate || reduce) return <>{items}</>;
  // Auslöser liegt auf dem (nicht abgeschnittenen) Wrapper – so starten auch kurze Überschriften zuverlässig.
  return (
    <motion.span initial="hidden" whileInView="show" viewport={{ once: true, margin: "-40px" }}>
      {items}
    </motion.span>
  );
}

export function SectionHeading({ eyebrow, title, emphasis, text, center = false, light = false }: { eyebrow?: string; title: string; emphasis?: string; text?: string; center?: boolean; light?: boolean }) {
  return (
    <div className={center ? "mx-auto max-w-3xl text-center" : "max-w-3xl"}>
      {eyebrow && <span className={`eyebrow ${light ? "!text-white/60 before:!text-sun" : ""}`}>{eyebrow}</span>}
      <h2 className={`relative mt-5 text-[2.3rem] font-semibold leading-[1.02] tracking-[-0.045em] sm:text-5xl lg:text-[3.6rem] ${light ? "text-white" : "text-navy"}`}>
        <Emph text={title} word={emphasis} />
      </h2>
      {text && (
        <motion.p initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.7, delay: 0.25 }}
          className={`mt-5 max-w-2xl text-lg leading-8 ${center ? "mx-auto" : ""} ${light ? "text-white/65" : "text-ink-soft"}`}>{text}</motion.p>
      )}
    </div>
  );
}
