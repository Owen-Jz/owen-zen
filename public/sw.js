// Bump this version on each release to purge stale caches on activate.
const CACHE_NAME = 'owen-zen-v2';
const OFFLINE_URL = '/offline';

// Assets to pre-cache on install. Intentionally does NOT include '/' — caching
// the HTML app shell across deploys serves a stale page that references deleted,
// content-hashed JS chunks (white screen until hard refresh). Navigations are
// network-first and fall back to the dedicated offline page instead.
const PRECACHE_ASSETS = [
    '/offline',
    '/manifest.json',
    '/logo.svg',
    '/icon-192.png',
    '/icon-512.png',
];

// --- Install: pre-cache the app shell ---
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(PRECACHE_ASSETS);
        })
    );
    self.skipWaiting();
});

// --- Activate: clear old caches ---
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) =>
            Promise.all(
                keys
                    .filter((key) => key !== CACHE_NAME)
                    .map((key) => caches.delete(key))
            )
        )
    );
    self.clients.claim();
});

// --- Fetch: network-first with offline fallback ---
self.addEventListener('fetch', (event) => {
    // Only handle GET requests
    if (event.request.method !== 'GET') return;

    // Skip API routes — always go to network
    const url = new URL(event.request.url);
    if (url.pathname.startsWith('/api/')) return;

    const isNavigation = event.request.mode === 'navigate' || event.request.destination === 'document';

    // Navigations: always network-first and NEVER cache the HTML shell (avoids
    // serving a stale page that points at deleted JS chunks after a deploy).
    // Offline → show the dedicated offline page.
    if (isNavigation) {
        event.respondWith(
            fetch(event.request).catch(async () => {
                const offlinePage = await caches.match(OFFLINE_URL);
                return offlinePage || new Response('You are offline.', { status: 503 });
            })
        );
        return;
    }

    // Static assets (content-hashed, safe to cache): network-first, cache on success.
    event.respondWith(
        fetch(event.request)
            .then((response) => {
                if (response && response.status === 200) {
                    const clone = response.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, clone);
                    });
                }
                return response;
            })
            .catch(async () => {
                const cached = await caches.match(event.request);
                if (cached) return cached;
                return new Response('Network error', { status: 503 });
            })
    );
});

// --- Push Notifications (optional, ready for future use) ---
self.addEventListener('push', (event) => {
    const data = event.data?.json() ?? {};
    const title = data.title || 'Owen Zen';
    const options = {
        body: data.body || 'You have a new notification.',
        icon: '/icon-192.png',
        badge: '/icon-192.png',
        vibrate: [100, 50, 100],
        data: { url: data.url || '/' },
    };
    event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    event.waitUntil(
        clients.openWindow(event.notification.data?.url || '/')
    );
});
