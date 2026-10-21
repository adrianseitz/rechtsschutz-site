"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";

const KEY = "rs_intro_seen";
export const INTRO_DONE_EVENT = "rs:intro-done";

/**
 * Einstiegs-Moment „Der Stempel“ (ca. 2,3 s):
 * Brief rutscht ins Bild → Stempel „Abgesichert“ knallt drauf (Bildschirm wackelt, gelbe Druckwelle)
 * → Claim erscheint → gelber Vorhang gibt die Seite frei.
 * Nur einmal pro Sitzung, per Klick/Taste überspringbar, entfällt bei „Bewegung reduzieren“.
 */
export function Intro() {
  const [show, setShow] = useState(false);
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    let seen = false;
    try { seen = sessionStorage.getItem(KEY) === "1"; } catch { /* */ }
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const bot = /bot|crawl|spider|lighthouse|headless/i.test(navigator.userAgent);
    const uncover = () => document.documentElement.classList.remove("intro-pending");
    if (seen || reduce || bot) { uncover(); (window as unknown as { __rsIntroDone?: boolean }).__rsIntroDone = true; window.dispatchEvent(new Event(INTRO_DONE_EVENT)); return; }
    try { sessionStorage.setItem(KEY, "1"); } catch { /* */ }
    setShow(true);
    requestAnimationFrame(() => requestAnimationFrame(uncover));
    document.documentElement.style.overflow = "hidden";
    const timers = [
      setTimeout(() => setPhase(1), 650),   // Stempel
      setTimeout(() => setPhase(2), 1250),  // Claim
      setTimeout(() => setPhase(3), 2000),  // Vorhang
      setTimeout(() => finish(), 2450),
    ];
    const skip = () => finish();
    window.addEventListener("keydown", skip, { once: true });
    function finish() {
      timers.forEach(clearTimeout);
      setShow(false);
      document.documentElement.style.overflow = "";
      (window as unknown as { __rsIntroDone?: boolean }).__rsIntroDone = true;
      window.dispatchEvent(new Event(INTRO_DONE_EVENT));
      window.removeEventListener("keydown", skip);
    }
    (window as unknown as { __rsIntroFinish?: () => void }).__rsIntroFinish = finish;
    return () => { timers.forEach(clearTimeout); document.documentElement.style.overflow = ""; };
  }, []);

  useEffect(() => {
    if (phase === 1 && "vibrate" in navigator) { try { navigator.vibrate(18); } catch { /* */ } }
  }, [phase]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          key="intro"
          role="presentation"
          onClick={() => (window as unknown as { __rsIntroFinish?: () => void }).__rsIntroFinish?.()}
          className="fixed inset-0 z-[100] cursor-pointer overflow-hidden"
          exit={{ clipPath: "inset(0 0 100% 0)" }}
          transition={{ duration: 0.55, ease: [0.76, 0, 0.24, 1] }}
          style={{ clipPath: "inset(0 0 0% 0)" }}
        >
          {/* Hintergrund: Papier */}
          <motion.div className="absolute inset-0 bg-[#F4F3EE]"
            animate={phase === 1 ? { x: [0, -10, 9, -6, 4, 0], y: [0, 6, -5, 3, 0] } : {}} transition={{ duration: 0.38 }} />

          {/* Gelber Vorhang von unten */}
          <motion.div className="absolute inset-x-0 bottom-0 bg-sun" initial={{ height: "0%" }} animate={{ height: phase >= 3 ? "100%" : "0%" }} transition={{ duration: 0.5, ease: [0.76, 0, 0.24, 1] }} />

          <div className="relative grid h-full place-items-center px-6">
            <div className="relative">
              {/* Brief */}
              <motion.div
                initial={{ y: "60vh", rotate: 14, opacity: 0 }}
                animate={{ y: phase >= 3 ? "-8vh" : 0, rotate: phase >= 1 ? -3 : 4, opacity: phase >= 3 ? 0 : 1, scale: phase === 1 ? [1, 0.96, 1] : 1 }}
                transition={{ type: "spring", stiffness: 120, damping: 18 }}
                className="relative w-[78vw] max-w-[380px] rounded-[3px] bg-[#FFFEFA] p-6 shadow-[0_30px_60px_-30px_rgba(11,11,10,0.55)]"
              >
                <p className="text-[11px] font-bold tracking-[0.08em] text-navy">POST FÜR DICH</p>
                <p className="mt-1 font-mono text-[9px] uppercase tracking-[0.16em] text-ink-muted">Einschreiben · Musterstadt</p>
                <div className="mt-5 space-y-2">
                  {[92, 86, 95, 70, 88, 52].map((w, i) => <div key={i} className="h-[5px] rounded-full bg-navy/[0.12]" style={{ width: `${w}%` }} />)}
                </div>
                <p className="mt-5 font-hand text-2xl text-[#1F3A8A]">… und jetzt?</p>

                {/* Stempel */}
                <AnimatePresence>
                  {phase >= 1 && (
                    <motion.div
                      initial={{ scale: 3.2, rotate: -30, opacity: 0 }}
                      animate={{ scale: 1, rotate: -11, opacity: 1 }}
                      transition={{ type: "spring", stiffness: 700, damping: 22 }}
                      className="absolute left-1/2 top-1/2 -ml-[130px] -mt-[52px] w-[260px] rounded-[10px] border-[5px] border-navy bg-sun/90 px-4 py-3 text-center text-navy mix-blend-multiply"
                    >
                      <p className="font-mono text-[30px] font-bold uppercase leading-none tracking-[0.12em]">Abgesichert</p>
                      <p className="mt-1 font-serif text-lg italic">§ Rechtsschutz</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>

              {/* Druckwelle */}
              {phase >= 1 && (
                <motion.span aria-hidden className="pointer-events-none absolute left-1/2 top-1/2 -ml-[10px] -mt-[10px] h-5 w-5 rounded-full border-[3px] border-sun"
                  initial={{ scale: 1, opacity: 0.9 }} animate={{ scale: 40, opacity: 0 }} transition={{ duration: 0.8, ease: "easeOut" }} />
              )}
            </div>
          </div>

          {/* Claim */}
          <AnimatePresence>
            {phase >= 2 && (
              <motion.p
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                className="absolute inset-x-0 bottom-[12vh] z-10 px-6 text-center text-[2rem] font-semibold leading-none tracking-[-0.045em] text-navy sm:text-5xl"
              >
                Bevor es ernst wird: <span className="font-serif font-normal italic">abgesichert.</span>
              </motion.p>
            )}
          </AnimatePresence>

          <button onClick={(e) => { e.stopPropagation(); (window as unknown as { __rsIntroFinish?: () => void }).__rsIntroFinish?.(); }}
            className="absolute right-5 top-5 z-10 rounded-full border border-navy/15 bg-white/70 px-4 py-2 font-mono text-[11px] uppercase tracking-[0.14em] text-navy backdrop-blur">
            Überspringen
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
