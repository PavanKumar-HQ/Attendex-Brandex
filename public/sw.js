const CACHE_NAME = 'attendex-v6';
const DATA_CACHE_NAME = 'attendex-data-v6';

const CORE_ASSETS = [
  '/',
  '/login',
  '/manifest.json',
  '/brandex-logo.png',
  '/icons/icon-192.png',
  '/icons/icon-512.png'
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

// 3. Strategic Fetching: Guaranteed Valid Response Resolution
self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Only handle GET requests
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // STRICT RULE 1: Only intercept SAME-ORIGIN requests. Never intercept Supabase, Dicebear, CDNs, etc.
  if (url.origin !== self.location.origin) {
    return;
  }

  // STRICT RULE 2: Bypass dev server endpoints, HMR, web sockets, browser extensions, and RSC payloads
  if (
    url.pathname.includes('_next/webpack-hmr') ||
    url.pathname.includes('__nextjs') ||
    url.pathname.includes('/api/auth') ||
    url.searchParams.has('_rsc')
  ) {
    return;
  }

  // Strategy A: Next.js Static Chunks (immutable JS/CSS/fonts) -> Cache-First with Fallback
  if (url.pathname.startsWith('/_next/static/')) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request)
          .then((networkRes) => {
            if (networkRes.ok) {
              const clone = networkRes.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(request, clone)).catch(() => {});
            }
            return networkRes;
          })
          .catch(() => {
            // NEVER return undefined - guarantee valid Response
            return new Response('', { status: 404, statusText: 'Static Asset Unavailable' });
          });
      })
    );
    return;
  }

  // Strategy B: Institutional Read APIs -> Network First with Cached Offline Fallback
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .then((networkRes) => {
          if (networkRes.ok) {
            const clone = networkRes.clone();
            caches.open(DATA_CACHE_NAME).then((cache) => cache.put(request, clone)).catch(() => {});
          }
          return networkRes;
        })
        .catch(async () => {
          const cached = await caches.match(request);
          if (cached) return cached;
          return new Response(
            JSON.stringify({ 
              error: 'Offline', 
              message: 'Institutional network currently unavailable. Please check connectivity.' 
            }),
            { status: 503, headers: { 'Content-Type': 'application/json' } }
          );
        })
    );
    return;
  }

  // Strategy C: HTML Page Navigation -> Network First with Offline HTML Fallback
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((networkRes) => {
          if (networkRes.ok) {
            const clone = networkRes.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone)).catch(() => {});
          }
          return networkRes;
        })
        .catch(async () => {
          const cached = await caches.match(request);
          if (cached) return cached;
          const loginCached = await caches.match('/login');
          if (loginCached) return loginCached;
          const rootCached = await caches.match('/');
          if (rootCached) return rootCached;
          return new Response(
            '<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"/><title>Attendex Offline</title><style>body{font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;background:#f8fafc;color:#1e293b;text-align:center;padding:20px;}</style></head><body><div><h2>Attendex Offline Portal</h2><p>Unable to connect to the institutional server. Please verify your connection.</p><button onclick="window.location.reload()" style="padding:10px 20px;border-radius:8px;background:#0f172a;color:#fff;border:none;cursor:pointer;">Retry Connection</button></div></body></html>',
            { status: 503, headers: { 'Content-Type': 'text/html' } }
          );
        })
    );
    return;
  }

  // Strategy D: Local Static Assets (e.g. /brandex-logo.png, icons) -> Stale-While-Revalidate
  event.respondWith(
    caches.match(request).then((cached) => {
      const networkFetch = fetch(request)
        .then((networkRes) => {
          if (networkRes.ok) {
            const clone = networkRes.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone)).catch(() => {});
          }
          return networkRes;
        })
        .catch(() => null);

      if (cached) return cached;

      return networkFetch.then((networkRes) => {
        if (networkRes) return networkRes;
        return new Response('', { status: 404, statusText: 'Resource Not Found' });
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
