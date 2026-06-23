'use client';

import { useEffect, useRef } from 'react';

const pageImagePosition = {
  left: 'left center',
  right: 'right center',
};

const pageImageSize = {
  left: '200% 100%',
  right: '200% 100%',
};

const LENS_MARGIN = 10;

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function getLensMetrics(width, height) {
  const diameter = Math.round(Math.min(176, Math.max(118, width * 0.34)));
  const radius = diameter / 2;

  return {
    diameter,
    radius,
    offsetX: Math.round(radius * 0.52),
    offsetY: Math.round(radius * 0.52),
    zoom: width < 280 ? 2.05 : width < 420 ? 2.25 : 2.45,
    width,
    height,
  };
}

export default function SpreadZoomPage({ image, alt, crop = 'left' }) {
  const rootRef = useRef(null);
  const lensRef = useRef(null);
  const surfaceRef = useRef(null);
  const frameRef = useRef(0);
  const pointerRef = useRef({ clientX: 0, clientY: 0 });
  const metricsRef = useRef(null);
  const translateRef = useRef({ x: 0, y: 0 });
  const isPointerCapableRef = useRef(false);
  const isVisibleRef = useRef(false);

  const hideLens = () => {
    const lens = lensRef.current;

    if (!lens) {
      return;
    }

    const { x, y } = translateRef.current;
    isVisibleRef.current = false;
    lens.style.opacity = '0';
    lens.style.transform = `translate3d(${x}px, ${y}px, 0) scale(0.92)`;
  };

  const updateMetrics = () => {
    const root = rootRef.current;
    const lens = lensRef.current;

    if (!root || !lens) {
      return null;
    }

    const rect = root.getBoundingClientRect();
    const nextMetrics = getLensMetrics(rect.width, rect.height);
    metricsRef.current = {
      ...nextMetrics,
      left: rect.left,
      top: rect.top,
    };

    lens.style.width = `${nextMetrics.diameter}px`;
    lens.style.height = `${nextMetrics.diameter}px`;

    return metricsRef.current;
  };

  const renderLens = () => {
    frameRef.current = 0;

    const lens = lensRef.current;
    const surface = surfaceRef.current;
    const metrics = metricsRef.current ?? updateMetrics();

    if (!lens || !surface || !metrics || !isVisibleRef.current) {
      return;
    }

    const localX = clamp(pointerRef.current.clientX - metrics.left, 0, metrics.width);
    const localY = clamp(pointerRef.current.clientY - metrics.top, 0, metrics.height);
    const lensCenterX = clamp(
      localX + metrics.offsetX,
      metrics.radius + LENS_MARGIN,
      metrics.width - metrics.radius - LENS_MARGIN,
    );
    const lensCenterY = clamp(
      localY + metrics.offsetY,
      metrics.radius + LENS_MARGIN,
      metrics.height - metrics.radius - LENS_MARGIN,
    );
    const translateX = lensCenterX - metrics.radius;
    const translateY = lensCenterY - metrics.radius;
    const fullImageX = crop === 'left' ? localX : metrics.width + localX;
    const backgroundWidth = metrics.width * 2 * metrics.zoom;
    const backgroundHeight = metrics.height * metrics.zoom;

    translateRef.current = {
      x: translateX,
      y: translateY,
    };

    lens.style.opacity = '1';
    lens.style.transform = `translate3d(${translateX}px, ${translateY}px, 0) scale(1)`;
    surface.style.backgroundSize = `${backgroundWidth}px ${backgroundHeight}px`;
    surface.style.backgroundPosition = `${metrics.radius - fullImageX * metrics.zoom}px ${
      metrics.radius - localY * metrics.zoom
    }px`;
  };

  const scheduleRender = () => {
    if (frameRef.current) {
      return;
    }

    frameRef.current = window.requestAnimationFrame(renderLens);
  };

  const handlePointerEnter = (event) => {
    if (!isPointerCapableRef.current) {
      return;
    }

    pointerRef.current = {
      clientX: event.clientX,
      clientY: event.clientY,
    };
    isVisibleRef.current = true;
    updateMetrics();
    scheduleRender();
  };

  const handlePointerMove = (event) => {
    if (!isPointerCapableRef.current || !isVisibleRef.current) {
      return;
    }

    pointerRef.current = {
      clientX: event.clientX,
      clientY: event.clientY,
    };
    scheduleRender();
  };

  const handlePointerLeave = () => {
    hideLens();
  };

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined;
    }

    const capabilityQuery = window.matchMedia('(hover: hover) and (pointer: fine)');
    const syncCapability = () => {
      isPointerCapableRef.current = capabilityQuery.matches;

      if (!capabilityQuery.matches) {
        hideLens();
      }
    };
    const handleResize = () => {
      if (!isVisibleRef.current) {
        return;
      }

      updateMetrics();
      scheduleRender();
    };

    syncCapability();

    if (capabilityQuery.addEventListener) {
      capabilityQuery.addEventListener('change', syncCapability);
    } else {
      capabilityQuery.addListener(syncCapability);
    }

    window.addEventListener('resize', handleResize);

    return () => {
      if (capabilityQuery.removeEventListener) {
        capabilityQuery.removeEventListener('change', syncCapability);
      } else {
        capabilityQuery.removeListener(syncCapability);
      }

      window.removeEventListener('resize', handleResize);

      if (frameRef.current) {
        window.cancelAnimationFrame(frameRef.current);
      }
    };
  }, []);

  return (
    <div
      ref={rootRef}
      aria-label={alt}
      role="img"
      onPointerEnter={handlePointerEnter}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      onPointerCancel={handlePointerLeave}
      className="relative h-full w-full cursor-[zoom-in] overflow-hidden"
    >
      <div
        className="h-full w-full select-none bg-no-repeat"
        style={{
          backgroundImage: `url("${image}")`,
          backgroundPosition: pageImagePosition[crop],
          backgroundSize: pageImageSize[crop],
        }}
      />

      <div
        ref={lensRef}
        aria-hidden="true"
        className="pointer-events-none absolute left-0 top-0 z-30 overflow-hidden rounded-full opacity-0 will-change-transform"
        style={{
          transform: 'translate3d(0, 0, 0) scale(0.92)',
          transition: 'opacity 180ms ease-out',
          background:
            'linear-gradient(180deg, rgba(255,255,255,0.24), rgba(255,255,255,0.08))',
          boxShadow:
            '0 24px 50px rgba(6,10,18,0.38), inset 0 1px 0 rgba(255,255,255,0.42), inset 0 -16px 26px rgba(255,255,255,0.08)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
        }}
      >
        <div
          className="absolute inset-[7px] overflow-hidden rounded-full"
          style={{
            boxShadow:
              'inset 0 0 0 1px rgba(255,255,255,0.2), inset 0 18px 28px rgba(255,255,255,0.08)',
          }}
        >
          <div
            ref={surfaceRef}
            className="absolute inset-0 rounded-full bg-no-repeat"
            style={{
              backgroundImage: `url("${image}")`,
              filter: 'saturate(1.05) contrast(1.04) brightness(1.02)',
              transform: 'translateZ(0)',
            }}
          />
          <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_28%_24%,rgba(255,255,255,0.34),transparent_34%),radial-gradient(circle_at_72%_76%,rgba(255,255,255,0.08),transparent_46%)]" />
        </div>

        <div className="absolute inset-0 rounded-full border border-white/45 shadow-[inset_0_1px_0_rgba(255,255,255,0.5),inset_0_-14px_22px_rgba(255,255,255,0.12)]" />
        <div className="absolute inset-[3px] rounded-full border border-white/18" />
        <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_24%_18%,rgba(255,255,255,0.34),transparent_24%),linear-gradient(135deg,rgba(255,255,255,0.16),transparent_44%,rgba(255,255,255,0.1)_100%)]" />
        <div className="absolute left-[17%] top-[12%] h-[25%] w-[32%] rounded-full bg-white/28 blur-[10px]" />
      </div>
    </div>
  );
}
