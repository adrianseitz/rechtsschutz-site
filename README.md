# Seitz Rechtsschutz – Website mit Lead-Funnel

Next.js 15 · React 19 · TypeScript · Tailwind CSS · Motion · React Hook Form · Zod

## Schnellstart

```bash
npm install
cp .env.example .env.local      # Werte eintragen (siehe unten)
npm run dev                     # http://localhost:3000
npm run build && npm start      # Produktion
```

## Seiten

| Route | Inhalt |
|---|---|
| `/` | Startseite mit Hero, Vertrauensbereich, 4 Produktkarten, 3-Schritte-Prozess, FAQ |
| `/privatrechtsschutz`, `/arbeitsrechtsschutz`, `/vermieterrechtsschutz`, `/firmenrechtsschutz` | Eigenständige Landingpages für Anzeigen |
| `/rechtsschutz-check` | Multi-Step-Funnel (5 Schritte, dynamische Fragen) |
| `/kontakt` | Termin, Rückruf oder Frage |
| `/vielen-dank` | Erfolgsseite (noindex) |
| `/impressum`, `/datenschutz` | **Vorlagen mit gelb markierten Platzhaltern** |

## Anzeige → Landingpage → Check

Jede Landingpage startet den Check vorausgewählt. Über die URL lassen sich die ersten Schritte überspringen:

- `/rechtsschutz-check?bereich=arbeit` startet bei Schritt 2.
- `/rechtsschutz-check?bereich=vermieter&situation=etw` startet bei Schritt 3.

Mögliche Werte für `bereich`: `arbeit`, `privat`, `vermieter`, `firma`, `mehrere`.

Empfohlene Ziel-URLs für Anzeigen:
```
https://deine-domain.de/arbeitsrechtsschutz?utm_source=google&utm_medium=cpc&utm_campaign=arbeitsrecht
https://deine-domain.de/vermieterrechtsschutz?utm_source=facebook&utm_medium=paid&utm_campaign=vermieter
```
UTM-Parameter, Einstiegsseite und verweisende Domain werden pro Sitzung erfasst und mit dem Lead gespeichert. Der Kanal (z. B. „Google Ads“, „Meta Ads“, „Suchmaschine (organisch)“) wird automatisch abgeleitet. `gclid` und `fbclid` werden nur mit Marketing-Einwilligung gespeichert.

## Lead-Verarbeitung

`POST /api/leads` und `POST /api/contact`:

- Zod-Validierung auf Server und Client (gleiches Schema).
- Same-Origin-Prüfung, Größenlimit von 16 KB, Rate Limit (Standard: 5 Anfragen pro 10 Minuten und IP).
- Spam-Schutz über ein Honeypot-Feld und eine Mindestausfüllzeit.
- Pro Lead werden Wortlaut, Version und Zeitpunkt jeder Einwilligung gespeichert.
- Die IP-Adresse wird nur gehasht gespeichert.

**Ziele (mindestens eines muss konfiguriert sein, sonst antwortet die API mit 503 – keine simulierte Übermittlung):**

1. **Datei** (`LEAD_STORAGE=file`): `data/leads.ndjson` und `data/contacts.ndjson`. Personenbezogene Daten werden mit AES-256-GCM verschlüsselt (`LEAD_ENCRYPTION_KEY`). Dafür ist ein Server mit dauerhaftem Speicher nötig (VPS, Docker, Hetzner, Railway mit Volume o. Ä.).
2. **CRM-Webhook** (`CRM_WEBHOOK_URL`): JSON mit `event` und `data`, signiert per HMAC-SHA256 im Header `X-Signature`. Passt direkt zu **Zapier „Catch Hook“ → Pipedrive**, Make oder n8n.
3. **E-Mail-Benachrichtigung** (SMTP): bei jedem neuen Lead an `LEAD_NOTIFY_TO`.

**Auf Vercel/Serverless** gibt es keinen dauerhaften Dateispeicher. Setze dort `LEAD_STORAGE=none` und nutze den CRM-Webhook plus SMTP. Für ein instanzübergreifendes Rate Limit sollte zusätzlich Upstash Redis angebunden werden (die Schnittstelle liegt in `src/lib/server/rateLimit.ts`).

**Lead-Export** (nur mit `ADMIN_TOKEN`, mindestens 24 Zeichen, sonst deaktiviert):
```bash
curl -H "Authorization: Bearer $ADMIN_TOKEN" "https://deine-domain.de/api/admin/leads?format=csv" -o leads.csv
curl -H "Authorization: Bearer $ADMIN_TOKEN" "https://deine-domain.de/api/admin/leads?type=contact&format=csv" -o kontakte.csv
```
Die CSV-Datei hat Semikolon-Trennung und UTF-8-BOM und lässt sich so direkt in Excel öffnen.

## CRM (`/admin`)

- Login mit `ADMIN_PASSWORD` (mind. 12 Zeichen), Sitzung 12 Stunden als HttpOnly-Cookie, max. 5 Login-Versuche pro 15 Minuten.
- Alle Anfragen aus Rechtsschutz-Check und Kontaktformular, neueste zuerst; Suche, Filter nach Status, Anruf-/Mail-Knopf, Details mit Quelle und Einwilligungen.
- Status: Neu → Kontaktiert → Termin → Angebot → Abschluss / Verloren, mit Verlauf. Gespeichert in `data/crm-status.json` (nur IDs + Status).
- CSV-Export inkl. Status über den Download-Knopf.
- Braucht `LEAD_STORAGE=file` auf einem Server mit dauerhaftem Speicher → siehe **DEPLOY.md** (IONOS VPS mit Docker + Caddy).
- Kein Header, kein Intro, kein Tracking und kein Cookie-Banner im CRM; `/admin` ist für Suchmaschinen gesperrt.

## Tracking & Consent

Ohne Einwilligung wird **kein** Tracking-Skript geladen. Das Banner bietet „Alle akzeptieren“ und „Nur notwendige“ gleichwertig an. Google Consent Mode v2 wird gesetzt. Bei einem Widerruf wird die Seite neu geladen. Die Schriften liegen lokal, es gibt also keine Verbindung zu Google Fonts.

Es gibt zwei Varianten, bitte **nur eine davon** nutzen, sonst wird doppelt gezählt:

- **GTM:** `NEXT_PUBLIC_GTM_ID` setzen. Die Events landen im `dataLayer` und werden im Container auf GA4, Ads und Meta verteilt.
- **Direkt:** `NEXT_PUBLIC_GA4_ID`, `NEXT_PUBLIC_GOOGLE_ADS_ID` mit den Labels und `NEXT_PUBLIC_META_PIXEL_ID` setzen.

| Event | Auslöser | Ads / Meta |
|---|---|---|
| `funnel_started` | erste Antwort im Check | – |
| `funnel_step_completed` | jeder abgeschlossene Schritt | – |
| `lead_submitted` | **nur** nach erfolgreicher Server-Antwort | Ads-Conversion (Lead-Label) / Meta `Lead` |
| `appointment_requested` | Kontaktformular mit Anliegen „Termin“ | Ads (Termin-Label) / Meta `Schedule` |
| `contact_form_submitted` | Rückruf oder Frage | Ads (Kontakt-Label) / Meta `Contact` |

Doppelte Auslösungen werden verhindert: Die Lead-ID dient als `dedupeKey` pro Sitzung, als `transaction_id` bei Google und als `eventID` bei Meta. Damit ist auch eine spätere Meta Conversions API vorbereitet. Die Danke-Seite selbst löst bewusst nichts aus, damit ein Neuladen nicht doppelt zählt.

## Design

- **Stil:** Weiße Flächen, tiefschwarze Schrift, Signalgelb `#FFD60A` als Markierungsfarbe (Textmarker hinter Schlüsselwörtern, gelbe Bänder, Buttons). Schriften: Geist (Grotesk), Instrument Serif kursiv für Hervorhebungen, Geist Mono für Kicker – alles lokal ausgeliefert.
- **Farb-Tokens** in `tailwind.config.ts`. Aus Kompatibilitätsgründen heißen sie weiterhin `navy` (= Schwarz) und `teal` (= Gelb); zusätzlich gibt es `sun`, `paper` und `surface`.
- **Bewegung:** Weiches Scrollen (Lenis, nur Desktop), Wort-für-Wort-Überschrift mit animiertem Marker, Parallax-Karten im Hero, horizontal laufende Situations-Galerie, gestapelte Ablauf-Karten, Laufleiste. Alles respektiert „Bewegung reduzieren“.

## Intro, Live-Effekte & Fotos

- **Intro „Der Stempel“** (`src/components/ui/Intro.tsx`): Brief rutscht ins Bild, Stempel „Abgesichert“ knallt drauf (Bildschirm wackelt, Handy vibriert kurz), Claim „Bevor es ernst wird: abgesichert.“, gelber Vorhang. Ca. 2,5 s, nur beim ersten Besuch pro Sitzung, per Klick/Taste überspringbar, entfällt bei „Bewegung reduzieren“ und für Suchmaschinen. Ein Inline-Script im Layout deckt die Seite bis zum Start ab (kein Aufblitzen).
- **Antipp-Effekte** (`ClickBurst.tsx`): gelber Ring + fliegende §-Zeichen/Punkte bei jedem Tippen auf Buttons, Links und markierte Elemente; auf Android kurzes Vibrieren.
- **3D-Schild antippen:** dreht sich einmal komplett und „ploppt“.
- **Foto-Galerie zum Anfassen** (`PeopleStrip.tsx`): Polaroids echter Menschen seitlich ziehen; Antippen dreht das Foto um – Rückseite zeigt handschriftlich, was hilft, plus Link.
- **Dokument antippen** („Der Ernstfall“): Notiz springt heraus, und an der getippten Stelle landet ein „Abgesichert“-Stempel.
- **Fotos:** Unsplash-Lizenz (kostenlos, auch kommerziell). Alle Fotos zeigen Models und sind als „Symbolbild“ gekennzeichnet. Liste mit Fotograf und Quelle in `src/lib/photos.ts`; der Bildnachweis erscheint automatisch im Impressum. Eigene Fotos: Datei in `public/photos/` (als `.webp` und `.jpg`) ablegen und in `photos.ts` eintragen.

## Handgemachte Details (gegen den „KI-Look“)

- **Dokument-Illustrationen** (`src/components/art/Documents.tsx`): Kündigungsschreiben, Paketschein, Nebenkostenabrechnung, Unfallbericht, Klageschrift, Bescheid, Schlüsselanhänger – reines HTML/SVG mit Papierstruktur, Stempeln und Handschrift. Alle Namen/Adressen sind fiktiv (Muster GmbH, Musterstadt).
- **Scribbles** (`Scribble.tsx`): Unterstreichungen, Kreise und Pfeile, die sich beim Scrollen selbst zeichnen.
- **Notizzettel** in Handschrift (Caveat), **rotierendes §-Siegel**, **Kassenbon** im Hero, **Fußnoten** im Magazin-Stil (¹ ² ³) statt versteckter Einschränkungen.
- **Animationen:** Cursor-Begleiter mit Label („Ansehen“), magnetische Buttons, Laufleiste reagiert auf Scroll-Tempo, Wort-für-Wort-Überschriften, Stempel „knallen“ beim Sichtbarwerden, Papierkörnung über der Seite.
- „Der Ernstfall“ auf jeder Produktseite: großes Beispiel-Dokument + die Fristen, die dann zählen (§ 4 KSchG, § 12a ArbGG, § 438 BGB, § 556 BGB, § 54 ArbGG).

## 3D & Bilder

- **3D-Szene im Hero** (`src/components/three/Shield3D.tsx`): Three.js / React Three Fiber mit Studio-HDRI (CC0, Poly Haven, über `@pmndrs/assets`). Wird erst nach dem Seitenaufbau nachgeladen; ohne WebGL entfällt sie einfach.
- **3D-Icons** (`public/3d/*.webp`): Microsoft Fluent Emoji 3D, **MIT-Lizenz** (siehe `public/3d/LICENSE-fluent-emoji.txt`). Verwendung über `<Icon3D name="briefcase" />`.
- **Dein Porträt:** Lege ein Foto als `public/images/adrian.jpg` ab (Hochformat 4:5, mind. 900 × 1125 px). Es erscheint automatisch im gelben Ansprechpartner-Bereich.

## Interaktive Tools

- **Kostenrechner** (`src/lib/costs.ts`): Berechnet Anwalts- und Gerichtskosten der 1. Instanz nach § 13 RVG und Anlage 2 GKG in der Fassung ab 01.06.2025, für Streitwerte bis 50.000 €. Im Modus „Kündigungsschutz“ gilt: Streitwert = 3 Bruttomonatsgehälter, eigene Kosten nach § 12a ArbGG. Bei künftigen Gebührenanpassungen müssen nur die Tabellenwerte oben in der Datei geändert werden.
- **Baukasten:** Die gewählte Kombination wird als `?bereich=mehrere&auswahl=…` an den Check übergeben, der dann direkt bei Schritt 3 startet.
- **Wartezeit-Zeitachse:** Interaktive Erklärung, warum bestehende Konflikte nicht versichert sind.

## Vor dem Livegang – Checkliste

- [ ] Alle `[PLATZHALTER …]` in `src/lib/site.ts` ausfüllen bzw. per `.env` setzen: Anschrift, Status nach § 34d GewO, Registernummer, IHK, Vergütung, Beteiligungen, USt-IdNr.
- [ ] Impressum und Datenschutzerklärung **fachlich bzw. anwaltlich prüfen lassen**. Hoster, SMTP- und CRM-Dienste, Löschfristen und die Aufsichtsbehörde ergänzen. Mit allen Dienstleistern Verträge zur Auftragsverarbeitung schließen.
- [ ] Einwilligungstexte in `src/lib/schemas.ts` prüfen lassen. Bei jeder Änderung `CONSENT_VERSION` hochzählen.
- [ ] Mit der ARAG klären, ob Logo oder Markenname verwendet werden dürfen. Bis dahin hat die Seite bewusst ein eigenes Design.
- [ ] Die Produkttexte (`src/lib/products.ts`, `src/lib/faq.ts`) mit den aktuellen ARAG-Bedingungen abgleichen, insbesondere Wartezeiten und Leistungsumfang.
- [ ] `LEAD_ENCRYPTION_KEY`, `LEAD_HASH_SALT` und `ADMIN_TOKEN` neu und zufällig erzeugen.
- [ ] `NEXT_PUBLIC_SITE_URL` auf die echte Domain setzen (wird für Sitemap, Open Graph und Origin-Prüfung gebraucht).
- [ ] Eine Testanfrage abschicken und prüfen, ob E-Mail, CRM-Eintrag und Conversion ankommen.

## Struktur

```
src/
  app/                 Seiten, API-Routen, sitemap.ts, robots.ts, opengraph-image.tsx
  components/
    funnel/            RechtsschutzCheck (Multi-Step-Funnel)
    sections/          Hero, ProductLanding (Vorlage aller Produktseiten), FAQ, CTA …
    consent/           ConsentManager (Banner + Laden der Tracking-Skripte)
    layout/ ui/ legal/
  lib/
    products.ts        Inhalte der 4 Produktseiten – neue Produkte hier ergänzen
    funnel.ts          Fragen und Antworten des Checks
    schemas.ts         Zod-Schemas und Einwilligungstexte
    tracking.ts        Event-API mit Deduplizierung
    server/            Speicherung, Verschlüsselung, Mail, CRM, Rate Limit, Guards
```

**Ein neues Produkt** (z. B. Verkehrsrechtsschutz) braucht drei Schritte: einen Eintrag in `products.ts`, Fragen in `funnel.ts` und eine 10-zeilige Seite unter `src/app/<route>/page.tsx` nach dem Muster der bestehenden Seiten.
