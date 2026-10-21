"use client";

import { AnimatePresence, motion } from "motion/react";

/** Vollbild-Stempel nach erfolgreichem Absenden – kurzer, einprägsamer Abschluss. */
export function StampOverlay({ show, text = "Eingegangen", sub = "Ich melde mich bei dir" }: { show: boolean; text?: string; sub?: string }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div className="fixed inset-0 z-[90] grid place-items-center bg-white/70 backdrop-blur-[2px]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <motion.div
            initial={{ scale: 3, rotate: -24, opacity: 0 }}
            animate={{ scale: 1, rotate: -9, opacity: 1, x: [0, -6, 5, -3, 0] }}
            transition={{ type: "spring", stiffness: 520, damping: 20, x: { delay: 0.18, duration: 0.3 } }}
            className="rounded-[14px] border-[6px] border-navy px-8 py-4 text-center text-navy mix-blend-multiply"
            style={{ background: "repeating-linear-gradient(90deg, rgba(255,214,10,0.95) 0 6px, rgba(255,214,10,0.82) 6px 9px)" }}
          >
            <p className="font-mono text-[42px] font-bold uppercase leading-none tracking-[0.12em] sm:text-[64px]">{text}</p>
            <p className="mt-2 font-hand text-2xl">{sub} ✓</p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
