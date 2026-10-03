"use client";

import { useEffect } from "react";

/**
 * Registers the PWA service worker (public/sw.js). Skipped in development so Fast
 * Refresh and uncached responses keep working while iterating; it only runs in the
 * built production app, which is also the only place `next build`/`next start` serve
 * a stable `/_next/static` asset set worth caching.
 */
export function RegisterServiceWorker() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

    navigator.serviceWorker.register("/sw.js").catch(() => {
      // Installability/offline support is a progressive enhancement; ignore failures.
    });
  }, []);

  return null;
}
