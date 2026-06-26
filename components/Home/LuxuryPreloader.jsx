'use client';

import React, { useEffect, useRef, useState } from 'react';
import {
  cacheAssetOnce,
  prefetchAssetsInChunks,
  registerAssetCacheServiceWorker,
} from '@/lib/client-asset-cache';
import styles from '../../app/home.module.css';

const MIN_PRELOADER_DURATION_MS = 1200;
const MAX_PRELOADER_DURATION_MS = 12000;
const REVEAL_DURATION_MS = 980;
const EASE_OUT_CUBIC = (value) => 1 - ((1 - value) ** 3);

const HOME_VIDEO = 'https://cdn.sthyra.com/AADHYA%20SERENE/videos/Aadhya%20Serene%20Home%20Page%205%20With%20Humans(2).mp4';
const HOME_POSTER = 'https://cdn.sthyra.com/AADHYA%20SERENE/images/Aadhya%20Serene%20Home%20Page%205%20With%20Humans%20-%20First%20Frame.avif';
const APARTMENTS_VIDEO_SAFE = 'https://cdn.sthyra.com/AADHYA%20SERENE/videos/AADHYA_SERENE_OPTIMIZED/3-1_1920w_60fps_h264_safe.mp4';
const APARTMENTS_VIDEO_PREMIUM = 'https://cdn.sthyra.com/AADHYA%20SERENE/videos/AADHYA_SERENE_OPTIMIZED/3-1_2560w_60fps_h264_premium.mp4';
const APARTMENTS_LOOP = 'https://cdn.sthyra.com/AADHYA%20SERENE/videos/3-2-av1.mp4';
const ROT360_BASE = 'https://cdn.sthyra.com/AADHYA%20SERENE/images/rot360_webp';

function frameUrl(frameNumber) {
  return `${ROT360_BASE}/frame_${String(frameNumber).padStart(4, '0')}.webp`;
}

function normalizeFrameNumber(frameNumber) {
  return (((Math.round(frameNumber) - 1) % 360) + 360) % 360 + 1;
}

function getPreloaderScrubFrames() {
  const frames = new Set([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 90, 180, 270, 360]);

  for (let offset = 12; offset <= 120; offset += 6) {
    frames.add(normalizeFrameNumber(offset));
    frames.add(normalizeFrameNumber(360 - offset));
  }

  [90, 180, 270].forEach((centerFrame) => {
    for (let offset = -12; offset <= 12; offset += 4) {
      frames.add(normalizeFrameNumber(centerFrame + offset));
    }
  });

  return [...frames].sort((a, b) => a - b);
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

function getSelectedMediaSources() {
  return {
    homeVideo: HOME_VIDEO,
    apartmentsTransition: shouldUseSafeMedia()
      ? APARTMENTS_VIDEO_SAFE
      : APARTMENTS_VIDEO_PREMIUM,
  };
}

function getCriticalAssets() {
  const { homeVideo, apartmentsTransition } = getSelectedMediaSources();
  const scrubFrameAssets = getPreloaderScrubFrames()
    .slice(0, shouldUseSafeMedia() ? 6 : 12)
    .map(frameUrl);

  return [
    '/favicon.ico',
    HOME_POSTER,
    homeVideo,
    apartmentsTransition,
    ...scrubFrameAssets,
  ];
}

function getIdleWarmAssets() {
  const sources = getSelectedMediaSources();
  const frameSeeds = getPreloaderScrubFrames();

  return [
    HOME_POSTER,
    sources.homeVideo,
    sources.apartmentsTransition,
    'https://cdn.sthyra.com/AADHYA%20SERENE/videos/first_frame_3_1%20(1).jpg',
    APARTMENTS_LOOP,
    ...frameSeeds.slice(0, 24).map(frameUrl),
  ];
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
