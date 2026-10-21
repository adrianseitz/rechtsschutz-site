import Link from "next/link";
import { site } from "@/lib/site";

export function Logo({ light = false }: { light?: boolean }) {
  return (
    <Link href="/" className="group flex items-center gap-2.5" aria-label={`${site.brand} – Startseite`}>
      <svg width="34" height="34" viewBox="0 0 34 34" aria-hidden className="transition-transform duration-500 group-hover:rotate-[-8deg]">
        <rect width="34" height="34" rx="11" fill={light ? "#FFD60A" : "#0B0B0A"} />
        <path d="M17 7.5 9.5 10.4v6.1c0 4.6 3.1 8.5 7.5 10 4.4-1.5 7.5-5.4 7.5-10v-6.1L17 7.5Z" fill={light ? "#0B0B0A" : "#FFD60A"} />
        <path d="m13.6 17.2 2.4 2.4 4.6-4.8" fill="none" stroke={light ? "#FFD60A" : "#0B0B0A"} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span className={`text-[17px] font-semibold tracking-[-0.03em] ${light ? "text-white" : "text-navy"}`}>
        {site.brandShort}<span className="font-serif text-[19px] font-normal italic tracking-normal"> Rechtsschutz</span>
      </span>
    </Link>
  );
}
