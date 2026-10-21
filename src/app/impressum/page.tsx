import type { Metadata } from "next";
import { LegalShell, V } from "@/components/legal/LegalShell";
import { legal, site } from "@/lib/site";
import { PHOTOS } from "@/lib/photos";

export const metadata: Metadata = { title: "Impressum & Vermittlerangaben", robots: { index: true, follow: true }, alternates: { canonical: "/impressum" } };

export default function ImpressumPage() {
  return (
    <LegalShell title="Impressum & Vermittlerangaben">
      <h2>Angaben gemäß § 5 DDG</h2>
      <p>{legal.name}<br /><V v={legal.street} /><br /><V v={legal.city} /></p>

      <h2>Kontakt</h2>
      <p>Telefon: <V v={site.phone} /><br />E-Mail: <V v={site.email} /></p>

      <h2>Umsatzsteuer</h2>
      <p>Umsatzsteuer-Identifikationsnummer gemäß § 27a UStG: <V v={legal.vatId} /></p>

      <h2>Angaben zur Versicherungsvermittlung (§ 15 VersVermV)</h2>
      <h3>Status</h3>
      <p><V v={legal.status} /></p>
      <h3>Tätig für</h3>
      <p><V v={legal.insurers} /></p>
      <h3>Beratung</h3>
      <p>Im Zusammenhang mit der Vermittlung wird eine Beratung angeboten. Die Beratung erfolgt zu Produkten der Versicherer, für die ich tätig bin; es handelt sich nicht um eine unabhängige Beratung auf Grundlage einer ausgewogenen Marktuntersuchung.</p>
      <h3>Vergütung</h3>
      <p><V v={legal.remuneration} /></p>
      <h3>Zuständige Erlaubnis- bzw. Registrierungsbehörde</h3>
      <p><V v={legal.chamber} /></p>
      <h3>Vermittlerregister</h3>
      <p>
        Registrierungsnummer: <V v={legal.registerNumber} /><br />
        Deutsche Industrie- und Handelskammer (DIHK), Breite Straße 29, 10178 Berlin<br />
        Telefon: 0180 600 58 50 (Festnetzpreis 0,20 €/Anruf; Mobilfunkpreise max. 0,60 €/Anruf)<br />
        <a href="https://www.vermittlerregister.info" target="_blank" rel="noopener noreferrer">www.vermittlerregister.info</a>
      </p>
      <h3>Beteiligungen</h3>
      <p><V v={legal.participations} /></p>
      <h3>Schlichtungsstellen</h3>
      <p>Bei Streitigkeiten zwischen Versicherungsvermittlern und Versicherungsnehmern können folgende Schlichtungsstellen angerufen werden:</p>
      <ul>
        <li>Versicherungsombudsmann e.V., Postfach 08 06 32, 10006 Berlin, <a href="https://www.versicherungsombudsmann.de" target="_blank" rel="noopener noreferrer">www.versicherungsombudsmann.de</a></li>
        <li>Ombudsmann Private Kranken- und Pflegeversicherung, Postfach 06 02 22, 10052 Berlin, <a href="https://www.pkv-ombudsmann.de" target="_blank" rel="noopener noreferrer">www.pkv-ombudsmann.de</a></li>
      </ul>
      <p><span className="ph">[PLATZHALTER: Anschriften vor Veröffentlichung auf Aktualität prüfen]</span></p>
      <h3>Berufsrechtliche Regelungen</h3>
      <ul>
        <li>§ 34d Gewerbeordnung (GewO)</li>
        <li>§§ 59–68 Versicherungsvertragsgesetz (VVG)</li>
        <li>Verordnung über die Versicherungsvermittlung und -beratung (VersVermV)</li>
      </ul>
      <p>Die Regelungen können unter <a href="https://www.gesetze-im-internet.de" target="_blank" rel="noopener noreferrer">www.gesetze-im-internet.de</a> eingesehen werden.</p>

      <h2>Verbraucherstreitbeilegung (§ 36 VSBG)</h2>
      <p><span className="ph">[PLATZHALTER: Erklärung, ob Sie zur Teilnahme an einem Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle bereit oder verpflichtet sind – mit Prüfung, ob die Pflicht für Sie gilt]</span></p>

      <h2>Hinweis zur Website</h2>
      <p>Diese Website wird von {legal.name} als selbstständigem Versicherungsvermittler betrieben. Sie ist keine offizielle Website der ARAG und kein unabhängiges Vergleichsportal. Inhalte zu Versicherungsleistungen sind allgemeine Informationen; maßgeblich sind ausschließlich die jeweiligen Versicherungsbedingungen.</p>

      <h2>Bildnachweise</h2>
      <p>Fotos von <a href="https://unsplash.com" target="_blank" rel="noopener noreferrer">Unsplash</a> (Unsplash-Lizenz). Es handelt sich um Symbolbilder; die abgebildeten Personen stehen in keinem Zusammenhang mit den beschriebenen Fällen.</p>
      <ul>
        {Object.values(PHOTOS).map((p) => (
          <li key={p.src}>{p.alt} – Foto: <a href={p.url} target="_blank" rel="noopener noreferrer">{p.author}</a></li>
        ))}
      </ul>
      <p>3D-Icons: Microsoft Fluent Emoji (MIT-Lizenz). Studio-Beleuchtung der 3D-Szene: Poly Haven (CC0).</p>

      <h2>Verantwortlich für den Inhalt</h2>
      <p>{legal.name}, Anschrift wie oben.</p>
    </LegalShell>
  );
}
