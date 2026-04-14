"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { useApartmentsData } from "../../hooks/useApartmentsData";
import Filters from "./Filters";
import ApartmentList from "./ApartmentList";
import Apartment360Viewer from "../Apartment360Viewer";
import { preloadInteriorStartPano } from "../../lib/interior-panos";
import { preloadFlatEntryVideo } from "../../lib/flats";

const PANEL_WIDTH = 360;

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
  } = useApartmentsData();

  const router = useRouter();
  const pathname = usePathname();

  const [isPanelOpen, setIsPanelOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [activeTab, setActiveTab] = useState("filters");
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [viewerVersion, setViewerVersion] = useState(0);
  const prefetchedFlatRoutesRef = useRef(new Set());

  const resetApartmentsExperience = useCallback((remountViewer = false) => {
    document.body.style.opacity = "1";
    document.body.style.transition = "";
    setIsVideoPlaying(false);

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
    const handleResize = () => setIsMobile(window.innerWidth <= 767);
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

  return (
    <div className="fixed inset-0 overflow-hidden bg-[#050608]">
      <div
        className="absolute inset-0 z-0"
        style={{
          opacity: isVideoPlaying ? 0 : 1,
          transition: "opacity 0.9s ease",
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

      <div className="pointer-events-none absolute inset-0 z-10 bg-[linear-gradient(90deg,rgba(7,9,14,0.12)_0%,rgba(7,9,14,0.04)_30%,rgba(7,9,14,0.18)_100%)]" />

      {/* Sidebar panel */}
      <div
        className="fixed right-0 top-[90px] z-[120]"
        style={{
          opacity: isVideoPlaying ? 0 : 1,
          pointerEvents: isVideoPlaying ? "none" : "auto",
          transform: `translateX(${isPanelOpen ? 0 : PANEL_WIDTH}px)`,
          transition: "transform 600ms cubic-bezier(0.22,1,0.36,1), opacity 900ms ease",
        }}
      >
        <aside className="flex h-[calc(100dvh-116px)] w-[360px] flex-col overflow-hidden rounded-l-[28px] border border-x-0 border-white/10 bg-[#0c0e14]/95 shadow-[-20px_0_80px_rgba(0,0,0,0.5)] backdrop-blur-[24px]">
          <div className="border-b border-white/8 px-4 py-3 md:hidden">
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setActiveTab("filters")}
                className={`rounded-full px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.14em] transition ${
                  activeTab === "filters" ? "bg-white text-[#0d1016]" : "bg-white/6 text-white/70"
                }`}
              >
                Filters
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("list")}
                className={`rounded-full px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.14em] transition ${
                  activeTab === "list" ? "bg-white text-[#0d1016]" : "bg-white/6 text-white/70"
                }`}
              >
                Apartments
              </button>
            </div>
          </div>

          {/* Scrollable content */}
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

            {(!isMobile || activeTab === "filters") && (
              <Filters
                filters={filters}
                onToggle={toggleFilter}
                onSetRange={setAreaRange}
                onToggleBoolean={toggleBoolean}
                onClose={() => setIsPanelOpen(false)}
                resultCount={data.length}
                totalCount={allData?.length ?? data.length}
              />
            )}

            {(!isMobile || activeTab === "list") && (
              <div className="mt-2 px-3 pb-3 space-y-2">
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
            )}
          </div>
        </aside>
      </div>

      {/* Toggle button — arrow only visible when panel is closed, at right edge */}
      {!isPanelOpen && (
        <button
          type="button"
          onClick={() => setIsPanelOpen(true)}
          aria-label="Show panel"
          className="fixed right-0 top-[108px] z-[130] flex h-[52px] w-[36px] items-center justify-center rounded-l-full border border-white/14 border-r-0 bg-[#1a1d28]/95 text-[#d4b96e] shadow-[-8px_0_30px_rgba(0,0,0,0.4)] backdrop-blur-[16px] transition-all duration-500 hover:bg-[#222633]/95"
        >
          <ChevronRight size={18} className="text-[#d4b96e]" />
        </button>
      )}
    </div>
  );
}
