'use client';

import { useEffect, useMemo } from 'react';
import {
  cacheAssetOnce,
  prefetchAssetsInChunks,
  registerAssetCacheServiceWorker,
} from '@/lib/client-asset-cache';
import usePerformanceProfile from '@/hooks/usePerformanceProfile';

const APARTMENTS_POSTER = 'https://cdn.sthyra.com/AADHYA%20SERENE/videos/first_frame_3_1%20(1).jpg';
const APARTMENTS_LOOP = 'https://cdn.sthyra.com/AADHYA%20SERENE/videos/3-2-av1.mp4';
const APARTMENTS_TRANSITION = {
  safe: 'https://cdn.sthyra.com/AADHYA%20SERENE/videos/AADHYA_SERENE_OPTIMIZED/3-1_1920w_60fps_h264_safe.mp4',
  premium: 'https://cdn.sthyra.com/AADHYA%20SERENE/videos/AADHYA_SERENE_OPTIMIZED/3-1_2560w_60fps_h264_premium.mp4',
  ultra: 'https://cdn.sthyra.com/AADHYA%20SERENE/videos/AADHYA_SERENE_OPTIMIZED/3-1_3200w_60fps_h264_ultra.mp4',
};

function resolveApartmentsTransition(profile) {
  if (profile.shouldConserveData || profile.isMobile || profile.isConstrainedDevice) {
    return APARTMENTS_TRANSITION.safe;
  }

  if (profile.veryHighCapabilityDesktop) {
    return APARTMENTS_TRANSITION.ultra;
  }

  return APARTMENTS_TRANSITION.premium;
}

export default function RootMediaWarmup({ enabled = true }) {
  const profile = usePerformanceProfile();

  const selectedTransition = useMemo(
    () => resolveApartmentsTransition(profile),
    [profile],
  );

  useEffect(() => {
    if (!enabled) {
      return undefined;
    }

    const criticalAssets = [
      APARTMENTS_POSTER,
      selectedTransition,
      APARTMENTS_LOOP,
    ];
    const fallbackAssets = Object.values(APARTMENTS_TRANSITION)
      .filter((url) => url !== selectedTransition);

    void registerAssetCacheServiceWorker();
    criticalAssets.forEach((assetUrl) => {
      void cacheAssetOnce(assetUrl, { priority: 'high' });
    });

    prefetchAssetsInChunks(fallbackAssets, {
      chunkSize: 1,
      concurrency: 1,
      priority: 'low',
      gapMs: 320,
      idleTimeoutMs: 1800,
      delayMs: 220,
    });

    return undefined;
  }, [enabled, selectedTransition]);

  if (!enabled) {
    return null;
  }

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed left-[-9999px] top-[-9999px] h-px w-px overflow-hidden opacity-0"
    >
      <img src={APARTMENTS_POSTER} alt="" fetchPriority="high" />
      <video
        key={selectedTransition}
        muted
        playsInline
        preload="auto"
        src={selectedTransition}
      />
      <video
        muted
        playsInline
        preload="auto"
        src={APARTMENTS_LOOP}
      />
    </div>
  );
}
