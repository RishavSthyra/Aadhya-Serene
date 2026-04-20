'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import BuildingModel from './BuildingModel';
import styles from './viewer.module.css';
import { flatViewKeyFromFrame } from '../../lib/flats';

const TOTAL_FRAMES = 360;
const SNAP_POINTS = [1, 90, 180, 270, 360];
const ROT360_CDN_BASE = 'https://cdn.sthyra.com/AADHYA%20SERENE/images/rot360_webp';
//https://cdn.sthyra.com/AADHYA%20SERENE/images/rot360_compressed/frame_0001.avif
//https://cdn.sthyra.com/AADHYA%20SERENE/images/rot360_webp/frame_0001.webp
const ROT360_FRAME_EXTENSION = ROT360_CDN_BASE.includes('webp') ? 'webp' : 'avif';
const DRAG_FRAME_STEP = 1;
const MOBILE_DRAG_FRAME_STEP = 2;
const PRELOAD_RADIUS = 12;
const PRELOAD_CONCURRENCY = 6;
const MAX_CACHE_SIZE = 56;
const DRAG_SENSITIVITY = 0.36;
const MOBILE_PRELOAD_RADIUS = 4;
const MOBILE_PRELOAD_CONCURRENCY = 2;
const MOBILE_MAX_CACHE_SIZE = 16;
const MOBILE_DPR_CAP = 1;
const DESKTOP_DPR_CAP = 1.6;
const MIN_ZOOM = 1;
const MAX_ZOOM = 2.25;
const DRAG_START_THRESHOLD = 8;
const SNAP_ANIMATION_DURATION_MS = 260;
const MOBILE_SNAP_ANIMATION_DURATION_MS = 200;
const DRAG_PRELOAD_RADIUS = 3;
const MOBILE_DRAG_PRELOAD_RADIUS = 1;
const DRAG_PRELOAD_STRIDE = 5;
const MOBILE_DRAG_PRELOAD_STRIDE = 10;
const INITIAL_WARMUP_RADIUS = 10;
const MOBILE_INITIAL_WARMUP_RADIUS = 4;
const INITIAL_WARMUP_CONCURRENCY = 3;
const MOBILE_INITIAL_WARMUP_CONCURRENCY = 1;
const INITIAL_WARMUP_DELAY_MS = 180;
const MOBILE_INITIAL_WARMUP_DELAY_MS = 420;
const INITIAL_WARMUP_TIMEOUT_MS = 800;
const MOBILE_INITIAL_WARMUP_TIMEOUT_MS = 1200;
const INITIAL_WARMUP_SNAP_RADIUS = 1;
const INITIAL_INTERACTION_PRIME_RADIUS = 14;
const MOBILE_INITIAL_INTERACTION_PRIME_RADIUS = 6;
const INITIAL_INTERACTION_PRIME_CONCURRENCY = 5;
const MOBILE_INITIAL_INTERACTION_PRIME_CONCURRENCY = 2;
const warmedStartupFrames = new Set();
const warmedStartupImages = new Map();
const startupWarmPromises = new Map();
let startupWarmQueue = [];
let startupWarmActiveLoads = 0;
let startupWarmIdleHandle = null;
let startupWarmTimeoutHandle = null;
let startupWarmRunId = 0;

function getFrameUrl(frameNumber) {
    return `${ROT360_CDN_BASE}/frame_${String(frameNumber).padStart(4, '0')}.${ROT360_FRAME_EXTENSION}`;
}

function normalizeFrame(frameNumber) {
    return ((Math.round(frameNumber) - 1 + TOTAL_FRAMES * 10) % TOTAL_FRAMES) + 1;
}

function quantizeFrame(frameNumber, step) {
    const zeroIndexed = ((Math.round(frameNumber) - 1) % TOTAL_FRAMES + TOTAL_FRAMES) % TOTAL_FRAMES;
    return ((Math.round(zeroIndexed / step) * step) % TOTAL_FRAMES) + 1;
}

function getCircularFrameDistance(fromFrame, toFrame) {
    const forwardDistance = Math.abs(normalizeFrame(fromFrame) - normalizeFrame(toFrame));
    return Math.min(forwardDistance, TOTAL_FRAMES - forwardDistance);
}

function getPreloadSequence(centerFrame, radius) {
    const normalizedCenter = normalizeFrame(centerFrame);
    const orderedFrames = [normalizedCenter];
    const seen = new Set(orderedFrames);

    for (let offset = 1; offset <= radius; offset += 1) {
        const nextFrame = normalizeFrame(normalizedCenter + offset);
        const previousFrame = normalizeFrame(normalizedCenter - offset);

        if (!seen.has(nextFrame)) {
            orderedFrames.push(nextFrame);
            seen.add(nextFrame);
        }

        if (!seen.has(previousFrame)) {
            orderedFrames.push(previousFrame);
            seen.add(previousFrame);
        }
    }

    return orderedFrames;
}

function getStartupWarmSequence(isConstrainedDevice) {
    const radius = isConstrainedDevice ? MOBILE_INITIAL_WARMUP_RADIUS : INITIAL_WARMUP_RADIUS;
    const orderedFrames = getPreloadSequence(1, radius);
    const seen = new Set(orderedFrames);

    SNAP_POINTS.slice(0, -1).forEach((snapFrame) => {
        getPreloadSequence(snapFrame, INITIAL_WARMUP_SNAP_RADIUS).forEach((frameNumber) => {
            if (!seen.has(frameNumber)) {
                seen.add(frameNumber);
                orderedFrames.push(frameNumber);
            }
        });
    });

    return orderedFrames;
}

function clearStartupWarmSchedule() {
    if (typeof window === 'undefined') {
        return;
    }

    if (startupWarmIdleHandle !== null && typeof window.cancelIdleCallback === 'function') {
        window.cancelIdleCallback(startupWarmIdleHandle);
    }

    if (startupWarmTimeoutHandle !== null) {
        window.clearTimeout(startupWarmTimeoutHandle);
    }

    startupWarmIdleHandle = null;
    startupWarmTimeoutHandle = null;
}

function warmStartupFrame(frameNumber, timeoutMs) {
    if (typeof window === 'undefined') {
        return Promise.resolve(false);
    }

    const normalizedFrame = normalizeFrame(frameNumber);
    if (warmedStartupFrames.has(normalizedFrame)) {
        return Promise.resolve(true);
    }

    const existingPromise = startupWarmPromises.get(normalizedFrame);
    if (existingPromise) {
        return existingPromise;
    }

    const warmPromise = new Promise((resolve) => {
        const image = new window.Image();
        let settled = false;

        const finish = (result) => {
            if (settled) return;
            settled = true;
            startupWarmPromises.delete(normalizedFrame);
            if (result) {
                warmedStartupFrames.add(normalizedFrame);
            }
            resolve(result);
        };

        const timeoutId = window.setTimeout(() => finish(false), timeoutMs);

        image.decoding = 'async';
        image.fetchPriority = normalizedFrame === 1 ? 'high' : 'low';
        image.onload = () => {
            window.clearTimeout(timeoutId);
            warmedStartupImages.set(normalizedFrame, image);
            finish(true);
        };
        image.onerror = () => {
            window.clearTimeout(timeoutId);
            finish(false);
        };
        image.src = getFrameUrl(normalizedFrame);
    });

    startupWarmPromises.set(normalizedFrame, warmPromise);
    return warmPromise;
}

function getInteractionPrimeSequence(isConstrainedDevice) {
    return getPreloadSequence(
        1,
        isConstrainedDevice ? MOBILE_INITIAL_INTERACTION_PRIME_RADIUS : INITIAL_INTERACTION_PRIME_RADIUS,
    );
}

async function warmFramesWithConcurrency(frameNumbers, { concurrency, timeoutMs }) {
    const queue = [...new Set(frameNumbers.map((frameNumber) => normalizeFrame(frameNumber)))];
    let index = 0;

    const workers = Array.from({ length: Math.max(1, concurrency) }, async () => {
        while (index < queue.length) {
            const nextIndex = index;
            index += 1;
            await warmStartupFrame(queue[nextIndex], timeoutMs);
        }
    });

    await Promise.all(workers);
}

function pumpStartupWarmQueue(runId, options) {
    if (typeof window === 'undefined' || runId !== startupWarmRunId) {
        return;
    }

    const { concurrency, timeoutMs } = options;

    while (startupWarmActiveLoads < concurrency && startupWarmQueue.length > 0) {
        const nextFrame = startupWarmQueue.shift();

        if (nextFrame == null || warmedStartupFrames.has(nextFrame)) {
            continue;
        }

        startupWarmActiveLoads += 1;

        warmStartupFrame(nextFrame, timeoutMs)
            .finally(() => {
                startupWarmActiveLoads = Math.max(0, startupWarmActiveLoads - 1);

                if (runId !== startupWarmRunId) {
                    return;
                }

                if (startupWarmQueue.length > 0) {
                    pumpStartupWarmQueue(runId, options);
                }
            });
    }
}

export function scheduleApartment360FrameWarmup({ isConstrainedDevice = false } = {}) {
    if (typeof window === 'undefined') {
        return () => {};
    }

    const queue = getStartupWarmSequence(isConstrainedDevice)
        .filter((frameNumber) => !warmedStartupFrames.has(frameNumber));

    if (!queue.length) {
        return () => {};
    }

    startupWarmRunId += 1;
    const runId = startupWarmRunId;
    startupWarmQueue = queue;

    const options = {
        concurrency: isConstrainedDevice ? MOBILE_INITIAL_WARMUP_CONCURRENCY : INITIAL_WARMUP_CONCURRENCY,
        delayMs: isConstrainedDevice ? MOBILE_INITIAL_WARMUP_DELAY_MS : INITIAL_WARMUP_DELAY_MS,
        timeoutMs: isConstrainedDevice ? MOBILE_INITIAL_WARMUP_TIMEOUT_MS : INITIAL_WARMUP_TIMEOUT_MS,
    };

    clearStartupWarmSchedule();

    const startWarmup = () => {
        startupWarmIdleHandle = null;
        startupWarmTimeoutHandle = null;
        pumpStartupWarmQueue(runId, options);
    };

    if (typeof window.requestIdleCallback === 'function') {
        startupWarmIdleHandle = window.requestIdleCallback(startWarmup, {
            timeout: options.timeoutMs,
        });
    } else {
        startupWarmTimeoutHandle = window.setTimeout(startWarmup, options.delayMs);
    }

    return () => {
        if (startupWarmRunId !== runId) {
            return;
        }

        startupWarmRunId += 1;
        startupWarmQueue = [];
        clearStartupWarmSchedule();
    };
}

function clampZoom(value) {
    return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, value));
}

function getPointerDistance(points) {
    if (points.length < 2) return 0;

    const [firstPoint, secondPoint] = points;
    return Math.hypot(secondPoint.x - firstPoint.x, secondPoint.y - firstPoint.y);
}

export default function Apartment360Viewer({
    onFlatClick,
    onFlatHoverStart,
    filteredFlatIds,
    onReadyChange,
    interactionLocked = false,
}) {
    const [snappedFrame, setSnappedFrame] = useState(1);
    const [isSettled, setIsSettled] = useState(true);
    const [isDraggingState, setIsDraggingState] = useState(false);
    const [isConstrainedDevice, setIsConstrainedDevice] = useState(false);
    const [zoom, setZoom] = useState(MIN_ZOOM);
    const [isStartupPrimed, setIsStartupPrimed] = useState(false);

    const canvasRef = useRef(null);
    const canvasContextRef = useRef(null);
    const mountedRef = useRef(false);
    const isDragging = useRef(false);
    const didDragRef = useRef(false);
    const suppressFlatClickUntilRef = useRef(0);
    const startX = useRef(0);
    const lastFrame = useRef(1);
    const targetFrameRef = useRef(1);
    const latestRequestedFrameRef = useRef(1);
    const loadedFramesRef = useRef(new Set());
    const failedFramesRef = useRef(new Set());
    const imageCacheRef = useRef(new Map());
    const loadingPromisesRef = useRef(new Map());
    const queuedFramesRef = useRef([]);
    const activeLoadsRef = useRef(0);
    const pendingFrameRef = useRef(1);
    const currentFrameRef = useRef(1);
    const displayFrameRef = useRef(1);
    const publishRafRef = useRef(null);
    const drawRafRef = useRef(null);
    const snapAnimationRafRef = useRef(null);
    const lastDrawnFrameRef = useRef(null);
    const hasAnnouncedReadyRef = useRef(false);
    const activePointersRef = useRef(new Map());
    const lastPinchDistanceRef = useRef(null);
    const pendingPublishOptionsRef = useRef({ preload: true, preloadRadius: PRELOAD_RADIUS });
    const lastDragPreloadedFrameRef = useRef(1);
    const startY = useRef(0);
    const dragFrameStep = isConstrainedDevice ? MOBILE_DRAG_FRAME_STEP : DRAG_FRAME_STEP;
    const preloadRadius = isConstrainedDevice ? MOBILE_PRELOAD_RADIUS : PRELOAD_RADIUS;
    const preloadConcurrency = isConstrainedDevice ? MOBILE_PRELOAD_CONCURRENCY : PRELOAD_CONCURRENCY;
    const maxCacheSize = isConstrainedDevice ? MOBILE_MAX_CACHE_SIZE : MAX_CACHE_SIZE;
    const devicePixelRatioCap = isConstrainedDevice ? MOBILE_DPR_CAP : DESKTOP_DPR_CAP;
    const dragPreloadRadius = isConstrainedDevice ? MOBILE_DRAG_PRELOAD_RADIUS : DRAG_PRELOAD_RADIUS;
    const dragPreloadStride = isConstrainedDevice ? MOBILE_DRAG_PRELOAD_STRIDE : DRAG_PRELOAD_STRIDE;
    const snapAnimationDuration = isConstrainedDevice ? MOBILE_SNAP_ANIMATION_DURATION_MS : SNAP_ANIMATION_DURATION_MS;
    const viewerInteractionLocked = interactionLocked || !isStartupPrimed;

    const hydrateWarmFrame = useCallback((frameNumber) => {
        const normalizedFrame = normalizeFrame(frameNumber);
        const warmedImage = warmedStartupImages.get(normalizedFrame);

        if (!warmedImage) {
            return false;
        }

        imageCacheRef.current.delete(normalizedFrame);
        imageCacheRef.current.set(normalizedFrame, warmedImage);
        loadedFramesRef.current.add(normalizedFrame);
        failedFramesRef.current.delete(normalizedFrame);
        return true;
    }, []);

    useEffect(() => {
        if (typeof window === 'undefined') {
            return undefined;
        }

        const compactMedia = window.matchMedia('(max-width: 1024px), (pointer: coarse)');
        const reducedMotionMedia = window.matchMedia('(prefers-reduced-motion: reduce)');
        const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;

        const updateProfile = () => {
            const hasSlowConnection = connection?.saveData
                || /(^|slow-)?2g|3g/.test(connection?.effectiveType ?? '');

            setIsConstrainedDevice(
                compactMedia.matches || reducedMotionMedia.matches || hasSlowConnection
            );
        };

        updateProfile();
        compactMedia.addEventListener('change', updateProfile);
        reducedMotionMedia.addEventListener('change', updateProfile);
        connection?.addEventListener?.('change', updateProfile);

        return () => {
            compactMedia.removeEventListener('change', updateProfile);
            reducedMotionMedia.removeEventListener('change', updateProfile);
            connection?.removeEventListener?.('change', updateProfile);
        };
    }, []);

    const syncCanvasSize = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) {
            return null;
        }

        const bounds = canvas.getBoundingClientRect();
        if (!bounds.width || !bounds.height) {
            return null;
        }

        const dpr = typeof window === 'undefined'
            ? 1
            : Math.min(window.devicePixelRatio || 1, devicePixelRatioCap);
        const targetWidth = Math.round(bounds.width * dpr);
        const targetHeight = Math.round(bounds.height * dpr);

        if (canvas.width !== targetWidth || canvas.height !== targetHeight) {
            canvas.width = targetWidth;
            canvas.height = targetHeight;
            canvasContextRef.current = null;
        }

        return { bounds, dpr };
    }, [devicePixelRatioCap]);

    const cancelSnapAnimation = useCallback(() => {
        if (snapAnimationRafRef.current === null || typeof window === 'undefined') {
            return;
        }

        window.cancelAnimationFrame(snapAnimationRafRef.current);
        snapAnimationRafRef.current = null;
    }, []);

    const drawFrame = useCallback((frameNumber) => {
        if (typeof window === 'undefined') {
            return;
        }

        const canvas = canvasRef.current;
        const image = imageCacheRef.current.get(frameNumber);
        if (!canvas || !image) {
            return;
        }

        if (drawRafRef.current !== null) {
            window.cancelAnimationFrame(drawRafRef.current);
        }

        drawRafRef.current = window.requestAnimationFrame(() => {
            drawRafRef.current = null;

            const size = syncCanvasSize();
            if (!size) {
                return;
            }

            const context = canvasContextRef.current
                ?? canvas.getContext('2d', { alpha: false, desynchronized: true });
            if (!context) {
                return;
            }
            canvasContextRef.current = context;

            const { bounds, dpr } = size;
            const canvasWidth = bounds.width * dpr;
            const canvasHeight = bounds.height * dpr;
            const imageRatio = image.naturalWidth / image.naturalHeight;
            const canvasRatio = bounds.width / bounds.height;

            // Use "cover" sizing so the 360 frames always fill the full viewport
            // without left/right or top/bottom black gaps on larger screens.
            let drawWidth = canvasWidth;
            let drawHeight = canvasWidth / imageRatio;

            if (drawHeight < canvasHeight) {
                drawHeight = canvasHeight;
                drawWidth = canvasHeight * imageRatio;
            }

            const drawX = (canvasWidth - drawWidth) / 2;
            const drawY = (canvasHeight - drawHeight) / 2;

            context.fillStyle = '#0b1018';
            context.fillRect(0, 0, canvasWidth, canvasHeight);
            context.imageSmoothingEnabled = true;
            context.imageSmoothingQuality = canvasRatio > imageRatio ? 'high' : 'medium';
            context.drawImage(image, drawX, drawY, drawWidth, drawHeight);
            lastDrawnFrameRef.current = frameNumber;

            if (!hasAnnouncedReadyRef.current) {
                hasAnnouncedReadyRef.current = true;
                onReadyChange?.(true);
            }
        });
    }, [onReadyChange, syncCanvasSize]);

    const redrawBestAvailableFrame = useCallback(() => {
        const displayFrame = displayFrameRef.current;
        const fallbackFrame = imageCacheRef.current.get(displayFrame)?.complete
            ? displayFrame
            : lastDrawnFrameRef.current;

        if (fallbackFrame) {
            drawFrame(fallbackFrame);
        }
    }, [drawFrame]);

    const trimCache = useCallback(() => {
        const pinnedFrames = new Set([
            displayFrameRef.current,
            latestRequestedFrameRef.current,
            ...getPreloadSequence(latestRequestedFrameRef.current, preloadRadius),
        ]);

        for (const frameNumber of imageCacheRef.current.keys()) {
            if (imageCacheRef.current.size <= maxCacheSize) {
                break;
            }

            if (pinnedFrames.has(frameNumber)) {
                continue;
            }

            imageCacheRef.current.delete(frameNumber);
            loadedFramesRef.current.delete(frameNumber);
        }
    }, [maxCacheSize, preloadRadius]);

    const pumpPreloadQueue = useCallback(() => {
        if (typeof window === 'undefined') {
            return;
        }

        while (activeLoadsRef.current < preloadConcurrency && queuedFramesRef.current.length > 0) {
            const nextFrame = queuedFramesRef.current.shift();

            if (
                nextFrame == null
                || loadedFramesRef.current.has(nextFrame)
                || failedFramesRef.current.has(nextFrame)
                || loadingPromisesRef.current.has(nextFrame)
            ) {
                continue;
            }

            if (hydrateWarmFrame(nextFrame)) {
                trimCache();

                if (latestRequestedFrameRef.current === nextFrame) {
                    displayFrameRef.current = nextFrame;
                    drawFrame(nextFrame);
                }

                continue;
            }

            activeLoadsRef.current += 1;

            const promise = new Promise((resolve, reject) => {
                const image = new window.Image();
                image.decoding = 'async';
                image.fetchPriority = nextFrame === latestRequestedFrameRef.current ? 'high' : 'low';

                image.onload = () => resolve(image);
                image.onerror = () => reject(new Error(`Failed to load frame ${nextFrame}`));
                image.src = getFrameUrl(nextFrame);
            })
                .then((image) => {
                    imageCacheRef.current.delete(nextFrame);
                    imageCacheRef.current.set(nextFrame, image);
                    loadedFramesRef.current.add(nextFrame);
                    failedFramesRef.current.delete(nextFrame);
                    trimCache();

                    if (latestRequestedFrameRef.current === nextFrame) {
                        displayFrameRef.current = nextFrame;
                        drawFrame(nextFrame);
                    }
                })
                .catch(() => {
                    failedFramesRef.current.add(nextFrame);
                })
                .finally(() => {
                    loadingPromisesRef.current.delete(nextFrame);
                    activeLoadsRef.current = Math.max(0, activeLoadsRef.current - 1);
                    pumpPreloadQueue();
                });

            loadingPromisesRef.current.set(nextFrame, promise);
        }
    }, [drawFrame, hydrateWarmFrame, preloadConcurrency, trimCache]);

    const enqueueFrames = useCallback((frameNumbers) => {
        const normalizedFrames = frameNumbers.map((frameNumber) => normalizeFrame(frameNumber));
        const remainingQueue = queuedFramesRef.current.filter((frameNumber) => !normalizedFrames.includes(frameNumber));

        queuedFramesRef.current = [
            ...normalizedFrames.filter((frameNumber) => (
                !loadedFramesRef.current.has(frameNumber)
                && !failedFramesRef.current.has(frameNumber)
                && !loadingPromisesRef.current.has(frameNumber)
            )),
            ...remainingQueue,
        ];

        pumpPreloadQueue();
    }, [pumpPreloadQueue]);

    const ensureFrameLoaded = useCallback((frameNumber) => {
        const normalizedFrame = normalizeFrame(frameNumber);

        if (loadedFramesRef.current.has(normalizedFrame) || failedFramesRef.current.has(normalizedFrame)) {
            return;
        }

        if (hydrateWarmFrame(normalizedFrame)) {
            return;
        }

        enqueueFrames([normalizedFrame]);
    }, [enqueueFrames, hydrateWarmFrame]);

    const preloadAroundFrame = useCallback((frameNumber, radius = preloadRadius) => {
        enqueueFrames(getPreloadSequence(frameNumber, radius));
    }, [enqueueFrames, preloadRadius]);

    const requestFrame = useCallback((frameNumber, options = {}) => {
        const normalizedFrame = normalizeFrame(frameNumber);
        const shouldPreload = options.preload ?? true;
        const preloadRadiusOverride = options.preloadRadius ?? preloadRadius;

        if (
            latestRequestedFrameRef.current === normalizedFrame
            && (
                loadedFramesRef.current.has(normalizedFrame)
                || loadingPromisesRef.current.has(normalizedFrame)
            )
        ) {
            return;
        }

        currentFrameRef.current = normalizedFrame;
        latestRequestedFrameRef.current = normalizedFrame;

        if (loadedFramesRef.current.has(normalizedFrame)) {
            displayFrameRef.current = normalizedFrame;
            drawFrame(normalizedFrame);
        } else if (!failedFramesRef.current.has(normalizedFrame)) {
            ensureFrameLoaded(normalizedFrame);
        }

        if (shouldPreload) {
            preloadAroundFrame(normalizedFrame, preloadRadiusOverride);
        }
    }, [drawFrame, ensureFrameLoaded, preloadAroundFrame, preloadRadius]);

    const publishFrame = useCallback((frameNumber, options = {}) => {
        pendingFrameRef.current = normalizeFrame(frameNumber);
        pendingPublishOptionsRef.current = {
            preload: options.preload ?? true,
            preloadRadius: options.preloadRadius ?? preloadRadius,
        };

        if (publishRafRef.current !== null || typeof window === 'undefined') {
            return;
        }

        publishRafRef.current = window.requestAnimationFrame(() => {
            publishRafRef.current = null;
            requestFrame(pendingFrameRef.current, pendingPublishOptionsRef.current);
        });
    }, [preloadRadius, requestFrame]);

    const animateToFrame = useCallback((fromFrame, toFrame, finalSnapPoint) => {
        if (typeof window === 'undefined') {
            publishFrame(toFrame);
            setIsSettled(true);
            setSnappedFrame(finalSnapPoint);
            return;
        }

        cancelSnapAnimation();

        const startTime = window.performance.now();
        const runAnimation = (now) => {
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / snapAnimationDuration, 1);
            const eased = 1 - ((1 - progress) ** 3);
            const interpolatedFrame = fromFrame + ((toFrame - fromFrame) * eased);

            publishFrame(interpolatedFrame, {
                preload: true,
                preloadRadius: preloadRadius,
            });

            if (progress < 1) {
                snapAnimationRafRef.current = window.requestAnimationFrame(runAnimation);
                return;
            }

            snapAnimationRafRef.current = null;
            publishFrame(toFrame, {
                preload: true,
                preloadRadius: preloadRadius,
            });
            setIsSettled(true);
            setSnappedFrame(finalSnapPoint);
        };

        snapAnimationRafRef.current = window.requestAnimationFrame(runAnimation);
    }, [cancelSnapAnimation, preloadRadius, publishFrame, snapAnimationDuration]);

    useEffect(() => {
        trimCache();
    }, [maxCacheSize, preloadRadius, trimCache]);

    useEffect(() => {
        requestFrame(1);
    }, [requestFrame]);

    useEffect(() => {
        let cancelled = false;

        const primeInitialInteraction = async () => {
            const criticalFrames = getInteractionPrimeSequence(isConstrainedDevice);

            await warmFramesWithConcurrency(criticalFrames, {
                concurrency: isConstrainedDevice
                    ? MOBILE_INITIAL_INTERACTION_PRIME_CONCURRENCY
                    : INITIAL_INTERACTION_PRIME_CONCURRENCY,
                timeoutMs: isConstrainedDevice
                    ? MOBILE_INITIAL_WARMUP_TIMEOUT_MS
                    : INITIAL_WARMUP_TIMEOUT_MS,
            });

            if (cancelled) {
                return;
            }

            criticalFrames.forEach((frameNumber) => {
                hydrateWarmFrame(frameNumber);
            });

            trimCache();
            requestFrame(currentFrameRef.current, {
                preload: true,
                preloadRadius: preloadRadius,
            });
            setIsStartupPrimed(true);
        };

        setIsStartupPrimed(false);
        void primeInitialInteraction();

        return () => {
            cancelled = true;
        };
    }, [hydrateWarmFrame, isConstrainedDevice, preloadRadius, requestFrame, trimCache]);

    useEffect(() => {
        const snapFrameSet = new Set();

        SNAP_POINTS.slice(0, -1).forEach((frame) => {
            getPreloadSequence(frame, Math.min(2, preloadRadius)).forEach((value) => {
                snapFrameSet.add(value);
            });
        });

        enqueueFrames([...snapFrameSet]);
    }, [enqueueFrames, preloadRadius]);

    useEffect(() => {
        mountedRef.current = true;

        return () => {
            mountedRef.current = false;
            hasAnnouncedReadyRef.current = false;
            onReadyChange?.(false);
        };
    }, [onReadyChange]);

    useEffect(() => {
        return () => {
            if (publishRafRef.current !== null && typeof window !== 'undefined') {
                window.cancelAnimationFrame(publishRafRef.current);
            }

            if (drawRafRef.current !== null && typeof window !== 'undefined') {
                window.cancelAnimationFrame(drawRafRef.current);
            }

            cancelSnapAnimation();
        };
    }, [cancelSnapAnimation]);

    const handlePointerDown = (e) => {
        if (viewerInteractionLocked) {
            return;
        }

        activePointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

        if (activePointersRef.current.size === 2) {
            lastPinchDistanceRef.current = getPointerDistance([...activePointersRef.current.values()]);
            isDragging.current = false;
            setIsDraggingState(false);
            return;
        }

        if (activePointersRef.current.size > 1) {
            return;
        }

        isDragging.current = false;
        didDragRef.current = false;
        cancelSnapAnimation();
        startX.current = e.clientX;
        startY.current = e.clientY;
        lastFrame.current = currentFrameRef.current;
        lastDragPreloadedFrameRef.current = currentFrameRef.current;
    };

    const handlePointerMove = (e) => {
        if (viewerInteractionLocked) return;
        if (!activePointersRef.current.has(e.pointerId)) return;

        activePointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

        if (activePointersRef.current.size === 2) {
            const nextDistance = getPointerDistance([...activePointersRef.current.values()]);

            if (lastPinchDistanceRef.current) {
                const zoomRatio = nextDistance / lastPinchDistanceRef.current;
                setZoom((currentZoom) => clampZoom(currentZoom * zoomRatio));
            }

            lastPinchDistanceRef.current = nextDistance;

            if (isDragging.current) {
                isDragging.current = false;
                setIsDraggingState(false);
            }

            return;
        }

        const deltaX = e.clientX - startX.current;
        const deltaY = e.clientY - startY.current;

        if (
            !isDragging.current
            && Math.abs(deltaX) >= Math.abs(deltaY)
            && Math.abs(deltaX) > DRAG_START_THRESHOLD
        ) {
            isDragging.current = true;
            setIsDraggingState(true);
            setIsSettled(false);
        }

        if (!isDragging.current) return;

        if (Math.abs(deltaX) > DRAG_START_THRESHOLD) {
            didDragRef.current = true;
        }

        const rawFrame = lastFrame.current - deltaX * (DRAG_SENSITIVITY / zoom);
        const nextFrame = quantizeFrame(rawFrame, dragFrameStep);

        publishFrame(nextFrame, {
            preload: false,
            preloadRadius: dragPreloadRadius,
        });

        if (getCircularFrameDistance(lastDragPreloadedFrameRef.current, nextFrame) >= dragPreloadStride) {
            lastDragPreloadedFrameRef.current = nextFrame;
            preloadAroundFrame(nextFrame, dragPreloadRadius);
        }
    };

    const settleToClosestHotspot = useCallback((sourceFrame) => {
        let finalFrame = sourceFrame;
        let normalized = finalFrame % TOTAL_FRAMES;
        if (normalized <= 0) normalized += TOTAL_FRAMES;
        let closestDist = Infinity;
        let bestTargetNorm = 1;
        for (const pt of SNAP_POINTS) {
            const dist = Math.min(
                Math.abs(normalized - pt),
                Math.abs(normalized - (pt + TOTAL_FRAMES)),
                Math.abs(normalized - (pt - TOTAL_FRAMES))
            );
            if (dist < closestDist) {
                closestDist = dist;
                bestTargetNorm = pt;
            }
        }
        let diff = bestTargetNorm - normalized;
        if (diff > 180) diff -= 360;
        if (diff < -180) diff += 360;
        const snapTarget = finalFrame + diff;
        targetFrameRef.current = snapTarget;
        ensureFrameLoaded(bestTargetNorm);
        preloadAroundFrame(bestTargetNorm, preloadRadius);
        animateToFrame(finalFrame, snapTarget, bestTargetNorm);
    }, [animateToFrame, ensureFrameLoaded, preloadAroundFrame, preloadRadius]);

    const moveToHotspot = useCallback((direction) => {
        const rawFrame = currentFrameRef.current;
        const normalizedFrame = normalizeFrame(rawFrame);
        const orderedPoints = SNAP_POINTS.slice(0, -1);
        const currentIndex = orderedPoints.findIndex((point) => {
            const distance = Math.min(
                Math.abs(normalizedFrame - point),
                Math.abs(normalizedFrame - (point + TOTAL_FRAMES)),
                Math.abs(normalizedFrame - (point - TOTAL_FRAMES)),
            );

            return distance <= 3;
        });

        let nextPoint;

        if (currentIndex >= 0) {
            nextPoint = orderedPoints[
                (currentIndex + direction + orderedPoints.length) % orderedPoints.length
            ];
        } else if (direction > 0) {
            nextPoint = orderedPoints.find((point) => point > normalizedFrame) ?? orderedPoints[0];
        } else {
            nextPoint = [...orderedPoints].reverse().find((point) => point < normalizedFrame)
                ?? orderedPoints[orderedPoints.length - 1];
        }

        let diff = nextPoint - normalizedFrame;
        if (diff > 180) diff -= 360;
        if (diff < -180) diff += 360;

        isDragging.current = false;
        setIsSettled(false);
        ensureFrameLoaded(nextPoint);
        preloadAroundFrame(nextPoint);
        targetFrameRef.current = rawFrame + diff;
        animateToFrame(rawFrame, targetFrameRef.current, nextPoint);
    }, [animateToFrame, ensureFrameLoaded, preloadAroundFrame]);

    const handlePointerUp = (e) => {
        if (interactionLocked) {
            activePointersRef.current.clear();
            lastPinchDistanceRef.current = null;
            return;
        }

        activePointersRef.current.delete(e.pointerId);

        if (activePointersRef.current.size < 2) {
            lastPinchDistanceRef.current = null;
        }

        if (!isDragging.current) return;
        isDragging.current = false;
        setIsDraggingState(false);
        if (didDragRef.current) {
            suppressFlatClickUntilRef.current = Date.now() + 550;
        }
        settleToClosestHotspot(currentFrameRef.current);
    };

    const shouldAllowFlatClick = useCallback(() => {
        return !viewerInteractionLocked && !isDragging.current && Date.now() >= suppressFlatClickUntilRef.current;
    }, [viewerInteractionLocked]);

    useEffect(() => {
        if (typeof window === 'undefined') {
            return undefined;
        }

        const canvas = canvasRef.current;

        redrawBestAvailableFrame();
        window.addEventListener('resize', redrawBestAvailableFrame);

        let resizeObserver;
        if (canvas && 'ResizeObserver' in window) {
            resizeObserver = new window.ResizeObserver(redrawBestAvailableFrame);
            resizeObserver.observe(canvas);
        }

        return () => {
            window.removeEventListener('resize', redrawBestAvailableFrame);
            resizeObserver?.disconnect();
        };
    }, [redrawBestAvailableFrame]);

    useEffect(() => {
        if (!viewerInteractionLocked) {
            return;
        }

        activePointersRef.current.clear();
        lastPinchDistanceRef.current = null;
        isDragging.current = false;
        didDragRef.current = false;
        setIsDraggingState(false);
    }, [viewerInteractionLocked]);

    useEffect(() => {
        if (typeof document === 'undefined') {
            return undefined;
        }

        const handleVisibilityChange = () => {
            if (document.visibilityState !== 'visible') {
                return;
            }

            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    redrawBestAvailableFrame();
                });
            });
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [redrawBestAvailableFrame]);

    const handleWheel = useCallback((event) => {
        if (viewerInteractionLocked) {
            return;
        }

        event.preventDefault();
        setZoom((currentZoom) => clampZoom(currentZoom - event.deltaY * 0.0015));
    }, [viewerInteractionLocked]);

    const handleModelFlatClick = useCallback((flatId) => {
        if (!flatId) {
            return;
        }

        onFlatClick?.(flatId, {
            viewKey: flatViewKeyFromFrame(currentFrameRef.current),
        });
    }, [onFlatClick]);

    return (
        <div
            className={styles.viewerContainer}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
            onPointerCancel={handlePointerUp}
            onWheel={handleWheel}
        >
            <div
                className={styles.viewportStage}
                style={{
                    transform: `scale(${zoom})`,
                }}
            >
                <canvas ref={canvasRef} className={styles.backgroundCanvas} />

                <div
                    className={styles.canvasOverlay}
                    style={{
                        opacity: 1,
                        pointerEvents: isSettled && !isDraggingState && !viewerInteractionLocked ? 'auto' : 'none'
                    }}
                >
                    <BuildingModel
                        currentFrame={snappedFrame}
                        filteredFlatIds={filteredFlatIds}
                        onFlatClick={handleModelFlatClick}
                        onFlatHoverStart={onFlatHoverStart}
                        shouldAllowFlatClick={shouldAllowFlatClick}
                        isConstrainedDevice={isConstrainedDevice}
                        meshInteractionEnabled={isSettled && !isDraggingState && !viewerInteractionLocked}
                    />
                </div>
            </div>

            <div
                className={styles.hotspotControls}
                aria-label="Apartment view controls"
                onPointerDown={(event) => event.stopPropagation()}
                onPointerMove={(event) => event.stopPropagation()}
                onPointerUp={(event) => event.stopPropagation()}
            >
                <button
                    type="button"
                    className={styles.hotspotButton}
                    onClick={() => moveToHotspot(-1)}
                    aria-label="Previous apartment view"
                    disabled={viewerInteractionLocked}
                >
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M14.6 6.4 9 12l5.6 5.6-1.4 1.4L6.2 12l7-7z" />
                    </svg>
                </button>
                <button
                    type="button"
                    className={styles.hotspotButton}
                    onClick={() => moveToHotspot(1)}
                    aria-label="Next apartment view"
                    disabled={viewerInteractionLocked}
                >
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                        <path d="m9.4 17.6 5.6-5.6-5.6-5.6L10.8 5l7 7-7 7z" />
                    </svg>
                </button>
            </div>

        </div>
    );
}
