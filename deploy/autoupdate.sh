#!/usr/bin/env bash
# Prüft, ob es auf GitHub einen neuen Stand gibt, und spielt ihn dann ein (läuft per Cron).
cd "$(dirname "$0")/.." || exit 0
git fetch -q origin main || exit 0
[ "$(git rev-parse HEAD)" = "$(git rev-parse origin/main)" ] && exit 0
echo "$(date '+%F %T') neuer Stand gefunden – aktualisiere"
flock -n /tmp/rs-update.lock bash deploy/update.sh
