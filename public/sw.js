// Minimal service worker for Sama's PWA shell.
// Scope: enable installability + a basic offline fallback, without trying to be a
// full offline-first cache (the app is mostly dynamic/wallet-driven).
const CACHE = "sama-shell-v1";
const SHELL_ASSETS = [
  "/manifest.webmanifest",
  "/sama-logo.svg",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(SHELL_ASSETS)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Page navigations: go to the network first so users always get fresh app
  // code; fall back to a cached shell only when fully offline.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(() => caches.match(request).then((res) => res || caches.match("/manifest.webmanifest")))
    );
    return;
  }

  // Static, hashed Next.js assets: cache-first since the content at a given
  // URL never changes.
  if (url.pathname.startsWith("/_next/static/") || SHELL_ASSETS.includes(url.pathname)) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((res) => {
            const copy = res.clone();
            caches.open(CACHE).then((cache) => cache.put(request, copy));
            return res;
          })
      )
    );
  }
});
