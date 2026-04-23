// Basic Service Worker for PWA compliance
const CACHE_NAME = 'arham-ledger-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/logo-app.png'
];

self.addEventListener('install', (event: any) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', (event: any) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => response || fetch(event.request))
  );
});
