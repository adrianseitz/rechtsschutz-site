import type { Metadata } from "next";
import { LegalShell, V } from "@/components/legal/LegalShell";
import { legal, site } from "@/lib/site";

export const metadata: Metadata = { title: "Datenschutzerklärung", alternates: { canonical: "/datenschutz" } };

const GA4 = Boolean(process.env.NEXT_PUBLIC_GA4_ID || process.env.NEXT_PUBLIC_GTM_ID);
const ADS = Boolean(process.env.NEXT_PUBLIC_GOOGLE_ADS_ID || process.env.NEXT_PUBLIC_META_PIXEL_ID || process.env.NEXT_PUBLIC_GTM_ID);
const GTM = Boolean(process.env.NEXT_PUBLIC_GTM_ID);

export default function DatenschutzPage() {
  return (
    <LegalShell title="Datenschutzerklärung">
      <p>Stand: Oktober 2026</p>

      <h2>Verantwortlicher</h2>
      <p>{legal.name}<br /><V v={legal.street} /><br /><V v={legal.city} /><br />E-Mail: <V v={site.email} /> · Telefon: <V v={site.phone} /></p>

      <h2>Hosting und Server-Logfiles</h2>
      <p>Diese Website wird auf einem Server der IONOS SE, Elgendorfer Str. 57, 56410 Montabaur, mit Serverstandort in der Europäischen Union (Rechenzentrum in Spanien) betrieben. Beim Aufruf werden technisch erforderliche Daten (z. B. IP-Adresse, Datum und Uhrzeit, aufgerufene Seite, Browsertyp) verarbeitet, um die Website auszuliefern und ihre Sicherheit zu gewährleisten. Rechtsgrundlage ist Art. 6 Abs. 1 lit. f DSGVO. Mit IONOS besteht ein Vertrag zur Auftragsverarbeitung (Art. 28 DSGVO).</p>
      <p>Ein Zugriffsprotokoll mit IP-Adressen wird nicht geführt. Zum Schutz vor Missbrauch (z. B. massenhaften Formulareinsendungen) wird die IP-Adresse nur in gehashter Form und nur kurzzeitig im Arbeitsspeicher verarbeitet. Technische Fehlerprotokolle enthalten keine Formularinhalte.</p>

      <h2>Rechtsschutz-Check und Kontaktformular</h2>
      <p>Wenn du den Rechtsschutz-Check oder das Kontaktformular nutzt, verarbeite ich deine Angaben (Antworten im Check, Name, E-Mail-Adresse, optional Telefonnummer, bevorzugter Kontaktweg, Nachricht), um deine Anfrage zu bearbeiten, dich zu beraten und dir ein Angebot zu unterbreiten. Rechtsgrundlage ist Art. 6 Abs. 1 lit. b DSGVO (vorvertragliche Maßnahmen auf deine Anfrage) sowie deine Einwilligung nach Art. 6 Abs. 1 lit. a DSGVO für die Kontaktaufnahme über den gewählten Kontaktweg.</p>
      <p>Zusätzlich speichere ich zur Nachweisbarkeit den Zeitpunkt und Wortlaut deiner Einwilligungen sowie Angaben zur Herkunft der Anfrage (Kampagnenparameter wie „utm_source“, Einstiegsseite, verweisende Domain). Werbe-Klick-IDs (z. B. gclid, fbclid) werden nur mit deiner Marketing-Einwilligung erfasst. Zum Schutz vor Missbrauch wird deine IP-Adresse ausschließlich in gehashter (pseudonymisierter) Form verarbeitet (Art. 6 Abs. 1 lit. f DSGVO).</p>
      <p>Die Felder werden verschlüsselt übertragen (TLS) und personenbezogene Inhalte verschlüsselt gespeichert. Deine Anfrage wird auf dem oben genannten Server in der EU gespeichert und in meinem eigenen, passwortgeschützten Kundenverwaltungssystem (CRM) auf diesem Server bearbeitet; eine Übermittlung an externe CRM-Anbieter findet nicht statt.</p>
      <h3>Weitergabe an Versicherer</h3>
      <p>Für die Erstellung eines Angebots oder einen Antrag übermittle ich die hierfür erforderlichen Daten an den Versicherer (ARAG) – erst wenn du ein konkretes Angebot wünschst. Empfänger ist die ARAG SE, ARAG Platz 1, 40472 Düsseldorf, bzw. die für das jeweilige Produkt zuständige Gesellschaft des ARAG Konzerns.</p>
      <h3>Optionale Marketing-Einwilligung</h3>
      <p>Wenn du dies gesondert erlaubst, informiere ich dich gelegentlich über weitere passende Versicherungslösungen (Art. 6 Abs. 1 lit. a DSGVO). Du kannst diese Einwilligung jederzeit mit Wirkung für die Zukunft widerrufen, z. B. per E-Mail.</p>
      <h3>Speicherdauer</h3>
      <p>Anfragen, aus denen kein Versicherungsvertrag entsteht, lösche ich spätestens 12 Monate nach dem letzten Kontakt. Kommt ein Vertrag zustande, speichere ich die Daten für die Dauer der Betreuung und darüber hinaus nur, soweit gesetzliche Aufbewahrungspflichten bestehen (z. B. nach Handels- und Steuerrecht). Daten, die ich aufgrund deiner Einwilligung verarbeite, lösche ich nach deren Widerruf, sofern keine andere Rechtsgrundlage besteht. Auf Wunsch lösche ich deine Anfrage jederzeit früher.</p>

      <h2>Einwilligungsverwaltung und Cookies</h2>
      <p>Für den Betrieb notwendige Informationen (z. B. deine Datenschutz-Auswahl) werden im Speicher deines Browsers abgelegt (§ 25 Abs. 2 TDDDG). Nicht notwendige Dienste werden erst nach deiner Einwilligung geladen (§ 25 Abs. 1 TDDDG, Art. 6 Abs. 1 lit. a DSGVO). Deine Auswahl kannst du jederzeit über „Cookie-Einstellungen“ im Footer ändern oder widerrufen.</p>

      {!GA4 && !ADS && (
        <>
          <h2>Analyse- und Marketing-Dienste</h2>
          <p>Derzeit setze ich auf dieser Website keine Analyse- oder Marketing-Dienste (z. B. Google Analytics, Google Ads, Meta Pixel) ein. Sollte sich das ändern, werden diese Dienste nur mit deiner Einwilligung geladen und hier beschrieben.</p>
        </>
      )}
      {GA4 && (
        <>
          <h2>Statistik: Google Analytics 4 (nur mit Einwilligung)</h2>
          <p>Mit deiner Einwilligung nutze ich Google Analytics 4 der Google Ireland Limited, Gordon House, Barrow Street, Dublin 4, Irland, zur Analyse der Website-Nutzung. Dabei kann es zu einer Übermittlung an Google LLC in die USA kommen; Google ist nach dem EU-US Data Privacy Framework zertifiziert. Google Analytics 4 speichert keine vollständigen IP-Adressen. Google Signals ist deaktiviert. Die Nutzungsdaten werden nach 2 Monaten gelöscht. Rechtsgrundlage ist deine Einwilligung (Art. 6 Abs. 1 lit. a DSGVO, § 25 Abs. 1 TDDDG), die du jederzeit über „Cookie-Einstellungen“ widerrufen kannst.</p>
        </>
      )}
      {ADS && (
        <>
          <h2>Marketing: Google Ads und Meta Pixel (nur mit Einwilligung)</h2>
          <p>Mit deiner Einwilligung messe ich, ob Werbeanzeigen zu Anfragen führen (Conversion-Tracking). Eingesetzt werden Google Ads (Google Ireland Limited) und das Meta Pixel der Meta Platforms Ireland Limited, Merrion Road, Dublin 4, Irland. Dabei können Daten in die USA übermittelt werden; beide Anbieter sind nach dem EU-US Data Privacy Framework zertifiziert. Für das Meta Pixel besteht eine gemeinsame Verantwortlichkeit mit Meta nach Art. 26 DSGVO für die Erhebung und Übermittlung. Es werden keine Kontaktdaten aus dem Formular an Google oder Meta übertragen.</p>
        </>
      )}
      {GTM && (
        <>
          <h2>Google Tag Manager</h2>
          <p>Der Google Tag Manager wird erst nach deiner Einwilligung geladen und dient dazu, die oben genannten Dienste einzubinden.</p>
        </>
      )}

      <h2>Schriftarten</h2>
      <p>Die verwendeten Schriftarten werden lokal von dieser Website ausgeliefert. Es findet keine Verbindung zu Servern von Google Fonts statt.</p>

      <h2>Deine Rechte</h2>
      <p>Du hast das Recht auf Auskunft (Art. 15 DSGVO), Berichtigung (Art. 16), Löschung (Art. 17), Einschränkung der Verarbeitung (Art. 18), Datenübertragbarkeit (Art. 20) und Widerspruch (Art. 21 DSGVO). Erteilte Einwilligungen kannst du jederzeit mit Wirkung für die Zukunft widerrufen (Art. 7 Abs. 3 DSGVO). Du kannst dich zudem bei einer Datenschutz-Aufsichtsbehörde beschweren, z. B. bei dem Landesbeauftragten für den Datenschutz und die Informationsfreiheit Rheinland-Pfalz, Hintere Bleiche 34, 55116 Mainz.</p>

      <h2>Pflicht zur Bereitstellung</h2>
      <p>Die Angabe deiner Kontaktdaten ist erforderlich, damit ich deine Anfrage bearbeiten kann. Ohne diese Angaben ist eine Beratung über das Formular nicht möglich.</p>
    </LegalShell>
  );
}
