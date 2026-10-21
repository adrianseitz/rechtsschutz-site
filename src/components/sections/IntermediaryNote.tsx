import { Info } from "lucide-react";
import Link from "next/link";

export function IntermediaryNote() {
  return (
    <section aria-label="Hinweis zur Vermittlerrolle" className="pb-16">
      <div className="container">
        <div className="flex items-start gap-3 rounded-2xl border border-line bg-white p-5 text-sm leading-6 text-ink-soft">
          <Info className="mt-0.5 h-5 w-5 shrink-0 text-navy" aria-hidden />
          <p>
            <strong className="text-navy">Transparenz:</strong> Adrian Seitz ist selbstständiger Versicherungsvermittler und Vertriebspartner der ARAG. Diese Website ist weder eine offizielle Website der ARAG noch ein unabhängiges Vergleichsportal. Details findest du in den{" "}
            <Link href="/impressum" className="font-medium text-teal-700 underline underline-offset-2">Vermittlerangaben</Link>.
          </p>
        </div>
      </div>
    </section>
  );
}
