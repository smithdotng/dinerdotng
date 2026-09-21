/* Diner.ng service worker — offline fallback + static asset caching.
 * Pages are always fetched from the network (they're personalised and change often);
 * only static, versioned assets are cached. Bump VERSION to invalidate caches. */
const VERSION = 'v1';
const STATIC_CACHE = `dinerng-static-${VERSION}`;
const OFFLINE_URL = '/offline';
const PRECACHE = [
    OFFLINE_URL,
    '/css/diner.css',
    '/images/logo.png',
    '/images/logo-light.png',
    '/images/icon-192.png',
    '/assets/vendors/bootstrap/css/bootstrap.min.css',
    '/assets/vendors/fontawesome6/css/all.min.css'
];

self.addEventListener('install', (event) => {
    event.waitUntil(caches.open(STATIC_CACHE).then((c) => c.addAll(PRECACHE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches
            .keys()
            .then((keys) => Promise.all(keys.filter((k) => k.startsWith('dinerng-') && k !== STATIC_CACHE).map((k) => caches.delete(k))))
            .then(() => self.clients.claim())
    );
});

const isStatic = (url) =>
    url.origin === self.location.origin &&
    (url.pathname.startsWith('/_next/static/') ||
        url.pathname.startsWith('/assets/') ||
        url.pathname.startsWith('/images/') ||
        url.pathname.startsWith('/css/'));

self.addEventListener('fetch', (event) => {
    const req = event.request;
    if (req.method !== 'GET') return; // never touch form posts / server actions / payments
    const url = new URL(req.url);

    // Page navigations: network first, offline page if the network is down.
    if (req.mode === 'navigate') {
        event.respondWith(fetch(req).catch(() => caches.match(OFFLINE_URL)));
        return;
    }

    // Static assets: cache first, then network (and store for next time).
    if (isStatic(url)) {
        event.respondWith(
            caches.match(req).then(
                (hit) =>
                    hit ||
                    fetch(req).then((res) => {
                        if (res.ok) {
                            const copy = res.clone();
                            caches.open(STATIC_CACHE).then((c) => c.put(req, copy));
                        }
                        return res;
                    })
            )
        );
    }
});
