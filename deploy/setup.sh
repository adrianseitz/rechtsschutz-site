#!/usr/bin/env bash
# Einrichtung auf einem frischen Ubuntu-Server (IONOS VPS, 22.04 oder 24.04).
# Aufruf im Projektordner:  bash deploy/setup.sh
set -euo pipefail
cd "$(dirname "$0")/.."

if ! command -v docker >/dev/null 2>&1; then
  echo "→ Installiere Docker …"
  curl -fsSL https://get.docker.com | sh
fi

if [ ! -f .env ]; then
  echo
  echo "Ein paar Angaben – sie werden nur in der Datei .env auf diesem Server gespeichert."
  read -rp "Domain ohne www (z. B. seitz-rechtsschutz.de): " DOMAIN
  read -rp "E-Mail, an die neue Anfragen gemeldet werden: " NOTIFY
  while true; do
    read -rsp "Passwort für das CRM (mind. 12 Zeichen, ohne ' ): " PW; echo
    if [ ${#PW} -ge 12 ] && [[ "$PW" != *"'"* ]]; then break; fi
    echo "Bitte mindestens 12 Zeichen und kein Apostroph."
  done
  cat > .env <<ENV
DOMAIN=${DOMAIN}
NEXT_PUBLIC_SITE_URL=https://www.${DOMAIN}
LEAD_STORAGE=file
LEAD_ENCRYPTION_KEY=$(openssl rand -base64 32)
LEAD_HASH_SALT=$(openssl rand -hex 24)
ADMIN_PASSWORD='${PW}'
ADMIN_TOKEN=$(openssl rand -hex 24)
LEAD_NOTIFY_TO=${NOTIFY}
# E-Mail-Versand (optional, für Benachrichtigungen) – siehe DEPLOY.md
SMTP_HOST=
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=
SMTP_PASS=
SMTP_FROM=
ENV
  chmod 600 .env
  echo "→ .env angelegt. WICHTIG: LEAD_ENCRYPTION_KEY sicher aufbewahren – ohne ihn sind gespeicherte Anfragen nicht mehr lesbar."
fi

echo "→ Baue und starte die Seite (dauert beim ersten Mal ein paar Minuten) …"
docker compose up -d --build
echo
echo "Fertig. Website: https://www.$(grep ^DOMAIN= .env | cut -d= -f2)   CRM: …/admin"
