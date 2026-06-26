import { spreadFloorplanPreviewUrls } from '@/components/ProjectOverviewBook/floorplan-hotspots';

const PROJECT_OVERVIEW_TEXTURE_FILES = [
  '/Brochure_Bg.avif',
  '/FlipbookPages/page1new.png',
  '/FlipbookPages/Page1.png',
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

const PROJECT_OVERVIEW_AUDIO_FILES = [
  '/project-overview-book/audios/page-flip-01a.mp3',
];

export function getProjectOverviewCriticalAssets() {
  return [
    '/models/animated_butterfly.glb',
    ...PROJECT_OVERVIEW_AUDIO_FILES,
    ...PROJECT_OVERVIEW_TEXTURE_FILES,
    ...spreadFloorplanPreviewUrls,
  ];
}

export function warmProjectOverviewModules() {
  return Promise.allSettled([
    import('@/components/ProjectOverviewBook'),
    import('@/components/ProjectOverviewBook/ButterflyOverlay'),
    import('@react-three/drei'),
    import('@react-three/fiber'),
    import('react-pageflip'),
  ]);
}
