import { Hero } from "@/components/sections/Hero";
import { ProductCards } from "@/components/sections/ProductCards";
import { PeopleStrip } from "@/components/sections/PeopleStrip";
import { HowItWorks } from "@/components/sections/HowItWorks";
import { AboutAdvisor } from "@/components/sections/AboutAdvisor";
import { Faq } from "@/components/sections/Faq";
import { CtaBanner } from "@/components/sections/CtaBanner";
import { Footnotes } from "@/components/sections/Footnotes";
import { Reviews } from "@/components/sections/Reviews";
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
        subtitle="Ob im Beruf, als Vermieter oder im Unternehmen – finde heraus, welche Rechtsschutzversicherung zu deiner Situation passt."
        chipsLabel="Was möchtest du absichern?"
        chips={[
          { label: "Beruf", href: "/rechtsschutz-check?bereich=arbeit", icon: "briefcase" },
          { label: "Privatleben", href: "/rechtsschutz-check?bereich=privat", icon: "shield" },
          { label: "Vermietung", href: "/rechtsschutz-check?bereich=vermieter", icon: "house" },
          { label: "Unternehmen", href: "/rechtsschutz-check?bereich=firma", icon: "office" },
        ]}
        secondary={{ href: site.bookingUrl || "/kontakt?anliegen=termin", label: "Kostenlose Beratung anfragen" }}
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
      <HowItWorks />
      <AboutAdvisor />
      <CoverageBuilder />
      <WaitingTimeline />
      <Reviews />
      <Faq items={generalFaq} />
      <CtaBanner />
      <Footnotes />
    </>
  );
}
