'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useMotionValue, useSpring } from 'framer-motion';
import BuildingModel from './BuildingModel';
import styles from './viewer.module.css';

const TOTAL_FRAMES = 360;
const SNAP_POINTS = [1, 90, 180, 270, 360];
const ROT360_CDN_BASE = 'https://cdn.sthyra.com/AADHYA%20SERENE/images/rot360';
const DRAG_FRAME_STEP = 1;
const PRELOAD_RADIUS = 14;
const PRELOAD_CONCURRENCY = 8;
const MAX_CACHE_SIZE = 72;
const DRAG_SENSITIVITY = 0.36;

function getFrameUrl(frameNumber) {
    return `${ROT360_CDN_BASE}/frame_${String(frameNumber).padStart(4, '0')}.avif`;
}

function normalizeFrame(frameNumber) {
    return ((Math.round(frameNumber) - 1 + TOTAL_FRAMES * 10) % TOTAL_FRAMES) + 1;
}

function quantizeFrame(frameNumber, step) {
    const zeroIndexed = ((Math.round(frameNumber) - 1) % TOTAL_FRAMES + TOTAL_FRAMES) % TOTAL_FRAMES;
    return ((Math.round(zeroIndexed / step) * step) % TOTAL_FRAMES) + 1;
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

export default function Apartment360Viewer({ onFlatClick, onFlatHoverStart, filteredFlatIds }) {
    const [currentFrame, setCurrentFrame] = useState(1);
    const [displayFrame, setDisplayFrame] = useState(1);
    const [snappedFrame, setSnappedFrame] = useState(1);
    const [isSettled, setIsSettled] = useState(true);

    const frameMotion = useMotionValue(1);
    const smoothFrame = useSpring(frameMotion, {
        stiffness: 82,
        damping: 28,
        mass: 0.72,
        restDelta: 0.18,
    });

    const canvasRef = useRef(null);
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
    const publishRafRef = useRef(null);
    const drawRafRef = useRef(null);

    const syncCanvasSize = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) {
            return null;
        }

        const bounds = canvas.getBoundingClientRect();
        if (!bounds.width || !bounds.height) {
            return null;
        }

        const dpr = typeof window === 'undefined' ? 1 : Math.min(window.devicePixelRatio || 1, 2);
        const targetWidth = Math.round(bounds.width * dpr);
        const targetHeight = Math.round(bounds.height * dpr);

        if (canvas.width !== targetWidth || canvas.height !== targetHeight) {
            canvas.width = targetWidth;
            canvas.height = targetHeight;
        }

        return { bounds, dpr };
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

            const context = canvas.getContext('2d', { alpha: false });
            if (!context) {
                return;
            }

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

            context.fillStyle = '#000';
            context.fillRect(0, 0, canvasWidth, canvasHeight);
            context.imageSmoothingEnabled = true;
            context.imageSmoothingQuality = canvasRatio > imageRatio ? 'high' : 'medium';
            context.drawImage(image, drawX, drawY, drawWidth, drawHeight);
        });
    }, [syncCanvasSize]);

    const trimCache = useCallback(() => {
        const pinnedFrames = new Set([
            displayFrame,
            latestRequestedFrameRef.current,
            ...getPreloadSequence(latestRequestedFrameRef.current, PRELOAD_RADIUS),
        ]);

        for (const frameNumber of imageCacheRef.current.keys()) {
            if (imageCacheRef.current.size <= MAX_CACHE_SIZE) {
                break;
            }

            if (pinnedFrames.has(frameNumber)) {
                continue;
            }

            imageCacheRef.current.delete(frameNumber);
            loadedFramesRef.current.delete(frameNumber);
        }
    }, [displayFrame]);

    const markFrameAsDisplayed = useCallback((frameNumber) => {
        if (!mountedRef.current) {
            return;
        }

        setDisplayFrame((previousFrame) => (
            previousFrame === frameNumber ? previousFrame : frameNumber
        ));
    }, []);

    const pumpPreloadQueue = useCallback(() => {
        if (typeof window === 'undefined') {
            return;
        }

        while (activeLoadsRef.current < PRELOAD_CONCURRENCY && queuedFramesRef.current.length > 0) {
            const nextFrame = queuedFramesRef.current.shift();

            if (
                nextFrame == null
                || loadedFramesRef.current.has(nextFrame)
                || failedFramesRef.current.has(nextFrame)
                || loadingPromisesRef.current.has(nextFrame)
            ) {
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
                        markFrameAsDisplayed(nextFrame);
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
    }, [drawFrame, markFrameAsDisplayed, trimCache]);

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

        enqueueFrames([normalizedFrame]);
    }, [enqueueFrames]);

    const preloadAroundFrame = useCallback((frameNumber) => {
        enqueueFrames(getPreloadSequence(frameNumber, PRELOAD_RADIUS));
    }, [enqueueFrames]);

    const publishFrame = useCallback((frameNumber) => {
        pendingFrameRef.current = frameNumber;

        if (publishRafRef.current !== null || typeof window === 'undefined') {
            return;
        }

        publishRafRef.current = window.requestAnimationFrame(() => {
            publishRafRef.current = null;
            setCurrentFrame((previousFrame) => (
                previousFrame === pendingFrameRef.current ? previousFrame : pendingFrameRef.current
            ));
        });
    }, []);

    useEffect(() => {
        mountedRef.current = true;

        return () => {
            mountedRef.current = false;
        };
    }, []);

    useEffect(() => {
        return smoothFrame.on('change', (latest) => {
            let wrapped = Math.round(latest);
            if (wrapped <= 0) wrapped += TOTAL_FRAMES;
            if (wrapped > TOTAL_FRAMES) wrapped -= TOTAL_FRAMES;
            const requestedFrame = isDragging.current
                ? quantizeFrame(wrapped, DRAG_FRAME_STEP)
                : wrapped;
            publishFrame(requestedFrame);

            if (!isDragging.current && !isSettled) {
                if (Math.abs(latest - targetFrameRef.current) <= 1.5) {
                    setIsSettled(true);
                    let targetWrapped = Math.round(targetFrameRef.current);
                    if (targetWrapped <= 0) targetWrapped += TOTAL_FRAMES;
                    if (targetWrapped > TOTAL_FRAMES) targetWrapped -= TOTAL_FRAMES;
                    let finalSnap = 1;
                    let minDist = Infinity;
                    for (const pt of SNAP_POINTS) {
                        const dist = Math.min(
                            Math.abs(targetWrapped - pt),
                            Math.abs(targetWrapped - (pt + TOTAL_FRAMES)),
                            Math.abs(targetWrapped - (pt - TOTAL_FRAMES))
                        );
                        if (dist < minDist) { minDist = dist; finalSnap = pt; }
                    }
                    setSnappedFrame(finalSnap);
                }
            }
        });
    }, [publishFrame, smoothFrame, isSettled]);

    useEffect(() => {
        return () => {
            if (publishRafRef.current !== null && typeof window !== 'undefined') {
                window.cancelAnimationFrame(publishRafRef.current);
            }

            if (drawRafRef.current !== null && typeof window !== 'undefined') {
                window.cancelAnimationFrame(drawRafRef.current);
            }
        };
    }, []);

    const handlePointerDown = (e) => {
        isDragging.current = true;
        didDragRef.current = false;
        setIsSettled(false);
        startX.current = e.clientX;
        lastFrame.current = smoothFrame.get();
        frameMotion.stop();
    };

    const handlePointerMove = (e) => {
        if (!isDragging.current) return;
        const deltaX = e.clientX - startX.current;
        if (Math.abs(deltaX) > 6) {
            didDragRef.current = true;
        }
        frameMotion.set(lastFrame.current - deltaX * DRAG_SENSITIVITY);
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
        frameMotion.set(snapTarget);
    }, [frameMotion]);

    const moveToHotspot = useCallback((direction) => {
        const rawFrame = frameMotion.get();
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
        preloadAroundFrame(nextPoint);
        targetFrameRef.current = rawFrame + diff;
        frameMotion.set(targetFrameRef.current);
    }, [frameMotion, preloadAroundFrame]);

    const handlePointerUp = () => {
        if (!isDragging.current) return;
        isDragging.current = false;
        if (didDragRef.current) {
            suppressFlatClickUntilRef.current = Date.now() + 550;
        }
        settleToClosestHotspot(frameMotion.get());
    };

    const shouldAllowFlatClick = useCallback(() => {
        return !isDragging.current && Date.now() >= suppressFlatClickUntilRef.current;
    }, []);

    useEffect(() => {
        const normalizedFrame = normalizeFrame(currentFrame);

        latestRequestedFrameRef.current = normalizedFrame;

        if (loadedFramesRef.current.has(normalizedFrame)) {
            markFrameAsDisplayed(normalizedFrame);
        } else if (!failedFramesRef.current.has(normalizedFrame)) {
            ensureFrameLoaded(normalizedFrame);
        }

        preloadAroundFrame(normalizedFrame);
    }, [currentFrame, ensureFrameLoaded, markFrameAsDisplayed, preloadAroundFrame]);

    useEffect(() => {
        const cachedImage = imageCacheRef.current.get(displayFrame);
        if (!cachedImage?.complete) {
            return;
        }

        drawFrame(displayFrame);
    }, [displayFrame, drawFrame]);

    useEffect(() => {
        if (typeof window === 'undefined') {
            return undefined;
        }

        const redraw = () => drawFrame(displayFrame);
        const canvas = canvasRef.current;

        redraw();
        window.addEventListener('resize', redraw);

        let resizeObserver;
        if (canvas && 'ResizeObserver' in window) {
            resizeObserver = new window.ResizeObserver(redraw);
            resizeObserver.observe(canvas);
        }

        return () => {
            window.removeEventListener('resize', redraw);
            resizeObserver?.disconnect();
        };
    }, [displayFrame, drawFrame]);

    return (
        <div
            className={styles.viewerContainer}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
        >
            <canvas ref={canvasRef} className={styles.backgroundCanvas} />

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
                >
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                        <path d="m9.4 17.6 5.6-5.6-5.6-5.6L10.8 5l7 7-7 7z" />
                    </svg>
                </button>
            </div>

            <div
                className={styles.canvasOverlay}
                style={{
                    opacity: isSettled ? 1 : 0,
                    transition: 'opacity 0.2s ease-in-out',
                    pointerEvents: isSettled ? 'auto' : 'none'
                }}
            >
                <BuildingModel
                    currentFrame={snappedFrame}
                    filteredFlatIds={filteredFlatIds}
                    onFlatClick={onFlatClick}
                    onFlatHoverStart={onFlatHoverStart}
                    shouldAllowFlatClick={shouldAllowFlatClick}
                />
            </div>

        </div>
    );
}
