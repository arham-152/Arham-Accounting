// Basic Service Worker for PWA compliance
const CACHE_NAME = 'arham-ledger-v2';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/logo-app.png',
  '/logo-dark.png',
  '/logo-light.png'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // Always fetch API calls and proxy from network
  if (url.pathname.startsWith('/api/')) {
    return;
  }

  // Network-first for the root page to ensure updates
  if (url.pathname === '/' || url.pathname === '/index.html') {
    event.respondWith(
      fetch(event.request)
        .catch(() => caches.match('/'))
    );
    return;
  }

  // Cache-first for assets (images, fonts)
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) return response;
        return fetch(event.request);
      })
  );
});
