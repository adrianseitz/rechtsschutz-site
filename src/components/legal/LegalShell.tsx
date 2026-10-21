import { AlertTriangle } from "lucide-react";
import { PLACEHOLDER_PREFIX } from "@/lib/site";

export function LegalShell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="py-12 sm:py-20">
      <div className="container max-w-3xl">
        <div className="mb-8 flex items-start gap-3 rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />
          <p><strong>Vorlage – vor Veröffentlichung fachlich prüfen lassen.</strong> Gelb markierte Angaben sind Platzhalter und müssen durch deine tatsächlichen Daten ersetzt werden. Diese Vorlage ersetzt keine Rechtsberatung.</p>
        </div>
        <h1 className="text-4xl font-extrabold tracking-tightest">{title}</h1>
        <div className="prose-legal mt-6">{children}</div>
      </div>
    </section>
  );
}

/** Zeigt Platzhalter gelb markiert, echte Werte normal. */
export function V({ v }: { v: string }) {
  return v.startsWith(PLACEHOLDER_PREFIX) ? <span className="ph">{v}</span> : <>{v}</>;
}
