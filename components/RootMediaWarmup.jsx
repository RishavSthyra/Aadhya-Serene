'use client';

import { useEffect, useMemo } from 'react';
import { usePathname } from 'next/navigation';
import {
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
  const pathname = usePathname();
  const profile = usePerformanceProfile();

  const selectedTransition = useMemo(
    () => resolveApartmentsTransition(profile),
    [profile],
  );
  const warmupConcurrency = profile.shouldConserveData || profile.isConstrainedDevice
    ? 1
    : profile.veryHighCapabilityDesktop
      ? 3
      : 2;
  const warmupVideoPreload = profile.shouldConserveData || profile.isConstrainedDevice
    ? 'metadata'
    : 'auto';
  const warmupVideoReadyEvent = warmupVideoPreload === 'auto'
    ? 'loadeddata'
    : 'loadedmetadata';

  useEffect(() => {
    if (!enabled || pathname === '/') {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      void registerAssetCacheServiceWorker();

      prefetchAssetsInChunks([
        APARTMENTS_POSTER,
        selectedTransition,
        APARTMENTS_LOOP,
      ], {
        chunkSize: 2,
        concurrency: warmupConcurrency,
        priority: 'low',
        immediate: true,
        gapMs: 160,
        idleTimeoutMs: 900,
        delayMs: 0,
        videoPreload: warmupVideoPreload,
        videoReadyEvent: warmupVideoReadyEvent,
        timeoutMs: warmupVideoPreload === 'auto' ? 9000 : 5000,
      });
    }, 900);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [
    enabled,
    pathname,
    selectedTransition,
    warmupConcurrency,
    warmupVideoPreload,
    warmupVideoReadyEvent,
  ]);

  return null;
}
