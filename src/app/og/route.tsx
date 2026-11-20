import { ImageResponse } from "next/og";
import { getBrand } from "@/lib/server/brand";

export const dynamic = "force-dynamic";

/** Vorschaubild für geteilte Links – mit dem Namen der aufgerufenen Domain. */
export async function GET() {
  const brand = await getBrand();
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: 72, background: "#0B0B0A", color: "white" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16, fontSize: 30, fontWeight: 700 }}>
          <div style={{ width: 52, height: 52, borderRadius: 14, background: "#FFD60A" }} />
          {brand.name}
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 76, fontWeight: 800, lineHeight: 1.05, letterSpacing: -2 }}>Rechtsschutz, der zu deinem Leben passt.</div>
          <div style={{ marginTop: 28, fontSize: 32, color: "rgba(255,255,255,0.7)" }}>Kostenloser Rechtsschutz-Check · Persönliche Beratung</div>
        </div>
        <div style={{ height: 8, width: 220, borderRadius: 8, background: "#FFD60A" }} />
      </div>
    ),
    { width: 1200, height: 630, headers: { "Cache-Control": "public, max-age=3600" } }
  );
}
