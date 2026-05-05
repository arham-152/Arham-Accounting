const CACHE_NAME = 'ledger-v2';
const ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/logo-app.png'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      );
    })
  );
});

self.addEventListener('fetch', (event) => {
  // Use Network-First strategy for the main page and PWA assets
  // This ensures that if the server is up, we get the latest assets,
  // but if offline, we fallback to cache.
  event.respondWith(
    fetch(event.request)
      .then(async (response) => {
        const cache = await caches.open(CACHE_NAME);
        cache.put(event.request, response.clone());
        return response;
      })
      .catch(() => {
        return caches.match(event.request);
      })
  );
});
