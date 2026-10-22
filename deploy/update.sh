#!/usr/bin/env bash
# Neuen Stand von GitHub holen und Seite neu starten. Anfragen bleiben erhalten.
set -euo pipefail
cd "$(dirname "$0")/.."
git pull --ff-only
docker compose up -d --build
docker image prune -f >/dev/null
echo "Aktualisiert."
