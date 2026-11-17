# Video-Automatik: erstellt die Shorts (Chromium + ffmpeg), spricht sie mit der eigenen Stimme (Kyutai Pocket TTS)
# und postet sie zum Termin. Build-Kontext ist tools/shorts (siehe docker-compose.yml).
FROM node:22-bookworm-slim
RUN apt-get update \
 && apt-get install -y --no-install-recommends chromium ffmpeg python3 python3-numpy python3-scipy ca-certificates curl libssl3 tini fonts-dejavu-core \
 && rm -rf /var/lib/apt/lists/*

# Eigene Stimme: Pocket TTS als fertiges Programm (MIT, ohne Python), Prüfsumme aus SHA256SUMS des Releases.
# Schlägt der Download fehl, wird das Image trotzdem gebaut – die Website-Updates hängen nicht daran; das CRM meldet dann „Sprachprogramm fehlt“.
ARG POCKET_TTS_RELEASE=v4.0.1
ARG POCKET_TTS_VERSION=3.3.0
RUN set -u; arch="$(dpkg --print-architecture)"; \
  case "$arch" in \
    amd64) t=x86_64-unknown-linux-gnu; sum=9abff0aa138a804e44052952d8c3bdaae247fb267ca8f4b83fe178897d1a0559 ;; \
    arm64) t=aarch64-unknown-linux-gnu; sum=2b9a727bffd86ea6d73370d675cbd91a7db118f11b7f5a60343c2d5da12b187a ;; \
    *) t=""; sum="" ;; \
  esac; \
  if [ -n "$t" ] \
    && curl -fsSL --retry 3 -o /tmp/pt.tgz "https://github.com/kyutai-labs/pocket-tts/releases/download/${POCKET_TTS_RELEASE}/pocket-tts-${POCKET_TTS_VERSION}-${t}.tar.gz" \
    && echo "${sum}  /tmp/pt.tgz" | sha256sum -c - \
    && mkdir -p /opt/pocket-tts && tar xzf /tmp/pt.tgz -C /opt/pocket-tts --strip-components=1; \
  then echo "Pocket TTS installiert"; else echo "WARNUNG: Pocket TTS nicht installiert"; fi; rm -f /tmp/pt.tgz
WORKDIR /opt/shorts
COPY package.json ./
RUN npm install --omit=dev --no-audit --no-fund
COPY . .
ENV NODE_ENV=production CHROME_PATH=/usr/bin/chromium SOCIAL_DIR=/data/social SHORTS_WORKERS=1 TZ=Europe/Berlin \
    POCKET_TTS_BIN=/opt/pocket-tts/pocket-tts HF_HOME=/data/social/hf SHORTS_TTS_THREADS=1
ENTRYPOINT ["/usr/bin/tini", "--"]
CMD ["node", "worker/worker.mjs"]
