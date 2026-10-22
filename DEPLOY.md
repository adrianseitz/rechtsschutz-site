# Eigener Server (IONOS VPS) – Website + CRM

Die Website läuft in einem Docker-Container, davor sorgt **Caddy** automatisch für HTTPS (Let's Encrypt).
Anfragen werden verschlüsselt auf dem Server gespeichert und im **CRM unter `/admin`** angezeigt.

## 1. Server bestellen (IONOS)

- Produkt: **VPS** (Linux), z. B. 2 vCPU / 2–4 GB RAM, Rechenzentrum **Deutschland**
- Betriebssystem: **Ubuntu 24.04**
- Nach der Bestellung zeigt IONOS die **IP-Adresse** und das **root-Passwort**.
- In der IONOS-**Firewall** des Servers die Ports **22, 80 und 443** freigeben.

## 2. Domain auf den Server zeigen lassen (IONOS → Domains & SSL → DNS)

| Typ | Hostname | Wert |
|---|---|---|
| A | `@` | IP-Adresse des Servers |
| A | `www` | IP-Adresse des Servers |

Vorhandene A-/AAAA-/CNAME-Einträge für `@` und `www` (z. B. von Vercel oder IONOS-Parkseite) vorher löschen.
Die Umstellung dauert meist 5–30 Minuten.

## 3. Auf dem Server einrichten

Am Laptop im Terminal (Windows: „Terminal“ / PowerShell):

```bash
ssh root@<IP-ADRESSE>
```

Dann auf dem Server:

```bash
apt update && apt install -y git
git clone https://github.com/adrianseitz/rechtsschutz-site.git
cd rechtsschutz-site
bash deploy/setup.sh
```

Das Skript richtet Firewall, automatische Sicherheitsupdates, Swap und eine tägliche Datensicherung ein, installiert Docker, fragt **Domain**, **Benachrichtigungs-E-Mail** und ein **CRM-Passwort** ab,
erzeugt alle Schlüssel und startet die Seite. Danach:

- Website: `https://www.seitz-rechtsschutz.de`
- CRM: `https://www.seitz-rechtsschutz.de/admin`

> **Wichtig:** In `.env` steht `LEAD_ENCRYPTION_KEY`. Ohne diesen Schlüssel sind gespeicherte Anfragen
> nicht mehr lesbar – an einem sicheren Ort (z. B. Passwortmanager) aufbewahren.

## 4. E-Mail-Benachrichtigung (optional, empfohlen)

`nano .env` → SMTP-Werte eintragen (z. B. Gmail mit App-Passwort: `smtp.gmail.com`, Port `465`, `SMTP_SECURE=true`),
dann `docker compose up -d`.

## 5. Laufender Betrieb

| Aufgabe | Befehl (im Ordner `rechtsschutz-site`) |
|---|---|
| Neuen Stand von GitHub übernehmen | `bash deploy/update.sh` |
| Datensicherung | läuft täglich automatisch; manuell: `bash deploy/backup.sh` → `deploy/backups/` |
| Logs ansehen | `docker compose logs -f app` |
| Neustart | `docker compose restart` |
| CRM-Passwort ändern | `.env` → `ADMIN_PASSWORD` ändern, dann `docker compose up -d` |

Sicherheitsupdates für Ubuntu laufen automatisch. Backups liegen auf demselben Server – für echte Sicherheit
regelmäßig eine Kopie herunterladen (z. B. `scp root@<IP>:rechtsschutz-site/deploy/backups/*.tar.gz .`).

## Datenschutz

- Hosting bei IONOS in Deutschland → **Auftragsverarbeitungsvertrag (AVV)** im IONOS-Kundenkonto abschließen.
- In der Datenschutzerklärung IONOS als Hoster nennen und die Speicherdauer der Anfragen festlegen.
- Anfragen, die nicht mehr benötigt werden, regelmäßig löschen (Löschkonzept).
