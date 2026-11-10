"use client";
import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";

const Shield3D = dynamic(() => import("./Shield3D"), { ssr: false });

/**
 * Lädt die 3D-Szene erst, wenn sie in die Nähe des sichtbaren Bereichs kommt und der Browser Luft hat.
 * Auf dem Handy liegt sie unter dem ersten Bildschirm – so bremst sie den Seitenstart nicht.
 */
export function ShieldScene({ className }: { className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let idle = 0;
    const io = new IntersectionObserver((entries) => {
      if (!entries.some((e) => e.isIntersecting)) return;
      io.disconnect();
      const start = () => setShow(true);
      const w = window as unknown as { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number };
      if (w.requestIdleCallback) idle = w.requestIdleCallback(start, { timeout: 1500 });
      else idle = window.setTimeout(start, 300);
    }, { rootMargin: "300px 0px" });
    io.observe(el);
    return () => { io.disconnect(); if (idle) { window.clearTimeout(idle); (window as unknown as { cancelIdleCallback?: (n: number) => void }).cancelIdleCallback?.(idle); } };
  }, []);

  return <div ref={ref} className={className}>{show && <Shield3D className="absolute inset-0" />}</div>;
}
