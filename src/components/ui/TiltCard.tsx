"use client";

import { useRef } from "react";
import { motion, useMotionTemplate, useMotionValue, useReducedMotion, useSpring, useTransform } from "motion/react";

/** Karte, die dem Mauszeiger folgt – 3D-Neigung plus Lichtreflex. Auf Touch-Geräten statisch. */
export function TiltCard({ children, className = "", max = 7 }: { children: React.ReactNode; className?: string; max?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const px = useMotionValue(0.5);
  const py = useMotionValue(0.5);
  const sx = useSpring(px, { stiffness: 180, damping: 18, mass: 0.4 });
  const sy = useSpring(py, { stiffness: 180, damping: 18, mass: 0.4 });
  const rotateX = useTransform(sy, [0, 1], [max, -max]);
  const rotateY = useTransform(sx, [0, 1], [-max, max]);
  const glow = useMotionTemplate`radial-gradient(420px circle at ${useTransform(sx, [0, 1], ["0%", "100%"])} ${useTransform(sy, [0, 1], ["0%", "100%"])}, rgba(255,214,10,0.16), transparent 60%)`;

  if (reduce) return <div className={className}>{children}</div>;

  return (
    <motion.div
      ref={ref}
      className={`group relative [transform-style:preserve-3d] ${className}`}
      style={{ rotateX, rotateY, transformPerspective: 900 }}
      onPointerMove={(e) => {
        if (e.pointerType !== "mouse") return;
        const r = ref.current!.getBoundingClientRect();
        px.set((e.clientX - r.left) / r.width);
        py.set((e.clientY - r.top) / r.height);
      }}
      onPointerLeave={() => { px.set(0.5); py.set(0.5); }}
    >
      <motion.div aria-hidden className="pointer-events-none absolute inset-0 z-10 rounded-[inherit] opacity-0 transition-opacity duration-300 group-hover:opacity-100" style={{ background: glow }} />
      {children}
    </motion.div>
  );
}
