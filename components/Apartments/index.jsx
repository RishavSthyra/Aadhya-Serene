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

const DESKTOP_PANEL_WIDTH = 392;
const COMPACT_BREAKPOINT = 1280;
const COMPACT_PEEK_HEIGHT = 92;
const COMPACT_MEDIA_HEIGHT = "min(56.25vw, 48dvh)";
const COMPACT_MEDIA_WIDTH = "min(100vw, 85.333333dvh)";

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

  const [isPanelOpen, setIsPanelOpen] = useState(true);
  const [isCompactLayout, setIsCompactLayout] = useState(false);
  const [activeTab, setActiveTab] = useState("filters");
  const [isVideoPlaying, setIsVideoPlaying] = useState(() => isBackgroundTransitionActive("apartments"));
  const [viewerVersion, setViewerVersion] = useState(0);
  const [shouldMountViewer, setShouldMountViewer] = useState(false);
  const [isViewerReady, setIsViewerReady] = useState(false);
  const prefetchedFlatRoutesRef = useRef(new Set());
  const hasHandledInitialPathRef = useRef(false);

  const resetApartmentsExperience = useCallback((remountViewer = false) => {
    document.body.style.opacity = "1";
    document.body.style.transition = "";
    setIsVideoPlaying(isBackgroundTransitionActive("apartments"));
    setIsViewerReady(false);
    setShouldMountViewer(false);

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
    const handleResize = () => {
      const width = window.innerWidth;
      const nextCompact = width < COMPACT_BREAKPOINT;

      setIsCompactLayout(nextCompact);
      setIsPanelOpen((current) => (nextCompact ? current : true));
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

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
    (flatId) => {
      void preloadInteriorStartPano();
      router.prefetch("/interior-panos");
      router.push(`/apartments/${flatId}`);
    },
    [router],
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
    <div className={`space-y-2 ${isCompactLayout ? "px-4 pb-28 pt-3" : "mt-2 px-3 pb-5"}`}>
      {loading ? (
        <div className="rounded-[28px] border border-white/18 bg-[linear-gradient(145deg,rgba(248,251,255,0.18),rgba(199,224,255,0.08)_52%,rgba(255,255,255,0.08))] px-6 py-8 text-center text-xs text-white/68 backdrop-blur-[18px]">
          Loading...
        </div>
      ) : error ? (
        <div className="rounded-[28px] border border-red-200/30 bg-red-100/10 px-6 py-8 text-center text-xs text-red-100 backdrop-blur-[18px]">
          Error loading apartments.
        </div>
      ) : (
        <ApartmentList
          apartments={data}
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
        pointerEvents: isVideoPlaying ? "none" : "auto",
        transform: isPanelOpen ? "translateX(0)" : `translateX(${DESKTOP_PANEL_WIDTH + 20}px)`,
        transition: "transform 420ms cubic-bezier(0.22,1,0.36,1), opacity 280ms ease",
      }}
    >
      <aside className="relative mr-4 flex h-[calc(100dvh-120px)] max-h-[calc(100dvh-120px)] w-[392px] flex-col overflow-hidden rounded-[34px] border border-white/14 bg-[linear-gradient(165deg,rgba(95,107,127,0.44)_0%,rgba(58,67,83,0.54)_46%,rgba(28,34,45,0.74)_100%)] shadow-[-16px_0_80px_rgba(8,12,18,0.34)] backdrop-blur-[28px]">
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
            top: COMPACT_MEDIA_HEIGHT,
          }}
        />
      ) : null}

      <div
        className="fixed inset-x-0 bottom-0 z-[120] xl:hidden"
        style={{
          top: COMPACT_MEDIA_HEIGHT,
          opacity: isVideoPlaying ? 0 : 1,
          pointerEvents: isVideoPlaying ? "none" : "auto",
          height: "auto",
          transform: isPanelOpen
            ? "translateY(0)"
            : `translateY(calc(100% - ${COMPACT_PEEK_HEIGHT}px))`,
          transition: "transform 360ms cubic-bezier(0.22,1,0.36,1), opacity 280ms ease",
        }}
      >
        <aside className="relative mx-2 flex h-full flex-col overflow-hidden rounded-t-[32px] border border-b-0 border-white/14 bg-[linear-gradient(165deg,rgba(95,107,127,0.48)_0%,rgba(58,67,83,0.56)_46%,rgba(28,34,45,0.76)_100%)] shadow-[0_-20px_80px_rgba(8,12,18,0.34)] backdrop-blur-[28px]">
          <div className="px-4 pt-3">
            <div className="mx-auto h-1.5 w-14 rounded-full bg-white/16" />
          </div>

          <div className="relative flex items-center justify-between gap-3 border-b border-white/12 px-4 pb-3 pt-4">
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/82">
                Residence Atelier
              </p>
              <p className="mt-1 text-sm text-white/70">
                {data.length} matches from {allData?.length ?? data.length} homes
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={resetFilters}
                className="rounded-full border border-white/12 bg-white/[0.05] px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/68 transition hover:border-white/20 hover:bg-white/[0.08] hover:text-white"
              >
                Reset
              </button>
              <button
                type="button"
                onClick={() => setIsPanelOpen((current) => !current)}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-white/12 bg-white/[0.05] text-white/68 transition hover:border-white/20 hover:bg-white/[0.08] hover:text-white"
                aria-label={isPanelOpen ? "Collapse apartments panel" : "Expand apartments panel"}
              >
                {isPanelOpen ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
              </button>
            </div>
          </div>

          <div className="relative border-b border-white/12 px-4 py-3">
            <div className="grid grid-cols-2 gap-2 rounded-full bg-black/10 p-1">
              <button
                type="button"
                onClick={() => {
                  setActiveTab("filters");
                  setIsPanelOpen(true);
                }}
                className={`rounded-full px-4 py-2.5 text-[10px] font-semibold uppercase tracking-[0.14em] transition ${
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
                className={`rounded-full px-4 py-2.5 text-[10px] font-semibold uppercase tracking-[0.14em] transition ${
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
        backgroundColor: shouldRevealViewer ? "#050608" : "transparent",
      }}
    >
      <div
        className="absolute z-0"
        style={{
          top: 0,
          right: isCompactLayout ? "auto" : 0,
          bottom: isCompactLayout ? "auto" : 0,
          left: isCompactLayout ? "50%" : 0,
          width: isCompactLayout ? COMPACT_MEDIA_WIDTH : "auto",
          height: isCompactLayout ? COMPACT_MEDIA_HEIGHT : "auto",
          transform: isCompactLayout ? "translateX(-50%)" : "none",
          overflow: "hidden",
          backgroundColor: "#050608",
          opacity: shouldRevealViewer ? 1 : 0,
          transition: "opacity 0.38s ease",
          pointerEvents: shouldRevealViewer ? "auto" : "none",
          backgroundImage: "linear-gradient(180deg, rgba(5,6,8,0.18), rgba(5,6,8,0.52))",
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
          />
        ) : (
          <div className="h-full w-full bg-transparent" />
        )}
      </div>

      <div className="pointer-events-none absolute inset-0 z-10 bg-[linear-gradient(90deg,rgba(8,19,38,0.08)_0%,rgba(9,24,46,0.02)_28%,rgba(10,26,52,0.16)_100%)]" />

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
