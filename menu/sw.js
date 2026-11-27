const CACHE = 'lucca-menu-v6';
const urlsToCache = [
  '.',
  'index.html',
  'icon.svg',
  'manifest.json',
  'assets/lucca-logo.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE).then(cache => {
      return Promise.all(urlsToCache.map(u => cache.add(new Request(u, { cache: 'reload' }))));
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(k => k !== CACHE).map(k => caches.delete(k))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    event.respondWith(
      caches.open(CACHE).then(async cache => {
        const cached = await cache.match(request);
        if (cached) return cached;
        const fetched = await fetch(request);
        cache.put(request, fetched.clone());
        return fetched;
      })
    );
    return;
  }

  if (url.hostname === 'cdnjs.cloudflare.com') {
    event.respondWith(
      caches.open(CACHE).then(async cache => {
        const cached = await cache.match(request);
        if (cached) return cached;
        try {
          const fetched = await fetch(request);
          cache.put(request, fetched.clone());
          return fetched;
        } catch {
          return new Response('', { status: 200, statusText: 'OK' });
        }
      })
    );
    return;
  }

  if (request.mode === 'navigate' || (url.origin === location.origin && /\.(html|js|css)$/.test(url.pathname))) {
    event.respondWith(
      fetch(request, { cache: 'no-cache' }).then(res => {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(request, copy));
        return res;
      }).catch(() => caches.match(request).then(r => r || caches.match('.')))
    );
    return;
  }

  event.respondWith(
    caches.match(request).then(cached => {
      if (cached) return cached;
      return fetch(request).catch(() => caches.match('.'));
    })
  );
});
