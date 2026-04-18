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
import {
  cancelIdleFlatVideoWarmup,
  preloadFlatEntryVideo,
  scheduleIdleFlatVideoWarmup,
} from "../../lib/flats";
import { isBackgroundTransitionActive } from "../../lib/background-transition";
import useResponsiveViewport from "../../hooks/useResponsiveViewport";

const DESKTOP_PANEL_WIDTH = 392;
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
  const { isMobile, isTablet, isTabletOrBelow, width } = useResponsiveViewport();

  const [isPanelOpen, setIsPanelOpen] = useState(true);
  const [activeTab, setActiveTab] = useState("filters");
  const [isVideoPlaying, setIsVideoPlaying] = useState(() => isBackgroundTransitionActive("apartments"));
  const [viewerVersion, setViewerVersion] = useState(0);
  const [shouldMountViewer, setShouldMountViewer] = useState(false);
  const [isViewerReady, setIsViewerReady] = useState(false);
  const [pendingFlatId, setPendingFlatId] = useState(null);
  const prefetchedFlatRoutesRef = useRef(new Set());
  const hasHandledInitialPathRef = useRef(false);
  const isCompactLayout = isTabletOrBelow;
  const compactBottomOffset = "calc(86px + env(safe-area-inset-bottom, 0px))";
  const compactSheetOverlap = isCompactLayout ? 1 : 0;
  const compactMediaHeight = isTabletOrBelow
    ? `${Math.min(
      Math.max(Math.round(width / COMPACT_VIEWER_ASPECT_RATIO), isTablet ? 420 : 220),
      isTablet ? 620 : 320,
    )}px`
    : "min(42dvh, 380px)";
  const isFlatRoutePreparing = pendingFlatId !== null;

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
    const handleStart = () => setIsVideoPlaying(true);
    const handleEnd = () => setIsVideoPlaying(false);
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

    const cancelWarmup = scheduleIdleFlatVideoWarmup({
      prioritizeFlatIds: prioritizedWarmupFlatIds,
    });

    return () => {
      cancelWarmup?.();
      cancelIdleFlatVideoWarmup();
    };
  }, [allData?.length, pathname, prioritizedWarmupFlatIds]);

  useEffect(() => {
    if (pathname !== "/apartments") {
      return undefined;
    }

    let cancelled = false;
    let cancelRotatorWarmup = null;

    import("../Apartment360Viewer").then((module) => {
      if (cancelled) {
        return;
      }

      cancelRotatorWarmup = module.scheduleApartment360FrameWarmup?.({
        isConstrainedDevice: isCompactLayout,
      });
    });

    return () => {
      cancelled = true;
      cancelRotatorWarmup?.();
    };
  }, [isCompactLayout, pathname]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return undefined;
    }

    if (shouldMountViewer) {
      return undefined;
    }

    const rafId = window.requestAnimationFrame(() => {
      setShouldMountViewer(true);
    });

    return () => {
      window.cancelAnimationFrame(rafId);
    };
  }, [shouldMountViewer, viewerVersion]);

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
            timeoutMs: isTabletOrBelow ? 2200 : 3200,
          }),
          new Promise((resolve) => {
            window.setTimeout(resolve, isTabletOrBelow ? 1800 : 2400);
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
    <div className={`space-y-2 ${isCompactLayout ? "px-0 pb-20 pt-0" : "mt-2 px-3 pb-5"}`}>
      {loading ? (
        <div className="border border-white/18 bg-[linear-gradient(145deg,rgba(9,14,22,0.76),rgba(7,12,19,0.46)_52%,rgba(5,9,14,0.32))] px-6 py-8 text-center text-xs text-white/68 backdrop-blur-[20px]">
          Loading...
        </div>
      ) : error ? (
        <div className="border border-red-200/30 bg-[linear-gradient(145deg,rgba(40,10,10,0.62),rgba(22,7,7,0.4))] px-6 py-8 text-center text-xs text-red-100 backdrop-blur-[20px]">
          Error loading apartments.
        </div>
      ) : (
        <ApartmentList
          apartments={data}
          compactMode={isCompactLayout}
          onSelect={(apartment) => handleFlatClick(apartment.id)}
        />
      )}
    </div>
  );

  const renderDesktopPanel = (
    <div
      className="fixed right-0 top-[104px] z-[120] hidden xl:block"
      style={{
        opacity: isVideoPlaying ? 0 : 1,
        pointerEvents: isVideoPlaying || isFlatRoutePreparing ? "none" : "auto",
        transform: isPanelOpen ? "translateX(0)" : `translateX(${DESKTOP_PANEL_WIDTH + 20}px)`,
        transition: "transform 420ms cubic-bezier(0.22,1,0.36,1), opacity 280ms ease",
      }}
    >
      <aside className="relative mr-4 flex h-[calc(100dvh-120px)] max-h-[calc(100dvh-120px)] w-[392px] flex-col overflow-hidden rounded-[26px] border border-white/16 bg-[linear-gradient(165deg,rgba(30,38,50,0.56)_0%,rgba(13,18,26,0.72)_46%,rgba(8,11,17,0.82)_100%)] shadow-[-14px_0_58px_rgba(8,12,18,0.28),inset_0_1px_0_rgba(255,255,255,0.18)] backdrop-blur-[28px] saturate-[150%]">
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02)_18%,rgba(12,15,21,0.12)_100%)]" />
        <div
          className="relative flex min-h-0 flex-1 flex-col overflow-y-auto scrollbar-thin"
          style={{
            scrollbarWidth: "thin",
            scrollbarColor: "rgba(255,255,255,0.12) transparent",
          }}
        >
          <style>{`
            .scrollbar-thin::-webkit-scrollbar { width: 3px; }
            .scrollbar-thin::-webkit-scrollbar-track { background: transparent; }
            .scrollbar-thin::-webkit-scrollbar-thumb {
              background: rgba(255,255,255,0.12);
              border-radius: 2px;
            }
            .scrollbar-thin::-webkit-scrollbar-thumb:hover {
              background: rgba(182,196,221,0.35);
            }
          `}</style>

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
          {renderListContent}
        </div>
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
          className="fixed inset-0 z-[109] bg-[radial-gradient(circle_at_top,rgba(126,146,176,0.16),rgba(6,10,18,0.26))] backdrop-blur-[3px] xl:hidden"
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
        <aside className="relative flex h-full flex-col overflow-hidden rounded-t-[22px] border border-b-0 border-x-0 border-white/14 bg-[linear-gradient(165deg,rgba(28,36,48,0.52)_0%,rgba(12,17,24,0.78)_40%,rgba(7,10,16,0.92)_100%)] shadow-[0_-20px_60px_rgba(8,12,18,0.34),inset_0_1px_0_rgba(255,255,255,0.16)] backdrop-blur-[28px] saturate-[150%]">
          <div className="relative flex items-center justify-between gap-3 border-b border-white/10 px-4 pb-3 pt-3">
            <div className="absolute inset-x-0 top-1 flex justify-center">
              <div className="h-1.5 w-14 rounded-full bg-white/14" />
            </div>
            <div className="min-w-0">
              <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-white/74">
                Residence Atelier
              </p>
              <p className="mt-1 text-[12px] text-white/60 md:text-[13px]">
                {data.length} matches from {allData?.length ?? data.length} homes
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={resetFilters}
                className="rounded-full border border-white/14 bg-[linear-gradient(180deg,rgba(255,255,255,0.12),rgba(255,255,255,0.05))] px-3 py-2 text-[14px] font-medium uppercase tracking-[0.08em] text-white/70 shadow-[0_14px_32px_rgba(7,10,18,0.14),inset_0_1px_0_rgba(255,255,255,0.14)] backdrop-blur-[18px] transition hover:border-white/24 hover:bg-white/[0.1] hover:text-white"
              >
                Reset
              </button>
              <button
                type="button"
                onClick={() => setIsPanelOpen((current) => !current)}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-white/14 bg-[linear-gradient(180deg,rgba(255,255,255,0.12),rgba(255,255,255,0.05))] text-white/70 shadow-[0_14px_32px_rgba(7,10,18,0.14),inset_0_1px_0_rgba(255,255,255,0.14)] backdrop-blur-[18px] transition hover:border-white/24 hover:bg-white/[0.1] hover:text-white"
                aria-label={isPanelOpen ? "Collapse apartments panel" : "Expand apartments panel"}
              >
                {isPanelOpen ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
              </button>
            </div>
          </div>

          <>
            <div className="relative border-b border-white/10 px-3 py-2.5">
              <div className="grid grid-cols-2 gap-2 rounded-[18px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.03))] p-1.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab("filters");
                    setIsPanelOpen(true);
                  }}
                  className={`rounded-[14px] px-4 py-2.5 text-[9px] font-medium uppercase tracking-[0.1em] transition md:text-[10px] ${
                    activeTab === "filters"
                      ? "border border-white/16 bg-[linear-gradient(180deg,rgba(255,255,255,0.16),rgba(255,255,255,0.08))] text-white shadow-[0_10px_28px_rgba(0,0,0,0.18),inset_0_1px_0_rgba(255,255,255,0.12)]"
                      : "text-white/54 hover:text-white/76"
                  }`}
                >
                  Filters
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab("list");
                    setIsPanelOpen(true);
                  }}
                  className={`rounded-[14px] px-4 py-2.5 text-[9px] font-medium uppercase tracking-[0.1em] transition md:text-[10px] ${
                    activeTab === "list"
                      ? "border border-white/16 bg-[linear-gradient(180deg,rgba(255,255,255,0.16),rgba(255,255,255,0.08))] text-white shadow-[0_10px_28px_rgba(0,0,0,0.18),inset_0_1px_0_rgba(255,255,255,0.12)]"
                      : "text-white/54 hover:text-white/76"
                  }`}
                >
                  Apartments
                </button>
              </div>
            </div>

            <div
              className="min-h-0 flex-1 overflow-y-auto scrollbar-thin"
              style={{
                scrollbarWidth: "thin",
                scrollbarColor: "rgba(255,255,255,0.12) transparent",
              }}
            >
              {activeTab === "filters" ? (
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
              ) : (
                renderListContent
              )}
            </div>
          </>
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
