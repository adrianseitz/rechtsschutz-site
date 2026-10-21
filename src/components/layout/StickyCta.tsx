"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowRight } from "lucide-react";
import { productList } from "@/lib/products";

const HIDDEN = ["/rechtsschutz-check", "/kontakt", "/vielen-dank", "/datenschutz", "/impressum"];

export function StickyCta() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);
  const product = productList.find((p) => p.slug === pathname);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 520);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [pathname]);

  if (HIDDEN.includes(pathname)) return null;
  const href = product ? `/rechtsschutz-check?bereich=${product.key}` : "/rechtsschutz-check";
  const label = product ? product.hero.cta : "Rechtsschutz-Check starten";

  return (
    <AnimatePresence>
      {visible && (
        <motion.div initial={{ y: 90 }} animate={{ y: 0 }} exit={{ y: 90 }} transition={{ type: "spring", stiffness: 380, damping: 34 }}
          className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-white/95 px-4 pb-[max(env(safe-area-inset-bottom),12px)] pt-3 backdrop-blur md:hidden">
          <Link href={href} className="flex w-full items-center justify-center gap-2 rounded-full bg-sun py-3.5 text-[15px] font-semibold text-navy">
            {label} <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
          <p className="mt-1.5 text-center text-[11px] text-ink-muted">Kostenlos & unverbindlich · ca. 60 Sekunden</p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
