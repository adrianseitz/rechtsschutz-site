"use client";

import { useEffect } from "react";
import { motion, useReducedMotion } from "motion/react";
import { fireBurst } from "./ui/ClickBurst";

/** Danke-Seite: Stempel „Angekommen“ mit Partikel-Effekt. */
export function ArrivalStamp() {
  const reduce = useReducedMotion();
  useEffect(() => {
    if (reduce) return;
    const t = setTimeout(() => fireBurst(window.innerWidth / 2, 200, true), 380);
    return () => clearTimeout(t);
  }, [reduce]);
  return (
    <motion.div
      initial={reduce ? false : { scale: 2.8, rotate: -26, opacity: 0 }}
      animate={{ scale: 1, rotate: -8, opacity: 1 }}
      transition={{ type: "spring", stiffness: 480, damping: 18, delay: 0.25 }}
      className="mx-auto inline-block rounded-[12px] border-[5px] border-navy bg-sun px-6 py-3 text-navy"
      aria-hidden
    >
      <p className="font-mono text-3xl font-bold uppercase tracking-[0.14em] sm:text-4xl">Angekommen</p>
      <p className="font-hand text-xl">Danke für dein Vertrauen</p>
    </motion.div>
  );
}
