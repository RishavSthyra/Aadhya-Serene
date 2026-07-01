'use client';

import { useEffect } from 'react';
import { cacheAssetOnce } from '@/lib/client-asset-cache';
import {
  getProjectOverviewCriticalAssets,
  getProjectOverviewShellAssets,
  warmProjectOverviewModules,
} from '@/lib/project-overview-assets';

const warmupAssets = getProjectOverviewShellAssets();

export default function ProjectOverviewWarmup() {
  useEffect(() => {
    void warmProjectOverviewModules();

    getProjectOverviewCriticalAssets().forEach((assetUrl) => {
      void cacheAssetOnce(assetUrl, { priority: 'high' });
    });
  }, []);

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed left-[-9999px] top-[-9999px] h-px w-px overflow-hidden opacity-0"
    >
      {warmupAssets.map((src) => (
        <img key={src} src={src} alt="" loading="eager" decoding="async" />
      ))}
    </div>
  );
}
