const PROJECT_OVERVIEW_TEXTURE_FILES = [
  '/BROCHUREIMAGE2.avif',
  '/FlipbookPages/page1new.png',
  '/FlipbookPages/page1.png',
  '/FlipbookPages/Page2.png',
  '/FlipbookPages/page3new2.png',
  '/FlipbookPages/page4new.png',
  '/FlipbookPages/page7new.png',
  '/FlipbookPages/page9new.png',
  '/FlipbookPages/Page5_And_6.png',
  '/FlipbookPages/Masterplan%20Page.png',
  '/FlipbookPages/Spec%20Left%20section%20Image.png',
  '/FlipbookPages/Specificaitions%20Right%20Page.png',
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
