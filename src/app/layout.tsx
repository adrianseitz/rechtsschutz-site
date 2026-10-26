import type { Metadata, Viewport } from "next";
import "@fontsource-variable/geist";
import "@fontsource-variable/geist-mono";
import "@fontsource/instrument-serif/400.css";
import "@fontsource/instrument-serif/400-italic.css";
import "@fontsource-variable/caveat";
import "./globals.css";
import { site } from "@/lib/site";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { StickyCta } from "@/components/layout/StickyCta";
import { ConsentManager } from "@/components/consent/ConsentManager";
import { ScrollProgress } from "@/components/ui/ScrollProgress";
import { SmoothScroll } from "@/components/ui/SmoothScroll";
import { Cursor } from "@/components/ui/Cursor";
import { ClickBurst } from "@/components/ui/ClickBurst";
import { Intro } from "@/components/ui/Intro";
import { PublicOnly } from "@/components/layout/PublicOnly";
import { PageView } from "@/components/analytics/PageView";

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: { default: `Rechtsschutz, der zu deinem Leben passt | ${site.brand}`, template: `%s | ${site.brand}` },
  description: site.description,
  applicationName: site.brand,
  authors: [{ name: site.owner }],
  openGraph: {
    type: "website",
    locale: site.locale,
    siteName: site.brand,
    title: "Rechtsschutz, der zu deinem Leben passt",
    description: site.description,
    url: "/",
  },
  twitter: { card: "summary_large_image" },
  robots: { index: true, follow: true },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: "#FFFFFF",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de" suppressHydrationWarning>
      <head>
        {/* Deckt die Seite vom ersten Bildaufbau an ab, bis das Intro übernimmt – verhindert kurzes Aufblitzen. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var s=sessionStorage.getItem('rs_intro_seen')==='1',r=matchMedia('(prefers-reduced-motion: reduce)').matches,b=/bot|crawl|spider|lighthouse|headless/i.test(navigator.userAgent);if(!(s||r||b||location.pathname.indexOf('/admin')===0)){document.documentElement.classList.add('intro-pending');setTimeout(function(){document.documentElement.classList.remove('intro-pending')},4000)}}catch(e){}`,
          }}
        />
      </head>
      <body>
        <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[70] focus:rounded-lg focus:bg-white focus:px-4 focus:py-2">Zum Inhalt springen</a>
        <ConsentManager>
          <PublicOnly>
            <PageView />
            <SmoothScroll />
            <Intro />
            <Cursor />
            <ClickBurst />
            <div className="grain" aria-hidden />
            <ScrollProgress />
            <Header />
          </PublicOnly>
          <main id="main">{children}</main>
          <PublicOnly>
            <Footer />
            <StickyCta />
          </PublicOnly>
        </ConsentManager>
      </body>
    </html>
  );
}
