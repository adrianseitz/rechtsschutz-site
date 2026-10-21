"use client";

import Script from "next/script";
import Link from "next/link";
import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Cookie, X } from "lucide-react";
import { readConsent, writeConsent, type ConsentState } from "@/lib/consent";
import { captureAttribution } from "@/lib/attribution";

const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID;
const GA4_ID = process.env.NEXT_PUBLIC_GA4_ID;
const ADS_ID = process.env.NEXT_PUBLIC_GOOGLE_ADS_ID;
const META_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID;
const TRACKING_CONFIGURED = Boolean(GTM_ID || GA4_ID || ADS_ID || META_ID);

type Ctx = { consent: ConsentState | null; openSettings: () => void };
const ConsentContext = createContext<Ctx>({ consent: null, openSettings: () => {} });
export const useConsent = () => useContext(ConsentContext);

export function ConsentManager({ children }: { children: React.ReactNode }) {
  const [consent, setConsent] = useState<ConsentState | null>(null);
  const [ready, setReady] = useState(false);
  const [bannerOpen, setBannerOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [stat, setStat] = useState(false);
  const [mkt, setMkt] = useState(false);

  useEffect(() => {
    captureAttribution();
    const c = readConsent();
    if (c) {
      (window as unknown as { __rsConsent?: ConsentState }).__rsConsent = c;
      setConsent(c);
      setStat(c.statistics);
      setMkt(c.marketing);
    } else {
      // Banner erst nach dem Intro zeigen, damit sich beides nicht überlagert.
      const open = () => setBannerOpen(true);
      if ((window as unknown as { __rsIntroDone?: boolean }).__rsIntroDone) open();
      else {
        window.addEventListener("rs:intro-done", open, { once: true });
        setTimeout(open, 3200);
      }
    }
    setReady(true);
  }, []);

  const save = useCallback(
    (statistics: boolean, marketing: boolean) => {
      const revoked = (consent?.statistics && !statistics) || (consent?.marketing && !marketing);
      const next = writeConsent({ statistics, marketing });
      (window as unknown as { __rsConsent?: ConsentState }).__rsConsent = next;
      setConsent(next);
      setBannerOpen(false);
      setDetailsOpen(false);
      // Bereits geladene Skripte lassen sich nicht entladen – bei Widerruf neu laden.
      if (revoked) window.location.reload();
    },
    [consent]
  );

  const openSettings = useCallback(() => {
    setStat(consent?.statistics ?? false);
    setMkt(consent?.marketing ?? false);
    setDetailsOpen(true);
    setBannerOpen(true);
  }, [consent]);

  const statistics = !!consent?.statistics;
  const marketing = !!consent?.marketing;
  const anyTracking = statistics || marketing;
  const consentMode = `{
    ad_storage: '${marketing ? "granted" : "denied"}',
    ad_user_data: '${marketing ? "granted" : "denied"}',
    ad_personalization: '${marketing ? "granted" : "denied"}',
    analytics_storage: '${statistics ? "granted" : "denied"}'
  }`;

  return (
    <ConsentContext.Provider value={{ consent, openSettings }}>
      {children}

      {/* Tracking wird ausschließlich nach Einwilligung geladen. */}
      {ready && anyTracking && GTM_ID && (
        <Script id="gtm" strategy="afterInteractive">
          {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}window.gtag=gtag;
gtag('consent','default',${consentMode});
(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${GTM_ID}');`}
        </Script>
      )}

      {ready && !GTM_ID && ((statistics && GA4_ID) || (marketing && ADS_ID)) && (
        <>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${statistics && GA4_ID ? GA4_ID : ADS_ID}`} strategy="afterInteractive" />
          <Script id="gtag-init" strategy="afterInteractive">
            {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}window.gtag=gtag;
gtag('consent','default',${consentMode});
gtag('js',new Date());
${statistics && GA4_ID ? `gtag('config','${GA4_ID}');` : ""}
${marketing && ADS_ID ? `gtag('config','${ADS_ID}');` : ""}`}
          </Script>
        </>
      )}

      {ready && !GTM_ID && marketing && META_ID && (
        <Script id="meta-pixel" strategy="afterInteractive">
          {`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
fbq('init','${META_ID}');fbq('track','PageView');`}
        </Script>
      )}

      <AnimatePresence>
        {bannerOpen && (
          <motion.div
            role="dialog"
            aria-modal="false"
            aria-labelledby="consent-title"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 24 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="fixed inset-x-3 bottom-3 z-[60] mx-auto max-w-xl rounded-2xl border border-line bg-white p-5 shadow-lift sm:bottom-5 sm:p-6"
          >
            <div className="flex items-start gap-3">
              <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-teal-50 text-teal-700">
                <Cookie className="h-5 w-5" aria-hidden />
              </span>
              <div className="min-w-0 flex-1">
                <h2 id="consent-title" className="text-base font-bold">Datenschutz-Einstellungen</h2>
                <p className="mt-1 text-sm leading-6 text-ink-soft">
                  Wir verwenden notwendige Technologien für den Betrieb der Website.
                  {TRACKING_CONFIGURED
                    ? " Mit deiner Einwilligung nutzen wir zusätzlich Statistik- und Marketing-Dienste (z. B. Google, Meta), um unser Angebot zu verbessern und Werbung zu messen. Du kannst deine Auswahl jederzeit im Footer ändern."
                    : " Statistik- und Marketing-Dienste sind derzeit nicht aktiv."}{" "}
                  <Link href="/datenschutz" className="font-medium text-teal-700 underline underline-offset-2">Mehr erfahren</Link>
                </p>
              </div>
              {consent && (
                <button aria-label="Schließen" onClick={() => setBannerOpen(false)} className="-mr-1 -mt-1 rounded-lg p-1.5 text-ink-muted hover:bg-surface">
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {detailsOpen && (
              <div className="mt-4 space-y-2">
                <ToggleRow title="Notwendig" text="Grundfunktionen, Formulare, Speicherung deiner Auswahl." checked disabled />
                <ToggleRow title="Statistik" text="Anonymisierte Reichweitenmessung (Google Analytics 4)." checked={stat} onChange={setStat} />
                <ToggleRow title="Marketing" text="Messung von Werbeanzeigen (Google Ads, Meta Pixel)." checked={mkt} onChange={setMkt} />
              </div>
            )}

            <div className="mt-5 grid grid-cols-2 gap-2 sm:flex sm:justify-end">
              {detailsOpen ? (
                <button onClick={() => save(stat, mkt)} className="col-span-2 rounded-xl bg-navy px-4 py-3 text-sm font-semibold text-white hover:bg-navy-800">
                  Auswahl speichern
                </button>
              ) : (
                <>
                  <button onClick={() => setDetailsOpen(true)} className="col-span-2 rounded-xl px-4 py-3 text-sm font-semibold text-navy underline-offset-2 hover:underline sm:col-span-1">
                    Einstellungen
                  </button>
                  <button onClick={() => save(false, false)} className="rounded-xl border border-navy px-4 py-3 text-sm font-semibold text-navy hover:bg-navy-50">
                    Nur notwendige
                  </button>
                  <button onClick={() => save(true, true)} className="rounded-xl border border-navy bg-navy px-4 py-3 text-sm font-semibold text-white hover:bg-navy-800">
                    Alle akzeptieren
                  </button>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </ConsentContext.Provider>
  );
}

function ToggleRow({ title, text, checked, disabled, onChange }: { title: string; text: string; checked: boolean; disabled?: boolean; onChange?: (v: boolean) => void }) {
  return (
    <label className={`flex items-center justify-between gap-4 rounded-xl border border-line p-3 ${disabled ? "opacity-70" : "cursor-pointer hover:bg-surface"}`}>
      <span>
        <span className="block text-sm font-semibold text-navy">{title}</span>
        <span className="block text-xs text-ink-muted">{text}</span>
      </span>
      <span className="relative inline-flex">
        <input type="checkbox" className="peer sr-only" checked={checked} disabled={disabled} onChange={(e) => onChange?.(e.target.checked)} />
        <span className="h-6 w-11 rounded-full bg-line transition peer-checked:bg-teal peer-focus-visible:ring-4 peer-focus-visible:ring-teal/20" />
        <span className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition peer-checked:translate-x-5" />
      </span>
    </label>
  );
}
