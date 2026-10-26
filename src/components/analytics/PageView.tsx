"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

/**
 * Meldet anonyme Seitenaufrufe an den eigenen Server (/api/collect).
 * Keine Cookies, kein Local Storage, keine Drittanbieter.
 */
export function PageView() {
  const path = usePathname();
  const first = useRef(true);

  useEffect(() => {
    if (!path || path.startsWith("/admin")) return;
    const q = new URLSearchParams(window.location.search);
    const payload = JSON.stringify({
      p: path,
      // Verweis nur beim ersten Aufruf auswerten – danach kommt er von der eigenen Seite
      r: first.current ? document.referrer : "",
      s: first.current ? q.get("utm_source") ?? "" : "",
      m: first.current ? q.get("utm_medium") ?? "" : "",
      g: first.current && q.has("gclid") ? 1 : 0,
      f: first.current && q.has("fbclid") ? 1 : 0,
      w: window.innerWidth,
    });
    first.current = false;
    try {
      const blob = new Blob([payload], { type: "application/json" });
      if (!navigator.sendBeacon?.("/api/collect", blob)) throw new Error();
    } catch {
      fetch("/api/collect", { method: "POST", body: payload, keepalive: true, headers: { "Content-Type": "application/json" } }).catch(() => undefined);
    }
  }, [path]);

  return null;
}
