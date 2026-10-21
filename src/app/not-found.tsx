import { ButtonLink } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <section className="py-24 text-center">
      <div className="container max-w-xl">
        <p className="font-display text-6xl font-extrabold text-teal">404</p>
        <h1 className="mt-4 text-3xl font-extrabold">Diese Seite gibt es nicht.</h1>
        <p className="mt-3 text-ink-soft">Vielleicht hilft dir der Rechtsschutz-Check weiter.</p>
        <div className="mt-8 flex justify-center gap-3"><ButtonLink href="/rechtsschutz-check" arrow>Zum Check</ButtonLink><ButtonLink href="/" variant="secondary">Startseite</ButtonLink></div>
      </div>
    </section>
  );
}
