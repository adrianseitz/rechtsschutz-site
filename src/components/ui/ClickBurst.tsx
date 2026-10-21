"use client";

import { useEffect, useRef } from "react";

/**
 * Live-Feedback bei jedem Antippen/Klicken auf Buttons, Links und markierte Elemente:
 * gelber Ring, kleine Partikel (§, Punkte, Striche) und auf Handys ein kurzes Vibrieren.
 * Reines Canvas-Overlay – blockiert keine Klicks, respektiert „Bewegung reduzieren“.
 */
type P = { x: number; y: number; vx: number; vy: number; life: number; max: number; kind: 0 | 1 | 2; rot: number; vr: number; size: number; color: string };
type Ring = { x: number; y: number; life: number; max: number };

const COLORS = ["#FFD60A", "#0B0B0A", "#FFE14D", "#E6BE00"];

export function ClickBurst() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const cv = ref.current!;
    const ctx = cv.getContext("2d")!;
    let parts: P[] = [];
    let rings: Ring[] = [];
    let raf = 0;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const resize = () => {
      cv.width = window.innerWidth * dpr;
      cv.height = window.innerHeight * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    const tick = () => {
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
      rings = rings.filter((r) => (r.life += 1) < r.max);
      for (const r of rings) {
        const t = r.life / r.max;
        ctx.beginPath();
        ctx.arc(r.x, r.y, 8 + t * 46, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(255,214,10,${0.9 * (1 - t)})`;
        ctx.lineWidth = 3 * (1 - t) + 0.5;
        ctx.stroke();
      }
      parts = parts.filter((p) => (p.life += 1) < p.max);
      for (const p of parts) {
        p.vy += 0.18;
        p.vx *= 0.98;
        p.x += p.vx;
        p.y += p.vy;
        p.rot += p.vr;
        const a = 1 - p.life / p.max;
        ctx.save();
        ctx.globalAlpha = a;
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.color;
        if (p.kind === 0) {
          ctx.font = `italic ${p.size * 2.2}px "Instrument Serif", Georgia, serif`;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText("§", 0, 0);
        } else if (p.kind === 1) {
          ctx.beginPath();
          ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.fillRect(-p.size, -1.5, p.size * 2, 3);
        }
        ctx.restore();
      }
      if (parts.length || rings.length) raf = requestAnimationFrame(tick);
      else raf = 0;
    };

    const burst = (x: number, y: number, strong: boolean) => {
      rings.push({ x, y, life: 0, max: 26 });
      const n = strong ? 22 : 12;
      for (let i = 0; i < n; i++) {
        const ang = Math.random() * Math.PI * 2;
        const sp = (strong ? 3.5 : 2.4) + Math.random() * (strong ? 4 : 2.5);
        parts.push({
          x, y, vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp - 2.2, life: 0, max: 34 + Math.random() * 22,
          kind: (i % 5 === 0 ? 0 : i % 2 ? 1 : 2) as P["kind"], rot: Math.random() * 6, vr: (Math.random() - 0.5) * 0.35,
          size: 4 + Math.random() * 5, color: COLORS[i % COLORS.length],
        });
      }
      if (!raf) raf = requestAnimationFrame(tick);
    };

    const onDown = (e: PointerEvent) => {
      const t = e.target as HTMLElement | null;
      const el = t?.closest<HTMLElement>("a, button, [role=radio], [data-burst], input[type=checkbox], label");
      if (!el) return;
      const strong = el.matches("[data-burst-strong], button[type=submit]") || !!el.closest("[data-burst-strong]");
      burst(e.clientX, e.clientY, strong);
      if (e.pointerType === "touch" && "vibrate" in navigator) {
        try { navigator.vibrate(strong ? [8, 30, 12] : 8); } catch { /* nicht unterstützt */ }
      }
    };
    const onCustom = (e: Event) => {
      const d = (e as CustomEvent<{ x: number; y: number; strong?: boolean }>).detail;
      if (d) burst(d.x, d.y, !!d.strong);
    };
    window.addEventListener("pointerdown", onDown, { passive: true });
    window.addEventListener("rs:burst", onCustom);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("rs:burst", onCustom);
    };
  }, []);

  return <canvas ref={ref} aria-hidden className="pointer-events-none fixed inset-0 z-[85] h-full w-full" />;
}

/** Löst einen Effekt aus Code heraus aus (z. B. nach erfolgreichem Absenden). */
export function fireBurst(x: number, y: number, strong = true) {
  window.dispatchEvent(new CustomEvent("rs:burst", { detail: { x, y, strong } }));
}
