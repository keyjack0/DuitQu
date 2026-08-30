const CACHE_VERSION = "duitqu-static-v3";
const NAV_CACHE_NAME = "duitqu-nav-v3";
const SHELL_URLS = ["/", "/dashboard", "/transactions", "/wallets", "/budgets", "/ai-assistant", "/login"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    fetch("/version.json")
      .then((r) => r.json())
      .then(({ version }) => {
        self.__APP_VERSION = version;
        return caches.open(`duitqu-static-${version}`);
      })
      .catch(() => {
        self.__APP_VERSION = null;
        return caches.open(CACHE_VERSION);
      })
      .then((cache) => cache.addAll(SHELL_URLS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => {
        const active = self.__APP_VERSION
          ? [`duitqu-static-${self.__APP_VERSION}`, `duitqu-nav-${self.__APP_VERSION}`]
          : [CACHE_VERSION, NAV_CACHE_NAME];
        return Promise.all(
          keys.filter((k) => !active.includes(k)).map((k) => caches.delete(k))
        );
      })
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // Network-only untuk data (Supabase & API AI) — data finansial tidak pernah di-cache
  if (url.origin !== self.location.origin || url.pathname.startsWith("/api/")) return;

  // Navigasi: network-first, fallback ke app shell saat offline
  if (request.mode === "navigate") {
    const navCache = self.__APP_VERSION
      ? `duitqu-nav-${self.__APP_VERSION}`
      : NAV_CACHE_NAME;
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(navCache).then((cache) => cache.put(request, copy));
          return response;
        })
        .catch(() =>
          caches.match(request).then((cached) => cached || caches.match("/dashboard"))
        )
    );
    return;
  }

  // Aset statis (_next/static/*): stale-while-revalidate
  if (url.pathname.startsWith("/_next/static/")) {
    const staticCache = self.__APP_VERSION
      ? `duitqu-static-${self.__APP_VERSION}`
      : CACHE_VERSION;
    event.respondWith(
      caches.match(request).then((cached) => {
        const network = fetch(request)
          .then((response) => {
            const copy = response.clone();
            caches.open(staticCache).then((cache) => cache.put(request, copy));
            return response;
          })
          .catch(() => cached);
        return cached || network;
      })
    );
    return;
  }

  // Aset lain (ikon, manifest, dll): cache-first
  const fallbackCache = self.__APP_VERSION
    ? `duitqu-static-${self.__APP_VERSION}`
    : CACHE_VERSION;
  event.respondWith(
    caches.match(request).then(
      (cached) =>
        cached ||
        fetch(request).then((response) => {
          const copy = response.clone();
          caches.open(fallbackCache).then((cache) => cache.put(request, copy));
          return response;
        })
    )
  );
});