#!/usr/bin/env bash
# Sichert alle Anfragen + CRM-Status nach deploy/backups/ (verschlüsselt wie gespeichert).
# Läuft nach deploy/setup.sh automatisch täglich um 03:15 Uhr (crontab).
set -euo pipefail
cd "$(dirname "$0")/.."
mkdir -p deploy/backups
f="deploy/backups/leads-$(date +%F).tar.gz"
docker compose exec -T app tar -czf - -C /app data > "$f"
find deploy/backups -name 'leads-*.tar.gz' -mtime +30 -delete
echo "Gesichert: $f"
