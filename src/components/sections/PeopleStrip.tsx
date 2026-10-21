"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { motion, useAnimationControls, useReducedMotion } from "motion/react";
import { ArrowUpRight, RotateCcw } from "lucide-react";
import { PHOTOS, type PhotoKey } from "@/lib/photos";
import { SectionHeading } from "../ui/SectionHeading";
import { Scribble } from "../ui/Scribble";
import { fireBurst } from "../ui/ClickBurst";

type Moment = { photo: PhotoKey; front: string; back: string; tip: string; href: string; cta: string; rotate: number };

const MOMENTS: Moment[] = [
  { photo: "brief", front: "Post vom Arbeitgeber …", back: "Kündigung bekommen?", tip: "Für eine Kündigungsschutzklage bleiben nur 3 Wochen.", href: "/arbeitsrechtsschutz", cta: "Arbeitsrechtsschutz", rotate: -4 },
  { photo: "einzug", front: "Endlich die eigene Wohnung!", back: "Ärger mit Vermieter oder Handwerker?", tip: "Wohnungs- und Privatrechtsschutz lassen sich kombinieren.", href: "/privatrechtsschutz", cta: "Privatrechtsschutz", rotate: 3 },
  { photo: "vermieter", front: "Vermietet – und jetzt?", back: "Mieter zahlt nicht?", tip: "Mietstreit, Nebenkosten, Räumung – je nach Tarif.", href: "/vermieterrechtsschutz", cta: "Vermieterrechtsschutz", rotate: -2 },
  { photo: "privat", front: "40 Minuten Warteschleife.", back: "Händler stellt sich quer?", tip: "Vertragsstreit im Alltag ist ein Klassiker im Privatrechtsschutz.", href: "/privatrechtsschutz", cta: "Privatrechtsschutz", rotate: 4 },
  { photo: "firma", front: "Unser Laden, unser Risiko.", back: "Ärger als Arbeitgeber?", tip: "Auch Arbeitgeber zahlen vor dem Arbeitsgericht ihre Anwälte in der 1. Instanz selbst.", href: "/firmenrechtsschutz", cta: "Firmenrechtsschutz", rotate: -3 },
  { photo: "verkehr", front: "Kurz nicht aufgepasst.", back: "Wer ist schuld – wer zahlt?", tip: "Verkehrsrechtsschutz gibt es als Baustein dazu.", href: "/rechtsschutz-check?bereich=mehrere&auswahl=verkehr", cta: "Check starten", rotate: 2 },
  { photo: "stress", front: "Dieser Bescheid kann nicht stimmen.", back: "Widerspruch einlegen?", tip: "Meist bleibt dafür ein Monat ab Bekanntgabe.", href: "/privatrechtsschutz", cta: "Privatrechtsschutz", rotate: -5 },
];

function FlipCard({ m, i, dragging, hint }: { m: Moment; i: number; dragging: React.RefObject<boolean>; hint: boolean }) {
  const [flipped, setFlipped] = useState(false);
  const reduce = useReducedMotion();
  const p = PHOTOS[m.photo];
  const wiggle = useAnimationControls();

  useEffect(() => {
    if (!hint || reduce) return;
    const id = setInterval(() => wiggle.start({ rotate: [0, -3, 3, -2, 0], transition: { duration: 0.6 } }), 3200);
    return () => clearInterval(id);
  }, [hint, reduce, wiggle]);

  return (
    <motion.div
      className="relative shrink-0 [perspective:1400px]"
      style={{ width: 280, height: 360, rotate: m.rotate }}
      initial={reduce ? false : { opacity: 0, y: 40, rotate: m.rotate + 10 }}
      whileInView={{ opacity: 1, y: 0, rotate: m.rotate }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ type: "spring", stiffness: 140, damping: 16, delay: (i % 4) * 0.06 }}
    >
      <motion.button
        type="button"
        animate={wiggle}
        aria-pressed={flipped}
        aria-label={`${m.front} – umdrehen`}
        data-burst
        onClick={(e) => {
          if (dragging.current) return;
          setFlipped((f) => !f);
          fireBurst(e.clientX, e.clientY, !flipped);
          if ("vibrate" in navigator) { try { navigator.vibrate(12); } catch { /* */ } }
        }}
        whileHover={reduce ? undefined : { y: -8, scale: 1.02 }}
        whileTap={reduce ? undefined : { scale: 0.97 }}
        className="relative block h-full w-full cursor-pointer text-left"
      >
        <motion.div className="relative h-full w-full [transform-style:preserve-3d]" animate={{ rotateY: flipped ? 180 : 0 }} transition={{ type: "spring", stiffness: 160, damping: 18 }}>
          {/* Vorderseite: Foto */}
          <div className="absolute inset-0 bg-[#FFFEFA] p-3 pb-4 shadow-[0_2px_2px_rgba(11,11,10,0.06),0_28px_44px_-22px_rgba(11,11,10,0.55)] [backface-visibility:hidden]">
            <span aria-hidden className="absolute -top-3 left-1/2 z-10 h-6 w-20 -translate-x-1/2 rotate-[-4deg] bg-[#FFE45C]/80 shadow-sm" />
            <div className="relative h-[262px] overflow-hidden bg-paper">
              <picture>
                <source srcSet={`${p.src}.webp`} type="image/webp" />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`${p.src}.jpg`} alt={p.alt} loading="lazy" decoding="async" draggable={false} className="h-full w-full object-cover [filter:saturate(0.92)_contrast(1.04)]" style={{ objectPosition: p.pos }} />
              </picture>
              <span className="absolute bottom-1.5 right-1.5 rounded-sm bg-black/45 px-1.5 py-0.5 font-mono text-[8px] uppercase tracking-[0.12em] text-white/85">Symbolbild</span>
              <span className="absolute left-2 top-2 grid h-8 w-8 place-items-center rounded-full bg-white/90 text-navy shadow-sm"><RotateCcw className="h-4 w-4" aria-hidden /></span>
            </div>
            <p className="px-1 pt-3 font-hand text-[23px] leading-tight text-navy">{m.front}</p>
          </div>
          {/* Rückseite: Notiz */}
          <div className="absolute inset-0 flex flex-col bg-[#FFE45C] p-6 shadow-[0_28px_44px_-22px_rgba(11,11,10,0.55)] [backface-visibility:hidden] [transform:rotateY(180deg)]"
            style={{ backgroundImage: "repeating-linear-gradient(180deg, transparent 0 31px, rgba(11,11,10,0.08) 31px 32px)" }}>
            <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-navy/50">§ Was hier hilft</span>
            <p className="mt-4 font-hand text-[30px] leading-[1.05] text-navy">{m.back}</p>
            <p className="mt-3 font-hand text-[21px] leading-[1.2] text-navy/80">{m.tip}</p>
            <span className="mt-auto inline-flex w-fit items-center gap-2 rounded-full bg-navy py-2 pl-4 pr-2 text-sm font-medium text-white">
              {m.cta}
              <span className="grid h-7 w-7 place-items-center rounded-full bg-sun text-navy"><ArrowUpRight className="h-4 w-4" aria-hidden /></span>
            </span>
          </div>
        </motion.div>
      </motion.button>
      {/* echter Link auf der Rückseite (separat, damit Umdrehen und Navigieren getrennt bleiben) */}
      {flipped && (
        <Link href={m.href} className="absolute bottom-6 left-6 z-10 h-11 w-[190px] rounded-full" aria-label={`${m.cta} ansehen`} />
      )}
    </motion.div>
  );
}

export function PeopleStrip() {
  const wrap = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);
  const [limit, setLimit] = useState(0);
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    const update = () => {
      if (wrap.current && track.current) setLimit(Math.max(0, track.current.scrollWidth - wrap.current.clientWidth));
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  return (
    <section className="bg-paper py-24 [overflow:clip] sm:py-32" aria-label="Momente aus dem Alltag">
      <div className="container flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
        <SectionHeading eyebrow="Echte Momente" title="Es fängt fast immer ganz alltäglich an." emphasis="alltäglich" />
        <div className="relative flex items-center gap-3 lg:pb-3">
          <p className="font-hand text-[24px] leading-tight text-navy">Zieh die Fotos zur Seite –<br />oder tipp eins an!</p>
          <Scribble kind="arrow" className="h-12 w-16 rotate-[30deg]" width={2} delay={0.5} />
        </div>
      </div>

      <div ref={wrap} className="mt-14 cursor-grab active:cursor-grabbing" onPointerDown={() => setTouched(true)}>
        <motion.div
          ref={track}
          drag="x"
          dragConstraints={{ left: -limit, right: 0 }}
          dragElastic={0.12}
          dragTransition={{ bounceStiffness: 260, bounceDamping: 26 }}
          onDragStart={() => { dragging.current = true; }}
          onDragEnd={() => { setTimeout(() => { dragging.current = false; }, 60); }}
          className="flex w-max gap-10 px-6 pb-10 pt-6 md:px-[max(2rem,calc((100vw-1200px)/2+2rem))]"
        >
          {MOMENTS.map((m, i) => <FlipCard key={m.photo} m={m} i={i} dragging={dragging} hint={!touched && i === 0} />)}
        </motion.div>
      </div>
      <p className="container mt-2 text-xs text-ink-muted">Symbolbilder von Unsplash mit Models – keine Kundinnen und Kunden. Ob ein Fall versichert ist, regelt der jeweilige Tarif.</p>
    </section>
  );
}
