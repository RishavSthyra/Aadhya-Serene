const PROJECT_OVERVIEW_TEXTURE_FILES = [
  '/BROCHUREIMAGE2.avif',
  '/FlipbookPages/Coverpage.png',
  '/FlipbookPages/Page1.png',
  '/FlipbookPages/Page2.png',
  '/FlipbookPages/Page3.png',
  '/FlipbookPages/Page4.png',
  '/FlipbookPages/Page5_And_6.png',
];

const PROJECT_OVERVIEW_AUDIO_FILES = [
  '/project-overview-book/audios/page-flip-01a.mp3',
];

export function getProjectOverviewCriticalAssets() {
  return [...PROJECT_OVERVIEW_AUDIO_FILES, ...PROJECT_OVERVIEW_TEXTURE_FILES];
}

export function warmProjectOverviewModules() {
  return Promise.allSettled([
    import('@/components/ProjectOverviewBook'),
    import('react-pageflip'),
  ]);
}
