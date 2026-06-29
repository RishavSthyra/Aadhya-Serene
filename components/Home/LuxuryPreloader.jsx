'use client';

import React, { useEffect, useRef, useState } from 'react';
import {
  cacheAssetOnce,
  prefetchAssetsInChunks,
  registerAssetCacheServiceWorker,
} from '@/lib/client-asset-cache';
import {
  APARTMENT_360_PRIMARY_PRELOAD_COUNT,
  APARTMENT_360_SNAP_POINTS,
  APARTMENT_360_TOTAL_FRAMES,
  apartment360FrameUrl,
} from '@/lib/apartment360Frames';
import styles from '../../app/home.module.css';

const MIN_PRELOADER_DURATION_MS = 1200;
const MAX_PRELOADER_DURATION_MS = 12000;
const REVEAL_DURATION_MS = 980;
const EASE_OUT_CUBIC = (value) => 1 - ((1 - value) ** 3);

const HOME_VIDEO = 'https://cdn.sthyra.com/AADHYA%20SERENE/videos/Aadhya%20Serene%20Home%20Page%205%20With%20Humans(2).mp4';
const HOME_POSTER = 'https://cdn.sthyra.com/AADHYA%20SERENE/images/Aadhya%20Serene%20Home%20Page%205%20With%20Humans%20-%20First%20Frame.avif';
const ROT360_TOTAL_FRAMES = APARTMENT_360_TOTAL_FRAMES;
const ROT360_SNAP_POINTS = APARTMENT_360_SNAP_POINTS;

function frameUrl(frameNumber) {
  return apartment360FrameUrl(frameNumber);
}

function normalizeFrameNumber(frameNumber) {
  return (((Math.round(frameNumber) - 1) % ROT360_TOTAL_FRAMES) + ROT360_TOTAL_FRAMES) % ROT360_TOTAL_FRAMES + 1;
}

function appendFrame(frames, seen, frameNumber) {
  const normalizedFrame = normalizeFrameNumber(frameNumber);
  if (seen.has(normalizedFrame)) {
    return;
  }

  seen.add(normalizedFrame);
  frames.push(normalizedFrame);
}

function getPreloaderScrubFrames() {
  return Array.from(
    { length: Math.min(APARTMENT_360_PRIMARY_PRELOAD_COUNT, ROT360_TOTAL_FRAMES) },
    (_, index) => index + 1,
  );
}

function getGradualRot360WarmFrames(isConstrainedDevice) {
  const frames = [];
  const seen = new Set();
  const snapRadius = isConstrainedDevice ? 36 : 72;
  const coarseStride = isConstrainedDevice ? 12 : 8;

  getPreloaderScrubFrames().forEach((frameNumber) => {
    appendFrame(frames, seen, frameNumber);
  });

  ROT360_SNAP_POINTS.forEach((centerFrame) => {
    for (let offset = 0; offset <= snapRadius; offset += 1) {
      appendFrame(frames, seen, centerFrame + offset);
      appendFrame(frames, seen, centerFrame - offset);
    }
  });

  for (let frameNumber = APARTMENT_360_PRIMARY_PRELOAD_COUNT + 1; frameNumber <= ROT360_TOTAL_FRAMES; frameNumber += coarseStride) {
    appendFrame(frames, seen, frameNumber);
  }

  for (let frameNumber = APARTMENT_360_PRIMARY_PRELOAD_COUNT + 1; frameNumber <= ROT360_TOTAL_FRAMES; frameNumber += 1) {
    appendFrame(frames, seen, frameNumber);
  }

  return frames;
}

function shouldUseSafeMedia() {
  if (typeof window === 'undefined') {
    return true;
  }

  const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  return window.innerWidth <= 900
    || connection?.saveData
    || /(^|slow-)?2g|3g/.test(connection?.effectiveType ?? '');
}

function getCriticalAssets() {
  const scrubFrameAssets = getPreloaderScrubFrames().map(frameUrl);

  return [
    '/favicon.ico',
    HOME_POSTER,
    HOME_VIDEO,
    ...scrubFrameAssets,
  ];
}

function getIdleWarmAssets() {
  return [
    HOME_POSTER,
    HOME_VIDEO,
  ];
}

function getGradualRot360WarmAssets(isConstrainedDevice) {
  return getGradualRot360WarmFrames(isConstrainedDevice).map(frameUrl);
}

export default function LuxuryPreloader({ onRevealStart, onCycleComplete }) {
  const completionReportedRef = useRef(false);
  const revealReportedRef = useRef(false);
  const onRevealStartRef = useRef(onRevealStart);
  const onCycleCompleteRef = useRef(onCycleComplete);
  const [progress, setProgress] = useState(0);
  const [isRevealing, setIsRevealing] = useState(false);

  useEffect(() => {
    onRevealStartRef.current = onRevealStart;
    onCycleCompleteRef.current = onCycleComplete;
  }, [onCycleComplete, onRevealStart]);

  useEffect(() => {
    let cancelled = false;
    let frameId = 0;
    const startTime = performance.now();
    const useSafeMedia = shouldUseSafeMedia();
    const criticalAssets = getCriticalAssets();
    let completedAssets = 0;
    let criticalDone = false;
    let timedOut = false;
    const criticalVideoPreload = useSafeMedia ? 'metadata' : 'auto';
    const criticalVideoReadyEvent = useSafeMedia ? 'loadedmetadata' : 'loadeddata';
    const criticalWorkerCount = useSafeMedia ? 2 : 3;
    const idleWarmConcurrency = useSafeMedia ? 2 : 3;

    const reportAssetComplete = () => {
      completedAssets += 1;
    };

    const beginReveal = () => {
      if (cancelled || revealReportedRef.current) return;

      revealReportedRef.current = true;
      setProgress(1);
      setIsRevealing(true);
      onRevealStartRef.current?.();

      prefetchAssetsInChunks(getIdleWarmAssets(), {
        chunkSize: 3,
        concurrency: idleWarmConcurrency,
        priority: 'low',
        immediate: true,
        gapMs: useSafeMedia ? 220 : 140,
        idleTimeoutMs: 1200,
        delayMs: 20,
        videoPreload: useSafeMedia ? 'metadata' : 'auto',
        videoReadyEvent: useSafeMedia ? 'loadedmetadata' : 'loadeddata',
        timeoutMs: useSafeMedia ? 5000 : 9000,
        pauseDuringBackgroundTransition: true,
        pauseOnAmenitiesRoute: true,
        pauseRetryMs: useSafeMedia ? 900 : 560,
      });

      prefetchAssetsInChunks(getGradualRot360WarmAssets(useSafeMedia), {
        chunkSize: useSafeMedia ? 4 : 8,
        concurrency: useSafeMedia ? 1 : 2,
        priority: 'low',
        immediate: true,
        gapMs: useSafeMedia ? 180 : 90,
        idleTimeoutMs: useSafeMedia ? 2400 : 1500,
        delayMs: useSafeMedia ? 160 : 40,
        timeoutMs: useSafeMedia ? 4200 : 6200,
        pauseDuringBackgroundTransition: true,
        pauseOnAmenitiesRoute: true,
        pauseRetryMs: useSafeMedia ? 900 : 560,
      });

      window.setTimeout(() => {
        if (cancelled || completionReportedRef.current) return;
        completionReportedRef.current = true;
        onCycleCompleteRef.current?.();
      }, REVEAL_DURATION_MS);
    };

    const tick = (now) => {
      const elapsed = now - startTime;
      const assetProgress = criticalAssets.length > 0
        ? completedAssets / criticalAssets.length
        : 1;
      const timeProgress = Math.min(elapsed / MIN_PRELOADER_DURATION_MS, 1);
      const maxTimeProgress = Math.min(elapsed / MAX_PRELOADER_DURATION_MS, 1);
      const nextProgress = Math.min(
        0.98,
        (EASE_OUT_CUBIC(timeProgress) * 0.44) + (assetProgress * 0.46) + (maxTimeProgress * 0.1),
      );

      if (!isRevealing) {
        setProgress(nextProgress);
      }

      const hasMetMinimumTime = elapsed >= MIN_PRELOADER_DURATION_MS;
      if ((criticalDone && hasMetMinimumTime) || timedOut || elapsed >= MAX_PRELOADER_DURATION_MS) {
        beginReveal();
        return;
      }

      frameId = window.requestAnimationFrame(tick);
    };

    void registerAssetCacheServiceWorker();
    const criticalQueue = [...criticalAssets];
    const criticalWorkers = Array.from({ length: criticalWorkerCount }, async () => {
      while (!cancelled && criticalQueue.length > 0) {
        const nextAsset = criticalQueue.shift();
        await cacheAssetOnce(nextAsset, {
          priority: 'high',
          immediate: true,
          videoPreload: criticalVideoPreload,
          videoReadyEvent: criticalVideoReadyEvent,
          timeoutMs: criticalVideoPreload === 'auto' ? 9000 : 5000,
        }).finally(reportAssetComplete);
      }
    });

    Promise.allSettled(criticalWorkers).then(() => {
      criticalDone = true;
    });

    const timeoutId = window.setTimeout(() => {
      timedOut = true;
    }, MAX_PRELOADER_DURATION_MS);

    frameId = window.requestAnimationFrame(tick);

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
      window.cancelAnimationFrame(frameId);
    };
  }, []);

  const progressPercent = Math.round(progress * 100);

  return (
    <div
      className={`${styles.luxuryLoader} ${isRevealing ? styles.luxuryLoaderExit : ''}`}
      aria-label="Loading Aadhya Serene"
      style={{
        '--loader-progress': `${progressPercent}%`,
        '--loader-ring-progress': `${Math.max(8, progressPercent)}%`,
      }}
    >
      <div className={styles.luxuryLoaderBackdrop} />

      <div className={styles.luxuryLoaderInner}>
        <div className={styles.luxuryLoaderMarkWrap} aria-hidden="true">
          <div className={styles.luxuryLoaderRing} />
          <img src="/favicon.ico" alt="" className={styles.luxuryLoaderMark} />
        </div>

        <div className={styles.luxuryLoaderProgressMeta}>
          <span>AADHYA SERENE</span>
          <span>{progressPercent}%</span>
        </div>
      </div>
    </div>
  );
}
