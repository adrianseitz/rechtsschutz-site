"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowRight, Phone } from "lucide-react";
import { productList } from "@/lib/products";
import { site } from "@/lib/site";
import { countEvent } from "@/lib/localEvents";

const HIDDEN = ["/rechtsschutz-check", "/kontakt", "/vielen-dank", "/datenschutz", "/impressum", "/nutzungsbedingungen"];
/** Hier ist die Leiste sofort da (Anzeigen-Zielseite), sonst erst nach etwas Scrollen. */
const ALWAYS = ["/vermieterrechtsschutz"];
/** Hier steht die Anfrage direkt oben auf der Seite (#anfrage) – die Leiste springt dorthin. */
const INLINE_FORM = ["/vermieterrechtsschutz"];

export function StickyCta() {
  const pathname = usePathname();
  const always = ALWAYS.includes(pathname);
  // Sofort-Seiten: schon im ersten HTML sichtbar, nicht erst nach dem Laden des JavaScripts.
  // Mit Anfrage oben auf der Seite: erst zeigen, wenn das Formular aus dem Bild gescrollt ist (sonst verdeckt die Leiste den Absenden-Button).
  const [visible, setVisible] = useState(always && !INLINE_FORM.includes(pathname));
  const product = productList.find((p) => p.slug === pathname);

  useEffect(() => {
    // Ausblenden, solange das Rückruf-Formular zu sehen ist – sonst liegt die Leiste über den Eingabefeldern.
    let formInView = false;
    const onScroll = () => setVisible((always || window.scrollY > 520) && !formInView);
    // Ausblenden, solange ein Formular (Rückruf oder Anfrage oben) zu sehen ist.
    const forms = ["rueckruf", "anfrage"].map((id) => document.getElementById(id)).filter((el): el is HTMLElement => !!el);
    const inView = new Set<Element>();
    const io = forms.length && "IntersectionObserver" in window
      ? new IntersectionObserver((entries) => {
          for (const e of entries) { if (e.isIntersecting) inView.add(e.target); else inView.delete(e.target); }
          formInView = inView.size > 0; onScroll();
        }, { threshold: 0.15 })
      : null;
    if (io) forms.forEach((f) => io.observe(f));
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => { window.removeEventListener("scroll", onScroll); io?.disconnect(); };
  }, [pathname, always]);

  if (HIDDEN.includes(pathname)) return null;
  const href = INLINE_FORM.includes(pathname) ? "#anfrage" : product ? `/rechtsschutz-check?bereich=${product.key}` : "/rechtsschutz-check";
  const label = product ? product.hero.cta : "Rechtsschutz-Check starten";

  return (
    <AnimatePresence>
      {visible && (
        <motion.div initial={always ? false : { y: 90 }} animate={{ y: 0 }} exit={{ y: 90 }} transition={{ type: "spring", stiffness: 380, damping: 34 }}
          // Sofort-Seiten: schmaler (ohne Zusatzzeile), damit die Auswahl im Hero darüber sichtbar bleibt.
          className={`fixed inset-x-0 bottom-0 z-40 border-t border-line bg-white/95 px-4 backdrop-blur md:hidden ${always ? "pb-[max(env(safe-area-inset-bottom),10px)] pt-2.5" : "pb-[max(env(safe-area-inset-bottom),12px)] pt-3"}`}>
          <div className="flex items-stretch gap-2">
            <a href={`tel:${site.phone.replace(/[^\d+]/g, "").replace(/^0/, "+49")}`} onClick={() => countEvent("call")} aria-label={`Anrufen: ${site.phone}`}
              className={`grid shrink-0 place-items-center rounded-full border border-navy bg-white text-navy ${always ? "w-[46px]" : "w-[52px]"}`}>
              <Phone className="h-5 w-5" aria-hidden />
            </a>
            <Link href={href} className={`flex min-w-0 flex-1 items-center justify-center gap-2 rounded-full bg-sun text-[15px] font-semibold text-navy ${always ? "py-3" : "py-3.5"}`}>
              <span className="truncate">{label}</span> <ArrowRight className="h-4 w-4 shrink-0" aria-hidden />
            </Link>
          </div>
          {!always && <p className="mt-1.5 text-center text-[11px] text-ink-muted">Kostenlos & unverbindlich · ca. 60 Sekunden</p>}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
