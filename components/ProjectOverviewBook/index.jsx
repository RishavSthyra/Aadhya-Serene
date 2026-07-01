'use client';

import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import dynamic from 'next/dynamic';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import HTMLFlipBook from 'react-pageflip';
import ProjectOverviewWarmup from './Warmup';
import DeckPage from './DeckPage';
import SpreadZoomPage from './SpreadZoomPage';
import { flipbookPages } from './book-data';

const FLIP_AUDIO_URL = '/project-overview-book/audios/page-flip-01a.mp3';
const PAGE_ASPECT_RATIO = 1.08;
const ButterflyOverlay = dynamic(() => import('./ButterflyOverlay'), { ssr: false });

function useViewport() {
  const [viewport, setViewport] = useState({
    width: 1440,
    height: 900,
  });

  useEffect(() => {
    const updateViewport = () => {
      setViewport({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    updateViewport();
    window.addEventListener('resize', updateViewport);

    return () => {
      window.removeEventListener('resize', updateViewport);
    };
  }, []);

  return viewport;
}

function playFlipAudio() {
  const audio = new Audio(FLIP_AUDIO_URL);
  audio.volume = 0.5;
  audio.play().catch(() => {});
}

function getBookSize(width, height) {
  const isMobile = width < 768;
  const isTablet = width >= 768 && width < 1180;
  const horizontalPadding = isMobile ? 28 : isTablet ? 40 : 64;
  const verticalChromeReserve = isMobile ? 190 : isTablet ? 230 : 260;
  const maxPageWidth = isMobile ? width - horizontalPadding : (width - horizontalPadding) / 2;
  const preferredPageWidth = isMobile
    ? width * 0.9
    : isTablet
      ? Math.min((width - 40) / 2, 620)
      : Math.min((width - 56) / 2, 900);
  const availableHeight = Math.max(isMobile ? 500 : 540, height - verticalChromeReserve);
  let pageWidth = Math.min(maxPageWidth, preferredPageWidth);
  let pageHeight = pageWidth * PAGE_ASPECT_RATIO;

  if (pageHeight > availableHeight) {
    pageHeight = availableHeight;
    pageWidth = pageHeight / PAGE_ASPECT_RATIO;
  }

  return {
    isMobile,
    width: Math.floor(pageWidth),
    height: Math.floor(pageHeight),
  };
}

export default function ProjectOverviewBook() {
  const bookRef = useRef(null);
  const activeSpreadInteractionsRef = useRef(new Set());
  const [currentPage, setCurrentPage] = useState(0);
  const [bookState, setBookState] = useState('read');
  const viewport = useViewport();
  const bookSize = useMemo(
    () => getBookSize(viewport.width, viewport.height),
    [viewport.height, viewport.width],
  );

  useEffect(() => {
    document.body.style.opacity = '1';
    document.body.style.transition = '';

    const container = document.getElementById('project-overview-container');
    if (container) {
      container.style.opacity = '1';
      container.style.transition = '';
    }
  }, []);

  const handleFlip = (event) => {
    if (event.data !== currentPage) {
      playFlipAudio();
    }

    setCurrentPage(event.data);
  };

  const lastPageIndex = flipbookPages.length - 1;
  const totalBookWidth = bookSize.isMobile ? bookSize.width : bookSize.width * 2;
  const flipbookKey = bookSize.isMobile
    ? `mobile-${bookSize.width}`
    : `desktop-${bookSize.width}-${bookSize.height}`;
  const isFrontCoverView = !bookSize.isMobile && currentPage === 0;
  const isBackCoverView = !bookSize.isMobile && currentPage === lastPageIndex;
  const showLeftSide = bookSize.isMobile ? true : !isFrontCoverView;
  const showRightSide = bookSize.isMobile ? true : !isBackCoverView;
  const hideTransitionStacks = !bookSize.isMobile && bookState !== 'read';
  const isBookBusy = bookState !== 'read';
  const canGoToPreviousPage = currentPage > 0 && !isBookBusy;
  const canGoToNextPage = currentPage < lastPageIndex && !isBookBusy;

  const goToPage = (nextPage, corner) => {
    if (nextPage < 0 || nextPage > lastPageIndex || isBookBusy) {
      return;
    }

    bookRef.current?.pageFlip()?.flip(nextPage, corner);
  };

  const goToPreviousPage = () => {
    goToPage(currentPage - 1, 'top');
  };

  const goToNextPage = () => {
    goToPage(currentPage + 1, 'bottom');
  };

  useEffect(() => {
    activeSpreadInteractionsRef.current.clear();
    setCurrentPage(0);
    setBookState('read');
  }, [flipbookKey]);

  const syncSpreadInteractionState = useCallback((hasActiveInteraction) => {
    const pageFlip = bookRef.current?.pageFlip();
    const settings = pageFlip?.getSettings();

    if (!settings) {
      return;
    }

    settings.showPageCorners = bookSize.isMobile ? false : !hasActiveInteraction;
    settings.disableFlipByClick = hasActiveInteraction;

    if (hasActiveInteraction && pageFlip.getState() === 'fold_corner') {
      pageFlip.getFlipController()?.showCorner({ x: -1, y: -1 });
    }
  }, [bookSize.isMobile]);

  const handleSpreadInteractionChange = useCallback((interactionId, isActive) => {
    if (!interactionId) {
      return;
    }

    const nextActiveInteractions = activeSpreadInteractionsRef.current;

    if (isActive) {
      nextActiveInteractions.add(interactionId);
    } else {
      nextActiveInteractions.delete(interactionId);
    }

    syncSpreadInteractionState(nextActiveInteractions.size > 0);
  }, [syncSpreadInteractionState]);

  const getPageContent = (page) => {
    if (page.key !== 'spread-left' && page.key !== 'spread-right') {
      return null;
    }

    return (
      <SpreadZoomPage
        image={page.src}
        alt={page.alt}
        crop={page.crop}
        interactionId={page.key}
        onInteractionChange={handleSpreadInteractionChange}
      />
    );
  };

  return (
    <main
      id="project-overview-container"
      className="fixed inset-0 z-10 overflow-hidden bg-[#110d08] text-white"
    >
      <ProjectOverviewWarmup />
      <div
        className="pointer-events-none absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/Brochure_Bg.avif')" }}
      />
      <ButterflyOverlay />
      {/* <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(20,14,8,0.2)_0%,rgba(20,14,8,0.34)_45%,rgba(20,14,8,0.52)_100%)]" /> */}
      {/* <motion.img
        src={FLOATING_ILLUSTRATION_URL}
        alt=""
        aria-hidden="true"
        initial={{ opacity: 0, x: -42, y: 52, scaleX: -0.86, scaleY: 0.86, rotate: -4 }}
        animate={{ opacity: 1, x: 0, y: 0, scaleX: -1, scaleY: 1, rotate: 0 }}
        transition={{ duration: 0.76, delay: 0.18, ease: [0.22, 1, 0.36, 1] }}
        className="pointer-events-none absolute bottom-0 left-0 z-20 w-[clamp(180px,18vw,340px)] select-none brightness-[1.08] contrast-[1.04] drop-shadow-[0_22px_48px_rgba(0,0,0,0.24)] sm:w-[clamp(220px,20vw,420px)]"
      /> */}
      {/* <motion.img
        src={FLOATING_PLANT_URL}
        alt=""
        aria-hidden="true"
        initial={{ opacity: 0, x: 40, y: -36, scale: 0.82, rotate: 7 }}
        animate={{ opacity: 1, x: 0, y: 0, scale: 1, rotate: 0 }}
        transition={{ duration: 0.82, delay: 0.28, ease: [0.22, 1, 0.36, 1] }}
        className="pointer-events-none absolute right-[clamp(18px,3.2vw,52px)] top-0 z-20 w-[clamp(130px,13vw,260px)] select-none drop-shadow-[0_18px_40px_rgba(0,0,0,0.16)] sm:w-[clamp(160px,15vw,300px)]"
      /> */}

      <div className="relative flex min-h-dvh flex-col items-center justify-center px-4 pb-16 pt-28 sm:px-6 sm:pb-20 sm:pt-32 lg:px-10 lg:pb-20 lg:pt-36 xl:pt-40">
        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.985 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="relative flex w-full flex-col items-center"
        >
          {/* <div className="mb-5 inline-flex items-center gap-3 rounded-full border border-white/14 bg-black/24 px-4 py-2 text-[10px] uppercase tracking-[0.34em] text-white/74 shadow-[0_18px_40px_rgba(0,0,0,0.22)] backdrop-blur-xl sm:mb-6 sm:text-[11px]">
            <span>Project Overview</span>
            <span className="h-1 w-1 rounded-full bg-[#d8b37a]" />
            <span>{currentPage + 1} / {flipbookPages.length}</span>
          </div> */}

          <div className="relative flex w-full justify-center">
            <div
              className="relative mx-auto overflow-visible"
              style={{ width: totalBookWidth, height: bookSize.height }}
            >
              {!bookSize.isMobile ? (
                <>
                  <div className="pointer-events-none absolute bottom-[-28px] left-[8%] right-[8%] h-[54px] rounded-full bg-black/28 blur-[26px]" />
                  {!hideTransitionStacks && showLeftSide ? (
                    <>
                      <div className="pointer-events-none absolute inset-y-[16px] left-[0.9%] w-[48.8%] rounded-l-[14px] bg-[linear-gradient(180deg,#eadcc7_0%,#ddceb5_100%)] shadow-[0_30px_65px_rgba(0,0,0,0.18),10px_0_18px_rgba(96,65,32,0.15)]" />
                      <div className="pointer-events-none absolute inset-y-[10px] left-[0.6%] w-[48.9%] rounded-l-[16px] border border-black/6 bg-[linear-gradient(180deg,rgba(255,252,246,0.46),rgba(228,214,190,0.18))]" />
                      <div className="pointer-events-none absolute bottom-[-10px] left-[3.2%] h-[26px] w-[43%] rounded-full bg-black/20 blur-[16px]" />
                    </>
                  ) : null}
                  {!hideTransitionStacks && showRightSide ? (
                    <>
                      <div className="pointer-events-none absolute inset-y-[16px] right-[0.9%] w-[48.8%] rounded-r-[14px] bg-[linear-gradient(180deg,#f1e5d4_0%,#e3d2b7_100%)] shadow-[0_30px_65px_rgba(0,0,0,0.18),-10px_0_18px_rgba(96,65,32,0.15)]" />
                      <div className="pointer-events-none absolute inset-y-[10px] right-[0.6%] w-[48.9%] rounded-r-[16px] border border-black/6 bg-[linear-gradient(180deg,rgba(255,252,246,0.46),rgba(228,214,190,0.18))]" />
                      <div className="pointer-events-none absolute bottom-[-10px] right-[3.2%] h-[26px] w-[43%] rounded-full bg-black/20 blur-[16px]" />
                    </>
                  ) : null}
                  {!hideTransitionStacks && showLeftSide && showRightSide ? (
                    <div className="pointer-events-none absolute inset-y-[8px] left-1/2 z-20 w-[30px] -translate-x-1/2 bg-[linear-gradient(90deg,rgba(52,31,12,0.18)_0%,rgba(255,255,255,0.3)_14%,rgba(113,81,46,0.14)_34%,rgba(28,18,10,0.34)_50%,rgba(113,81,46,0.14)_66%,rgba(255,255,255,0.26)_86%,rgba(52,31,12,0.18)_100%)]" />
                  ) : null}
                </>
              ) : null}

              <div className="relative z-[80] [filter:drop-shadow(0_22px_46px_rgba(0,0,0,0.28))]">
                <HTMLFlipBook
                  key={flipbookKey}
                  ref={bookRef}
                  width={bookSize.width}
                  height={bookSize.height}
                  size="fixed"
                  drawShadow={!bookSize.isMobile}
                  flippingTime={bookSize.isMobile ? 700 : 1000}
                  maxShadowOpacity={bookSize.isMobile ? 0.18 : 0.28}
                  showCover={!bookSize.isMobile}
                  mobileScrollSupport
                  usePortrait={bookSize.isMobile}
                  startPage={0}
                  autoSize={false}
                  swipeDistance={bookSize.isMobile ? 12 : 24}
                  clickEventForward
                  useMouseEvents
                  showPageCorners={!bookSize.isMobile}
                  disableFlipByClick={false}
                  startZIndex={5}
                  onFlip={handleFlip}
                  onChangeState={(event) => setBookState(event.data)}
                  className="mx-auto"
                >
                  {flipbookPages.map((page) => (
                    <DeckPage
                      key={page.key}
                      image={page.src}
                      alt={page.alt}
                      crop={page.crop}
                      hard={!bookSize.isMobile && page.hard}
                      content={getPageContent(page)}
                    />
                  ))}
                </HTMLFlipBook>
              </div>
            </div>
          </div>

          <div className="mt-6 flex items-center gap-3 sm:mt-7 lg:absolute lg:bottom-[-88px] lg:left-1/2 lg:mt-0 lg:-translate-x-1/2">
            <button
              type="button"
              onClick={goToPreviousPage}
              disabled={!canGoToPreviousPage}
              aria-label="Turn page left"
              className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white shadow-[0_18px_40px_rgba(0,0,0,0.22)] backdrop-blur-xl transition duration-200 hover:bg-white/16 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronLeft className="h-5 w-5" strokeWidth={2.3} />
            </button>

            <button
              type="button"
              onClick={goToNextPage}
              disabled={!canGoToNextPage}
              aria-label="Turn page right"
              className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white shadow-[0_18px_40px_rgba(0,0,0,0.22)] backdrop-blur-xl transition duration-200 hover:bg-white/16 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronRight className="h-5 w-5" strokeWidth={2.3} />
            </button>
          </div>
        </motion.div>
      </div>
    </main>
  );
}
