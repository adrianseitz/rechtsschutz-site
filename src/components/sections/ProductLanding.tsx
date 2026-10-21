import { AlertCircle } from "lucide-react";
import type { Product } from "@/lib/products";
import { SITUATION } from "@/lib/funnel";
import { generalFaq } from "@/lib/faq";
import { site } from "@/lib/site";
import { Hero, type FloatCard } from "./Hero";
import { AboutAdvisor } from "./AboutAdvisor";
import { Reviews } from "./Reviews";
import { HowItWorks } from "./HowItWorks";
import { Faq } from "./Faq";
import { CtaBanner } from "./CtaBanner";
import { Footnotes } from "./Footnotes";
import { CostCalculatorSection } from "../tools/CostCalculator";
import { WaitingTimeline } from "../tools/WaitingTimeline";
import { Icon } from "../ui/Icon";
import { Ernstfall } from "./Ernstfall";
import { Marquee } from "../ui/Marquee";
import { Reveal } from "../ui/Reveal";
import { SectionHeading } from "../ui/SectionHeading";

const TOPIC_ICONS: Record<Product["key"], string[]> = {
  privat: ["ShoppingBag", "Coins", "Landmark", "Receipt", "Gavel", "MessageCircle"],
  arbeit: ["DoorOpen", "Mailbox", "Award", "Wallet", "FileSignature"],
  vermieter: ["Scale", "FileText", "KeyRound", "Receipt", "Users"],
  firma: ["Users", "FileSignature", "Receipt", "Store", "Layers"],
};
const WAIT_AREA: Record<Product["key"], string> = {
  privat: "z. B. im Vertrags- oder Sozialrecht",
  arbeit: "u. a. im Arbeitsrecht",
  vermieter: "u. a. in Miet- und Grundstücksangelegenheiten",
  firma: "z. B. im Arbeitsrecht",
};
const EMPHASIS: Record<Product["key"], string> = { privat: "Alltag", arbeit: "Job", vermieter: "Verantwortung", firma: "Unternehmen" };
const HERO_ICON: Record<Product["key"], string> = { privat: "package", arbeit: "briefcase", vermieter: "house", firma: "office" };
const NOTES: Record<Product["key"], string> = {
  privat: "Auch Partner & Kinder lassen sich oft mitversichern.",
  arbeit: "Kündigung bekommen? Die Klagefrist beträgt nur 3 Wochen!",
  vermieter: "Jede Wohneinheit zählt – sag mir, wie viele es sind.",
  firma: "Nicht jedes Risiko ist versicherbar – ich sag dir ehrlich, was geht.",
};
const CARDS = (k: Product["key"]): FloatCard[] => [
  k === "arbeit"
    ? { type: "receipt", title: "Kündigungsschutz¹", rows: [["Gehalt (brutto)", "3.500 €"], ["Streitwert (×3)", "10.500 €"], ["Gegnerische Seite", "0 €"]], total: ["Eigene Kosten", "2.127 €"], foot: "§ 12a ArbGG: jede Seite zahlt selbst", pos: "-left-2 top-[6%] sm:left-0", depth: 1.1, rotate: -5 }
    : { type: "receipt", title: "Kostenrisiko¹", rows: [["Eigene Anwältin", "1.078 €"], ["Gegnerische Seite", "1.078 €"], ["Gericht", "512 €"]], total: ["Gesamt", "2.668 €"], foot: "Beispiel: Streitwert 5.000 €", pos: "-left-2 top-[6%] sm:left-0", depth: 1.1, rotate: -5 },
  { type: "note", text: NOTES[k], sign: "Adrian", pos: "right-0 bottom-[10%] sm:-right-2", depth: -0.9, rotate: 4 },
  { type: "photo", photo: k, caption: PHOTO_CAPTION[k], pos: "right-[2%] top-[0%]", depth: 0.6, rotate: 5, width: 190 },
];
const PHOTO_CAPTION: Record<Product["key"], string> = {
  privat: "„Und jetzt? Der Händler blockt ab.“",
  arbeit: "Plötzlich ging alles ganz schnell …",
  vermieter: "Schlüsselübergabe – und dann Streit?",
  firma: "Eigenes Café – eigene Risiken.",
};

export function ProductLanding({ product }: { product: Product }) {
  const checkHref = `/rechtsschutz-check?bereich=${product.key}`;
  const situation = SITUATION[product.key];
  const faq = [...product.faq, ...generalFaq.filter((f) => /Wartezeit|bestehende|kostenlos/i.test(f.q))];

  return (
    <>
      <Hero
        eyebrow={`${product.hero.eyebrow} · Persönliche Beratung`}
        title={product.hero.title}
        emphasis={EMPHASIS[product.key]}
        subtitle={product.hero.subtitle}
        chipsLabel={situation.title}
        chips={situation.options.map((o) => ({ label: o.label, href: `${checkHref}&situation=${o.value}`, icon: o.icon ?? HERO_ICON[product.key] }))}
        secondary={{ href: site.bookingUrl || `/kontakt?anliegen=termin&thema=${product.key}`, label: "Kostenlose Beratung anfragen" }}
        cards={CARDS(product.key)}
      />
      <Marquee items={product.cardTopics.concat(["Persönliche Beratung", "Kostenlos & unverbindlich"])} />

      <section className="py-24 sm:py-32">
        <div className="container">
          <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
            <SectionHeading eyebrow="Themen" title={product.topicsTitle} emphasis={product.topicsTitle.split(" ").slice(-1)[0]} />
            <p className="max-w-sm text-ink-soft lg:pb-2">Ein Überblick über typische Situationen. Was im Einzelfall versichert ist, regelt dein Tarif.</p>
          </div>
          <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {product.topics.map((t, i) => (
              <Reveal key={t.title} delay={(i % 3) * 0.06}>
                <div className={`group relative h-full overflow-hidden rounded-[28px] border p-7 transition duration-500 hover:-translate-y-1 ${i === 0 ? "border-navy bg-sun" : "border-line bg-white hover:border-navy/30"}`}>
                  <div className="flex items-start justify-between">
                    <span className="font-mono text-xs text-navy/50">{String(i + 1).padStart(2, "0")}</span>
                    <span className={`grid h-14 w-14 place-items-center rounded-full border transition duration-500 group-hover:rotate-[-8deg] ${i === 0 ? "border-navy/30" : "border-line group-hover:border-navy"}`}><Icon name={TOPIC_ICONS[product.key][i] ?? "Shield"} className="h-6 w-6 text-navy" /></span>
                  </div>
                  <h3 className="mt-8 text-2xl font-semibold tracking-[-0.035em] text-navy">{t.title}</h3>
                  <p className={`mt-3 text-[15px] leading-7 ${i === 0 ? "text-navy/70" : "text-ink-soft"}`}>{t.text}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <Ernstfall product={product.key} />

      <CostCalculatorSection defaultMode={product.key === "arbeit" ? "arbeit" : "zivil"} lockMode={product.key === "arbeit"} ctaHref={checkHref} />

      <section className="pb-8 pt-8">
        <div className="container">
          <SectionHeading eyebrow="Gut zu wissen" title="Klar gesagt, bevor du entscheidest." emphasis="Klar" />
          <div className="mt-12 grid gap-px overflow-hidden rounded-[28px] border border-line bg-line md:grid-cols-3">
            {product.facts.map((f, i) => (
              <div key={f.title} className="bg-white p-7 sm:p-9">
                <span className="font-serif text-5xl italic text-navy/20">0{i + 1}</span>
                <h3 className="mt-4 text-xl font-semibold tracking-[-0.03em] text-navy">{f.title}</h3>
                <p className="mt-3 text-[15px] leading-7 text-ink-soft">{f.text}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 flex items-start gap-3 rounded-2xl bg-sun-wash p-5 text-sm leading-6 text-ink-soft">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-navy" aria-hidden />
            <p>{product.notice}</p>
          </div>
        </div>
      </section>

      <WaitingTimeline area={WAIT_AREA[product.key]} />
      <HowItWorks ctaHref={checkHref} ctaLabel={product.hero.cta} />
      <AboutAdvisor />
      <Reviews />
      <Faq items={faq} title={`Fragen zum ${product.name}`} />
      <CtaBanner title={`${product.name}: Finde heraus, was zu dir passt.`} emphasis="passt." href={checkHref} label={product.hero.cta} />
      <Footnotes />
    </>
  );
}
