import type { MetadataRoute } from "next";
import { site } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = [
    ["/", 1], ["/privatrechtsschutz", 0.9], ["/arbeitsrechtsschutz", 0.9], ["/vermieterrechtsschutz", 0.9], ["/firmenrechtsschutz", 0.9],
    ["/rechtsschutz-check", 0.8], ["/kontakt", 0.6], ["/impressum", 0.2], ["/datenschutz", 0.2],
  ] as const;
  return routes.map(([path, priority]) => ({ url: `${site.url}${path}`, lastModified: new Date(), changeFrequency: "monthly", priority }));
}
