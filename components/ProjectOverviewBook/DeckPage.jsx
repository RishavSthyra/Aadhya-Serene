'use client';

import React, { forwardRef } from 'react';

const pageImagePosition = {
  full: 'center center',
  left: 'left center',
  right: 'right center',
};

const pageImageSize = {
  full: '100% 100%',
  left: '200% 100%',
  right: '200% 100%',
};

const DeckPage = forwardRef(function DeckPage(
  { image, alt, crop = 'full', hard = false },
  ref,
) {
  const isSplitSpread = crop === 'left' || crop === 'right';

  return (
    <div
      ref={ref}
      data-density={hard ? 'hard' : 'soft'}
      className="relative h-full w-full overflow-hidden bg-transparent"
      style={{
        backfaceVisibility: 'hidden',
        WebkitBackfaceVisibility: 'hidden',
        transformStyle: 'preserve-3d',
      }}
    >
      <div
        className="absolute inset-0"
        style={{
          backfaceVisibility: 'hidden',
          WebkitBackfaceVisibility: 'hidden',
          transform: 'translateZ(1px)',
        }}
      >
        {isSplitSpread ? (
          <div
            aria-label={alt}
            role="img"
            className="h-full w-full bg-no-repeat"
            style={{
              backgroundImage: `url(${image})`,
              backgroundPosition: pageImagePosition[crop],
              backgroundSize: pageImageSize[crop],
            }}
          />
        ) : (
          <img
            src={image}
            alt={alt}
            draggable={false}
            className="h-full w-full select-none object-fill"
          />
        )}

        <div
          aria-hidden="true"
          className={`pointer-events-none absolute inset-y-0 ${
            crop === 'left'
              ? 'right-0 w-12 bg-gradient-to-l from-black/16 via-black/7 to-transparent'
              : crop === 'right'
                ? 'left-0 w-12 bg-gradient-to-r from-black/16 via-black/7 to-transparent'
                : 'inset-x-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.08),transparent_16%,transparent_84%,rgba(0,0,0,0.05))]'
          }`}
        />

        <div
          aria-hidden="true"
          className={`pointer-events-none absolute inset-0 ${
            hard
              ? 'shadow-[inset_0_0_0_1px_rgba(76,56,31,0.18),inset_0_16px_22px_rgba(255,255,255,0.08),inset_0_-22px_28px_rgba(45,25,10,0.07)]'
              : 'shadow-[inset_0_0_0_1px_rgba(76,56,31,0.08),inset_0_10px_14px_rgba(255,255,255,0.05),inset_0_-16px_20px_rgba(45,25,10,0.05)]'
          }`}
        />

        {hard ? (
          <div className="pointer-events-none absolute inset-y-0 left-0 right-0 bg-[radial-gradient(circle_at_50%_24%,rgba(255,255,255,0.08),transparent_28%),linear-gradient(180deg,transparent_0%,transparent_72%,rgba(40,22,8,0.06)_100%)]" />
        ) : null}
      </div>
    </div>
  );
});

DeckPage.displayName = 'DeckPage';

export default DeckPage;
