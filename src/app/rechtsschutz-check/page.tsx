import type { Metadata } from "next";
import { Suspense } from "react";
import { RechtsschutzCheck } from "@/components/funnel/RechtsschutzCheck";

export const metadata: Metadata = {
  title: "Rechtsschutz-Check – in 60 Sekunden zur passenden Absicherung",
  description: "Beantworte ein paar kurze Fragen und erhalte eine persönliche, unverbindliche Rechtsschutz-Beratung. Kostenlos und transparent.",
  alternates: { canonical: "/rechtsschutz-check" },
};

export default function CheckPage() {
  return (
    <section className="min-h-[calc(100svh-4rem)] bg-gradient-to-b from-surface to-navy-50/60 px-5 pb-16 pt-8 sm:pt-14">
      <Suspense fallback={<div className="mx-auto h-96 max-w-xl animate-pulse rounded-2xl bg-white" />}>
        <RechtsschutzCheck />
      </Suspense>
    </section>
  );
}
