'use client';

const warmupAssets = [
  '/BROCHUREIMAGE2.avif',
  '/FlipbookPages/Coverpage.png',
  '/FlipbookPages/Page1.png',
  '/FlipbookPages/Page2.png',
  '/FlipbookPages/Page3.png',
  '/FlipbookPages/Page4.png',
  '/FlipbookPages/Page5_And_6.png',
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
