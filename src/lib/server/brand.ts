import { headers } from "next/headers";
import { brandForHost } from "@/lib/brand";

/** Marke der aktuellen Anfrage (Caddy reicht den ursprünglichen Host durch). */
export async function getBrand() {
  const h = await headers();
  return brandForHost(h.get("x-forwarded-host") || h.get("host"));
}
