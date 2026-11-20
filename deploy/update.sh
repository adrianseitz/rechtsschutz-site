#!/usr/bin/env bash
# Neuen Stand von GitHub holen und Seite neu starten. Anfragen bleiben erhalten.
set -euo pipefail
cd "$(dirname "$0")/.."
before=$(git rev-parse HEAD)
git pull --ff-only
docker compose up -d --build
# Caddyfile geändert? Caddy neu starten, damit die neue Konfiguration greift
git diff --quiet "$before" HEAD -- deploy/Caddyfile || docker compose restart caddy
docker image prune -f >/dev/null
echo "Aktualisiert."
