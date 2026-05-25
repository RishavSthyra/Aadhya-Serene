const ASSET_CACHE_NAME = 'aadhya-serene-media-v3';
const SERVICE_WORKER_URL = '/asset-cache-sw.js';
const DEFAULT_IDLE_TIMEOUT_MS = 1800;
const DEFAULT_DELAY_MS = 360;

const cachedAssetUrls = new Set();
const failedAssetUrls = new Set();
const pendingAssetFetches = new Map();
const queuedAssetUrls = new Set();
const assetQueue = [];

let activeAssetFetches = 0;
let pumpScheduled = false;
let swRegistrationPromise = null;

function canUseBrowserCache() {
    return typeof window !== 'undefined'
        && typeof caches !== 'undefined'
        && typeof fetch === 'function';
}

function scheduleIdle(callback, { timeout = DEFAULT_IDLE_TIMEOUT_MS, delay = DEFAULT_DELAY_MS } = {}) {
    if (typeof window === 'undefined') {
        return () => {};
    }

    if (typeof window.requestIdleCallback === 'function') {
        const idleId = window.requestIdleCallback(callback, { timeout });
        return () => window.cancelIdleCallback?.(idleId);
    }

    const timeoutId = window.setTimeout(callback, delay);
    return () => window.clearTimeout(timeoutId);
}

export function registerAssetCacheServiceWorker() {
    if (
        typeof window === 'undefined'
        || !('serviceWorker' in navigator)
        || (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost')
    ) {
        return Promise.resolve(null);
    }

    if (!swRegistrationPromise) {
        swRegistrationPromise = navigator.serviceWorker
            .register(SERVICE_WORKER_URL, { scope: '/' })
            .catch(() => null);
    }

    return swRegistrationPromise;
}

function createAssetRequest(url, priority = 'low') {
    try {
        return new Request(url, {
            mode: 'no-cors',
            credentials: 'omit',
            cache: 'force-cache',
            priority,
        });
    } catch {
        return url;
    }
}

export async function cacheAssetOnce(url, options = {}) {
    if (!url || failedAssetUrls.has(url)) {
        return false;
    }

    if (cachedAssetUrls.has(url)) {
        return true;
    }

    const existingFetch = pendingAssetFetches.get(url);
    if (existingFetch) {
        return existingFetch;
    }

    if (!canUseBrowserCache()) {
        return false;
    }

    const { priority = 'low' } = options;
    const fetchPromise = (async () => {
        try {
            await registerAssetCacheServiceWorker();

            const cache = await caches.open(ASSET_CACHE_NAME);
            const request = createAssetRequest(url, priority);
            const cachedResponse = await cache.match(request, { ignoreVary: true });

            if (cachedResponse) {
                cachedAssetUrls.add(url);
                return true;
            }

            const response = await fetch(request);
            if (!response) {
                failedAssetUrls.add(url);
                return false;
            }

            await cache.put(request, response.clone());
            cachedAssetUrls.add(url);
            failedAssetUrls.delete(url);
            return true;
        } catch {
            failedAssetUrls.add(url);
            return false;
        } finally {
            pendingAssetFetches.delete(url);
        }
    })();

    pendingAssetFetches.set(url, fetchPromise);
    return fetchPromise;
}

function pumpAssetQueue() {
    if (pumpScheduled || typeof window === 'undefined') {
        return;
    }

    pumpScheduled = true;
    scheduleIdle(() => {
        pumpScheduled = false;

        const nextJob = assetQueue[0];
        if (!nextJob) {
            return;
        }

        const {
            url,
            concurrency = 1,
            priority = 'low',
            gapMs = DEFAULT_DELAY_MS,
        } = nextJob;

        if (activeAssetFetches >= concurrency) {
            window.setTimeout(pumpAssetQueue, gapMs);
            return;
        }

        assetQueue.shift();
        queuedAssetUrls.delete(url);

        if (cachedAssetUrls.has(url) || pendingAssetFetches.has(url)) {
            pumpAssetQueue();
            return;
        }

        activeAssetFetches += 1;
        cacheAssetOnce(url, { priority })
            .finally(() => {
                activeAssetFetches = Math.max(0, activeAssetFetches - 1);
                window.setTimeout(pumpAssetQueue, gapMs);
            });

        while (activeAssetFetches < concurrency && assetQueue.length > 0) {
            const parallelJob = assetQueue.shift();
            queuedAssetUrls.delete(parallelJob.url);

            if (cachedAssetUrls.has(parallelJob.url) || pendingAssetFetches.has(parallelJob.url)) {
                continue;
            }

            activeAssetFetches += 1;
            cacheAssetOnce(parallelJob.url, { priority: parallelJob.priority ?? priority })
                .finally(() => {
                    activeAssetFetches = Math.max(0, activeAssetFetches - 1);
                    window.setTimeout(pumpAssetQueue, parallelJob.gapMs ?? gapMs);
                });
        }
    }, nextQueueIdleOptions());
}

function nextQueueIdleOptions() {
    const nextJob = assetQueue[0];
    return {
        timeout: nextJob?.idleTimeoutMs ?? DEFAULT_IDLE_TIMEOUT_MS,
        delay: nextJob?.delayMs ?? DEFAULT_DELAY_MS,
    };
}

export function prefetchAssetsInChunks(urls, options = {}) {
    if (typeof window === 'undefined' || !Array.isArray(urls) || urls.length === 0) {
        return;
    }

    const {
        chunkSize = 1,
        concurrency = 1,
        priority = 'low',
        gapMs = DEFAULT_DELAY_MS,
        idleTimeoutMs = DEFAULT_IDLE_TIMEOUT_MS,
        delayMs = DEFAULT_DELAY_MS,
    } = options;

    const uniqueUrls = [...new Set(urls.filter(Boolean))];
    uniqueUrls.forEach((url, index) => {
        if (cachedAssetUrls.has(url) || pendingAssetFetches.has(url) || queuedAssetUrls.has(url)) {
            return;
        }

        queuedAssetUrls.add(url);
        assetQueue.push({
            url,
            concurrency,
            priority,
            gapMs: index > 0 && index % Math.max(1, chunkSize) === 0
                ? gapMs * 2
                : gapMs,
            idleTimeoutMs,
            delayMs,
        });
    });

    pumpAssetQueue();
}

export function markAssetCached(url) {
    if (url) {
        cachedAssetUrls.add(url);
        failedAssetUrls.delete(url);
    }
}

export function isAssetCachePending(url) {
    return pendingAssetFetches.has(url) || queuedAssetUrls.has(url);
}
