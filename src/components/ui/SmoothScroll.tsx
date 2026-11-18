"use client";

import { useEffect } from "react";
import Lenis from "lenis";

/** Weiches Scrollen (Lenis). Deaktiviert bei „Bewegung reduzieren“ und auf Touch-Geräten. */
export function SmoothScroll() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (window.matchMedia("(pointer: coarse)").matches) return;
    // anchors: Links wie #ansprechpartner oder #preise gleiten sanft zum Abschnitt (Abstand für die Kopfzeile).
    const lenis = new Lenis({ duration: 1.1, easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), anchors: { offset: -80 } });
    let id = 0;
    const raf = (time: number) => { lenis.raf(time); id = requestAnimationFrame(raf); };
    id = requestAnimationFrame(raf);
    return () => { cancelAnimationFrame(id); lenis.destroy(); };
  }, []);
  return null;
}
