"use client";

import { usePathname } from "next/navigation";

/** Blendet Website-Elemente (Header, Intro, Effekte …) im CRM-Bereich /admin aus. */
export function PublicOnly({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  if (path?.startsWith("/admin")) return null;
  return <>{children}</>;
}
