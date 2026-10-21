"use client";

import { motion, useReducedMotion } from "motion/react";

/** Notizzettel mit Klebestreifen und Handschrift – bewusst „analog“. */
export function StickyNote({ children, rotate = -4, className = "", tone = "yellow", sign, delay = 0.2 }: { children: React.ReactNode; rotate?: number; className?: string; tone?: "yellow" | "white"; sign?: string; delay?: number }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 24, rotate: rotate - 8, scale: 0.9 }}
      whileInView={{ opacity: 1, y: 0, rotate, scale: 1 }}
      viewport={{ once: true, margin: "-60px" }}
      whileHover={reduce ? undefined : { rotate: rotate * -0.4, y: -4 }}
      transition={{ type: "spring", stiffness: 180, damping: 16, delay }}
      className={`relative w-[220px] p-5 pt-7 shadow-[0_18px_30px_-16px_rgba(11,11,10,0.45),0_2px_0_rgba(11,11,10,0.04)] ${tone === "yellow" ? "bg-[#FFE45C]" : "bg-white"} ${className}`}
      style={{ clipPath: "polygon(0 0, 100% 0, 100% 92%, 94% 100%, 0 100%)" }}
    >
      <span aria-hidden className="absolute -top-3 left-1/2 h-6 w-20 -translate-x-1/2 rotate-[-3deg] bg-white/55 shadow-sm backdrop-blur-[1px]" style={{ maskImage: "linear-gradient(90deg, transparent 0 3px, #000 3px calc(100% - 3px), transparent calc(100% - 3px))" }} />
      <div className="font-hand text-[22px] leading-[1.15] text-navy">{children}</div>
      {sign && <p className="mt-3 text-right font-hand text-lg text-navy/70">– {sign}</p>}
    </motion.div>
  );
}
