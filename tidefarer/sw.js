/* Tidefarer service worker.
   Strategy:
   - Navigations (the HTML shell): network-first so a fresh deploy loads, with a
     cached fallback so the app still opens offline.
   - Everything else same-origin (the ?v=-stamped js/css, icons, manifest):
     cache-first, populated on first fetch. Because each asset URL carries its
     own ?v= version, a version bump is simply a new URL that gets cached fresh —
     no manifest of files to hand-maintain here.
   Bump CACHE when you want to purge every old entry in one go. */
const CACHE = 'tidefarer-v340';

/* Precache the bare shell so the very first offline launch works even before the
   player has loaded every script online. The rest fills in at runtime. */
const SHELL = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE)
      // addAll is atomic; a single 404 would reject the whole install, so add
      // the shell entries individually and ignore any that momentarily fail.
      .then((cache) => Promise.all(
        SHELL.map((url) => cache.add(url).catch(() => null))
      ))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // let cross-origin pass through

  // Network-first for page navigations so new builds aren't shadowed by cache.
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
          return res;
        })
        .catch(() => caches.match(req)
          .then((hit) => hit || caches.match('./index.html'))
        )
    );
    return;
  }

  // Cache-first for the versioned static assets.
  event.respondWith(
    caches.match(req).then((hit) => {
      if (hit) return hit;
      return fetch(req).then((res) => {
        // Only cache good, basic (same-origin) responses.
        if (res && res.ok && res.type === 'basic') {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
        }
        return res;
      });
    })
  );
});
