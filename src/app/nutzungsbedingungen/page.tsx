import type { Metadata } from "next";
import Link from "next/link";
import { LegalShell } from "@/components/legal/LegalShell";
import { legal } from "@/lib/site";

export const metadata: Metadata = { title: "Nutzungsbedingungen", robots: { index: true, follow: true }, alternates: { canonical: "/nutzungsbedingungen" } };

export default function NutzungsbedingungenPage() {
  return (
    <LegalShell title="Nutzungsbedingungen">
      <h2>Worum es geht</h2>
      <p>
        Diese Website informiert über Rechtsschutzversicherungen der ARAG und bietet einen kostenlosen, unverbindlichen
        Rechtsschutz-Check sowie Kontakt- und Rückrufmöglichkeiten. Anbieter ist {legal.name}; alle Angaben zum Anbieter
        stehen im <Link href="/impressum">Impressum</Link>.
      </p>

      <h2>Keine Rechtsberatung, keine verbindlichen Angebote</h2>
      <p>
        Die Inhalte dienen der allgemeinen Information. Sie ersetzen weder eine Rechtsberatung noch eine persönliche Beratung zu
        deinem Versicherungsschutz. Welche Leistungen gelten, richtet sich allein nach dem jeweiligen Tarif und den
        Versicherungsbedingungen. Preise und Beispiele auf dieser Website sind unverbindlich.
      </p>

      <h2>Nutzung des Rechtsschutz-Checks und der Formulare</h2>
      <p>
        Bitte gib nur wahre Angaben und nur deine eigenen Kontaktdaten an. Das Absenden ist kostenlos und verpflichtet zu nichts.
        Wie deine Angaben verarbeitet werden, steht in der <Link href="/datenschutz">Datenschutzerklärung</Link>.
      </p>

      <h2>Videos und Social Media</h2>
      <p>
        Der Anbieter veröffentlicht eigene Erklärvideos auf Instagram, TikTok und YouTube. Dafür nutzt er die offiziellen
        Schnittstellen dieser Plattformen ausschließlich mit seinen eigenen Konten. Es werden dabei keine Daten von Besucherinnen
        und Besuchern dieser Website verwendet. Für die Plattformen selbst gelten deren eigene Nutzungsbedingungen.
      </p>

      <h2>Urheberrecht</h2>
      <p>Texte, Grafiken und Videos dieser Website sind urheberrechtlich geschützt. Eine Weiterverwendung ist nur mit Zustimmung erlaubt.</p>

      <h2>Haftung für Links</h2>
      <p>Für Inhalte verlinkter fremder Websites sind ausschließlich deren Betreiber verantwortlich.</p>
    </LegalShell>
  );
}
