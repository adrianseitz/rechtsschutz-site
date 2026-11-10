import type { Metadata } from "next";
import Link from "next/link";
import { Mail, MessageCircle, FileText, Phone } from "lucide-react";
import { ButtonLink } from "@/components/ui/Button";
import { ArrivalStamp } from "@/components/ArrivalStamp";
import { CallLink } from "@/components/ui/CallLink";
import { site } from "@/lib/site";
import { effectiveMail } from "@/lib/server/mailSettings";

export const metadata: Metadata = {
  title: "Vielen Dank",
  robots: { index: false, follow: false },
};

const next = [
  { icon: Mail, title: "Bestätigung & Prüfung", text: "Ich sehe mir deine Angaben persönlich an und bereite mich auf unser Gespräch vor." },
  { icon: MessageCircle, title: "Persönliche Kontaktaufnahme", text: "Ich melde mich auf dem von dir gewählten Weg, um offene Fragen zu klären." },
  { icon: FileText, title: "Unverbindliche Empfehlung", text: "Du erhältst eine Empfehlung, die zu deiner Situation passt – ohne Verpflichtung." },
];

export default async function DankePage({ searchParams }: { searchParams: Promise<{ typ?: string }> }) {
  const { typ } = await searchParams;
  const mail = await effectiveMail().catch(() => null);
  const confirmationSent = Boolean(mail && mail.confirm !== false);
  const title = typ === "termin" ? "Vielen Dank! Deine Terminanfrage ist eingegangen." : typ === "rueckruf" ? "Vielen Dank! Deine Rückrufbitte ist eingegangen." : "Vielen Dank! Deine Anfrage ist eingegangen.";
  return (
    <section className="py-16 sm:py-24">
      <div className="container max-w-2xl text-center">
        <ArrivalStamp />
        <h1 className="mt-6 text-3xl font-extrabold leading-tight tracking-tightest sm:text-5xl">{title}</h1>
        <p className="mt-4 text-lg leading-8 text-ink-soft">Danke für dein Vertrauen. So geht es jetzt weiter:</p>
        <ol className="mt-10 space-y-3 text-left">
          {next.map((n, i) => (
            <li key={n.title} className="card flex items-start gap-4 p-5">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-navy text-teal"><n.icon className="h-5 w-5" aria-hidden /></span>
              <div><p className="font-semibold text-navy">{i + 1}. {n.title}</p><p className="mt-1 text-[15px] leading-7 text-ink-soft">{n.text}</p></div>
            </li>
          ))}
        </ol>
        <div className="mt-6 rounded-3xl border border-navy bg-sun p-6 text-left sm:flex sm:items-center sm:justify-between sm:gap-6">
          <div>
            <p className="text-lg font-semibold tracking-[-0.02em] text-navy">Du möchtest nicht warten?</p>
            <p className="mt-1 text-[15px] leading-6 text-navy/75">Ruf mich einfach direkt an – dann klären wir deine Fragen sofort.</p>
          </div>
          <CallLink className="mt-4 inline-flex w-full items-center justify-center gap-2 whitespace-nowrap rounded-full bg-navy px-6 py-3.5 text-[15px] font-semibold text-white sm:mt-0 sm:w-auto">
            <Phone className="h-4 w-4" aria-hidden /> {site.phone}
          </CallLink>
        </div>
        <p className="mt-8 text-sm text-ink-muted">{confirmationSent ? "Eine Bestätigung ist per E-Mail zu dir unterwegs. Bitte schau auch im Spam-Ordner nach, falls sie nicht ankommt." : "Bitte prüfe auch deinen Spam-Ordner, falls du eine E-Mail von mir erwartest."}</p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <ButtonLink href="/" variant="secondary">Zur Startseite</ButtonLink>
          <ButtonLink href="/#bereiche" variant="ghost">Bereiche ansehen</ButtonLink>
        </div>
        <p className="mt-10 text-xs text-ink-muted">Du möchtest deine Angaben ändern oder zurückziehen? <Link href="/kontakt?anliegen=frage" className="underline">Schreib mir kurz</Link>.</p>
      </div>
    </section>
  );
}
