import { PLACEHOLDER_PREFIX } from "@/lib/site";

export function LegalShell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="py-12 sm:py-20">
      <div className="container max-w-3xl">
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
