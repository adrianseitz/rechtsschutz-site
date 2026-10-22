#!/usr/bin/env bash
# Sichert alle Anfragen + CRM-Status nach deploy/backups/ (verschlüsselt wie gespeichert).
# Täglich automatisch:  crontab -e  →  15 3 * * * bash /root/rechtsschutz-site/deploy/backup.sh
set -euo pipefail
cd "$(dirname "$0")/.."
mkdir -p deploy/backups
f="deploy/backups/leads-$(date +%F).tar.gz"
docker compose cp app:/app/data - | gzip > "$f"
find deploy/backups -name 'leads-*.tar.gz' -mtime +30 -delete
echo "Gesichert: $f"
