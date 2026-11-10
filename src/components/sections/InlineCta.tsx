import { Phone } from "lucide-react";
import { ButtonLink } from "../ui/Button";
import { CallLink } from "../ui/CallLink";
import { site } from "@/lib/site";

/** Ruhige Handlungsaufforderung zwischen zwei Abschnitten: Check starten oder direkt anrufen. */
export function InlineCta({ href, label, text }: { href: string; label: string; text: string }) {
  return (
    <section className="pb-6">
      <div className="container">
        <div className="flex flex-col items-start justify-between gap-5 rounded-[28px] border border-navy bg-sun px-6 py-6 sm:flex-row sm:items-center sm:px-9 sm:py-7">
          <div>
            <p className="text-[1.45rem] font-semibold leading-tight tracking-[-0.03em] text-navy sm:text-[1.7rem]">{text}</p>
            <p className="mt-1.5 text-[15px] text-navy/70">In rund 60 Sekunden weißt du, was zu dir passt – kostenlos und unverbindlich.</p>
          </div>
          <div className="flex w-full shrink-0 flex-col gap-2.5 sm:w-auto sm:flex-row sm:items-center">
            <ButtonLink href={href} arrow>{label}</ButtonLink>
            <CallLink className="inline-flex items-center justify-center gap-2 rounded-full border border-navy/30 px-5 py-3 text-[15px] font-semibold text-navy transition hover:border-navy hover:bg-white/40">
              <Phone className="h-4 w-4" aria-hidden />{site.phone}
            </CallLink>
          </div>
        </div>
      </div>
    </section>
  );
}
