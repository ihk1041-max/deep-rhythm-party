const CACHE_NAME = 'rhythm-variety-v9.0.1';
const APP_SHELL = [
  './',
  './index.html',
  './styles.css?v=9.0.1',
  './assets/v9/main.js',
  './assets/v9/audio.js',
  './assets/v9/games.js',
  './assets/v9/renderer.js',
  './assets/v9/rhythm.js',
  './assets/v9/settings.js',
  './assets/v9/types.js',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './audio/hey.wav',
  './audio/go.wav',
  './audio/yeah.wav',
  './music/README.txt'
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).then((response) => {
        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put('./index.html', clone));
        return response;
      }).catch(() => caches.match('./index.html'))
    );
    return;
  }

  const networkFirst = event.request.destination === 'script' || event.request.destination === 'style';
  if (networkFirst) {
    event.respondWith(
      fetch(event.request).then((response) => {
        if (response.ok) caches.open(CACHE_NAME).then((cache) => cache.put(event.request, response.clone()));
        return response;
      }).catch(() => caches.match(event.request))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request).then((response) => {
      if (response.ok) caches.open(CACHE_NAME).then((cache) => cache.put(event.request, response.clone()));
      return response;
    }))
  );
});
