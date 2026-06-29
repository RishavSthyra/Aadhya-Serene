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
import useResponsiveViewport from "../../hooks/useResponsiveViewport";

const DESKTOP_PANEL_WIDTH = 420;
const COMPACT_VIEWER_ASPECT_RATIO = 16 / 9;
const SIDEBAR_SHELL_CLASS = "relative overflow-hidden rounded-[22px] border border-[#eadff3] bg-[linear-gradient(145deg,rgba(255,252,248,0.76)_0%,rgba(255,251,247,0.72)_36%,rgba(250,244,255,0.68)_100%)] shadow-[-14px_0_58px_rgba(190,170,220,0.14),inset_0_1px_0_rgba(255,255,255,0.84)] backdrop-blur-[30px]";
const MOBILE_SIDEBAR_SHELL_CLASS = "relative overflow-hidden rounded-[20px] border border-[#eadff3] bg-[linear-gradient(145deg,rgba(255,252,248,0.8)_0%,rgba(255,251,247,0.76)_42%,rgba(250,244,255,0.72)_100%)] shadow-[0_14px_34px_rgba(190,170,220,0.12),inset_0_1px_0_rgba(255,255,255,0.84)] md:backdrop-blur-[18px]";

function SidebarLeaves({ compact = false }) {
  return (
    <>
      <img
        src="/leaves-illustrations-1.png"
        alt=""
        aria-hidden="true"
        className={`pointer-events-none absolute select-none object-contain ${compact ? "-left-12 top-[4.5rem] w-[236px] opacity-[0.8] [transform:rotateY(180deg)]" : "-left-20 top-14 w-[312px] opacity-[1] [transform:rotateY(180deg)]"}`}
      />
      <img
        src="/leaves-illustrations-2.png"
        alt=""
        aria-hidden="true"
        className={`pointer-events-none absolute select-none object-contain ${compact ? "-right-12 bottom-0 w-[256px] opacity-[0.76]" : "-right-[4.5rem] -bottom-2 w-[336px] opacity-[0.92]"}`}
      />
    </>
  );
}

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
  const compactNavClearance = "calc(108px + env(safe-area-inset-bottom, 0px))";
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
    setIsViewerReady(false);
    setShouldMountViewer(false);
    setPendingFlatId(null);

    if (remountViewer) {
      setViewerVersion((current) => current + 1);
    }
  }, []);

  useEffect(() => {
    const handlePageShow = (event) => {
      if (event.persisted) {
        resetApartmentsExperience(true);
      }
    };

    resetApartmentsExperience(true);

    window.addEventListener("pageshow", handlePageShow);

    return () => {
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
    if (pathname !== "/apartments") {
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

  const shouldRevealViewer = shouldMountViewer && isViewerReady;

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
        opacity: 1,
        pointerEvents: isFlatRoutePreparing ? "none" : "auto",
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

        <section className={`${SIDEBAR_SHELL_CLASS} shrink-0`}>
          <div className="pointer-events-none absolute -right-10 -top-16 h-44 w-48 rounded-full bg-[radial-gradient(circle,rgba(226,215,248,0.52)_0%,rgba(226,215,248,0)_72%)] blur-3xl" />
          <div className="pointer-events-none absolute -left-10 bottom-8 h-36 w-40 rounded-full bg-[radial-gradient(circle,rgba(245,225,233,0.46)_0%,rgba(245,225,233,0)_72%)] blur-3xl" />
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.46),rgba(255,255,255,0.14)_32%,rgba(255,255,255,0.04)_100%)]" />
          <SidebarLeaves />
          <div
            className="relative z-[1] overflow-y-auto scrollbar-thin"
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

        <section className={`${SIDEBAR_SHELL_CLASS} flex min-h-0 flex-1 flex-col`}>
          <div className="pointer-events-none absolute -right-8 top-8 h-36 w-40 rounded-full bg-[radial-gradient(circle,rgba(226,215,248,0.38)_0%,rgba(226,215,248,0)_70%)] blur-3xl" />
          <div className="pointer-events-none absolute -left-12 bottom-4 h-40 w-44 rounded-full bg-[radial-gradient(circle,rgba(245,225,233,0.34)_0%,rgba(245,225,233,0)_72%)] blur-3xl" />
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.4),rgba(255,255,255,0.08)_32%,rgba(255,255,255,0.03)_100%)]" />
          <div className="relative z-[1] flex items-start justify-between gap-3 border-b border-[#efe4f4] px-4 pb-3 pt-3.5">
            <div className="min-w-0">
              <h3 className="text-[1.58rem] font-semibold leading-none tracking-[-0.02em] text-[#2e2438] 2xl:text-[1.72rem]">
                Matching Flats
              </h3>
              <p className="mt-1.5 text-[11.5px] leading-4 text-[#8c8197] 2xl:text-[12px]">
                View apartments matching your current filters.
              </p>
            </div>
            <span className="shrink-0 rounded-full border border-[#eee4f7] bg-[linear-gradient(180deg,#fffdfc_0%,#faf3ff_100%)] px-2.5 py-1 text-[10.5px] font-semibold text-[#8e7fa5] shadow-[inset_0_1px_0_rgba(255,255,255,0.96)]">
              {data.length} units
            </span>
          </div>
          <div
            className="relative z-[1] min-h-0 flex-1 overflow-y-auto px-3 pb-3 pt-2.5 scrollbar-thin"
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
          bottom: 0,
          opacity: 1,
          pointerEvents: isFlatRoutePreparing ? "none" : "auto",
          height: "auto",
          transform: isPanelOpen
            ? "translateY(0)"
            : "translateY(calc(100% - 82px))",
          transition: "transform 300ms cubic-bezier(0.22,1,0.36,1)",
        }}
      >
        <aside className="relative flex h-full flex-col overflow-hidden rounded-t-[22px] border border-b-0 border-x-0 border-[#eadff3] bg-[linear-gradient(145deg,rgba(255,252,248,0.98)_0%,rgba(255,251,247,0.96)_42%,rgba(250,244,255,0.94)_100%)] shadow-[0_-16px_42px_rgba(190,170,220,0.16),inset_0_1px_0_rgba(255,255,255,0.98)] saturate-[120%] md:backdrop-blur-[18px]">
          <div className="pointer-events-none absolute -right-14 -top-12 h-44 w-48 rounded-full bg-[radial-gradient(circle,rgba(226,215,248,0.42)_0%,rgba(226,215,248,0)_72%)] blur-3xl" />
          <div className="pointer-events-none absolute -left-10 bottom-16 h-36 w-40 rounded-full bg-[radial-gradient(circle,rgba(245,225,233,0.3)_0%,rgba(245,225,233,0)_72%)] blur-3xl" />
          <div className="relative z-[1] flex items-center justify-between gap-3 border-b border-[#efe4f4] px-4 pb-3 pt-3">
            <div className="absolute inset-x-0 top-1 flex justify-center">
              <div className="h-1.5 w-14 rounded-full bg-[#d8cde8]" />
            </div>
            <div className="min-w-0">
              <p className="text-[8px] font-semibold uppercase tracking-[0.16em] text-[#9c8aa2]">
                Residence Atelier
              </p>
              <p className="mt-1 text-[11px] text-[#8c8197] md:text-[12px]">
                {data.length} matches from {allData?.length ?? data.length} homes
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={resetFilters}
                className="rounded-full border border-[#eee4f7] bg-[linear-gradient(180deg,#fffefd_0%,#faf4ff_100%)] px-3 py-2 text-[14px] font-medium uppercase tracking-[0.08em] text-[#736781] shadow-[0_14px_32px_rgba(194,175,221,0.14),inset_0_1px_0_rgba(255,255,255,0.98)] backdrop-blur-[18px] transition hover:border-[#ddcfee] hover:text-[#564b64]"
              >
                Reset
              </button>
              <button
                type="button"
                onClick={() => setIsPanelOpen((current) => !current)}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-[#eee4f7] bg-[linear-gradient(180deg,#fffefd_0%,#faf4ff_100%)] text-[#7c7190] shadow-[0_14px_32px_rgba(194,175,221,0.14),inset_0_1px_0_rgba(255,255,255,0.98)] backdrop-blur-[18px] transition hover:border-[#ddcfee] hover:text-[#564b64]"
                aria-label={isPanelOpen ? "Collapse apartments panel" : "Expand apartments panel"}
              >
                {isPanelOpen ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
              </button>
            </div>
          </div>

          <div
            className="min-h-0 flex-1 overflow-y-auto px-3 pt-3 scrollbar-thin"
            style={{
              ...sharedScrollStyles,
              paddingBottom: compactNavClearance,
            }}
          >
            <div className="space-y-3">
              <section className={MOBILE_SIDEBAR_SHELL_CLASS}>
                <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.42),rgba(255,255,255,0.08)_100%)]" />
                <SidebarLeaves compact />
                <div className="relative z-[1]">
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

              <section className={MOBILE_SIDEBAR_SHELL_CLASS}>
                <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.38),rgba(255,255,255,0.08)_100%)]" />
                <div className="relative z-[1] border-b border-[#efe4f4] px-4 pb-3 pt-3.5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-[20px] font-semibold leading-none tracking-[-0.02em] text-[#2e2438]">
                        Matching Flats
                      </h3>
                      <p className="mt-1 text-[11px] leading-4 text-[#8c8197]">
                        View apartments matching your filters.
                      </p>
                    </div>
                    <span className="shrink-0 rounded-full border border-[#eee4f7] bg-[linear-gradient(180deg,#fffdfc_0%,#faf3ff_100%)] px-2.5 py-1 text-[10px] font-semibold text-[#8e7fa5] shadow-[inset_0_1px_0_rgba(255,255,255,0.96)]">
                      {data.length} units
                    </span>
                  </div>
                </div>
                <div className="relative z-[1] px-3 pb-3 pt-2">
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
            selectedFlatId={pendingFlatId}
          />
        ) : (
          <div className="h-full w-full bg-transparent" />
        )}
      </div>

      <div className="pointer-events-none absolute inset-0 z-10 bg-[linear-gradient(90deg,rgba(8,19,38,0.05)_0%,rgba(9,24,46,0.01)_28%,rgba(10,26,52,0.1)_100%)]" />

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
