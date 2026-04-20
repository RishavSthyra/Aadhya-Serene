'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import usePerformanceProfile from '@/hooks/usePerformanceProfile';

const LocationMap = dynamic(
  () => import('./MapComponent').then((mod) => mod.CustomStyleExample),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-dvh items-center justify-center bg-slate-100 px-6">
        <div className="rounded-[24px] border border-slate-200 bg-white px-6 py-5 text-center shadow-[0_20px_50px_rgba(15,23,42,0.08)]">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
            Location
          </p>
          <p className="mt-2 text-sm text-slate-700">
            Preparing the map and nearby places...
          </p>
        </div>
      </div>
    ),
  },
);

export default function LocationMapShell() {
  const { isConstrainedDevice } = usePerformanceProfile();
  const [shouldMountMap, setShouldMountMap] = useState(false);

  useEffect(() => {
    let timeoutId = null;
    let idleId = null;

    const mountMap = () => {
      setShouldMountMap(true);
    };

    if (typeof window === 'undefined') {
      setShouldMountMap(true);
      return undefined;
    }

    if (typeof window.requestIdleCallback === 'function') {
      idleId = window.requestIdleCallback(mountMap, {
        timeout: isConstrainedDevice ? 1600 : 700,
      });
    } else {
      timeoutId = window.setTimeout(mountMap, isConstrainedDevice ? 450 : 180);
    }

    return () => {
      if (idleId !== null && typeof window.cancelIdleCallback === 'function') {
        window.cancelIdleCallback(idleId);
      }

      if (timeoutId !== null) {
        window.clearTimeout(timeoutId);
      }
    };
  }, [isConstrainedDevice]);

  return (
    <div className="relative z-10">
      {shouldMountMap ? (
        <LocationMap />
      ) : (
        <div className="flex h-dvh items-center justify-center bg-slate-100 px-6">
          <div className="rounded-[24px] border border-slate-200 bg-white px-6 py-5 text-center shadow-[0_20px_50px_rgba(15,23,42,0.08)]">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
              Location
            </p>
            <p className="mt-2 text-sm text-slate-700">
              Preparing the map and nearby places...
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
