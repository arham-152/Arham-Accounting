const CACHE_NAME = 'ledger-v3';
const ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/logo-app.png',
  '/logo-dark.png',
  '/logo-light.png'
];

// Force immediate replacement
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    })
  );
});

// Clear old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map(k => {
          if (k !== CACHE_NAME) return caches.delete(k);
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Stale-While-Revalidate strategy for static assets
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // Only cache GET requests and skip tracking/sync scripts
  if (event.request.method !== 'GET' || url.search.includes('script.google.com')) {
    return;
  }

  event.respondWith(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.match(event.request).then((cachedResponse) => {
        const fetchPromise = fetch(event.request).then((networkResponse) => {
          // If it's a valid response, cache it
          if (networkResponse && networkResponse.status === 200) {
            cache.put(event.request, networkResponse.clone());
          }
          return networkResponse;
        }).catch(() => {
          // If network fails, we hope we had a cache
          return cachedResponse;
        });

        return cachedResponse || fetchPromise;
      });
    })
  );
});
