import { Check } from "lucide-react";
import type { Product } from "@/lib/products";
import { SectionHeading } from "../ui/SectionHeading";
import { Reveal } from "../ui/Reveal";

/**
 * Was den ARAG-Schutz in diesem Bereich besonders macht – ein großer Hauptvorteil und die weiteren Pluspunkte.
 * Alle Aussagen stammen aus den Produktseiten der ARAG; Grenzen stehen direkt dabei.
 */
export function Vorteile({ usp }: { usp: NonNullable<Product["usp"]> }) {
  const f = usp.feature;
  return (
    <section className="py-20 sm:py-28" id="vorteile">
      <div className="container">
        <SectionHeading eyebrow="Darum ARAG" title={usp.title} emphasis={usp.emphasis} text={usp.intro} />

        <Reveal>
          <div className="mt-12 grid overflow-hidden rounded-[32px] bg-navy text-white lg:grid-cols-[0.8fr_1.2fr]">
            <div className="relative flex flex-col justify-between gap-6 bg-sun p-7 text-navy sm:p-10">
              <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-navy/60">{f.kicker}</span>
              <p className="leading-none">
                <span className="block text-[clamp(4.5rem,18vw,9rem)] font-semibold tracking-[-0.06em]">{f.big}</span>
                <span className="mt-2 block font-serif text-[clamp(1.6rem,6vw,2.4rem)] italic">{f.bigLabel}</span>
              </p>
              <p className="max-w-xs text-[15px] leading-6 text-navy/75">{f.bigNote}</p>
            </div>
            <div className="p-7 sm:p-10">
              <h3 className="text-[1.6rem] font-semibold leading-tight tracking-[-0.035em] text-white sm:text-[2rem]">{f.title}</h3>
              <p className="mt-4 text-[16px] leading-7 text-white/75">{f.text}</p>
              <ul className="mt-6 space-y-3">
                {f.points.map((p) => (
                  <li key={p} className="flex gap-3 text-[15px] leading-6 text-white/85">
                    <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-sun text-navy"><Check className="h-3.5 w-3.5" strokeWidth={3} aria-hidden /></span>
                    {p}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Reveal>

        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {usp.items.map((it, i) => (
            <Reveal key={it.title} delay={(i % 4) * 0.05}>
              <div className="h-full rounded-[24px] border border-line bg-white p-6">
                <span className="grid h-8 w-8 place-items-center rounded-full bg-sun text-navy"><Check className="h-4 w-4" strokeWidth={2.75} aria-hidden /></span>
                <h3 className="mt-4 text-[1.15rem] font-semibold leading-snug tracking-[-0.025em] text-navy">{it.title}</h3>
                <p className="mt-2 text-[15px] leading-6 text-ink-soft">{it.text}</p>
              </div>
            </Reveal>
          ))}
        </div>
        <p className="mt-5 max-w-3xl text-[13px] leading-5 text-ink-muted">{usp.source}</p>
      </div>
    </section>
  );
}

/** Einstiegspreise je Tarif – mit den Annahmen gleich darunter, damit niemand enttäuscht wird. */
export function Preise({ prices }: { prices: NonNullable<Product["prices"]> }) {
  return (
    <section className="pb-16 sm:pb-20" id="preise">
      <div className="container">
        <SectionHeading eyebrow="Beiträge" title={prices.title} emphasis={prices.emphasis} />
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {prices.tiers.map((t) => (
            <div key={t.name} className={`relative flex flex-col rounded-[28px] border p-6 sm:p-7 ${t.badge ? "border-navy bg-sun-wash" : "border-line bg-white"}`}>
              {t.badge && <span className="absolute -top-3 left-6 rounded-full bg-navy px-3 py-1 text-xs font-semibold text-white">{t.badge}</span>}
              <p className="text-lg font-semibold tracking-[-0.02em] text-navy">{t.name}</p>
              <p className="mt-3 text-navy">
                <span className="text-[15px]">ab </span>
                <span className="text-[2.6rem] font-semibold leading-none tracking-[-0.04em]">{t.price}</span>
                <span className="text-[15px]"> € im Monat</span>
              </p>
              <p className="mt-4 text-[15px] leading-6 text-ink-soft">{t.text}</p>
            </div>
          ))}
        </div>
        {prices.addon && (
          <div className="mt-4 flex flex-col gap-2 rounded-[24px] border border-navy bg-sun px-6 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-7">
            <p className="text-[16px] font-semibold text-navy">+ {prices.addon.name}</p>
            <p className="text-[15px] text-navy/80"><span className="font-semibold text-navy">ab {prices.addon.price} € im Monat</span> · {prices.addon.text}</p>
          </div>
        )}
        <p className="mt-5 max-w-3xl text-[13px] leading-5 text-ink-muted">{prices.note}</p>
      </div>
    </section>
  );
}
