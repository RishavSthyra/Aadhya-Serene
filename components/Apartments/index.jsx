"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  ChevronDown,
  ChevronRight,
  ChevronUp,
} from "lucide-react";
import { useApartmentsData } from "../../hooks/useApartmentsData";
import Filters from "./Filters";
import ApartmentList from "./ApartmentList";
import Apartment360Viewer from "../Apartment360Viewer";
import { preloadInteriorStartPano } from "../../lib/interior-panos";
import { preloadFlatEntryVideo } from "../../lib/flats";
import { isBackgroundTransitionActive } from "../../lib/background-transition";

const DESKTOP_PANEL_WIDTH = 392;
const COMPACT_BREAKPOINT = 1280;
const COMPACT_PEEK_HEIGHT = 92;
const COMPACT_MEDIA_HEIGHT = "min(56.25vw, 48dvh)";
const COMPACT_MEDIA_WIDTH = "min(100vw, 85.333333dvh)";

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
  const prefetchedFlatRoutesRef = useRef(new Set());

  const resetApartmentsExperience = useCallback((remountViewer = false) => {
    document.body.style.opacity = "1";
    document.body.style.transition = "";
    setIsVideoPlaying(isBackgroundTransitionActive("apartments"));

    if (remountViewer) {
      setViewerVersion((current) => current + 1);
    }
  }, []);

  useEffect(() => {
    const handleStart = () => setIsVideoPlaying(true);
    const handleEnd = () => setIsVideoPlaying(false);
    const handlePageShow = () => resetApartmentsExperience(true);
    const handleWindowFocus = () => resetApartmentsExperience(true);

    resetApartmentsExperience(true);

    window.addEventListener("bg-transition-started", handleStart);
    window.addEventListener("bg-transition-ended", handleEnd);
    window.addEventListener("pageshow", handlePageShow);
    window.addEventListener("focus", handleWindowFocus);

    return () => {
      window.removeEventListener("bg-transition-started", handleStart);
      window.removeEventListener("bg-transition-ended", handleEnd);
      window.removeEventListener("pageshow", handlePageShow);
      window.removeEventListener("focus", handleWindowFocus);
    };
  }, [resetApartmentsExperience]);

  useEffect(() => {
    if (pathname === "/apartments") {
      resetApartmentsExperience(true);
    }
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
        <div className="rounded-2xl border border-white/10 bg-black/25 px-6 py-8 text-center text-xs text-white/50">
          Loading...
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-red-400/20 bg-red-500/10 px-6 py-8 text-center text-xs text-red-200">
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
      <aside className="mr-4 flex h-[calc(100dvh-120px)] max-h-[calc(100dvh-120px)] w-[392px] flex-col overflow-hidden rounded-[30px] border border-white/10 bg-[#0c0e14]/92 shadow-[-20px_0_80px_rgba(0,0,0,0.5)] backdrop-blur-[24px]">
        <div
          className="flex min-h-0 flex-1 flex-col overflow-y-auto scrollbar-thin"
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
              background: rgba(212,185,110,0.35);
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
          className="fixed inset-0 z-[109] bg-black/30 backdrop-blur-[2px] xl:hidden"
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
        <aside className="mx-2 flex h-full flex-col overflow-hidden rounded-t-[28px] border border-b-0 border-white/10 bg-[#0c0e14]/96 shadow-[0_-20px_80px_rgba(0,0,0,0.45)] backdrop-blur-[24px]">
          <div className="px-4 pt-3">
            <div className="mx-auto h-1.5 w-14 rounded-full bg-white/15" />
          </div>

          <div className="flex items-center justify-between gap-3 border-b border-white/8 px-4 pb-3 pt-4">
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#d4b96e]/85">
                Apartment Curation
              </p>
              <p className="mt-1 text-sm text-white/70">
                {data.length} matches from {allData?.length ?? data.length} homes
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={resetFilters}
                className="rounded-full border border-white/12 bg-white/5 px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/60 transition hover:border-white/22 hover:bg-white/10 hover:text-white/86"
              >
                Reset
              </button>
              <button
                type="button"
                onClick={() => setIsPanelOpen((current) => !current)}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-white/12 bg-white/5 text-white/72 transition hover:border-white/22 hover:bg-white/10 hover:text-white"
                aria-label={isPanelOpen ? "Collapse apartments panel" : "Expand apartments panel"}
              >
                {isPanelOpen ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
              </button>
            </div>
          </div>

          <div className="border-b border-white/8 px-4 py-3">
            <div className="grid grid-cols-2 gap-2 rounded-full bg-white/[0.04] p-1">
              <button
                type="button"
                onClick={() => {
                  setActiveTab("filters");
                  setIsPanelOpen(true);
                }}
                className={`rounded-full px-4 py-2.5 text-[10px] font-semibold uppercase tracking-[0.14em] transition ${
                  activeTab === "filters"
                    ? "bg-[#d4b96e] text-[#0d1016]"
                    : "text-white/68"
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
                    ? "bg-[#d4b96e] text-[#0d1016]"
                    : "text-white/68"
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
        backgroundColor: isVideoPlaying ? "transparent" : "#050608",
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
          opacity: isVideoPlaying ? 0 : 1,
          transition: "opacity 0.28s ease",
          pointerEvents: isVideoPlaying ? "none" : "auto",
        }}
      >
        <Apartment360Viewer
          key={viewerVersion}
          onFlatClick={handleFlatClick}
          onFlatHoverStart={handleFlatHoverStart}
          filteredFlatIds={filteredFlatIds}
        />
      </div>

      <div className="pointer-events-none absolute inset-0 z-10 bg-[linear-gradient(90deg,rgba(7,9,14,0.12)_0%,rgba(7,9,14,0.03)_32%,rgba(7,9,14,0.2)_100%)]" />

      {renderDesktopPanel}
      {isCompactLayout ? renderCompactSheet : null}

      {!isCompactLayout && !isPanelOpen ? (
        <button
          type="button"
          onClick={() => setIsPanelOpen(true)}
          aria-label="Show apartments panel"
          className="fixed right-4 top-1/2 z-[130] hidden h-14 w-14 -translate-y-1/2 items-center justify-center rounded-full border border-white/14 bg-[#1a1d28]/95 text-[#d4b96e] shadow-[-8px_0_30px_rgba(0,0,0,0.4)] backdrop-blur-[16px] transition-all duration-300 hover:bg-[#222633]/95 xl:flex"
        >
          <ChevronRight size={20} className="text-[#d4b96e]" />
        </button>
      ) : null}
    </div>
  );
}
