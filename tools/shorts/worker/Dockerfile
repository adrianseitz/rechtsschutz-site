# Video-Automatik: erstellt die Shorts (Chromium + ffmpeg) und postet sie zum Termin.
# Build-Kontext ist tools/shorts (siehe docker-compose.yml).
FROM node:22-bookworm-slim
RUN apt-get update \
 && apt-get install -y --no-install-recommends chromium ffmpeg python3 python3-numpy python3-scipy ca-certificates tini fonts-dejavu-core \
 && rm -rf /var/lib/apt/lists/*
WORKDIR /opt/shorts
COPY package.json ./
RUN npm install --omit=dev --no-audit --no-fund
COPY . .
ENV NODE_ENV=production CHROME_PATH=/usr/bin/chromium SOCIAL_DIR=/data/social SHORTS_WORKERS=1 TZ=Europe/Berlin
ENTRYPOINT ["/usr/bin/tini", "--"]
CMD ["node", "worker/worker.mjs"]
