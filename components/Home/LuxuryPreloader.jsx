'use client';

import React, { useEffect, useRef, useState } from 'react';
import {
  cacheAssetOnce,
  prefetchAssetsInChunks,
  registerAssetCacheServiceWorker,
} from '@/lib/client-asset-cache';
import {
  APARTMENT_360_PRIMARY_PRELOAD_COUNT,
  APARTMENT_360_TOTAL_FRAMES,
  apartment360FrameUrl,
} from '@/lib/apartment360Frames';
import { primeApartment360FramesForTransition } from '@/lib/apartment360Warmup';
import { getProjectOverviewShellAssets } from '@/lib/project-overview-assets';
import styles from '../../app/home.module.css';

const MIN_PRELOADER_DURATION_MS = 1200;
const MAX_PRELOADER_DURATION_MS = 12000;
const REVEAL_DURATION_MS = 980;
const EASE_OUT_CUBIC = (value) => 1 - ((1 - value) ** 3);

const HOME_VIDEO = 'https://cdn.sthyra.com/AADHYA%20SERENE/videos/Aadhya%20Serene%20Home%20Page%206%201%20Chr2.mp4';
const HOME_POSTER = 'https://cdn.sthyra.com/AADHYA%20SERENE/images/Aadhya_Serene_Home_Page_6_First_Frame.avif';
const ROT360_TOTAL_FRAMES = APARTMENT_360_TOTAL_FRAMES;

function frameUrl(frameNumber) {
  return apartment360FrameUrl(frameNumber);
}

function getPreloaderScrubFrames() {
  return Array.from(
    { length: Math.min(APARTMENT_360_PRIMARY_PRELOAD_COUNT, ROT360_TOTAL_FRAMES) },
    (_, index) => index + 1,
  );
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
  const projectOverviewShellAssets = getProjectOverviewShellAssets();

  return [
    '/favicon.ico',
    HOME_POSTER,
    HOME_VIDEO,
    ...projectOverviewShellAssets,
    ...scrubFrameAssets,
  ];
}

function getIdleWarmAssets() {
  return [
    HOME_POSTER,
    HOME_VIDEO,
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
    const trackedAssetCount = criticalAssets.length + 1;
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

      window.setTimeout(() => {
        if (cancelled || completionReportedRef.current) return;
        completionReportedRef.current = true;
        onCycleCompleteRef.current?.();
      }, REVEAL_DURATION_MS);
    };

    const tick = (now) => {
      const elapsed = now - startTime;
      const assetProgress = trackedAssetCount > 0
        ? completedAssets / trackedAssetCount
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
    const transitionPrimePromise = primeApartment360FramesForTransition({
      isConstrainedDevice: useSafeMedia,
    }).finally(reportAssetComplete);
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

    Promise.allSettled([...criticalWorkers, transitionPrimePromise]).then(() => {
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
