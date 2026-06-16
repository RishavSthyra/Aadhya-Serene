'use client';

const warmupAssets = [
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

export default function ProjectOverviewWarmup() {
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
