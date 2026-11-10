"use client";

import { site } from "@/lib/site";
import { countEvent } from "@/lib/localEvents";

export const telHref = `tel:${site.phone.replace(/[^\d+]/g, "").replace(/^0/, "+49")}`;

/** Anruf-Link, der Klicks anonym mitzählt (eigene Statistik, ohne Cookies). */
export function CallLink({ className, children }: { className?: string; children?: React.ReactNode }) {
  return (
    <a href={telHref} onClick={() => countEvent("call")} className={className}>
      {children ?? site.phone}
    </a>
  );
}
