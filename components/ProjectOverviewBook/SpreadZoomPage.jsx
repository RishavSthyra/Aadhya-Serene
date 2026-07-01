'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { spreadFloorplanHotspots } from './floorplan-hotspots';

const pageImagePosition = {
  left: 'left center',
  right: 'right center',
};

const pageImageSize = {
  left: '200% 100%',
  right: '200% 100%',
};

function projectHotspotToPage(hotspot, crop) {
  const cropStart = crop === 'left' ? 0 : 0.5;
  const cropEnd = crop === 'left' ? 0.5 : 1;
  const { x, y, width, height } = hotspot.box;
  const xEnd = x + width;

  if (xEnd <= cropStart || x >= cropEnd) {
    return null;
  }

  const clippedStart = Math.max(x, cropStart);
  const clippedEnd = Math.min(xEnd, cropEnd);
  const localX = (clippedStart - cropStart) / 0.5;
  const localWidth = (clippedEnd - clippedStart) / 0.5;

  if (localWidth <= 0) {
    return null;
  }

  return {
    ...hotspot,
    localBox: {
      x: localX,
      y,
      width: localWidth,
      height,
    },
  };
}

function FloorplanPreviewModal({ hotspot, onClose }) {
  if (typeof document === 'undefined') {
    return null;
  }

  return createPortal(
    <AnimatePresence>
      {hotspot ? (
        <motion.div
          key={hotspot.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/54 p-4 backdrop-blur-[6px]"
          onClick={onClose}
        >
          <button
            type="button"
            onClick={onClose}
            aria-label="Close floor plan preview"
            className="absolute right-5 top-5 z-20 inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/12 bg-black/28 text-white/82 backdrop-blur-md transition hover:bg-black/42 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>

          <motion.div
            initial={{ opacity: 0, y: 26, scale: 0.82 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.84 }}
            transition={{ duration: 0.34, ease: [0.22, 1, 0.36, 1] }}
            onClick={(event) => event.stopPropagation()}
            className="origin-center"
          >
            <img
              src={hotspot.previewSrc}
              alt={`${hotspot.displayUnitCode} individual floor plan`}
              className="max-h-[58vh] w-auto max-w-[min(84vw,760px)] object-contain drop-shadow-[0_28px_70px_rgba(0,0,0,0.42)] sm:max-h-[54vh] sm:max-w-[min(56vw,720px)]"
            />
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}

export default function SpreadZoomPage({
  image,
  alt,
  crop = 'left',
  interactionId = null,
  onInteractionChange = null,
}) {
  const [selectedHotspot, setSelectedHotspot] = useState(null);
  const [isClient, setIsClient] = useState(false);
  const visibleHotspots = useMemo(
    () => spreadFloorplanHotspots
      .map((hotspot) => projectHotspotToPage(hotspot, crop))
      .filter(Boolean),
    [crop],
  );

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    return () => {
      if (interactionId && onInteractionChange) {
        onInteractionChange(interactionId, false);
      }
    };
  }, [interactionId, onInteractionChange]);

  useEffect(() => {
    if (!selectedHotspot) {
      return undefined;
    }

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setSelectedHotspot(null);
      }
    };

    window.addEventListener('keydown', handleEscape);

    return () => {
      window.removeEventListener('keydown', handleEscape);
    };
  }, [selectedHotspot]);

  return (
    <>
      <div
        aria-label={alt}
        role="img"
        className="relative h-full w-full overflow-hidden"
        onMouseEnter={() => onInteractionChange?.(interactionId, true)}
        onMouseLeave={() => onInteractionChange?.(interactionId, false)}
      >
        <div
          className="h-full w-full select-none bg-no-repeat"
          style={{
            backgroundImage: `url("${image}")`,
            backgroundPosition: pageImagePosition[crop],
            backgroundSize: pageImageSize[crop],
          }}
        />

        <div className="absolute inset-0 z-20">
          {visibleHotspots.map((hotspot) => {
            return (
              <button
                key={hotspot.id}
                type="button"
                aria-label={`Open ${hotspot.displayUnitCode} floor plan`}
                title={hotspot.displayUnitCode}
                onMouseDown={(event) => event.stopPropagation()}
                onTouchStart={(event) => event.stopPropagation()}
                onPointerDown={(event) => event.stopPropagation()}
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  setSelectedHotspot(hotspot);
                }}
                className="group absolute cursor-pointer bg-transparent outline-none"
                style={{
                  left: `${hotspot.localBox.x * 100}%`,
                  top: `${hotspot.localBox.y * 100}%`,
                  width: `${hotspot.localBox.width * 100}%`,
                  height: `${hotspot.localBox.height * 100}%`,
                }}
              >
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-[6%] border border-transparent bg-transparent transition duration-200 group-hover:border-[#7ff2e2]/38 group-hover:bg-[#7ff2e2]/10 group-focus-visible:border-[#7ff2e2]/44 group-focus-visible:bg-[#7ff2e2]/12"
                />
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute -top-7 left-1/2 -translate-x-1/2 whitespace-nowrap border border-[rgba(111,238,228,0.22)] bg-[rgba(8,24,28,0.86)] px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.14em] text-[#c8fffa] opacity-0 shadow-[0_8px_18px_rgba(0,0,0,0.18)] transition duration-200 group-hover:opacity-100 group-focus-visible:opacity-100"
                >
                  {hotspot.displayUnitCode}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {isClient ? (
        <FloorplanPreviewModal
          hotspot={selectedHotspot}
          onClose={() => setSelectedHotspot(null)}
        />
      ) : null}
    </>
  );
}
