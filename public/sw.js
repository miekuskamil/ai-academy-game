/*
 * Neuron service worker.
 *
 * The app is already fully self-contained, so this only needs to make it
 * installable and reliably offline. Strategy: on install, pre-cache the app
 * shell; at runtime, serve same-origin GETs cache-first and fall back to the
 * network, then to the cached index for navigations. Bump CACHE when you ship
 * a new build so old assets are cleared.
 */
const CACHE = 'neuron-v1';
const SHELL = [
  './',
  './index.html',
  './manifest.webmanifest',
  './favicon.svg',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(SHELL)).then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) return;

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request)
        .then((response) => {
          // Cache new same-origin assets (hashed JS/CSS) as they are requested.
          const copy = response.clone();
          caches.open(CACHE).then((cache) => cache.put(request, copy));
          return response;
        })
        .catch(() => {
          // Offline navigations fall back to the app shell.
          if (request.mode === 'navigate') return caches.match('./index.html');
          return new Response('', { status: 504, statusText: 'offline' });
        });
    }),
  );
});
