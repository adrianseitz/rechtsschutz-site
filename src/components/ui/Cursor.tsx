"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useMotionValue, useSpring } from "motion/react";

/**
 * Dezenter Cursor-Begleiter (nur Maus, nicht bei „Bewegung reduzieren“).
 * Elemente mit data-cursor="Text" zeigen ein Label, Links vergrößern den Punkt.
 */
export function Cursor() {
  const [enabled, setEnabled] = useState(false);
  const [label, setLabel] = useState<string | null>(null);
  const [hover, setHover] = useState(false);
  const [hidden, setHidden] = useState(true);
  const x = useMotionValue(-100);
  const y = useMotionValue(-100);
  const sx = useSpring(x, { stiffness: 500, damping: 40, mass: 0.4 });
  const sy = useSpring(y, { stiffness: 500, damping: 40, mass: 0.4 });

  useEffect(() => {
    const ok = window.matchMedia("(pointer: fine)").matches && !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setEnabled(ok);
    if (!ok) return;
    const move = (e: PointerEvent) => {
      x.set(e.clientX); y.set(e.clientY); setHidden(false);
      const t = e.target as HTMLElement | null;
      const withLabel = t?.closest<HTMLElement>("[data-cursor]");
      setLabel(withLabel?.dataset.cursor ?? null);
      setHover(!!t?.closest("a, button, [role=radio], input[type=range], label"));
    };
    const leave = () => setHidden(true);
    window.addEventListener("pointermove", move, { passive: true });
    document.documentElement.addEventListener("pointerleave", leave);
    return () => { window.removeEventListener("pointermove", move); document.documentElement.removeEventListener("pointerleave", leave); };
  }, [x, y]);

  if (!enabled) return null;
  const size = label ? 96 : hover ? 44 : 12;
  return (
    <motion.div aria-hidden className="pointer-events-none fixed left-0 top-0 z-[80]" style={{ x: sx, y: sy }}>
      <motion.div
        className={`-translate-x-1/2 -translate-y-1/2 rounded-full ${label ? "bg-navy" : "bg-sun mix-blend-multiply"}`}
        animate={{ width: size, height: size, opacity: hidden ? 0 : 1 }}
        transition={{ type: "spring", stiffness: 400, damping: 28 }}
        style={{ display: "grid", placeItems: "center" }}
      >
        <AnimatePresence>
          {label && (
            <motion.span initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="font-mono text-[11px] uppercase tracking-[0.12em] text-sun">
              {label}
            </motion.span>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}
