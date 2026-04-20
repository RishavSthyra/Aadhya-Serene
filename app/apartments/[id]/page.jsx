'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
    ArrowLeft,
    Bath,
    BedDouble,
    Building2,
    Compass,
    Flower2,
    Fullscreen,
    Home,
    LayoutGrid,
    Maximize2,
    MessageCircle,
    Package2,
    Play,
    Ruler,
    Sofa,
    Sparkles,
    UtensilsCrossed,
    Volume2,
    VolumeX,
} from 'lucide-react';
import {
    floorPlanSrc,
    flatRenderFallbackPoster,
    flatVideoFallbackId,
    flatReverseVideoSrc,
    flatVideoSrc,
    getFlatById,
    normalizeFlatViewKey,
    supportsFlatRenderVideoPlayback,
    WALKTHROUGH_VIDEO,
} from '../../../lib/flats';
import {
    buildInteriorPanosHref,
    preloadInteriorStartPano,
    INTERIOR_START_PREVIEW_URL,
} from '../../../lib/interior-panos';
import { skipNextApartmentsReplay } from '../../../lib/background-transition';
import useResponsiveViewport from '../../../hooks/useResponsiveViewport';

const WHATSAPP_URL = 'https://wa.me/919620993333?text=Hi!%20I%20want%20to%20know%20more%20about%20flat%20';
const COMPACT_MEDIA_ASPECT_RATIO = 16 / 9;

function formatFacing(facing) {
    return facing.charAt(0).toUpperCase() + facing.slice(1);
}

function getRoomIcon(name) {
    const label = name.toLowerCase();

    if (label.includes('bedroom')) return BedDouble;
    if (label.includes('toilet') || label.includes('bath')) return Bath;
    if (label.includes('living')) return Sofa;
    if (label.includes('dining')) return UtensilsCrossed;
    if (label.includes('kitchen')) return Home;
    if (label.includes('utility')) return Package2;
    if (label.includes('balcony')) return Flower2;

    return LayoutGrid;
}

function StatCard({ icon: Icon, label, value, accent = 'text-white' }) {
    return (
        <div className="rounded-[20px] border border-white/14 bg-[linear-gradient(160deg,rgba(255,255,255,0.12),rgba(48,57,71,0.16)_42%,rgba(10,14,21,0.38)_100%)] px-4 py-3 shadow-[0_18px_40px_rgba(0,0,0,0.22),inset_0_1px_0_rgba(255,255,255,0.1)] backdrop-blur-[26px]">
            <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-white/36">
                    <Icon className="h-4 w-4 text-white/68" />
                    <span>{label}</span>
                </div>
                <p className={`text-[16px] font-medium ${accent}`}>
                    {value}
                </p>
            </div>
        </div>
    );
}

function RoomCard({ room }) {
    const Icon = getRoomIcon(room.name);

    return (
        <div className="group rounded-[20px] border border-white/14 bg-[linear-gradient(160deg,rgba(255,255,255,0.1),rgba(47,57,70,0.14)_42%,rgba(10,14,21,0.34)_100%)] px-4 py-3 shadow-[0_18px_42px_rgba(0,0,0,0.18),inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-[22px] transition-all duration-300 hover:border-white/22 hover:bg-[linear-gradient(160deg,rgba(255,255,255,0.14),rgba(52,61,75,0.18)_42%,rgba(12,17,24,0.4)_100%)]">
            <div className="flex items-center justify-between gap-4">
                <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/14 bg-[linear-gradient(180deg,rgba(255,255,255,0.1),rgba(255,255,255,0.04))] text-white/72 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
                        <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/35">
                            Space
                        </p>
                        <h3 className="mt-1 truncate text-[15px] font-medium text-white/88">
                            {room.name}
                        </h3>
                    </div>
                </div>
                <p className="shrink-0 text-[13px] text-white/52">
                    {room.size}
                </p>
            </div>
        </div>
    );
}

function FloorPlanCard({
    flat,
    planSrc,
    floorPlanError,
    onFloorPlanError,
    sectionTitleClass,
    compactMode = false,
}) {
    const imageHeightClass = compactMode ? 'h-[220px] sm:h-[250px]' : 'h-[260px]';

    return (
        <div className="p-4 rounded-[18px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(25,33,44,0.14)_24%,rgba(7,11,17,0.26)_100%)] shadow-[0_16px_38px_rgba(0,0,0,0.14),inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-[22px]">
            <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-white/34">
                        Floor Plan
                    </p>
                    <h2 className={`mt-2 font-medium text-white ${sectionTitleClass}`}>
                        Residence layout
                    </h2>
                </div>
                <span className="rounded-full border border-white/12 bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.03))] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/55 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
                    {flat.flat}
                </span>
            </div>

            <div className="overflow-hidden rounded-[18px] border border-white/12 bg-[linear-gradient(180deg,rgba(5,8,14,0.48),rgba(5,8,14,0.26))] shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
                {!floorPlanError ? (
                    <img
                        src={planSrc}
                        alt={`Floor plan of apartment ${flat.flat}`}
                        className={`${imageHeightClass} w-full object-cover transition duration-500 hover:scale-[1.02]`}
                        draggable={false}
                        loading="lazy"
                        decoding="async"
                        onError={onFloorPlanError}
                    />
                ) : (
                    <div className={`flex ${imageHeightClass} flex-col items-center justify-center bg-black/20 px-6 text-center`}>
                        <Fullscreen className="h-10 w-10 text-white/64" />
                        <p className="mt-4 text-[12px] font-semibold uppercase tracking-[0.2em] text-white/42">
                            Floor plan unavailable
                        </p>
                        <p className="mt-2 text-sm text-white/56">
                            This plan preview will be added shortly.
                        </p>
                    </div>
                )}
            </div>

            <div className="mt-4 grid gap-2">
                <a
                    href={planSrc}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 rounded-full border border-white/14 bg-[linear-gradient(180deg,rgba(255,255,255,0.1),rgba(255,255,255,0.04))] px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/82 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] transition hover:border-white/24 hover:bg-white/[0.08]"
                >
                    <Maximize2 className="h-4 w-4" />
                    Open Plan
                </a>
                <a
                    href={`${WHATSAPP_URL}${flat.flat}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 rounded-full border border-white/14 bg-[linear-gradient(180deg,rgba(255,255,255,0.14),rgba(255,255,255,0.06))] px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/88 shadow-[0_12px_26px_rgba(0,0,0,0.14),inset_0_1px_0_rgba(255,255,255,0.1)] transition hover:border-white/24 hover:bg-white/[0.1]"
                >
                    <MessageCircle className="h-4 w-4" />
                    Discuss
                </a>
            </div>
        </div>
    );
}

function WalkthroughPreviewCard({
    onOpenWalkthrough,
    sectionTitleClass,
    bodyCopyClass,
    quietSurfaceClass,
    compactMode = false,
}) {
    const imageHeightClass = compactMode ? 'h-[230px] sm:h-[260px]' : 'h-[210px]';

    return (
        <div className="p-4 rounded-[18px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(25,33,44,0.14)_24%,rgba(7,11,17,0.26)_100%)] shadow-[0_16px_38px_rgba(0,0,0,0.14),inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-[22px]">
            <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-white/34">
                Interior Preview
            </p>
            <h2 className={`mt-2 font-medium text-white ${sectionTitleClass}`}>
                Sample walkthrough
            </h2>

            <button
                type="button"
                onClick={onOpenWalkthrough}
                className="group mt-4 block w-full overflow-hidden rounded-[18px] border border-white/12 bg-[linear-gradient(180deg,rgba(5,8,14,0.48),rgba(5,8,14,0.26))] text-left shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]"
            >
                <div className="relative">
                    <img
                        src={INTERIOR_START_PREVIEW_URL}
                        alt="Interior walkthrough"
                        className={`${imageHeightClass} w-full object-cover transition duration-500 group-hover:scale-[1.03]`}
                        draggable={false}
                        loading="lazy"
                        decoding="async"
                        onError={(event) => {
                            event.currentTarget.style.opacity = '0.3';
                        }}
                    />
                    <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent_0%,rgba(8,11,17,0.24)_40%,rgba(8,11,17,0.88)_100%)]" />
                    <div className="absolute inset-0 flex items-center justify-center">
                        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-white/18 bg-[linear-gradient(180deg,rgba(255,255,255,0.14),rgba(255,255,255,0.06))] text-white backdrop-blur-md transition group-hover:scale-105 group-hover:bg-white/16">
                            <Play className="ml-0.5 h-4 w-4 fill-current" />
                        </span>
                    </div>
                </div>
            </button>

            <div className={`mt-4 px-4 py-4 ${quietSurfaceClass}`}>
                <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/36">
                    Design Note
                </p>
                <p className={`mt-3 text-white/56 ${bodyCopyClass}`}>
                    The residence is positioned as a calm, daylight-led home with a more
                    understated luxury language across proportion, flow, and private outdoor edges.
                </p>
            </div>
        </div>
    );
}

function primeInlineVideoElement(videoElement) {
    if (!videoElement) return;

    videoElement.muted = true;
    videoElement.defaultMuted = true;
    videoElement.playsInline = true;
    videoElement.autoplay = true;
    videoElement.controls = false;
    videoElement.disablePictureInPicture = true;
    videoElement.setAttribute('muted', '');
    videoElement.setAttribute('autoplay', '');
    videoElement.setAttribute('playsinline', '');
    videoElement.setAttribute('webkit-playsinline', 'true');
    videoElement.setAttribute('disablepictureinpicture', '');
    videoElement.setAttribute('controlslist', 'nodownload noplaybackrate noremoteplayback nofullscreen');
}

export default function FlatDetailPage() {
    const params = useParams();
    const router = useRouter();
    const id = params?.id;
    const pageShellRef = useRef(null);
    const introVideoRef = useRef(null);
    const loopVideoRef = useRef(null);
    const reverseVideoRef = useRef(null);
    const mainPanelRef = useRef(null);
    const sidebarPanelRef = useRef(null);
    const isNavigatingRef = useRef(false);
    const reverseFallbackTimeoutRef = useRef(null);
    const hasActiveTouchGestureRef = useRef(false);

    const [muted, setMuted] = useState(true);
    const [floorPlanError, setFloorPlanError] = useState(false);
    const [activeViewKey, setActiveViewKey] = useState('A1');
    const [useVideoFallback, setUseVideoFallback] = useState(() => !supportsFlatRenderVideoPlayback());
    const [videoPhase, setVideoPhase] = useState('intro');
    const [isIntroFrameReady, setIsIntroFrameReady] = useState(false);
    const [isExitTransitionActive, setIsExitTransitionActive] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const { isMobile, isTablet, isTabletOrBelow, width } = useResponsiveViewport();

    useEffect(() => {
        if (typeof window === 'undefined') {
            return;
        }

        const nextViewKey = normalizeFlatViewKey(
            new URLSearchParams(window.location.search).get('view'),
        );
        setActiveViewKey(nextViewKey);
    }, [id]);

    const flat = getFlatById(id);
    const renderPosterSrc = flatRenderFallbackPoster(activeViewKey);
    const fallbackId = flat ? flatVideoFallbackId(id) : null;
    const hasVideo = !!fallbackId;
    const hasFlatSpecificVideo = hasVideo && !useVideoFallback;
    const shouldAllowGestureBack = !hasFlatSpecificVideo || videoPhase === 'loop';

    const clearReverseFallbackTimeout = useCallback(() => {
        if (!reverseFallbackTimeoutRef.current) return;

        window.clearTimeout(reverseFallbackTimeoutRef.current);
        reverseFallbackTimeoutRef.current = null;
    }, []);

    const finalizeBackNavigation = useCallback(() => {
        clearReverseFallbackTimeout();
        skipNextApartmentsReplay();
        router.push('/apartments');
    }, [clearReverseFallbackTimeout, router]);

    useEffect(() => {
        clearReverseFallbackTimeout();
        setUseVideoFallback(!supportsFlatRenderVideoPlayback());
        setVideoPhase('intro');
        setIsIntroFrameReady(false);
        setIsExitTransitionActive(false);
        isNavigatingRef.current = false;
        hasActiveTouchGestureRef.current = false;
    }, [clearReverseFallbackTimeout, id]);

    useEffect(() => {
        const introVideo = introVideoRef.current;
        const loopVideo = loopVideoRef.current;
        const reverseVideo = reverseVideoRef.current;

        primeInlineVideoElement(introVideo);
        primeInlineVideoElement(loopVideo);
        primeInlineVideoElement(reverseVideo);

        setVideoPhase('intro');
        setIsIntroFrameReady(false);

        if (introVideo) {
            introVideo.pause();
            introVideo.currentTime = 0;
            introVideo.load();
            introVideo.play().catch(() => {});
        }

        if (loopVideo) {
            loopVideo.pause();
            loopVideo.currentTime = 0;
            loopVideo.load();
        }

        if (reverseVideo) {
            reverseVideo.pause();
            reverseVideo.currentTime = 0;
        }
    }, [hasFlatSpecificVideo, id, useVideoFallback]);

    useEffect(() => {
        return () => {
            clearReverseFallbackTimeout();
        };
    }, [clearReverseFallbackTimeout]);

    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(document.fullscreenElement === pageShellRef.current);
        };

        document.addEventListener('fullscreenchange', handleFullscreenChange);

        return () => {
            document.removeEventListener('fullscreenchange', handleFullscreenChange);
        };
    }, []);

    const revealLoopVideo = useCallback(() => {
        window.requestAnimationFrame(() => {
            window.requestAnimationFrame(() => {
                introVideoRef.current?.pause();
                setVideoPhase('loop');
            });
        });
    }, []);

    const handleIntroEnded = useCallback(() => {
        if (!hasFlatSpecificVideo) return;

        const loopVideo = loopVideoRef.current;
        if (!loopVideo) return;

        let didRevealLoop = false;
        const revealWhenReady = () => {
            if (didRevealLoop) return;
            didRevealLoop = true;
            loopVideo.removeEventListener('playing', revealWhenReady);
            revealLoopVideo();
        };

        loopVideo.currentTime = 0;
        loopVideo.addEventListener('playing', revealWhenReady);

        loopVideo.play()
            .then(() => {
                if (loopVideo.readyState >= 2) {
                    revealLoopVideo();
                }
            })
            .catch(() => {
                loopVideo.removeEventListener('playing', revealWhenReady);
                const introVideo = introVideoRef.current;
                if (!introVideo) return;

                introVideo.loop = true;
                introVideo.play().catch(() => {});
            });
    }, [hasFlatSpecificVideo, revealLoopVideo]);

    const navigateBack = useCallback(() => {
        if (isNavigatingRef.current) return;

        isNavigatingRef.current = true;
        setIsExitTransitionActive(true);

        if (!hasFlatSpecificVideo) {
            window.setTimeout(() => {
                finalizeBackNavigation();
            }, 180);
            return;
        }

        const introVideo = introVideoRef.current;
        const loopVideo = loopVideoRef.current;
        const reverseVideo = reverseVideoRef.current;

        if (!reverseVideo) {
            finalizeBackNavigation();
            return;
        }

        let didRevealReverse = false;
        const revealReverse = () => {
            if (didRevealReverse) return;
            didRevealReverse = true;
            reverseVideo.removeEventListener('playing', revealReverse);
            window.requestAnimationFrame(() => {
                window.requestAnimationFrame(() => {
                    introVideo?.pause();
                    loopVideo?.pause();
                    setVideoPhase('reverse');
                });
            });
        };

        const fallbackDelay = Number.isFinite(reverseVideo.duration) && reverseVideo.duration > 0
            ? Math.ceil(reverseVideo.duration * 1000) + 500
            : 4000;

        clearReverseFallbackTimeout();
        reverseFallbackTimeoutRef.current = window.setTimeout(() => {
            finalizeBackNavigation();
        }, fallbackDelay);

        introVideo?.pause();
        loopVideo?.pause();
        reverseVideo.pause();
        reverseVideo.currentTime = 0;
        reverseVideo.addEventListener('playing', revealReverse);

        reverseVideo.play().then(() => {
            if (reverseVideo.readyState >= 2) {
                revealReverse();
            }
        }).catch(() => {
            reverseVideo.removeEventListener('playing', revealReverse);
            finalizeBackNavigation();
        });
    }, [clearReverseFallbackTimeout, finalizeBackNavigation, hasFlatSpecificVideo]);

    useEffect(() => {
        void preloadInteriorStartPano();
        router.prefetch('/interior-panos');
        router.prefetch('/apartments');
    }, [router]);

    useEffect(() => {
        const isInsideInteractivePanel = (target) => {
            if (!(target instanceof Node)) return false;

            return [mainPanelRef.current, sidebarPanelRef.current].some(
                (panel) => panel?.contains(target)
            );
        };

        const handleWheel = (event) => {
            if (isNavigatingRef.current) return;
            if (!shouldAllowGestureBack) return;
            if (isInsideInteractivePanel(event.target)) return;
            if (event.deltaY < -30) navigateBack();
        };

        let touchStartY = 0;
        let touchStartedInsidePanel = false;

        const handleTouchStart = (event) => {
            if (isNavigatingRef.current || !shouldAllowGestureBack) {
                hasActiveTouchGestureRef.current = false;
                return;
            }

            hasActiveTouchGestureRef.current = true;
            touchStartY = event.touches[0].clientY;
            touchStartedInsidePanel = isInsideInteractivePanel(event.target);
        };

        const handleTouchEnd = (event) => {
            if (isNavigatingRef.current) return;
            if (!shouldAllowGestureBack) return;
            if (!hasActiveTouchGestureRef.current) return;

            hasActiveTouchGestureRef.current = false;
            if (touchStartedInsidePanel) return;
            const deltaY = touchStartY - event.changedTouches[0].clientY;

            if (deltaY < -60) {
                navigateBack();
            }
        };

        const handleTouchCancel = () => {
            hasActiveTouchGestureRef.current = false;
        };

        window.addEventListener('wheel', handleWheel, { passive: true });
        window.addEventListener('touchstart', handleTouchStart, { passive: true });
        window.addEventListener('touchend', handleTouchEnd, { passive: true });
        window.addEventListener('touchcancel', handleTouchCancel, { passive: true });

        return () => {
            window.removeEventListener('wheel', handleWheel);
            window.removeEventListener('touchstart', handleTouchStart);
            window.removeEventListener('touchend', handleTouchEnd);
            window.removeEventListener('touchcancel', handleTouchCancel);
        };
    }, [navigateBack, shouldAllowGestureBack]);

    const toggleMute = useCallback(() => {
        setMuted((currentMuted) => !currentMuted);
    }, []);

    const goFullscreen = useCallback(async () => {
        const pageShell = pageShellRef.current;
        if (!pageShell) return;

        try {
            if (document.fullscreenElement) {
                await document.exitFullscreen?.();
                return;
            }

            await pageShell.requestFullscreen?.();
        } catch (error) {
            console.error('Unable to toggle fullscreen view', error);
        }
    }, []);

    if (!flat) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-[#090b10] px-6 text-white">
                <div className="border border-white/10 bg-[linear-gradient(135deg,rgba(6,10,16,0.78),rgba(8,13,20,0.44))] px-8 py-10 text-center backdrop-blur-[24px]">
                    <p className="text-sm text-white/65">Apartment not found.</p>
                    <Link
                        href="/apartments"
                        className="mt-5 inline-flex items-center gap-2 rounded-full border border-white/15 px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/78 transition hover:border-white/28 hover:text-white"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back to Apartments
                    </Link>
                </div>
            </div>
        );
    }

    const floorLabel = flat.floor === 'G' ? 'Ground Floor' : `Floor ${flat.floor}`;
    const facingLabel = formatFacing(flat.facing);
    const isAvailable = flat.status === 'available';
    const planSrc = floorPlanSrc(flat.flat);
    const introVideoSrc = hasFlatSpecificVideo ? flatVideoSrc(fallbackId, 1) : WALKTHROUGH_VIDEO;
    const loopVideoSrc = hasFlatSpecificVideo ? flatVideoSrc(fallbackId, 2) : null;
    const reverseVideoSrc = hasFlatSpecificVideo ? flatReverseVideoSrc(fallbackId) : null;
    const bhkValue = Number.parseInt(flat.type, 10);
    const shouldShowDetailPanels = isTabletOrBelow
        ? true
        : !hasFlatSpecificVideo || videoPhase === 'loop';
    const interiorPanosHref = buildInteriorPanosHref({
        apartmentId: flat.id,
        flatNumber: flat.flat,
        floorLabel: flat.floor === 'G' ? 'Ground' : flat.floor,
        bhk: Number.isFinite(bhkValue) ? bhkValue : null,
    });
    const isCompactDesktop = !isTabletOrBelow && width < 1480;
    const isWideDesktop = width >= 1700;
    const desktopTopInset = isCompactDesktop ? '5.75rem' : '6.5rem';
    const desktopPanelHeight = isCompactDesktop ? 'calc(100vh - 8rem)' : 'calc(100vh - 8.9rem)';
    const desktopSidebarHeight = isCompactDesktop ? 'calc(100vh - 7.6rem)' : 'calc(100vh - 8.35rem)';
    const desktopGridColumns = isWideDesktop
        ? '420px 410px'
        : isCompactDesktop
            ? '360px 350px'
            : '390px 380px';
    const compactMediaHeight = isTabletOrBelow
        ? `${Math.min(
            Math.max(Math.round(width / COMPACT_MEDIA_ASPECT_RATIO), isTablet ? 420 : 220),
            isTablet ? 620 : 340,
        )}px`
        : 'min(42dvh, 380px)';
    const compactSheetOverlap = isTablet ? 28 : 24;
    const shouldShowPosterScrim = hasFlatSpecificVideo && videoPhase === 'intro' && !isIntroFrameReady;
    const shouldFadeDetailPanels = !shouldShowDetailPanels || (!isTabletOrBelow && isExitTransitionActive);
    const shouldDisableDetailPanelInteraction = isExitTransitionActive || !shouldShowDetailPanels;
    const detailShellInsetClass = isTabletOrBelow
        ? 'px-0 pb-24 pt-0'
        : 'px-4 pb-24 pt-5 2xl:px-8';
    const dockShellClass = isCompactDesktop
        ? 'gap-1.5 px-2 py-2'
        : 'gap-2 px-2.5 py-2.5';
    const dockButtonClass = isCompactDesktop
        ? 'px-3 py-2 text-[10px] tracking-[0.16em]'
        : 'px-4 py-2.5 text-[10px] tracking-[0.17em] 2xl:text-[11px]';
    const glassScrollbarClass = 'glass-scrollbar';
    const heroTitleClass = isTabletOrBelow
        ? 'text-[30px] sm:text-[34px]'
        : isCompactDesktop
            ? 'text-[28px] xl:text-[31px]'
            : 'text-[32px] xl:text-[36px]';
    const sectionTitleClass = isTabletOrBelow
        ? 'text-[18px] sm:text-[20px]'
        : isCompactDesktop
            ? 'text-[18px] xl:text-[19px]'
            : 'text-[20px]';
    const roomSectionHeadingClass = isTabletOrBelow
        ? 'text-[24px] sm:text-[26px]'
        : isCompactDesktop
            ? 'text-[22px] xl:text-[24px]'
            : 'text-[26px]';
    const bodyCopyClass = isTabletOrBelow
        ? 'text-[11px] leading-5 sm:text-[12px] sm:leading-6'
        : isCompactDesktop
            ? 'text-[11px] leading-5 xl:text-[12px] xl:leading-6'
            : 'text-[12px] leading-6';
    const metaValueClass = isCompactDesktop ? 'text-[12px] xl:text-[13px]' : 'text-[13px]';
    const cardSurfaceClass = 'rounded-[24px] border border-white/14 bg-[linear-gradient(160deg,rgba(255,255,255,0.12),rgba(48,58,72,0.16)_42%,rgba(9,13,20,0.4)_100%)] shadow-[0_24px_68px_rgba(0,0,0,0.28),inset_0_1px_0_rgba(255,255,255,0.1)] backdrop-blur-[32px]';
    const insetSurfaceClass = 'rounded-[20px] border border-white/12 bg-[linear-gradient(180deg,rgba(255,255,255,0.1),rgba(28,36,47,0.16)_26%,rgba(7,11,17,0.3)_100%)] shadow-[0_18px_40px_rgba(0,0,0,0.18),inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-[26px]';
    const quietSurfaceClass = 'rounded-[18px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(25,33,44,0.14)_24%,rgba(7,11,17,0.26)_100%)] shadow-[0_16px_38px_rgba(0,0,0,0.14),inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-[22px]';
    const openWalkthrough = () => router.push(interiorPanosHref);
    const renderSupportCards = (compactMode = false) => (
        <div className="space-y-4">
            <FloorPlanCard
                flat={flat}
                planSrc={planSrc}
                floorPlanError={floorPlanError}
                onFloorPlanError={() => setFloorPlanError(true)}
                sectionTitleClass={sectionTitleClass}
                compactMode={compactMode}
            />
            <WalkthroughPreviewCard
                onOpenWalkthrough={openWalkthrough}
                sectionTitleClass={sectionTitleClass}
                bodyCopyClass={bodyCopyClass}
                quietSurfaceClass={quietSurfaceClass}
                compactMode={compactMode}
            />
        </div>
    );

    return (
        <div
            ref={pageShellRef}
            className="relative min-h-screen overflow-hidden bg-[#07090e] text-white"
        >
            <div
                className={isTabletOrBelow ? 'absolute inset-x-0 top-0 z-0 overflow-hidden bg-black' : 'absolute inset-0 bg-black'}
                style={
                    isTabletOrBelow
                        ? {
                            height: compactMediaHeight,
                            backgroundImage: `url(${renderPosterSrc})`,
                            backgroundPosition: 'center',
                            backgroundRepeat: 'no-repeat',
                            backgroundSize: 'cover',
                        }
                        : {
                            backgroundImage: `url(${renderPosterSrc})`,
                            backgroundPosition: 'center',
                            backgroundRepeat: 'no-repeat',
                            backgroundSize: 'cover',
                        }
                }
            >
                {shouldShowPosterScrim ? (
                    <div
                        className="absolute inset-0 z-[2] transition-opacity duration-300"
                        style={{
                            backgroundImage: `linear-gradient(180deg,rgba(7,10,15,0.06),rgba(7,10,15,0.18)), url(${renderPosterSrc})`,
                            backgroundPosition: 'center',
                            backgroundRepeat: 'no-repeat',
                            backgroundSize: 'cover',
                            opacity: 1,
                        }}
                    />
                ) : null}
                <video
                    ref={introVideoRef}
                    key={introVideoSrc}
                    src={introVideoSrc}
                    className="absolute inset-0 h-full w-full object-cover transition-opacity duration-500"
                    style={{ opacity: videoPhase === 'intro' && isIntroFrameReady ? 1 : 0, zIndex: videoPhase === 'intro' ? 3 : 1 }}
                    muted={muted}
                    playsInline
                    preload="auto"
                    fetchPriority="high"
                    autoPlay
                    poster={renderPosterSrc}
                    controls={false}
                    disablePictureInPicture
                    controlsList="nodownload noplaybackrate noremoteplayback nofullscreen"
                    loop={!hasFlatSpecificVideo}
                    onLoadedData={() => setIsIntroFrameReady(true)}
                    onCanPlay={() => setIsIntroFrameReady(true)}
                    onPlaying={() => setIsIntroFrameReady(true)}
                    onEnded={handleIntroEnded}
                    onError={() => {
                        setIsIntroFrameReady(true);
                        if (hasFlatSpecificVideo) {
                            setVideoPhase('intro');
                            setUseVideoFallback(true);
                        }
                    }}
                />
                {loopVideoSrc ? (
                    <video
                        ref={loopVideoRef}
                        key={loopVideoSrc}
                        src={loopVideoSrc}
                        className="absolute inset-0 h-full w-full object-cover transition-opacity duration-500"
                        style={{ opacity: videoPhase === 'loop' ? 1 : 0, zIndex: videoPhase === 'loop' ? 4 : 1 }}
                        muted={muted}
                        playsInline
                        preload="auto"
                        fetchPriority="low"
                        loop
                        controls={false}
                        disablePictureInPicture
                        controlsList="nodownload noplaybackrate noremoteplayback nofullscreen"
                        onError={() => {
                            setVideoPhase('intro');
                            setUseVideoFallback(true);
                        }}
                    />
                ) : null}
                {reverseVideoSrc ? (
                    <video
                        ref={reverseVideoRef}
                        key={reverseVideoSrc}
                        src={reverseVideoSrc}
                        className="absolute inset-0 h-full w-full object-cover transition-opacity duration-300"
                        style={{ opacity: videoPhase === 'reverse' ? 1 : 0, zIndex: videoPhase === 'reverse' ? 5 : 1 }}
                        muted={muted}
                        playsInline
                        preload="metadata"
                        fetchPriority="low"
                        controls={false}
                        disablePictureInPicture
                        controlsList="nodownload noplaybackrate noremoteplayback nofullscreen"
                        onEnded={finalizeBackNavigation}
                        onError={() => {
                            if (isNavigatingRef.current || videoPhase === 'reverse') {
                                finalizeBackNavigation();
                            }
                        }}
                    />
                ) : null}
            </div>

            {isTabletOrBelow ? (
                <div
                    className="absolute inset-x-0 bottom-0 z-[1] bg-[linear-gradient(180deg,rgba(8,12,18,0.86),rgba(7,10,16,0.96))]"
                    style={{
                        top: `calc(${compactMediaHeight} - ${compactSheetOverlap}px)`,
                    }}
                />
            ) : null}

            <div
                className={`relative z-10 min-h-screen transition-opacity duration-500 ${detailShellInsetClass} ${
                    shouldDisableDetailPanelInteraction
                        ? 'pointer-events-none'
                        : 'opacity-100'
                }`}
                style={
                    isTabletOrBelow
                        ? {
                            paddingTop: `calc(${compactMediaHeight} - ${compactSheetOverlap}px)`,
                            opacity: shouldFadeDetailPanels ? 0 : 1,
                        }
                        : {
                            paddingTop: desktopTopInset,
                            opacity: shouldFadeDetailPanels ? 0 : 1,
                        }
                }
            >
                <div className="mx-auto flex min-h-[calc(100vh-2rem)] w-full max-w-none flex-col">
                    {!isMobile ? (
                        <div className="fixed inset-x-0 bottom-4 z-20 flex justify-center px-4 lg:bottom-5">
                            <div className={`flex flex-wrap items-center justify-center rounded-[22px] border border-white/12 bg-[linear-gradient(160deg,rgba(255,255,255,0.12),rgba(33,42,55,0.16)_42%,rgba(8,12,18,0.42)_100%)] shadow-[0_18px_46px_rgba(0,0,0,0.32),inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-[28px] ${dockShellClass}`}>
                                <button
                                    type="button"
                                    onClick={toggleMute}
                                    className={`inline-flex items-center gap-2 rounded-full border border-white/14 bg-[linear-gradient(180deg,rgba(255,255,255,0.1),rgba(255,255,255,0.04))] font-semibold uppercase text-white/82 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-[20px] transition hover:border-white/24 hover:bg-white/[0.08] ${dockButtonClass}`}
                                >
                                    {muted ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
                                    {muted ? 'Muted' : 'Audio On'}
                                </button>
                                <button
                                    type="button"
                                    onClick={(event) => {
                                        event.preventDefault();
                                        event.stopPropagation();
                                        void goFullscreen();
                                    }}
                                    className={`inline-flex items-center gap-2 rounded-full border border-white/14 bg-[linear-gradient(180deg,rgba(255,255,255,0.1),rgba(255,255,255,0.04))] font-semibold uppercase text-white/82 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-[20px] transition hover:border-white/24 hover:bg-white/[0.08] ${dockButtonClass}`}
                                >
                                    <Maximize2 className="h-3.5 w-3.5" />
                                    {isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
                                </button>
                                <a
                                    href={`${WHATSAPP_URL}${flat.flat}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={`inline-flex items-center gap-2 rounded-full border border-white/14 bg-[linear-gradient(180deg,rgba(255,255,255,0.14),rgba(255,255,255,0.06))] font-semibold uppercase text-white/88 shadow-[0_12px_26px_rgba(0,0,0,0.14),inset_0_1px_0_rgba(255,255,255,0.1)] transition hover:border-white/24 hover:bg-white/[0.1] ${dockButtonClass} ${isCompactDesktop ? 'px-3.5' : 'px-4 2xl:px-5'}`}
                                >
                                    <MessageCircle className="h-3.5 w-3.5" />
                                    Enquire
                                </a>
                            </div>
                        </div>
                    ) : null}

                    <div
                        className={isTabletOrBelow
                            ? 'mt-3 flex flex-1 flex-col gap-4'
                            : 'mt-3 grid flex-1 gap-4 lg:justify-between lg:px-1 xl:mt-0 xl:gap-5'}
                        style={!isTabletOrBelow ? { gridTemplateColumns: desktopGridColumns } : undefined}
                    >
                        <div className="min-h-0 w-full">
                            <div
                                className={`${cardSurfaceClass} ${isTabletOrBelow ? 'rounded-t-[28px] border-x-0 border-b-0 px-3 pb-6 pt-3 shadow-[0_-20px_60px_rgba(8,12,18,0.34),inset_0_1px_0_rgba(255,255,255,0.16)]' : 'p-3 sm:p-4 lg:overflow-hidden'}`}
                                style={!isTabletOrBelow ? { height: desktopPanelHeight } : undefined}
                            >
                                <div
                                    ref={mainPanelRef}
                                    className={`flex min-h-0 flex-col gap-4 lg:h-full lg:overflow-y-auto lg:pr-1 ${glassScrollbarClass}`}
                                >
                                    <div className={`flex shrink-0 flex-col p-4 ${insetSurfaceClass}`}>
                                        <div className="flex flex-wrap items-center gap-2">
                                            <span className="inline-flex items-center gap-2 rounded-full border border-white/14 bg-[linear-gradient(180deg,rgba(255,255,255,0.12),rgba(255,255,255,0.05))] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/82 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
                                                <Sparkles className="h-3.5 w-3.5" />
                                                Aadhya Serene
                                            </span>
                                            <span
                                                className={`inline-flex border px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.22em] ${
                                                    isAvailable
                                                        ? 'border-emerald-300/18 bg-emerald-300/10 text-emerald-200'
                                                        : 'border-white/12 bg-white/8 text-white/58'
                                                }`}
                                            >
                                                {isAvailable ? 'Available Now' : 'Sold Out'}
                                            </span>
                                        </div>

                                        <div className="mt-4">
                                            <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-white/34">
                                                Signature Residence
                                            </p>
                                            <h1 className={`mt-3 font-serif leading-[0.94] text-white ${heroTitleClass}`}>
                                                Apartment {flat.flat}
                                            </h1>
                                            <p className={`mt-3 text-white/58 ${bodyCopyClass}`}>
                                                A calmer expression of premium living shaped with balanced proportions, refined daylight, and everyday ease.
                                            </p>
                                            {useVideoFallback ? (
                                                <p className="mt-3 border border-white/12 bg-white/[0.05] px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/58">
                                                    Sample exterior video shown while the flat-specific preview is unavailable.
                                                </p>
                                            ) : null}
                                        </div>

                                        <div className={`mt-4 p-3.5 ${quietSurfaceClass}`}>
                                            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/34">
                                                Curated Summary
                                            </p>
                                            <div className="mt-3 space-y-2.5">
                                                <div className="flex items-center justify-between border-b border-white/8 pb-2">
                                                    <span className="text-[10px] uppercase tracking-[0.16em] text-white/36">Typology</span>
                                                    <span className={`${metaValueClass} font-medium text-white/88`}>{flat.type}</span>
                                                </div>
                                                <div className="flex items-center justify-between border-b border-white/8 pb-2">
                                                    <span className="text-[10px] uppercase tracking-[0.16em] text-white/36">Area</span>
                                                    <span className={`${metaValueClass} font-medium text-white/88`}>{flat.area} sqft</span>
                                                </div>
                                                <div className="flex items-center justify-between border-b border-white/8 pb-2">
                                                    <span className="text-[10px] uppercase tracking-[0.16em] text-white/36">Facing</span>
                                                    <span className={`${metaValueClass} font-medium text-white/88`}>{facingLabel}</span>
                                                </div>
                                                <div className="flex items-center justify-between border-b border-white/8 pb-2">
                                                    <span className="text-[10px] uppercase tracking-[0.16em] text-white/36">Level</span>
                                                    <span className={`${metaValueClass} font-medium text-white/88`}>{floorLabel}</span>
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <span className="text-[10px] uppercase tracking-[0.16em] text-white/36">Balconies</span>
                                                    <span className={`${metaValueClass} font-medium text-white/88`}>{flat.balconies}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="mt-4 grid gap-2">
                                            <div className={`${quietSurfaceClass} px-3.5 py-3`}>
                                                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/34">Status</p>
                                                <p className={`mt-1.5 text-[17px] font-medium ${isAvailable ? 'text-emerald-200' : 'text-white/64'}`}>
                                                    {isAvailable ? 'Available' : 'Sold Out'}
                                                </p>
                                            </div>
                                            {/* <div className="rounded-[18px] border border-white/8 bg-white/[0.03] px-3.5 py-3">
                                                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/34">Planning Note</p>
                                                <p className="mt-1.5 text-[11px] leading-5 text-white/54">
                                                    A quieter home language with practical flow, private edges, and calm proportions throughout.
                                                </p>
                                            </div> */}
                                        </div>

                                        <button
                                            type="button"
                                            onClick={navigateBack}
                                                className="mt-4 inline-flex cursor-pointer items-center justify-center gap-2 rounded-full border border-white/14 bg-[linear-gradient(180deg,rgba(255,255,255,0.1),rgba(255,255,255,0.04))] px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/82 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-[20px] transition hover:border-white/24 hover:bg-white/[0.08]"
                                        >
                                            <ArrowLeft className="h-4 w-4" />
                                            Back to Apartments
                                        </button>
                                    </div>

                                    <div className={`${insetSurfaceClass} p-4 lg:pt-8`}>
                                        {!isTabletOrBelow ? (
                                            <>
                                                <div className="grid gap-2">
                                                    <StatCard icon={Building2} label="Type" value={flat.type} />
                                                    <StatCard icon={Ruler} label="Area" value={`${flat.area} sqft`} />
                                                    <StatCard icon={Compass} label="Facing" value={facingLabel} />
                                                    <StatCard icon={LayoutGrid} label="Level" value={floorLabel} />
                                                    <StatCard icon={Flower2} label="Balconies" value={`${flat.balconies}`} />
                                                    <StatCard
                                                        icon={Sparkles}
                                                        label="Status"
                                                        value={isAvailable ? 'Available' : 'Sold Out'}
                                                        accent={isAvailable ? 'text-emerald-200' : 'text-white/64'}
                                                    />
                                                </div>

                                                <div className="mt-5 flex flex-wrap items-end justify-between gap-4">
                                                    <div>
                                                        <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-white/36">
                                                            Spatial Composition
                                                        </p>
                                                        <h2 className={`mt-2 font-medium tracking-[0.02em] text-white ${roomSectionHeadingClass}`}>
                                                            Room Dimensions
                                                        </h2>
                                                    </div>
                                                    <p className={`max-w-[34ch] text-white/48 ${isCompactDesktop ? 'text-[12px] leading-5' : 'text-[13px] leading-6'}`}>
                                                        Every room is proportioned for practical comfort while preserving a clean,
                                                        elevated planning language throughout the residence.
                                                    </p>
                                                </div>

                                                <div className="mt-5 grid gap-2">
                                                    {flat.rooms.map((room, index) => (
                                                        <RoomCard key={`${room.name}-${index}`} room={room} />
                                                    ))}
                                                </div>
                                            </>
                                        ) : null}

                                        {isTabletOrBelow ? (
                                            <div className="mt-5">
                                                {renderSupportCards(true)}
                                            </div>
                                        ) : null}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div
                            className="min-h-0 lg:sticky lg:self-start"
                            hidden={isTabletOrBelow}
                            style={!isTabletOrBelow ? { top: desktopTopInset } : undefined}
                        >
                            <div
                                ref={sidebarPanelRef}
                                className={`${cardSurfaceClass} p-3 sm:p-4 lg:overflow-y-auto ${glassScrollbarClass}`}
                                style={!isTabletOrBelow ? { maxHeight: desktopSidebarHeight } : undefined}
                            >
                                {renderSupportCards(false)}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <style jsx global>{`
                .glass-scrollbar {
                    scrollbar-width: thin;
                    scrollbar-color: rgba(232, 238, 248, 0.42) rgba(255, 255, 255, 0.05);
                }

                .glass-scrollbar::-webkit-scrollbar {
                    width: 10px;
                }

                .glass-scrollbar::-webkit-scrollbar-track {
                    background: linear-gradient(
                        180deg,
                        rgba(255, 255, 255, 0.06),
                        rgba(255, 255, 255, 0.02)
                    );
                    border-radius: 999px;
                    border: 1px solid rgba(255, 255, 255, 0.08);
                    box-shadow:
                        inset 0 1px 0 rgba(255, 255, 255, 0.08),
                        0 8px 18px rgba(7, 10, 18, 0.16);
                    backdrop-filter: blur(10px) saturate(1.2);
                }

                .glass-scrollbar::-webkit-scrollbar-thumb {
                    background: linear-gradient(
                        180deg,
                        rgba(248, 250, 255, 0.46),
                        rgba(214, 223, 238, 0.26)
                    );
                    border-radius: 999px;
                    border: 1px solid rgba(255, 255, 255, 0.18);
                    box-shadow:
                        inset 0 1px 0 rgba(255, 255, 255, 0.22),
                        0 10px 18px rgba(6, 10, 18, 0.18);
                    backdrop-filter: blur(12px) saturate(1.25);
                }

                .glass-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: linear-gradient(
                        180deg,
                        rgba(252, 253, 255, 0.58),
                        rgba(225, 232, 244, 0.34)
                    );
                }
            `}</style>
        </div>
    );
}
