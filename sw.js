const CACHE_NAME = 'hafalan-cache-v1';
const urlsToCache = [
  './index.html',
  './manifest.json',
  './icon-192x192.png',
  './icon-512x512.png'
];

// Install Service Worker & Cache file dasar
self.addEventListener('install', event => {
  self.skipWaiting(); // Memaksa SW baru untuk langsung aktif
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        return cache.addAll(urlsToCache);
      })
  );
});

// Activate & Hapus cache lama
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Strategi: Network First, Fallback to Cache
// Ini menjamin aplikasi selalu mendapatkan update terbaru dari GitHub saat online
self.addEventListener('fetch', event => {
  // Hanya proses request GET
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Jika berhasil ambil dari network (GitHub), simpan clone-nya ke cache
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }
        const responseToCache = response.clone();
        caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, responseToCache);
        });
        return response;
      })
      .catch(() => {
        // Jika gagal (offline), ambil dari cache
        return caches.match(event.request);
      })
  );
});
