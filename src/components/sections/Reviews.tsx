import { ExternalLink, Star } from "lucide-react";
import reviewsData from "@/content/reviews.json";
import { TiltCard } from "../ui/TiltCard";
import { SectionHeading } from "../ui/SectionHeading";
import { Reveal } from "../ui/Reveal";

type Review = { name: string; rating: number; text: string; date: string; source: "google" | "trustpilot" | "direkt" };

const reviews = (reviewsData as Review[]).filter((r) => r.text && r.rating >= 1 && r.rating <= 5);
const GOOGLE = process.env.NEXT_PUBLIC_GOOGLE_REVIEWS_URL?.trim() || "";
const TRUSTPILOT = process.env.NEXT_PUBLIC_TRUSTPILOT_URL?.trim() || "";
const SOURCE_LABEL: Record<Review["source"], string> = { google: "Google", trustpilot: "Trustpilot", direkt: "Direkt" };

function Stars({ value }: { value: number }) {
  return (
    <span className="inline-flex gap-0.5" aria-label={`${value} von 5 Sternen`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} className={`h-4 w-4 ${i <= value ? "fill-amber-400 text-amber-400" : "text-line"}`} aria-hidden />
      ))}
    </span>
  );
}

/** Zeigt nichts an, solange keine echten Bewertungen oder Profil-Links hinterlegt sind. */
export function Reviews() {
  if (reviews.length === 0 && !GOOGLE && !TRUSTPILOT) return null;
  const avg = reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;

  return (
    <section className="py-20 sm:py-28">
      <div className="container">
        <div className="flex flex-col justify-between gap-8 md:flex-row md:items-end">
          <SectionHeading eyebrow="Bewertungen" title="Was Kunden über die Beratung sagen." />
          <div className="flex flex-wrap gap-3">
            {GOOGLE && (
              <a href={GOOGLE} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-xl border border-line bg-white px-4 py-3 text-sm font-semibold text-navy shadow-card transition hover:-translate-y-0.5 hover:shadow-lift">
                Google-Bewertungen lesen <ExternalLink className="h-4 w-4" aria-hidden />
              </a>
            )}
            {TRUSTPILOT && (
              <a href={TRUSTPILOT} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-xl border border-line bg-white px-4 py-3 text-sm font-semibold text-navy shadow-card transition hover:-translate-y-0.5 hover:shadow-lift">
                Trustpilot-Profil <ExternalLink className="h-4 w-4" aria-hidden />
              </a>
            )}
          </div>
        </div>

        {reviews.length > 0 && (
          <>
            <div className="mt-8 flex items-center gap-4">
              <span className="font-display text-4xl font-extrabold text-navy">{avg.toFixed(1).replace(".", ",")}</span>
              <div>
                <Stars value={Math.round(avg)} />
                <p className="mt-0.5 text-sm text-ink-muted">{reviews.length} {reviews.length === 1 ? "Bewertung" : "Bewertungen"}</p>
              </div>
            </div>
            <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {reviews.map((r, i) => (
                <Reveal key={i} delay={(i % 3) * 0.06}>
                  <TiltCard max={4} className="h-full">
                    <figure className="card flex h-full flex-col p-6">
                      <Stars value={r.rating} />
                      <blockquote className="mt-4 flex-1 leading-7 text-ink-soft">„{r.text}“</blockquote>
                      <figcaption className="mt-5 flex items-center justify-between border-t border-line pt-4 text-sm">
                        <span className="font-semibold text-navy">{r.name}</span>
                        <span className="text-ink-muted">{SOURCE_LABEL[r.source]} · {new Date(r.date).toLocaleDateString("de-DE", { month: "short", year: "numeric" })}</span>
                      </figcaption>
                    </figure>
                  </TiltCard>
                </Reveal>
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
