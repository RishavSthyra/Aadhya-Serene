'use client';

import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import HTMLFlipBook from 'react-pageflip';
import DeckPage from './DeckPage';
import { flipbookPages } from './book-data';

const FLIP_AUDIO_URL = '/project-overview-book/audios/page-flip-01a.mp3';
const PAGE_ASPECT_RATIO = 1.414;

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
  const maxPageWidth = isMobile ? width - horizontalPadding : (width - horizontalPadding) / 2;
  const preferredPageWidth = isMobile
    ? width * 0.82
    : isTablet
      ? Math.min((width - 52) / 2, 520)
      : Math.min((width - 72) / 2, 820);
  const availableHeight = Math.max(500, height - (isMobile ? 220 : 210));
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
  const [currentPage, setCurrentPage] = useState(0);
  const [bookState, setBookState] = useState('read');
  const viewport = useViewport();
  const bookSize = useMemo(
    () => getBookSize(viewport.width, viewport.height),
    [viewport.height, viewport.width],
  );

  useEffect(() => {
    setCurrentPage(0);
  }, [bookSize.height, bookSize.width]);

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

  const goToPreviousPage = () => {
    bookRef.current?.pageFlip()?.flipPrev('bottom');
  };

  const goToNextPage = () => {
    bookRef.current?.pageFlip()?.flipNext('bottom');
  };

  const lastPageIndex = flipbookPages.length - 1;
  const totalBookWidth = bookSize.isMobile ? bookSize.width : bookSize.width * 2;
  const isFrontCoverView = !bookSize.isMobile && currentPage === 0;
  const isBackCoverView = !bookSize.isMobile && currentPage === lastPageIndex;
  const showLeftSide = bookSize.isMobile ? true : !isFrontCoverView;
  const showRightSide = bookSize.isMobile ? true : !isBackCoverView;
  const hideTransitionStacks = !bookSize.isMobile && bookState !== 'read';

  return (
    <main
      id="project-overview-container"
      className="fixed inset-0 z-10 overflow-hidden bg-[#110d08] text-white"
    >
      <div
        className="pointer-events-none absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/BROCHUREIMAGE2.avif')" }}
      />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(20,14,8,0.1)_0%,rgba(20,14,8,0.2)_45%,rgba(20,14,8,0.36)_100%)]" />

      <div className="relative flex min-h-dvh flex-col items-center justify-center px-4 py-24 sm:px-6 sm:py-28 lg:px-10">
        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.985 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="flex w-full flex-col items-center"
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

              <div className="relative z-30 [filter:drop-shadow(0_22px_46px_rgba(0,0,0,0.28))]">
                <HTMLFlipBook
                  key={`${bookSize.width}-${bookSize.height}-${bookSize.isMobile ? 'mobile' : 'desktop'}`}
                  ref={bookRef}
                  width={bookSize.width}
                  height={bookSize.height}
                  size="fixed"
                  drawShadow
                  flippingTime={1000}
                  maxShadowOpacity={0.28}
                  showCover
                  mobileScrollSupport
                  usePortrait={bookSize.isMobile}
                  startPage={0}
                  autoSize={false}
                  swipeDistance={24}
                  clickEventForward
                  useMouseEvents
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
                      hard={page.hard}
                    />
                  ))}
                </HTMLFlipBook>
              </div>
            </div>
          </div>

          <div className="mt-6 flex items-center gap-3 sm:mt-7">
            <button
              type="button"
              onClick={goToPreviousPage}
              disabled={currentPage <= 0}
              aria-label="Turn page left"
              className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white shadow-[0_18px_40px_rgba(0,0,0,0.22)] backdrop-blur-xl transition duration-200 hover:bg-white/16 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronLeft className="h-5 w-5" strokeWidth={2.3} />
            </button>

            <div className="rounded-full border border-white/12 bg-black/22 px-4 py-2 text-[11px] uppercase tracking-[0.24em] text-white/70 shadow-[0_18px_40px_rgba(0,0,0,0.18)] backdrop-blur-xl">
              Swipe or click page corners
            </div>

            <button
              type="button"
              onClick={goToNextPage}
              disabled={currentPage >= lastPageIndex}
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
