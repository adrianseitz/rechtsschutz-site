#!/bin/bash
# Rendert jedes Spielszenen-Reel, sobald seine Stimme fertig ist
S=/tmp/claude-0/-home-claude/79a33912-41b3-599f-8551-abfa6afe01fd/scratchpad/reels
export REELS_DIR=$S/scriptsP VOICE_DIR=$S/voiceP OUT_DIR=$S/outP
for f in $S/scriptsP/*.json; do
  n=$(basename $f .json)
  [ -f $S/outP/$n.mp4 ] && continue
  until [ -f $S/voiceP/$n.json ] && grep -q '"words"' $S/voiceP/$n.json; do sleep 20; done
  python3 -I $S/render/render.py $n full > $S/outP/$n.log 2>&1 && echo "$n gerendert" || echo "$n FEHLER"
done
echo ALLE_FERTIG
