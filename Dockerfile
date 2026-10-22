# ── Build ──
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
# Öffentliche Werte werden beim Build in die Seite geschrieben – deshalb hier übergeben
ARG NEXT_PUBLIC_SITE_URL
ARG NEXT_PUBLIC_CONTACT_EMAIL
ARG NEXT_PUBLIC_CONTACT_PHONE
ARG NEXT_PUBLIC_BOOKING_URL
ARG NEXT_PUBLIC_GTM_ID
ARG NEXT_PUBLIC_GA4_ID
ARG NEXT_PUBLIC_GOOGLE_ADS_ID
ARG NEXT_PUBLIC_GOOGLE_ADS_LEAD_LABEL
ARG NEXT_PUBLIC_GOOGLE_ADS_APPOINTMENT_LABEL
ARG NEXT_PUBLIC_GOOGLE_ADS_CONTACT_LABEL
ARG NEXT_PUBLIC_META_PIXEL_ID
RUN npm run build

# ── Laufzeit ──
FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=3000 HOSTNAME=0.0.0.0 LEAD_STORAGE_DIR=/app/data
RUN addgroup -S app && adduser -S app -G app && mkdir -p /app/data && chown app:app /app/data
COPY --from=build --chown=app:app /app/.next/standalone ./
COPY --from=build --chown=app:app /app/.next/static ./.next/static
COPY --from=build --chown=app:app /app/public ./public
USER app
EXPOSE 3000
VOLUME ["/app/data"]
CMD ["node", "server.js"]
