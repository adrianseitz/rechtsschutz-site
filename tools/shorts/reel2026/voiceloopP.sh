#!/bin/bash
# Stimmen + Wort-Zeiten für die Spielszenen-Reels, eins nach dem anderen
S=/tmp/claude-0/-home-claude/79a33912-41b3-599f-8551-abfa6afe01fd/scratchpad
cd $S
until grep -q FERTIG reels/voiceP/reel-37.log; do sleep 5; done
for f in reels/scriptsP/*.json; do
  n=$(basename $f .json)
  [ -f reels/voiceP/$n.json ] && grep -q '"words"' reels/voiceP/$n.json && continue
  python3 -I pro/voice_v2.py $S/st3bank $f reels/voiceP/$n asr/sherpa-onnx-whisper-small 0.35 > reels/voiceP/$n.log 2>&1 \
   && python3 -I pro/wordtimes.py asr/sherpa-onnx-nemo-parakeet-tdt-0.6b-v3-int8 reels/voiceP/$n.wav reels/voiceP/$n.json >> reels/voiceP/$n.log 2>&1 \
   && echo "$n Stimme fertig" || echo "$n Stimme FEHLER"
done
echo ALLE_STIMMEN_FERTIG
