"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { usePathname, useRouter } from "next/navigation";
import {
  ChevronDown,
  ChevronRight,
  ChevronUp,
} from "lucide-react";
import { useApartmentsData } from "../../hooks/useApartmentsData";
import Filters from "./Filters";
import ApartmentList from "./ApartmentList";
import { preloadInteriorStartPano } from "../../lib/interior-panos";
import { warmApartment360Frames } from "../../lib/apartment360Warmup";
import {
  cancelIdleFlatVideoWarmup,
  preloadFlatEntryVideo,
  scheduleIdleFlatVideoWarmup,
} from "../../lib/flats";
import { isBackgroundTransitionActive } from "../../lib/background-transition";
import useResponsiveViewport from "../../hooks/useResponsiveViewport";

const DESKTOP_PANEL_WIDTH = 420;
const COMPACT_VIEWER_ASPECT_RATIO = 16 / 9;
const Apartment360Viewer = dynamic(() => import("../Apartment360Viewer"), {
  ssr: false,
  loading: () => null,
});

export default function Apartments() {
  const {
    data,
    allData,
    loading,
    error,
    filters,
    toggleFilter,
    setAreaRange,
    toggleBoolean,
    resetFilters,
  } = useApartmentsData();

  const router = useRouter();
  const pathname = usePathname();
  const { isMobile, isTablet, isTabletOrBelow, width, height } = useResponsiveViewport();

  const [isPanelOpen, setIsPanelOpen] = useState(true);
  const [isVideoPlaying, setIsVideoPlaying] = useState(() => isBackgroundTransitionActive("apartments"));
  const [viewerVersion, setViewerVersion] = useState(0);
  const [shouldMountViewer, setShouldMountViewer] = useState(false);
  const [isViewerReady, setIsViewerReady] = useState(false);
  const [pendingFlatId, setPendingFlatId] = useState(null);
  const prefetchedFlatRoutesRef = useRef(new Set());
  const hasHandledInitialPathRef = useRef(false);
  const isCompactLayout = isTabletOrBelow;
  const isShortDesktop = !isCompactLayout && height <= 900;
  const shouldUseCompactCards = isCompactLayout || isShortDesktop;
  const desktopPanelWidth = isShortDesktop ? 372 : width >= 1536 ? DESKTOP_PANEL_WIDTH : 390;
  const compactBottomOffset = "calc(86px + env(safe-area-inset-bottom, 0px))";
  const compactSheetOverlap = isCompactLayout ? 1 : 0;
  const compactMediaHeight = isTabletOrBelow
    ? `${Math.min(
      Math.max(
        Math.round(width / COMPACT_VIEWER_ASPECT_RATIO),
        isTablet ? 360 : 220,
      ),
      Math.round(height * (isTablet ? 0.54 : 0.46)),
      isTablet ? 600 : 320,
    )}px`
    : "min(42dvh, 380px)";
  const isFlatRoutePreparing = pendingFlatId !== null;
  const sharedScrollStyles = {
    scrollbarWidth: "thin",
    scrollbarColor: "rgba(33,24,39,0.16) transparent",
    scrollBehavior: "smooth",
    WebkitOverflowScrolling: "touch",
    overscrollBehavior: "contain",
  };

  const resetApartmentsExperience = useCallback((remountViewer = false) => {
    document.body.style.opacity = "1";
    document.body.style.transition = "";
    setIsVideoPlaying(isBackgroundTransitionActive("apartments"));
    setIsViewerReady(false);
    setShouldMountViewer(false);
    setPendingFlatId(null);

    if (remountViewer) {
      setViewerVersion((current) => current + 1);
    }
  }, []);

  useEffect(() => {
    const handleStart = (event) => {
      if (!event.detail || event.detail?.layout === "apartments") {
        setIsVideoPlaying(true);
      }
    };
    const handleEnd = (event) => {
      if (!event.detail || event.detail?.layout === "apartments") {
        setIsVideoPlaying(false);
      }
    };
    const handlePageShow = (event) => {
      if (event.persisted) {
        resetApartmentsExperience(true);
      }
    };

    resetApartmentsExperience(true);

    window.addEventListener("bg-transition-started", handleStart);
    window.addEventListener("bg-transition-ended", handleEnd);
    window.addEventListener("pageshow", handlePageShow);

    return () => {
      window.removeEventListener("bg-transition-started", handleStart);
      window.removeEventListener("bg-transition-ended", handleEnd);
      window.removeEventListener("pageshow", handlePageShow);
    };
  }, [resetApartmentsExperience]);

  useEffect(() => {
    if (pathname !== "/apartments") {
      return;
    }

    if (!hasHandledInitialPathRef.current) {
      hasHandledInitialPathRef.current = true;
      return;
    }

    resetApartmentsExperience(true);
  }, [pathname, resetApartmentsExperience]);

  useEffect(() => {
    setIsPanelOpen((current) => (isCompactLayout ? current : true));
  }, [isCompactLayout]);

  const prioritizedWarmupFlatIds = useMemo(
    () => data.slice(0, 18).map((flat) => flat.id),
    [data],
  );

  useEffect(() => {
    if (pathname !== "/apartments" || !allData?.length) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      scheduleIdleFlatVideoWarmup({
        prioritizeFlatIds: prioritizedWarmupFlatIds,
      });
    }, isCompactLayout ? 300 : 80);

    return () => {
      window.clearTimeout(timeoutId);
      cancelIdleFlatVideoWarmup();
    };
  }, [allData?.length, isCompactLayout, pathname, prioritizedWarmupFlatIds]);

  useEffect(() => {
    if (pathname !== "/apartments" || isVideoPlaying) {
      return undefined;
    }

    let cancelled = false;
    let cancelRotatorWarmup = null;

    void warmApartment360Frames({
      isConstrainedDevice: isCompactLayout,
      includeInteractionFrames: true,
    }).then((cleanup) => {
      if (cancelled) {
        cleanup?.();
        return;
      }

      cancelRotatorWarmup = cleanup;
    });

    return () => {
      cancelled = true;
      cancelRotatorWarmup?.();
    };
  }, [isCompactLayout, isVideoPlaying, pathname]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return undefined;
    }

    if (isVideoPlaying || shouldMountViewer) {
      return undefined;
    }

    const rafId = window.requestAnimationFrame(() => {
      setShouldMountViewer(true);
    });

    return () => {
      window.cancelAnimationFrame(rafId);
    };
  }, [isVideoPlaying, shouldMountViewer, viewerVersion]);

  const shouldRevealViewer = shouldMountViewer && isViewerReady && !isVideoPlaying;

  const filteredFlatIds = useMemo(() => {
    if (!allData || data.length === allData.length) return null;
    return new Set(data.map((flat) => flat.id));
  }, [data, allData]);

  const handleFlatClick = useCallback(
    async (flatId, options = {}) => {
      if (!flatId || pendingFlatId) {
        return;
      }

      const viewKey = typeof options === "string" ? options : options?.viewKey;
      const apartmentHref = viewKey
        ? `/apartments/${flatId}?view=${encodeURIComponent(viewKey)}`
        : `/apartments/${flatId}`;

      setPendingFlatId(flatId);
      void preloadInteriorStartPano();
      router.prefetch("/interior-panos");

      if (!prefetchedFlatRoutesRef.current.has(flatId)) {
        prefetchedFlatRoutesRef.current.add(flatId);
        router.prefetch(apartmentHref);
      }

      try {
        await Promise.race([
          preloadFlatEntryVideo(flatId, {
            aggressive: true,
            timeoutMs: isTabletOrBelow ? 900 : 1400,
          }),
          new Promise((resolve) => {
            window.setTimeout(resolve, isTabletOrBelow ? 450 : 700);
          }),
        ]);
      } finally {
        window.requestAnimationFrame(() => {
          router.push(apartmentHref);
        });
      }
    },
    [isTabletOrBelow, pendingFlatId, router],
  );

  const handleFlatHoverStart = useCallback(
    (flatId) => {
      if (!flatId) return;

      preloadFlatEntryVideo(flatId);

      if (!prefetchedFlatRoutesRef.current.has(flatId)) {
        prefetchedFlatRoutesRef.current.add(flatId);
        router.prefetch(`/apartments/${flatId}`);
      }
    },
    [router],
  );

  const renderListContent = (
    <div className={`space-y-2 ${shouldUseCompactCards ? "px-0 pb-1 pt-0" : "px-0 pb-2 pt-0"}`}>
      {loading ? (
        <div className="border border-[#211827]/10 bg-white/76 px-6 py-8 text-center text-xs text-[#1c1c20]/62 shadow-[0_18px_42px_rgba(88,47,117,0.08)] backdrop-blur-[20px]">
          Loading...
        </div>
      ) : error ? (
        <div className="border border-red-200/70 bg-red-50/88 px-6 py-8 text-center text-xs text-red-700 backdrop-blur-[20px]">
          Error loading apartments.
        </div>
      ) : (
        <ApartmentList
          apartments={data}
          compactMode={shouldUseCompactCards}
          onSelect={(apartment) => handleFlatClick(apartment.id)}
        />
      )}
    </div>
  );

  const renderDesktopPanel = (
    <div
      className="fixed right-0 top-[104px] z-[120] hidden xl:block"
      style={{
        top: isShortDesktop ? "92px" : "104px",
        opacity: isVideoPlaying ? 0 : 1,
        pointerEvents: isVideoPlaying || isFlatRoutePreparing ? "none" : "auto",
        transform: isPanelOpen ? "translateX(0)" : `translateX(${desktopPanelWidth + 20}px)`,
        transition: "transform 420ms cubic-bezier(0.22,1,0.36,1), opacity 280ms ease",
      }}
    >
      <aside
        className="mr-4 flex flex-col"
        style={{
          width: `${desktopPanelWidth}px`,
          height: isShortDesktop ? "calc(100dvh - 106px)" : "calc(100dvh - 116px)",
          maxHeight: isShortDesktop ? "calc(100dvh - 106px)" : "calc(100dvh - 116px)",
          gap: isShortDesktop ? "9px" : "12px",
        }}
      >
        <style>{`
          .scrollbar-thin::-webkit-scrollbar { width: 4px; }
          .scrollbar-thin::-webkit-scrollbar-track { background: transparent; }
          .scrollbar-thin::-webkit-scrollbar-thumb {
            background: rgba(33,24,39,0.16);
            border-radius: 999px;
          }
          .scrollbar-thin::-webkit-scrollbar-thumb:hover {
            background: rgba(156,77,170,0.26);
          }
        `}</style>

        <section className="relative shrink-0 overflow-hidden rounded-[22px] border border-[#211827]/10 bg-[linear-gradient(145deg,rgba(255,255,255,0.96)_0%,rgba(252,249,255,0.95)_56%,rgba(255,255,255,0.92)_100%)] shadow-[-14px_0_58px_rgba(68,38,88,0.12),inset_0_1px_0_rgba(255,255,255,0.95)] backdrop-blur-[28px]">
          <div className="pointer-events-none absolute -right-16 -top-20 h-52 w-56 rotate-12 bg-[conic-gradient(from_220deg_at_50%_50%,rgba(177,78,255,0),rgba(177,78,255,0.13),rgba(236,86,171,0.11),rgba(177,78,255,0))] blur-2xl" />
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.3),rgba(255,255,255,0.08)_28%,rgba(255,255,255,0.02)_100%)]" />
          <div
            className="relative overflow-y-auto scrollbar-thin"
            style={{
              ...sharedScrollStyles,
              maxHeight: isShortDesktop ? "40dvh" : "45dvh",
            }}
          >
            <Filters
              filters={filters}
              onToggle={toggleFilter}
              onSetRange={setAreaRange}
              onToggleBoolean={toggleBoolean}
              onClose={() => setIsPanelOpen(false)}
              onReset={resetFilters}
              resultCount={data.length}
              totalCount={allData?.length ?? data.length}
            />
          </div>
        </section>

        <section className="relative flex min-h-0 flex-1 flex-col overflow-hidden rounded-[22px] border border-[#211827]/10 bg-[linear-gradient(145deg,rgba(255,255,255,0.94)_0%,rgba(252,249,255,0.92)_58%,rgba(255,255,255,0.9)_100%)] shadow-[-14px_0_58px_rgba(68,38,88,0.12),inset_0_1px_0_rgba(255,255,255,0.95)] backdrop-blur-[28px]">
          <div className="pointer-events-none absolute -right-20 -top-24 h-56 w-60 rotate-12 bg-[conic-gradient(from_220deg_at_50%_50%,rgba(177,78,255,0),rgba(177,78,255,0.12),rgba(236,86,171,0.1),rgba(177,78,255,0))] blur-2xl" />
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.26),rgba(255,255,255,0.06)_28%,rgba(255,255,255,0.02)_100%)]" />
          <div className="relative flex items-start justify-between gap-3 border-b border-[#211827]/8 px-4 pb-3 pt-3.5">
            <div className="min-w-0">
              <h3 className="text-[1.58rem] font-semibold leading-none tracking-[-0.02em] text-[#151518] 2xl:text-[1.72rem]">
                Matching Flats
              </h3>
              <p className="mt-1.5 text-[11.5px] leading-4 text-[#1c1c20]/54 2xl:text-[12px]">
                View apartments matching your current filters.
              </p>
            </div>
            <span className="shrink-0 rounded-full border border-[#211827]/10 bg-[#f4f0f7] px-2.5 py-1 text-[10.5px] font-semibold text-[#151518]/70 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]">
              {data.length} units
            </span>
          </div>
          <div
            className="relative min-h-0 flex-1 overflow-y-auto px-3 pb-3 pt-2.5 scrollbar-thin"
            style={sharedScrollStyles}
          >
            {renderListContent}
          </div>
        </section>
      </aside>
    </div>
  );

  const renderCompactSheet = (
    <>
      {isPanelOpen ? (
        <button
          type="button"
          aria-label="Close apartments panel backdrop"
          onClick={() => setIsPanelOpen(false)}
          className="fixed inset-0 z-[109] bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.12),rgba(20,16,26,0.2))] backdrop-blur-[3px] xl:hidden"
          style={{
            top: `calc(${compactMediaHeight} - ${compactSheetOverlap}px)`,
          }}
        />
      ) : null}

      <div
        className="fixed inset-x-0 bottom-0 z-[120] xl:hidden"
        style={{
          top: `calc(${compactMediaHeight} - ${compactSheetOverlap}px)`,
          bottom: compactBottomOffset,
          opacity: 1,
          pointerEvents: isFlatRoutePreparing ? "none" : "auto",
          height: "auto",
          transform: isPanelOpen
            ? "translateY(0)"
            : "translateY(calc(100% - 82px))",
          transition: "transform 300ms cubic-bezier(0.22,1,0.36,1)",
        }}
      >
        <aside className="relative flex h-full flex-col overflow-hidden rounded-t-[22px] border border-b-0 border-x-0 border-[#211827]/10 bg-[linear-gradient(145deg,rgba(255,255,255,0.96)_0%,rgba(252,249,255,0.94)_58%,rgba(255,255,255,0.92)_100%)] shadow-[0_-20px_60px_rgba(68,38,88,0.16),inset_0_1px_0_rgba(255,255,255,0.96)] backdrop-blur-[28px] saturate-[140%]">
          <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-72 rotate-12 bg-[conic-gradient(from_220deg_at_50%_50%,rgba(177,78,255,0),rgba(177,78,255,0.13),rgba(236,86,171,0.11),rgba(177,78,255,0))] blur-2xl" />
          <div className="relative flex items-center justify-between gap-3 border-b border-[#211827]/8 px-4 pb-3 pt-3">
            <div className="absolute inset-x-0 top-1 flex justify-center">
              <div className="h-1.5 w-14 rounded-full bg-[#211827]/12" />
            </div>
            <div className="min-w-0">
              <p className="text-[8px] font-semibold uppercase tracking-[0.16em] text-[#1c1c20]/62">
                Residence Atelier
              </p>
              <p className="mt-1 text-[11px] text-[#1c1c20]/54 md:text-[12px]">
                {data.length} matches from {allData?.length ?? data.length} homes
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={resetFilters}
                className="rounded-full border border-[#211827]/10 bg-white px-3 py-2 text-[14px] font-medium uppercase tracking-[0.08em] text-[#1c1c20]/68 shadow-[0_14px_32px_rgba(88,47,117,0.08),inset_0_1px_0_rgba(255,255,255,0.95)] backdrop-blur-[18px] transition hover:border-[#211827]/16 hover:text-[#151518]"
              >
                Reset
              </button>
              <button
                type="button"
                onClick={() => setIsPanelOpen((current) => !current)}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-[#211827]/10 bg-white text-[#1c1c20]/68 shadow-[0_14px_32px_rgba(88,47,117,0.08),inset_0_1px_0_rgba(255,255,255,0.95)] backdrop-blur-[18px] transition hover:border-[#211827]/16 hover:text-[#151518]"
                aria-label={isPanelOpen ? "Collapse apartments panel" : "Expand apartments panel"}
              >
                {isPanelOpen ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
              </button>
            </div>
          </div>

          <div
            className="min-h-0 flex-1 overflow-y-auto px-3 pb-5 pt-3 scrollbar-thin"
            style={sharedScrollStyles}
          >
            <div className="space-y-3">
              <section className="relative overflow-hidden rounded-[20px] border border-[#211827]/8 bg-white/54 shadow-[0_18px_46px_rgba(88,47,117,0.08),inset_0_1px_0_rgba(255,255,255,0.86)] backdrop-blur-[24px]">
                <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.3),rgba(255,255,255,0.04)_100%)]" />
                <div className="relative">
                  <Filters
                    filters={filters}
                    onToggle={toggleFilter}
                    onSetRange={setAreaRange}
                    onToggleBoolean={toggleBoolean}
                    onClose={() => setIsPanelOpen(false)}
                    onReset={resetFilters}
                    resultCount={data.length}
                    totalCount={allData?.length ?? data.length}
                    showCloseButton={false}
                    compactMode
                  />
                </div>
              </section>

              <section className="relative overflow-hidden rounded-[20px] border border-[#211827]/8 bg-white/54 shadow-[0_18px_46px_rgba(88,47,117,0.08),inset_0_1px_0_rgba(255,255,255,0.86)] backdrop-blur-[24px]">
                <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.3),rgba(255,255,255,0.04)_100%)]" />
                <div className="relative border-b border-[#211827]/8 px-4 pb-3 pt-3.5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-[20px] font-semibold leading-none tracking-[-0.02em] text-[#151518]">
                        Matching Flats
                      </h3>
                      <p className="mt-1 text-[11px] leading-4 text-[#1c1c20]/54">
                        View apartments matching your filters.
                      </p>
                    </div>
                    <span className="shrink-0 rounded-full border border-[#211827]/10 bg-[#f4f0f7] px-2.5 py-1 text-[10px] font-semibold text-[#151518]/70 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]">
                      {data.length} units
                    </span>
                  </div>
                </div>
                <div className="relative px-3 pb-3 pt-2">
                  {renderListContent}
                </div>
              </section>
            </div>
          </div>
        </aside>
      </div>
    </>
  );

  return (
    <div
      className="fixed inset-0 overflow-hidden"
      style={{
        backgroundColor: "transparent",
      }}
    >
      <div
        className="absolute z-0"
        style={{
          top: 0,
          right: isCompactLayout ? 0 : 0,
          bottom: isCompactLayout ? "auto" : 0,
          left: 0,
          width: isCompactLayout ? "100vw" : "auto",
          height: isCompactLayout ? compactMediaHeight : "auto",
          transform: "none",
          overflow: "hidden",
          backgroundColor: "transparent",
          opacity: shouldRevealViewer ? 1 : 0,
          transition: isCompactLayout ? "opacity 0.18s linear" : "opacity 0.38s ease",
          pointerEvents: shouldRevealViewer && !isFlatRoutePreparing ? "auto" : "none",
          backgroundImage: "linear-gradient(180deg, rgba(11,16,24,0.08), rgba(11,16,24,0.3))",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          backgroundSize: "cover",
        }}
      >
        {shouldMountViewer ? (
          <Apartment360Viewer
            key={viewerVersion}
            onFlatClick={handleFlatClick}
            onFlatHoverStart={handleFlatHoverStart}
            filteredFlatIds={filteredFlatIds}
            onReadyChange={setIsViewerReady}
            interactionLocked={isFlatRoutePreparing}
          />
        ) : (
          <div className="h-full w-full bg-transparent" />
        )}
      </div>

      <div className="pointer-events-none absolute inset-0 z-10 bg-[linear-gradient(90deg,rgba(8,19,38,0.05)_0%,rgba(9,24,46,0.01)_28%,rgba(10,26,52,0.1)_100%)]" />

      {isFlatRoutePreparing ? (
        <div className="absolute inset-0 z-[125] flex items-center justify-center bg-[radial-gradient(circle_at_center,rgba(193,216,255,0.08),rgba(6,10,18,0.16))] backdrop-blur-[3px]">
          <div className="border border-white/14 bg-[linear-gradient(180deg,rgba(12,18,28,0.82),rgba(8,13,20,0.58))] px-5 py-3 text-center shadow-[0_18px_42px_rgba(7,10,18,0.22)] backdrop-blur-[18px]">
            <p className="text-[9px] font-semibold uppercase tracking-[0.22em] text-white/58">
              Preparing Residence
            </p>
            <p className="mt-1.5 text-[13px] font-medium tracking-[0.06em] text-white/88">
              Apartment {pendingFlatId}
            </p>
          </div>
        </div>
      ) : null}

      {renderDesktopPanel}
      {isCompactLayout ? renderCompactSheet : null}

      {!isCompactLayout && !isPanelOpen ? (
        <button
          type="button"
          onClick={() => setIsPanelOpen(true)}
          aria-label="Show apartments panel"
          className="fixed right-4 top-1/2 z-[130] hidden h-14 w-14 -translate-y-1/2 items-center justify-center rounded-full border border-white/16 bg-[linear-gradient(180deg,rgba(255,255,255,0.18),rgba(226,233,242,0.08))] text-white shadow-[-8px_0_30px_rgba(8,12,18,0.28),inset_0_1px_0_rgba(255,255,255,0.2)] backdrop-blur-[22px] transition-all duration-300 hover:border-white/26 hover:bg-[linear-gradient(180deg,rgba(255,255,255,0.22),rgba(232,238,245,0.12))] xl:flex"
        >
          <ChevronRight size={20} className="text-white" />
        </button>
      ) : null}
    </div>
  );
}
