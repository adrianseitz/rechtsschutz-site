import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

type Variant = "primary" | "sun" | "secondary" | "ghost" | "light";
const base =
  "group relative inline-flex items-center justify-center gap-3 rounded-full text-[15px] font-medium tracking-[-0.01em] transition duration-300 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60";
const variants: Record<Variant, string> = {
  primary: "bg-navy text-white hover:bg-navy-800",
  sun: "bg-sun text-navy hover:bg-teal-400",
  secondary: "border border-navy/15 bg-white text-navy hover:border-navy/40",
  ghost: "text-navy hover:bg-navy-50",
  light: "border border-white/20 bg-white/5 text-white hover:bg-white/10",
};
const dot: Record<Variant, string> = {
  primary: "bg-sun text-navy",
  sun: "bg-navy text-sun",
  secondary: "bg-navy text-white",
  ghost: "bg-navy text-white",
  light: "bg-sun text-navy",
};

function Inner({ children, arrow, variant }: { children: React.ReactNode; arrow: boolean; variant: Variant }) {
  return (
    <>
      <span>{children}</span>
      {arrow && (
        <span className={`-mr-2 grid h-8 w-8 place-items-center overflow-hidden rounded-full ${dot[variant]}`}>
          <ArrowUpRight className="h-4 w-4 transition-transform duration-300 group-hover:rotate-45" aria-hidden />
        </span>
      )}
    </>
  );
}

export function ButtonLink({ href, children, variant = "primary", arrow = false, className = "", ...rest }: {
  href: string; children: React.ReactNode; variant?: Variant; arrow?: boolean; className?: string;
} & Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, "href">) {
  const external = href.startsWith("http");
  const pad = arrow ? "py-2.5 pl-6 pr-3.5" : "px-6 py-3.5";
  const cls = `${base} ${pad} ${variants[variant]} ${className}`;
  return external ? (
    <a href={href} className={cls} target="_blank" rel="noopener noreferrer" {...rest}><Inner arrow={arrow} variant={variant}>{children}</Inner></a>
  ) : (
    <Link href={href} className={cls} {...rest}><Inner arrow={arrow} variant={variant}>{children}</Inner></Link>
  );
}

export function buttonClass(variant: Variant = "primary", extra = "") {
  return `${base} px-6 py-3.5 ${variants[variant]} ${extra}`;
}
