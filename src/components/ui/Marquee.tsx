"use client";

import { useRef } from "react";
import { motion, useAnimationFrame, useMotionValue, useReducedMotion, useScroll, useSpring, useTransform, useVelocity, wrap } from "motion/react";

/** Laufleiste, die beim Scrollen beschleunigt und die Richtung wechselt. Keine erfundenen Zahlen. */
export function Marquee({ items, dark = false, baseSpeed = 2.2 }: { items: string[]; dark?: boolean; baseSpeed?: number }) {
  const reduce = useReducedMotion();
  const base = useMotionValue(0);
  const { scrollY } = useScroll();
  const vel = useSpring(useVelocity(scrollY), { damping: 50, stiffness: 400 });
  const factor = useTransform(vel, [-1500, 0, 1500], [-5, 0, 5], { clamp: false });
  const skew = useTransform(vel, [-2000, 0, 2000], [6, 0, -6]);
  const dir = useRef(1);
  const x = useTransform(base, (v) => `${wrap(-33.333, 0, v)}%`);

  useAnimationFrame((_, delta) => {
    if (reduce) return;
    let move = dir.current * baseSpeed * (delta / 1000);
    const f = factor.get();
    if (f < 0) dir.current = -1; else if (f > 0) dir.current = 1;
    move += dir.current * move * Math.abs(f);
    base.set(base.get() - Math.abs(move) * dir.current);
  });

  const row = [...items, ...items, ...items];
  return (
    <div className={`relative overflow-hidden border-y py-6 ${dark ? "border-white/10 bg-navy" : "border-line bg-white"}`} aria-label="Unsere Grundsätze">
      <motion.div style={{ x, skewX: skew }} className="flex w-max items-center gap-12 whitespace-nowrap">
        {row.map((t, i) => (
          <span key={i} className={`flex items-center gap-12 ${dark ? "text-white" : "text-navy"}`}>
            <span className="font-serif text-[2rem] italic leading-none tracking-[-0.01em]">{t}</span>
            <span className="font-serif text-2xl text-sun [text-shadow:0_0_0_#0B0B0A]" style={{ WebkitTextStroke: "1px #0B0B0A" }}>§</span>
          </span>
        ))}
      </motion.div>
    </div>
  );
}
