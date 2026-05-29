const CACHE_NAME = "duitqu-v1";
const urlsToCache = ["/", "/dashboard", "/transactions", "/wallets", "/budgets", "/ai-assistant"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(urlsToCache))
  );
});

self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      if (response) return response;
      return fetch(event.request).catch(() => caches.match("/dashboard"));
    })
  );
});
