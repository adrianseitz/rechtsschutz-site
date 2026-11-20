#!/bin/bash
# Rendert jedes Reel, sobald seine Stimme fertig ist
S=/tmp/claude-0/-home-claude/79a33912-41b3-599f-8551-abfa6afe01fd/scratchpad/reels
export REELS_DIR=$S/scripts30 VOICE_DIR=$S/voice30 OUT_DIR=$S/out30
for f in $S/scripts30/*.json; do
  n=$(basename $f .json)
  [ -f $S/out30/$n.mp4 ] && continue
  until [ -f $S/voice30/$n.json ] && grep -q '"words"' $S/voice30/$n.json; do sleep 20; done
  python3 -I $S/render/render.py $n full > $S/out30/$n.log 2>&1 && echo "$n gerendert" || echo "$n FEHLER"
done
echo ALLE_FERTIG
