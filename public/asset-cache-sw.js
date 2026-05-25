const CACHE_NAME = 'aadhya-serene-media-v3';
const CACHEABLE_HOSTS = new Set([
    'cdn.sthyra.com',
    'du67w5n77drxm.cloudfront.net',
    'aadhya-serene-assets-v2.s3.amazonaws.com',
]);
const CACHEABLE_PATH_PARTS = [
    '/AADHYA%20SERENE/videos/',
    '/AADHYA%20SERENE/images/rot360_webp/',
    '/AADHYA%20SERENE/renders',
    '/videos/amenities/',
    '/videos/flats/',
    '/assets/background-video/',
];

self.addEventListener('install', (event) => {
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(self.clients.claim());
});

function isCacheableMediaRequest(request) {
    if (request.method !== 'GET') {
        return false;
    }

    const url = new URL(request.url);
    const isKnownHost = CACHEABLE_HOSTS.has(url.hostname) || url.origin === self.location.origin;
    if (!isKnownHost) {
        return false;
    }

    return CACHEABLE_PATH_PARTS.some((part) => url.pathname.includes(part));
}

self.addEventListener('fetch', (event) => {
    const { request } = event;

    if (!isCacheableMediaRequest(request)) {
        return;
    }

    if (request.headers.has('range')) {
        event.respondWith(fetch(request));
        return;
    }

    event.respondWith((async () => {
        const cache = await caches.open(CACHE_NAME);
        const cachedResponse = await cache.match(request, { ignoreVary: true });

        if (cachedResponse) {
            return cachedResponse;
        }

        const response = await fetch(request);
        if (response && (response.ok || response.type === 'opaque')) {
            cache.put(request, response.clone()).catch(() => {});
        }

        return response;
    })());
});
