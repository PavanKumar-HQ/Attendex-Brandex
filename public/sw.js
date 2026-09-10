const CACHE_NAME = 'attendex-v4';
const DATA_CACHE_NAME = 'attendex-data-v4';

const CORE_ASSETS = [
  '/',
  '/login',
  '/manifest.json',
  '/brandex-logo.png',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/KLE_logo.jpg'
];

// 1. Installation: Safe, non-blocking core asset caching
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // Use allSettled so that an individual missing asset NEVER aborts SW installation
      return Promise.allSettled(
        CORE_ASSETS.map((url) =>
          fetch(url, { cache: 'no-cache' })
            .then((res) => {
              if (res.ok) return cache.put(url, res);
            })
            .catch(() => null)
        )
      );
    })
  );
  self.skipWaiting();
});

// 2. Activation: Clean up old caches immediately
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME && name !== DATA_CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

// 3. Strategic Fetching: Stale-While-Revalidate for Instant 0ms Load
self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Only handle GET requests from http/https
  if (request.method !== 'GET' || !request.url.startsWith('http')) return;

  const url = new URL(request.url);

  // Ignore browser extensions or dev server websockets
  if (url.protocol === 'chrome-extension:' || url.pathname.includes('_next/webpack-hmr')) {
    return;
  }

  // Strategy A: Next.js Static Chunks (immutable JS/CSS/fonts) -> Cache-First
  if (url.pathname.startsWith('/_next/static/')) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((networkRes) => {
          if (networkRes.ok) {
            const clone = networkRes.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return networkRes;
        });
      })
    );
    return;
  }

  // Strategy B: Institutional Read APIs (/api/pulse, /api/classes, /api/subjects, etc.) -> Stale-While-Revalidate
  if (url.pathname.startsWith('/api/') && !url.pathname.includes('/auth/')) {
    event.respondWith(
      caches.open(DATA_CACHE_NAME).then((cache) => {
        return cache.match(request).then((cached) => {
          const fetchPromise = fetch(request)
            .then((networkRes) => {
              if (networkRes.ok) {
                cache.put(request, networkRes.clone());
              }
              return networkRes;
            })
            .catch(() => cached); // On network error, fallback to cached

          // Return cached response immediately if present, otherwise wait for network
          return cached || fetchPromise;
        });
      })
    );
    return;
  }

  // Strategy C: HTML Navigation & Core Pages -> Stale-While-Revalidate with Network Fallback
  event.respondWith(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.match(request).then((cached) => {
        const networkFetch = fetch(request)
          .then((networkRes) => {
            if (networkRes.ok && networkRes.type === 'basic') {
              cache.put(request, networkRes.clone());
            }
            return networkRes;
          })
          .catch(() => cached);

        return cached || networkFetch;
      });
    })
  );
});

// 4. Background Sync: Ensure Offline Attendance / Mutated Data is Flushed
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-offline-queue') {
    event.waitUntil(
      self.clients.matchAll().then((clients) => {
        clients.forEach((client) => {
          client.postMessage({ type: 'OFFLINE_SYNC_TRIGGERED' });
        });
      })
    );
  }
});

// 5. Push Notification Handler
self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : { title: 'Attendex', body: 'New academic update.' };

  const options = {
    body: data.body,
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    vibrate: [100, 50, 100],
    data: { url: data.url || '/' }
  };

  event.waitUntil(self.registration.showNotification(data.title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(self.clients.openWindow(event.notification.data.url));
});
