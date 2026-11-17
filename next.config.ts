import type { NextConfig } from "next";

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
];

const nextConfig: NextConfig = {
  // Eigenständiger Build für den Betrieb im Docker-Container (eigener Server)
  output: "standalone",
  reactStrictMode: true,
  poweredByHeader: false,
  images: { formats: ["image/avif", "image/webp"] },
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      // Im CRM darf das Mikrofon an (eigene Sprachaufnahme für die Videos). Spätere Regel überschreibt die frühere.
      { source: "/admin", headers: [{ key: "Permissions-Policy", value: "camera=(), microphone=(self), geolocation=()" }] },
      { source: "/admin/:path*", headers: [{ key: "Permissions-Policy", value: "camera=(), microphone=(self), geolocation=()" }] },
      { source: "/api/:path*", headers: [{ key: "Cache-Control", value: "no-store" }] },
    ];
  },
};

export default nextConfig;
