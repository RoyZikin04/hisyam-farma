// Service Worker untuk Progressive Web App (PWA) Hisyam Farma
const CACHE_NAME = "hisyam-farma-pwa-v1";
const STATIC_ASSETS = [
  "/",
  "/login",
  "/manifest.json",
  "/icons/icon-192x192.png",
  "/icons/icon-512x512.png",
  "/favicon-32x32.png"
];

// Install: Cache aset dasar
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate: Bersihkan cache versi lama
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch: Network first untuk API dinamis, Stale-while-revalidate untuk aset statis
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Jangan sentuh API routes agar mutasi data kasir/stok selalu langsung ke server
  if (url.pathname.startsWith("/api/")) {
    return;
  }

  // Khusus navigasi halaman: coba network dulu, fallback ke cache jika offline
  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.match(event.request).then((res) => res || caches.match("/"));
      })
    );
    return;
  }

  // Aset statis lainnya: Cache First dengan update background
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        // Update di background
        fetch(event.request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              caches.open(CACHE_NAME).then((cache) => cache.put(event.request, networkResponse));
            }
          })
          .catch(() => {});
        return cachedResponse;
      }
      return fetch(event.request);
    })
  );
});
