/* Cache only immutable/static assets; financial data always stays network-only. */
const STATIC_CACHE = "duitqu-static-v6";
const STATIC_PREFIXES = ["/icons/", "/images/"];
const STATIC_PATHS = new Set(["/manifest.json"]);

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys
          .filter((key) => /^duitqu-(?:static|nav)-/.test(key) && key !== STATIC_CACHE)
          .map((key) => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

function isRscRequest(request, url) {
  const accept = request.headers.get("accept") || "";
  return url.searchParams.has("_rsc") ||
    url.pathname.endsWith(".rsc") ||
    request.headers.has("rsc") ||
    request.headers.has("next-router-state-tree") ||
    request.headers.has("next-router-prefetch") ||
    request.headers.has("next-router-segment-prefetch") ||
    accept.includes("text/x-component");
}

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (
    url.origin !== self.location.origin ||
    request.mode === "navigate" ||
    url.pathname.startsWith("/api/") ||
    isRscRequest(request, url)
  ) {
    return;
  }

  const isStatic = STATIC_PATHS.has(url.pathname) ||
    STATIC_PREFIXES.some((prefix) => url.pathname.startsWith(prefix));
  if (!isStatic) return;

  event.respondWith(caches.open(STATIC_CACHE).then(async (cache) => {
    const cached = await cache.match(request);
    if (cached) return cached;

    const response = await fetch(request);
    const cacheControl = response.headers.get("cache-control") || "";
    if (response.ok && response.type === "basic" && !/\b(?:no-store|private)\b/i.test(cacheControl)) {
      await cache.put(request, response.clone());
    }
    return response;
  }));
});
