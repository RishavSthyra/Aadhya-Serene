'use client';

import React, { useEffect, useRef, useState } from 'react';
import {
  cacheAssetOnce,
  prefetchAssetsInChunks,
  registerAssetCacheServiceWorker,
} from '@/lib/client-asset-cache';
import {
  getProjectOverviewCriticalAssets,
  warmProjectOverviewModules,
} from '@/lib/project-overview-assets';
import { getAmenityVideoSources } from '@/lib/amenity-video-sources';
import ProjectOverviewWarmup from '@/components/ProjectOverviewBook/Warmup';
import styles from '../../app/home.module.css';

const MIN_PRELOADER_DURATION_MS = 1800;
const MAX_PRELOADER_DURATION_MS = 30000;
const REVEAL_DURATION_MS = 980;
const EASE_OUT_CUBIC = (value) => 1 - ((1 - value) ** 3);

const HOME_VIDEO = 'https://cdn.sthyra.com/AADHYA%20SERENE/videos/Aadhya%20Serene%20Home%20Page%205%20With%20Humans.mp4';
const HOME_POSTER = 'https://cdn.sthyra.com/AADHYA%20SERENE/images/Aadhya%20Serene%20Home%20Page%205%20With%20Humans%20-%20First%20Frame.avif';
const APARTMENTS_VIDEO_SAFE = 'https://cdn.sthyra.com/AADHYA%20SERENE/videos/AADHYA_SERENE_OPTIMIZED/3-1_1920w_60fps_h264_safe.mp4';
const APARTMENTS_VIDEO_PREMIUM = 'https://cdn.sthyra.com/AADHYA%20SERENE/videos/AADHYA_SERENE_OPTIMIZED/3-1_2560w_60fps_h264_premium.mp4';
const APARTMENTS_VIDEO_ULTRA = 'https://cdn.sthyra.com/AADHYA%20SERENE/videos/AADHYA_SERENE_OPTIMIZED/3-1_3200w_60fps_h264_ultra.mp4';
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

function getAmenityWarmupSources() {
  return getAmenityVideoSources(['720p', '1080p']);
}

function getVideoWarmupSources() {
  return [
    HOME_VIDEO,
    APARTMENTS_VIDEO_SAFE,
    APARTMENTS_VIDEO_PREMIUM,
    APARTMENTS_VIDEO_ULTRA,
    APARTMENTS_LOOP,
    ...getAmenityWarmupSources(),
  ];
}

function getCriticalAssets() {
  const scrubFrameAssets = getPreloaderScrubFrames()
    .slice(0, shouldUseSafeMedia() ? 18 : 34)
    .map(frameUrl);

  return [
    '/favicon.ico',
    HOME_POSTER,
    HOME_VIDEO,
    APARTMENTS_VIDEO_SAFE,
    APARTMENTS_VIDEO_PREMIUM,
    APARTMENTS_VIDEO_ULTRA,
    APARTMENTS_LOOP,
    ...getAmenityWarmupSources(),
    ...getProjectOverviewCriticalAssets(),
    ...scrubFrameAssets,
  ];
}

function getIdleWarmAssets() {
  const sources = getSelectedMediaSources();
  const frameSeeds = getPreloaderScrubFrames();

  return [
    HOME_POSTER,
    sources.homeVideo,
    'https://cdn.sthyra.com/AADHYA%20SERENE/videos/first_frame_3_1%20(1).jpg',
    ...getAmenityWarmupSources(),
    ...frameSeeds.map(frameUrl),
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
    const criticalAssets = getCriticalAssets();
    let completedAssets = 0;
    let criticalDone = false;
    let timedOut = false;

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
        chunkSize: 5,
        concurrency: 1,
        priority: 'low',
        gapMs: 420,
        idleTimeoutMs: 2200,
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
    void warmProjectOverviewModules();
    const criticalQueue = [...criticalAssets];
    const criticalWorkers = Array.from({ length: 3 }, async () => {
      while (!cancelled && criticalQueue.length > 0) {
        const nextAsset = criticalQueue.shift();
        await cacheAssetOnce(nextAsset, { priority: 'high' }).finally(reportAssetComplete);
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
      <ProjectOverviewWarmup />
      <div
        aria-hidden="true"
        className="pointer-events-none fixed left-[-9999px] top-[-9999px] h-px w-px overflow-hidden opacity-0"
      >
        {getVideoWarmupSources().map((src) => (
          <video
            key={src}
            muted
            playsInline
            preload="auto"
            src={src}
          />
        ))}
      </div>

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
