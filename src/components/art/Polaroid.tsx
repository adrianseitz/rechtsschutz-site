"use client";

import { motion, useReducedMotion } from "motion/react";
import { PHOTOS, type PhotoKey } from "@/lib/photos";

/** Echtes Foto als Polaroid mit Klebestreifen und handschriftlicher Bildunterschrift. */
export function Polaroid({ photo, caption, rotate = -4, className = "", width = 260, tape = true, priority = false, interactive = true }: {
  photo: PhotoKey; caption?: string; rotate?: number; className?: string; width?: number; tape?: boolean; priority?: boolean; interactive?: boolean;
}) {
  const p = PHOTOS[photo];
  const reduce = useReducedMotion();
  return (
    <motion.figure
      className={`relative bg-[#FFFEFA] p-2.5 pb-3 shadow-[0_2px_2px_rgba(11,11,10,0.06),0_24px_40px_-20px_rgba(11,11,10,0.5)] ${className}`}
      style={{ width, rotate }}
      initial={reduce ? false : { opacity: 0, y: 30, rotate: rotate + 8 }}
      whileInView={{ opacity: 1, y: 0, rotate }}
      viewport={{ once: true, margin: "-60px" }}
      whileHover={interactive && !reduce ? { rotate: rotate * -0.5, scale: 1.03, y: -6 } : undefined}
      whileTap={interactive && !reduce ? { rotate: rotate * -1.2, scale: 0.97 } : undefined}
      transition={{ type: "spring", stiffness: 160, damping: 16 }}
      data-burst
    >
      {tape && <span aria-hidden className="absolute -top-3 left-1/2 z-10 h-6 w-20 -translate-x-1/2 rotate-[-4deg] bg-[#FFE45C]/80 shadow-sm" />}
      <div className="relative overflow-hidden bg-paper" style={{ aspectRatio: "4 / 3.2" }}>
        <picture>
          <source srcSet={`${p.src}.webp`} type="image/webp" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={`${p.src}.jpg`} alt={p.alt} loading={priority ? "eager" : "lazy"} decoding="async" className="h-full w-full object-cover [filter:saturate(0.92)_contrast(1.04)]" style={{ objectPosition: p.pos }} />
        </picture>
        <span className="absolute bottom-1.5 right-1.5 rounded-sm bg-black/45 px-1.5 py-0.5 font-mono text-[8px] uppercase tracking-[0.12em] text-white/85">Symbolbild</span>
      </div>
      {caption && <figcaption className="px-1 pt-2.5 font-hand text-[20px] leading-tight text-navy">{caption}</figcaption>}
    </motion.figure>
  );
}
