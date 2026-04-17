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
import { preloadFlatEntryVideo } from "../../lib/flats";
import { isBackgroundTransitionActive } from "../../lib/background-transition";
import useResponsiveViewport from "../../hooks/useResponsiveViewport";

const DESKTOP_PANEL_WIDTH = 392;
const COMPACT_PEEK_HEIGHT = 82;

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
  const { isMobile, isTablet, isTabletOrBelow } = useResponsiveViewport();

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
  const compactMediaHeight = isTablet
    ? "min(46dvh, 430px)"
    : isMobile
      ? "min(38dvh, 320px)"
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
    async (flatId) => {
      if (!flatId || pendingFlatId) {
        return;
      }

      setPendingFlatId(flatId);
      void preloadInteriorStartPano();
      router.prefetch("/interior-panos");

      if (!prefetchedFlatRoutesRef.current.has(flatId)) {
        prefetchedFlatRoutesRef.current.add(flatId);
        router.prefetch(`/apartments/${flatId}`);
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
          router.push(`/apartments/${flatId}`);
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
      <aside className="relative mr-4 flex h-[calc(100dvh-120px)] max-h-[calc(100dvh-120px)] w-[392px] flex-col overflow-hidden border border-white/12 bg-[linear-gradient(165deg,rgba(10,16,26,0.82)_0%,rgba(8,13,20,0.68)_46%,rgba(5,8,14,0.52)_100%)] shadow-[-14px_0_58px_rgba(8,12,18,0.28)] backdrop-blur-[22px]">
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.01)_18%,rgba(12,15,21,0.08)_100%)]" />
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
          className="fixed inset-0 z-[109] bg-[radial-gradient(circle_at_top,rgba(173,207,255,0.22),rgba(6,10,18,0.38))] backdrop-blur-[4px] xl:hidden"
          style={{
            top: compactMediaHeight,
          }}
        />
      ) : null}

      <div
        className="fixed inset-x-0 bottom-0 z-[120] xl:hidden"
        style={{
          top: compactMediaHeight,
          bottom: compactBottomOffset,
          opacity: 1,
          pointerEvents: isFlatRoutePreparing ? "none" : "auto",
          height: "auto",
          transform: isPanelOpen
            ? "translateY(0)"
            : `translateY(calc(100% - ${COMPACT_PEEK_HEIGHT}px))`,
          transition: "transform 360ms cubic-bezier(0.22,1,0.36,1)",
        }}
      >
        <aside className="relative flex h-full flex-col overflow-hidden rounded-none border border-b-0 border-x-0 border-white/10 bg-[linear-gradient(165deg,rgba(9,15,24,0.84)_0%,rgba(8,13,20,0.7)_46%,rgba(5,8,14,0.56)_100%)] shadow-[0_-16px_54px_rgba(8,12,18,0.28)] backdrop-blur-[20px]">
          <div className="px-4 pt-2">
            <div className="mx-auto h-1.5 w-14 bg-white/12" />
          </div>

          <div className="relative flex items-center justify-between gap-3 border-b border-white/10 px-4 pb-2.5 pt-3">
            <div className="min-w-0">
              <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-white/78">
                Residence Atelier
              </p>
              <p className="mt-1 text-[12px] text-white/62 md:text-[13px]">
                {data.length} matches from {allData?.length ?? data.length} homes
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={resetFilters}
                className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-2 text-[9px] font-semibold uppercase tracking-[0.14em] text-white/64 transition hover:border-white/20 hover:bg-white/[0.08] hover:text-white"
              >
                Reset
              </button>
              <button
                type="button"
                onClick={() => setIsPanelOpen((current) => !current)}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/[0.05] text-white/64 transition hover:border-white/20 hover:bg-white/[0.08] hover:text-white"
                aria-label={isPanelOpen ? "Collapse apartments panel" : "Expand apartments panel"}
              >
                {isPanelOpen ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
              </button>
            </div>
          </div>

          <div className="relative border-b border-white/10 px-3 py-2.5">
            <div className="grid grid-cols-2 gap-1.5 bg-black/10 p-1">
              <button
                type="button"
                onClick={() => {
                  setActiveTab("filters");
                  setIsPanelOpen(true);
                }}
                className={`rounded-[14px] px-4 py-2 text-[9px] font-semibold uppercase tracking-[0.14em] transition md:text-[10px] ${
                  activeTab === "filters"
                    ? "bg-white/14 text-white shadow-[0_8px_20px_rgba(0,0,0,0.18)]"
                    : "text-white/54"
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
                className={`rounded-[14px] px-4 py-2 text-[9px] font-semibold uppercase tracking-[0.14em] transition md:text-[10px] ${
                  activeTab === "list"
                    ? "bg-white/14 text-white shadow-[0_8px_20px_rgba(0,0,0,0.18)]"
                    : "text-white/54"
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
        </aside>
      </div>
    </>
  );

  return (
    <div
      className="fixed inset-0 overflow-hidden"
      style={{
        backgroundColor: shouldRevealViewer ? "#0b1018" : "transparent",
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
          backgroundColor: "#0b1018",
          opacity: shouldRevealViewer ? 1 : 0,
          transition: "opacity 0.38s ease",
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
          className="fixed right-4 top-1/2 z-[130] hidden h-14 w-14 -translate-y-1/2 items-center justify-center rounded-full border border-white/14 bg-[linear-gradient(145deg,rgba(91,103,123,0.5),rgba(54,63,77,0.64))] text-white shadow-[-8px_0_30px_rgba(8,12,18,0.28)] backdrop-blur-[18px] transition-all duration-300 hover:border-white/22 hover:bg-[linear-gradient(145deg,rgba(103,116,137,0.54),rgba(58,68,84,0.7))] xl:flex"
        >
          <ChevronRight size={20} className="text-white" />
        </button>
      ) : null}
    </div>
  );
}
