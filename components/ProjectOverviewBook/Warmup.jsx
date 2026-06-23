'use client';

import { useEffect } from 'react';
import { cacheAssetOnce } from '@/lib/client-asset-cache';
import { getProjectOverviewCriticalAssets, warmProjectOverviewModules } from '@/lib/project-overview-assets';

const warmupAssets = [
  '/Brochure_Bg.avif',
  '/FlipbookPages/page1new.png',
  '/FlipbookPages/page1.png',
  '/FlipbookPages/Page2.png',
  '/FlipbookPages/page3new2.avif',
  '/FlipbookPages/page4new.avif',
  '/FlipbookPages/page7new.avif',
  '/FlipbookPages/page9new.avif',
  '/FlipbookPages/Page5_And_6.avif',
  '/FlipbookPages/Masterplan%20Page.avif',
  '/FlipbookPages/Spec%20Left%20section%20Image.avif',
  '/FlipbookPages/Specificaitions%20Right%20Page.avif',
];

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
