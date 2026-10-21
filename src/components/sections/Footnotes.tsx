import Link from "next/link";

/** Fußnoten im Magazin-Stil – macht Einschränkungen transparent, statt sie zu verstecken. */
const NOTES = [
  "Vereinfachte Beispielrechnung für die 1. Instanz mit Urteil nach RVG und GKG (Stand 06/2025), inkl. 19 % USt. auf Anwaltskosten; ohne Zeugen, Gutachten oder weitere Instanzen. Tatsächliche Kosten können abweichen.",
  "Wartezeiten hängen vom Tarif und Rechtsbereich ab; häufig drei Monate (z. B. Arbeits-, Vertrags- und Mietrecht). Einige Bereiche wie Schadenersatz-Rechtsschutz sind oft ohne Wartezeit versichert.",
  "Bereits bestehende oder absehbare Streitigkeiten sind nicht versicherbar. Maßgeblich sind ausschließlich die Versicherungsbedingungen des jeweiligen Tarifs.",
];

export function Footnotes() {
  return (
    <section aria-label="Anmerkungen" className="py-14">
      <div className="container">
        <div className="grid gap-8 border-t border-navy pt-6 lg:grid-cols-[0.6fr_1.4fr]">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-ink-muted">Anmerkungen</p>
            <p className="mt-3 max-w-xs text-sm leading-6 text-ink-soft">
              <strong className="font-semibold text-navy">Transparenz:</strong> Adrian Seitz ist selbstständiger Versicherungsvermittler und Vertriebspartner der ARAG. Diese Website ist weder eine offizielle Website der ARAG noch ein unabhängiges Vergleichsportal.{" "}
              <Link href="/impressum" className="underline decoration-sun decoration-2 underline-offset-4">Vermittlerangaben</Link>
            </p>
          </div>
          <ol className="grid gap-5 sm:grid-cols-3">
            {NOTES.map((n, i) => (
              <li key={i} className="text-[13px] leading-6 text-ink-muted">
                <span className="mb-1 block font-serif text-2xl italic leading-none text-navy">{i + 1}</span>
                {n}
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
