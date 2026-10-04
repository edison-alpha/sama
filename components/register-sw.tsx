"use client";

import { useEffect } from "react";

/**
 * Registers the PWA service worker (public/sw.js) in the built production app only.
 *
 * In development it does the opposite: it removes any service worker and cache left over from an earlier
 * `next start` on the same origin. That worker serves /_next/static/ cache-first, and the dev server keeps the same
 * CSS/JS URLs while their content changes, so a leftover worker would keep serving the first copy it cached and hide
 * every later style change (this is what kept scrollbars visible in the installed PWA). After cleaning up it reloads
 * once so the open page picks up fresh assets; the next load has no controlling worker, so it cannot loop.
 */
export function RegisterServiceWorker() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

    if (process.env.NODE_ENV !== "production") {
      const controlled = Boolean(navigator.serviceWorker.controller);
      void (async () => {
        try {
          const registrations = await navigator.serviceWorker.getRegistrations();
          await Promise.all(registrations.map((r) => r.unregister()));
          if ("caches" in window) {
            const keys = await caches.keys();
            await Promise.all(keys.filter((k) => k.startsWith("sama-shell")).map((k) => caches.delete(k)));
          }
          if (controlled && registrations.length > 0) window.location.reload();
        } catch {
          // Best effort: a blocked storage API leaves things as they were.
        }
      })();
      return;
    }

    navigator.serviceWorker.register("/sw.js").catch(() => {
      // Installability/offline support is a progressive enhancement; ignore failures.
    });
  }, []);

  return null;
}
