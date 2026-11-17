import { Hero } from "@/components/sections/Hero";
import { ProductCards } from "@/components/sections/ProductCards";
import { PeopleStrip } from "@/components/sections/PeopleStrip";
import { HowItWorks } from "@/components/sections/HowItWorks";
import { AboutAdvisor } from "@/components/sections/AboutAdvisor";
import { Faq } from "@/components/sections/Faq";
import { CtaBanner } from "@/components/sections/CtaBanner";
import { Footnotes } from "@/components/sections/Footnotes";
import { Leistungen } from "@/components/sections/Leistungen";
import { Marquee } from "@/components/ui/Marquee";
import { CostCalculatorSection } from "@/components/tools/CostCalculator";
import { CoverageBuilder } from "@/components/tools/CoverageBuilder";
import { WaitingTimeline } from "@/components/tools/WaitingTimeline";
import { generalFaq } from "@/lib/faq";
import { site } from "@/lib/site";

export default function HomePage() {
  return (
    <>
      <Hero
        eyebrow="Persönliche Rechtsschutz-Beratung · ARAG-Vertriebspartner"
        title="Rechtsschutz, der zu deinem Leben passt."
        emphasis="Leben"
        subtitle="Ob privat, im Beruf, als Vermieter oder im Unternehmen: Lies in Ruhe nach, was der jeweilige Rechtsschutz abdeckt und was ein Streit ohne ihn kosten kann – mit persönlicher Beratung statt Callcenter."
        chipsLabel="Welcher Bereich interessiert dich?"
        chips={[
          { label: "Privatrechtsschutz", href: "/privatrechtsschutz", icon: "shield" },
          { label: "Arbeitsrechtsschutz", href: "/arbeitsrechtsschutz", icon: "briefcase" },
          { label: "Vermieterrechtsschutz", href: "/vermieterrechtsschutz", icon: "house" },
          { label: "Firmenrechtsschutz", href: "/firmenrechtsschutz", icon: "office" },
        ]}
        chipsNote="Leistungen, Kosten und Beispiele – in Ruhe zum Nachlesen"
        bullets={["Kostenlos & unverbindlich", "Persönlicher Ansprechpartner", "Ohne Callcenter"]}
        secondary={{ href: "/kontakt?anliegen=rueckruf", label: "Rückruf anfordern" }}
        cards={[
          { type: "receipt", title: "Kostenrisiko¹", rows: [["Eigene Anwältin", "1.078 €"], ["Gegnerische Seite", "1.078 €"], ["Gericht", "512 €"]], total: ["Gesamt", "2.668 €"], foot: "Beispiel: Streitwert 5.000 €", pos: "-left-2 top-[6%] sm:left-0", depth: 1.1, rotate: -5 },
          { type: "note", text: "Wartezeit meist 3 Monate² – früh dran sein lohnt sich!", sign: "Adrian", pos: "right-0 bottom-[10%] sm:-right-2", depth: -0.9, rotate: 4 },
          { type: "badge", pos: "right-[6%] top-[2%]", depth: 0.6 },
        ]}
      />
      <Marquee items={["Persönliche Beratung", "Individuelle Absicherung", "Transparente Vermittlerrolle", "Kostenlos & unverbindlich", "Ohne Callcenter"]} />
      <PeopleStrip />
      <ProductCards />
      <CostCalculatorSection />
      <Leistungen />
      <HowItWorks />
      <AboutAdvisor />
      <CoverageBuilder />
      <WaitingTimeline />
      <Faq items={generalFaq} />
      <CtaBanner />
      <Footnotes />
    </>
  );
}
