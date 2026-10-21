"use client";

import { motion, useReducedMotion } from "motion/react";

/** Handgezeichnete Markierungen, die sich beim Sichtbarwerden selbst zeichnen. */
const PATHS = {
  underline: { vb: "0 0 300 24", d: ["M4 14C60 6 132 4 206 9c32 2 62 5 90 9", "M24 20c58-6 140-8 232-2"] },
  circle: { vb: "0 0 300 120", d: ["M150 8C70 6 10 30 12 62c2 34 74 52 150 50 78-2 132-26 128-58C286 22 214 4 120 12 82 16 52 24 34 34"] },
  arrow: { vb: "0 0 160 120", d: ["M8 14c30 4 70 18 92 44 14 17 22 36 28 52", "M108 96l20 16 10-26"] },
  arrowLeft: { vb: "0 0 160 120", d: ["M152 10c-36 2-80 16-104 42-14 16-22 34-28 56", "M40 92 20 110 12 84"] },
  zigzag: { vb: "0 0 200 30", d: ["M4 20 22 8l16 14 18-14 16 14 18-14 16 14 18-14 16 14 18-14 16 14 18-12"] },
  check: { vb: "0 0 60 50", d: ["M6 28c8 6 14 12 18 18C32 30 42 16 56 4"] },
  star: { vb: "0 0 60 60", d: ["M30 4c2 12 6 22 26 26-20 4-24 14-26 26-2-12-6-22-26-26 20-4 24-14 26-26Z"] },
} as const;

export type ScribbleKind = keyof typeof PATHS;

/** controlled = true: Animation folgt dem Eltern-Element (Varianten "hidden"/"show") statt eigenem Sichtbarkeits-Trigger. */
export function Scribble({ kind, className = "", color = "#0B0B0A", width = 3, delay = 0, duration = 1.1, controlled = false }: { kind: ScribbleKind; className?: string; color?: string; width?: number; delay?: number; duration?: number; controlled?: boolean }) {
  const reduce = useReducedMotion();
  const p = PATHS[kind];
  return (
    <svg viewBox={p.vb} className={className} fill="none" aria-hidden preserveAspectRatio="none">
      {p.d.map((d, i) => (
        controlled && !reduce ? (
          <motion.path key={i} d={d} stroke={color} strokeWidth={width} strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke"
            variants={{
              hidden: { pathLength: 0, opacity: 0 },
              show: { pathLength: 1, opacity: 1, transition: { pathLength: { duration, delay: delay + i * duration * 0.7, ease: [0.65, 0, 0.35, 1] }, opacity: { duration: 0.01, delay: delay + i * duration * 0.7 } } },
            }} />
        ) : (
          <motion.path key={i} d={d} stroke={color} strokeWidth={width} strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke"
            initial={reduce ? false : { pathLength: 0, opacity: 0 }} whileInView={{ pathLength: 1, opacity: 1 }} viewport={{ once: true, margin: "-40px" }}
            transition={{ pathLength: { duration, delay: delay + i * duration * 0.7, ease: [0.65, 0, 0.35, 1] }, opacity: { duration: 0.01, delay: delay + i * duration * 0.7 } }} />
        )
      ))}
    </svg>
  );
}
