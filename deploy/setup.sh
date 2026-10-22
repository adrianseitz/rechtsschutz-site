#!/usr/bin/env bash
# Einrichtung auf einem frischen Ubuntu-Server (IONOS VPS, 22.04 oder 24.04).
# Aufruf im Projektordner:  bash deploy/setup.sh
set -euo pipefail
cd "$(dirname "$0")/.."

echo "→ System aktualisieren …"
export DEBIAN_FRONTEND=noninteractive
apt-get update -qq
apt-get install -y -qq git curl openssl ufw unattended-upgrades >/dev/null

# Automatische Sicherheitsupdates
dpkg-reconfigure -f noninteractive unattended-upgrades >/dev/null 2>&1 || true

# Auslagerungsspeicher, damit der Build auch bei wenig RAM nicht abbricht
if [ "$(swapon --show | wc -l)" -eq 0 ]; then
  echo "→ Lege 2 GB Swap an …"
  fallocate -l 2G /swapfile && chmod 600 /swapfile && mkswap /swapfile >/dev/null && swapon /swapfile
  grep -q '/swapfile' /etc/fstab || echo '/swapfile none swap sw 0 0' >> /etc/fstab
fi

# Firewall: nur SSH, HTTP, HTTPS
ufw allow OpenSSH >/dev/null && ufw allow 80/tcp >/dev/null && ufw allow 443/tcp >/dev/null && ufw --force enable >/dev/null

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

# Tägliche Datensicherung um 03:15 Uhr
DIR="$(pwd)"
( crontab -l 2>/dev/null | grep -v 'deploy/backup.sh'; echo "15 3 * * * bash $DIR/deploy/backup.sh >/dev/null 2>&1" ) | crontab -
echo
echo "Fertig. Website: https://www.$(grep ^DOMAIN= .env | cut -d= -f2)   CRM: …/admin"
