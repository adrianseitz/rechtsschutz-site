import { Check, X } from "lucide-react";
import { SectionHeading } from "../ui/SectionHeading";

/**
 * Das Kernversprechen in klaren Worten: was eine Rechtsschutzversicherung im versicherten Fall übernimmt –
 * und was nicht. Bewusst ehrlich; die Grenzen stehen direkt daneben.
 */
const COVERED = [
  { title: "Anwalt deiner Wahl", text: "Du suchst selbst aus, wer dich vertritt. Die freie Anwaltswahl ist gesetzlich garantiert (§ 127 VVG)." },
  { title: "Gerichtskosten", text: "Einschließlich der Kosten für Zeugen und gerichtlich bestellte Sachverständige." },
  { title: "Kosten der Gegenseite", text: "Wenn du sie tragen musst – etwa weil du einen Prozess verlierst." },
  { title: "Erste Einschätzung am Telefon", text: "Viele Tarife enthalten eine telefonische Rechtsberatung. Oft klärt sich eine Frage schon dort." },
  { title: "Mediation", text: "Je nach Tarif: eine Einigung mit Hilfe eines Mediators statt eines langen Prozesses." },
];

const NOT_COVERED = [
  { title: "Laufende und absehbare Streitfälle", text: "Was schon begonnen hat oder sich abzeichnet, lässt sich nicht nachträglich versichern." },
  { title: "Die Forderung selbst", text: "Bezahlt werden die Kosten des Rechtsstreits – nicht die offene Miete, der Kaufpreis oder der Schaden." },
  { title: "Nicht gewählte Bereiche", text: "Versichert ist nur, was im Vertrag steht. Vermietung und Selbstständigkeit brauchen eigene Bausteine." },
  { title: "Vorsätzliche Straftaten", text: "Wer vorsätzlich eine Straftat begeht, hat dafür keinen Versicherungsschutz." },
];

export function Leistungen() {
  return (
    <section className="py-16 sm:py-20" id="leistungen">
      <div className="container">
        <SectionHeading eyebrow="Was du bekommst" title="Das übernimmt dein Rechtsschutz im Ernstfall." emphasis="übernimmt"
          text="Im versicherten Fall trägt die Versicherung die Kosten, die sonst an dir hängen bleiben." />
        <div className="mt-12 grid gap-4 lg:grid-cols-[1.25fr_1fr]">
          <div className="rounded-[28px] border border-navy bg-white p-6 sm:p-9">
            <h3 className="text-xl font-semibold tracking-[-0.03em] text-navy">Das zahlt die Versicherung</h3>
            <ul className="mt-5 divide-y divide-line">
              {COVERED.map((c) => (
                <li key={c.title} className="flex gap-4 py-4 first:pt-0 last:pb-0">
                  <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-sun text-navy"><Check className="h-4 w-4" strokeWidth={2.5} aria-hidden /></span>
                  <div>
                    <p className="font-semibold text-navy">{c.title}</p>
                    <p className="mt-0.5 text-[15px] leading-6 text-ink-soft">{c.text}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-[28px] bg-paper p-6 sm:p-9">
            <h3 className="text-xl font-semibold tracking-[-0.03em] text-navy">Das ist nicht versichert</h3>
            <ul className="mt-5 divide-y divide-navy/10">
              {NOT_COVERED.map((c) => (
                <li key={c.title} className="flex gap-4 py-4 first:pt-0 last:pb-0">
                  <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full border border-navy/25 text-navy/60"><X className="h-4 w-4" strokeWidth={2.5} aria-hidden /></span>
                  <div>
                    <p className="font-semibold text-navy">{c.title}</p>
                    <p className="mt-0.5 text-[15px] leading-6 text-ink-soft">{c.text}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <p className="mt-4 text-sm leading-6 text-ink-muted">
          Die Versicherung leistet bis zur vereinbarten Versicherungssumme und abzüglich deiner Selbstbeteiligung. Was genau versichert ist, steht in den Bedingungen deines Tarifs – ich gehe sie mit dir durch.
        </p>
      </div>
    </section>
  );
}
