#!/usr/bin/env bash
# Schaltet automatische Updates ein: alle 15 Minuten wird geprüft, ob es einen neuen Stand gibt.
DIR="$(cd "$(dirname "$0")/.." && pwd)"
( crontab -l 2>/dev/null | grep -v 'deploy/autoupdate.sh'; echo "*/15 * * * * bash $DIR/deploy/autoupdate.sh >> /var/log/rs-autoupdate.log 2>&1" ) | crontab -
echo "Automatische Updates sind eingeschaltet. Erster Lauf jetzt ..."
bash "$DIR/deploy/autoupdate.sh"
echo "Fertig."
