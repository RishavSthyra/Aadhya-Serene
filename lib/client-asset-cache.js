const ASSET_CACHE_NAME = 'aadhya-serene-media-v4';
const SERVICE_WORKER_URL = '/asset-cache-sw.js';
const DEFAULT_IDLE_TIMEOUT_MS = 1800;
const DEFAULT_DELAY_MS = 360;

const cachedAssetUrls = new Set();
const failedAssetUrls = new Set();
const pendingAssetFetches = new Map();
const queuedAssetUrls = new Set();
const assetQueue = [];
const pooledVideoWarmups = new Map();

let activeAssetFetches = 0;
let pumpScheduled = false;
let swRegistrationPromise = null;

const MAX_POOLED_VIDEO_WARMUPS = 6;
const VIDEO_READY_STATE_BY_EVENT = {
    loadedmetadata: 1,
    loadeddata: 2,
    canplay: 3,
    canplaythrough: 4,
};

function isVideoAssetUrl(url) {
    if (!url || typeof url !== 'string') {
        return false;
    }

    try {
        const parsedUrl = new URL(url, typeof window !== 'undefined' ? window.location.href : 'http://localhost');
        return /\.(mp4|webm|m3u8|mov)(?:$|\?)/i.test(parsedUrl.pathname);
    } catch {
        return /\.(mp4|webm|m3u8|mov)(?:$|\?)/i.test(url);
    }
}

function canUseBrowserCache() {
    return typeof window !== 'undefined'
        && typeof caches !== 'undefined'
        && typeof fetch === 'function';
}

function canWarmVideoInBrowser() {
    return typeof window !== 'undefined'
        && typeof document !== 'undefined'
        && typeof HTMLVideoElement !== 'undefined';
}

function touchPooledVideoWarmup(url) {
    const existingVideo = pooledVideoWarmups.get(url);
    if (!existingVideo) {
        return;
    }

    pooledVideoWarmups.delete(url);
    pooledVideoWarmups.set(url, existingVideo);
}

function trimPooledVideoWarmups() {
    while (pooledVideoWarmups.size > MAX_POOLED_VIDEO_WARMUPS) {
        const oldestEntry = pooledVideoWarmups.entries().next().value;
        if (!oldestEntry) {
            return;
        }

        const [oldestUrl, oldestVideo] = oldestEntry;
        oldestVideo.pause?.();
        oldestVideo.removeAttribute?.('src');
        oldestVideo.load?.();
        pooledVideoWarmups.delete(oldestUrl);
    }
}

function createVideoWarmup(url) {
    const video = document.createElement('video');
    video.muted = true;
    video.defaultMuted = true;
    video.playsInline = true;
    video.autoplay = false;
    video.controls = false;
    video.disablePictureInPicture = true;
    video.setAttribute('muted', '');
    video.setAttribute('playsinline', '');
    video.setAttribute('webkit-playsinline', 'true');
    video.setAttribute('disablepictureinpicture', '');
    video.setAttribute('controlslist', 'nodownload noplaybackrate noremoteplayback nofullscreen');
    pooledVideoWarmups.set(url, video);
    trimPooledVideoWarmups();
    return video;
}

function getVideoWarmOptions(options = {}) {
    const priority = options.priority ?? 'low';
    const videoPreload = options.videoPreload ?? (priority === 'high' ? 'auto' : 'metadata');
    const videoReadyEvent = options.videoReadyEvent ?? (videoPreload === 'auto' ? 'loadeddata' : 'loadedmetadata');
    const timeoutMs = options.timeoutMs ?? (priority === 'high' ? 9000 : 5000);

    return {
        priority,
        videoPreload,
        videoReadyEvent,
        timeoutMs,
    };
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

function schedulePrefetchWork(callback, nextJob) {
    if (typeof window === 'undefined') {
        return () => {};
    }

    if (nextJob?.immediate || nextJob?.priority === 'high') {
        const timeoutId = window.setTimeout(callback, nextJob?.delayMs ?? 0);
        return () => window.clearTimeout(timeoutId);
    }

    return scheduleIdle(callback, {
        timeout: nextJob?.idleTimeoutMs ?? DEFAULT_IDLE_TIMEOUT_MS,
        delay: nextJob?.delayMs ?? DEFAULT_DELAY_MS,
    });
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

function warmVideoAsset(url, options = {}) {
    if (!url) {
        return Promise.resolve(false);
    }

    if (cachedAssetUrls.has(url)) {
        touchPooledVideoWarmup(url);
        return Promise.resolve(true);
    }

    const existingFetch = pendingAssetFetches.get(url);
    if (existingFetch) {
        return existingFetch;
    }

    if (!canWarmVideoInBrowser()) {
        return Promise.resolve(false);
    }

    const {
        priority,
        videoPreload,
        videoReadyEvent,
        timeoutMs,
    } = getVideoWarmOptions(options);

    const minimumReadyState = VIDEO_READY_STATE_BY_EVENT[videoReadyEvent] ?? 1;
    const video = pooledVideoWarmups.get(url) ?? createVideoWarmup(url);

    const warmPromise = new Promise((resolve) => {
        let settled = false;
        let timeoutId = 0;

        const cleanup = () => {
            video.removeEventListener('loadedmetadata', handleReady);
            video.removeEventListener('loadeddata', handleReady);
            video.removeEventListener('canplay', handleReady);
            video.removeEventListener('canplaythrough', handleReady);
            video.removeEventListener('error', handleError);
            window.clearTimeout(timeoutId);
        };

        const finish = (didWarm) => {
            if (settled) {
                return;
            }

            settled = true;
            cleanup();

            if (didWarm) {
                cachedAssetUrls.add(url);
                failedAssetUrls.delete(url);
                touchPooledVideoWarmup(url);
            } else {
                failedAssetUrls.add(url);
            }

            pendingAssetFetches.delete(url);
            resolve(didWarm);
        };

        const handleReady = () => {
            if (video.readyState >= minimumReadyState) {
                finish(true);
            }
        };

        const handleError = () => {
            finish(false);
        };

        video.addEventListener('loadedmetadata', handleReady);
        video.addEventListener('loadeddata', handleReady);
        video.addEventListener('canplay', handleReady);
        video.addEventListener('canplaythrough', handleReady);
        video.addEventListener('error', handleError);

        timeoutId = window.setTimeout(() => {
            finish(video.readyState >= minimumReadyState);
        }, timeoutMs);

        try {
            video.preload = videoPreload;
            video.setAttribute('fetchpriority', priority);

            if (video.src !== url) {
                video.src = url;
            }

            video.load();
            handleReady();
        } catch {
            finish(false);
        }
    });

    pendingAssetFetches.set(url, warmPromise);
    return warmPromise;
}

function getQueueAssetOptions(job, fallbackPriority = 'low') {
    return {
        priority: job?.priority ?? fallbackPriority,
        immediate: job?.immediate ?? false,
        videoPreload: job?.videoPreload,
        videoReadyEvent: job?.videoReadyEvent,
        timeoutMs: job?.timeoutMs,
    };
}

export async function cacheAssetOnce(url, options = {}) {
    if (!url) {
        return false;
    }

    if (isVideoAssetUrl(url)) {
        return warmVideoAsset(url, options);
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
    const nextJob = assetQueue[0];
    schedulePrefetchWork(() => {
        pumpScheduled = false;

        const currentJob = assetQueue[0];
        if (!currentJob) {
            return;
        }

        const {
            url,
            concurrency = 1,
            priority = 'low',
            gapMs = DEFAULT_DELAY_MS,
        } = currentJob;

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
        cacheAssetOnce(url, getQueueAssetOptions(currentJob, priority))
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
            cacheAssetOnce(parallelJob.url, getQueueAssetOptions(parallelJob, priority))
                .finally(() => {
                    activeAssetFetches = Math.max(0, activeAssetFetches - 1);
                    window.setTimeout(pumpAssetQueue, parallelJob.gapMs ?? gapMs);
                });
        }
    }, nextJob);
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
        immediate = false,
        videoPreload,
        videoReadyEvent,
        timeoutMs,
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
            immediate,
            gapMs: index > 0 && index % Math.max(1, chunkSize) === 0
                ? gapMs * 2
                : gapMs,
            idleTimeoutMs,
            delayMs,
            videoPreload,
            videoReadyEvent,
            timeoutMs,
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
