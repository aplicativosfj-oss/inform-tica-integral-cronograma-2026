// Agenda de Informática - Service Worker
// Caches static assets and enables offline support

const CACHE_NAME = "agenda-v1";
const RUNTIME_CACHE = "agenda-runtime-v1";

// Static assets to cache on install
const STATIC_ASSETS = [
  "/",
  "/index.html",
  "/offline.html",
  "/manifest.json",
  "/favicon.ico",
];

// Install event: pre-cache static assets
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate event: clean up old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName !== RUNTIME_CACHE) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch event: serve from cache, fallback to network
self.addEventListener("fetch", (event) => {
  const { request } = event;

  // Skip non-GET requests
  if (request.method !== "GET") {
    return;
  }

  // Cache-first strategy for static assets
  if (isStaticAsset(request.url)) {
    event.respondWith(
      caches
        .match(request)
        .then((response) => {
          if (response) {
            return response;
          }
          return fetch(request).then((response) => {
            if (!response || response.status !== 200) {
              return response;
            }
            const responseToCache = response.clone();
            caches
              .open(CACHE_NAME)
              .then((cache) => {
                cache.put(request, responseToCache);
              });
            return response;
          });
        })
        .catch(() => {
          // Return offline page if available
          return caches.match("/offline.html");
        })
    );
  } else {
    // Network-first strategy for dynamic content
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (!response || response.status !== 200) {
            return response;
          }
          const responseToCache = response.clone();
          caches
            .open(RUNTIME_CACHE)
            .then((cache) => {
              cache.put(request, responseToCache);
            });
          return response;
        })
        .catch(() => {
          // Try to return cached version
          return caches
            .match(request)
            .then((response) => {
              if (response) {
                return response;
              }
              return caches.match("/offline.html");
            });
        })
    );
  }
});

/**
 * Determine if URL is a static asset
 */
function isStaticAsset(url) {
  const staticPatterns = [
    /\.(js|css|woff2|woff|ttf|otf|eot)$/i,
    /^.*\/assets\//,
    /\.(jpg|jpeg|png|gif|webp|avif|svg)$/i,
  ];
  return staticPatterns.some((pattern) => pattern.test(url));
}
