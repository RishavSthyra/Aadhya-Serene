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
    flatVideoFallbackId,
    flatReverseVideoSrc,
    flatVideoSrc,
    getFlatById,
    supportsFlatRenderVideoPlayback,
    WALKTHROUGH_VIDEO,
} from '../../../lib/flats';
import {
    buildInteriorPanosHref,
    preloadInteriorStartPano,
    INTERIOR_START_PREVIEW_URL,
} from '../../../lib/interior-panos';
import { skipNextApartmentsReplay } from '../../../lib/background-transition';

const WHATSAPP_URL = 'https://wa.me/919620993333?text=Hi!%20I%20want%20to%20know%20more%20about%20flat%20';

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
        <div className="rounded-[20px] border border-white/10 bg-black/18 px-4 py-3 backdrop-blur-[18px]">
            <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-white/36">
                    <Icon className="h-4 w-4 text-[#dcc27c]" />
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
        <div className="group rounded-[20px] border border-white/9 bg-white/[0.04] px-4 py-3 transition-all duration-300 hover:border-[#dcc27c]/25 hover:bg-white/[0.06]">
            <div className="flex items-center justify-between gap-4">
                <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#dcc27c]/18 bg-[#dcc27c]/8 text-[#dcc27c]">
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

    const [muted, setMuted] = useState(true);
    const [floorPlanError, setFloorPlanError] = useState(false);
    const [useVideoFallback, setUseVideoFallback] = useState(() => !supportsFlatRenderVideoPlayback());
    const [videoPhase, setVideoPhase] = useState('intro');
    const [isExitTransitionActive, setIsExitTransitionActive] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);

    const flat = getFlatById(id);
    const fallbackId = flat ? flatVideoFallbackId(id) : null;
    const hasVideo = !!fallbackId;
    const hasFlatSpecificVideo = hasVideo && !useVideoFallback;

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
        setIsExitTransitionActive(false);
        isNavigatingRef.current = false;
    }, [clearReverseFallbackTimeout, id]);

    useEffect(() => {
        const introVideo = introVideoRef.current;
        const loopVideo = loopVideoRef.current;
        const reverseVideo = reverseVideoRef.current;

        primeInlineVideoElement(introVideo);
        primeInlineVideoElement(loopVideo);
        primeInlineVideoElement(reverseVideo);

        setVideoPhase('intro');

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
            reverseVideo.load();
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

        loopVideo.play().catch(() => {
            loopVideo.removeEventListener('playing', revealWhenReady);
            const introVideo = introVideoRef.current;
            if (!introVideo) return;

            introVideo.loop = true;
            introVideo.play().catch(() => {});
        });

        if (loopVideo.readyState >= 2) {
            revealLoopVideo();
        }
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
            if (isInsideInteractivePanel(event.target)) return;
            if (event.deltaY < -30) navigateBack();
        };

        let touchStartY = 0;
        let touchStartedInsidePanel = false;

        const handleTouchStart = (event) => {
            touchStartY = event.touches[0].clientY;
            touchStartedInsidePanel = isInsideInteractivePanel(event.target);
        };

        const handleTouchEnd = (event) => {
            if (isNavigatingRef.current) return;
            if (touchStartedInsidePanel) return;
            const deltaY = touchStartY - event.changedTouches[0].clientY;

            if (deltaY < -60) {
                navigateBack();
            }
        };

        window.addEventListener('wheel', handleWheel, { passive: true });
        window.addEventListener('touchstart', handleTouchStart, { passive: true });
        window.addEventListener('touchend', handleTouchEnd, { passive: true });

        return () => {
            window.removeEventListener('wheel', handleWheel);
            window.removeEventListener('touchstart', handleTouchStart);
            window.removeEventListener('touchend', handleTouchEnd);
        };
    }, [navigateBack]);

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
                <div className="rounded-[32px] border border-white/10 bg-white/[0.04] px-8 py-10 text-center backdrop-blur-[22px]">
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
    const shouldShowDetailPanels = !hasFlatSpecificVideo || videoPhase === 'loop';
    const interiorPanosHref = buildInteriorPanosHref({
        apartmentId: flat.id,
        flatNumber: flat.flat,
        floorLabel: flat.floor === 'G' ? 'Ground' : flat.floor,
        bhk: Number.isFinite(bhkValue) ? bhkValue : null,
    });

    return (
        <div
            ref={pageShellRef}
            className="relative min-h-screen overflow-hidden bg-[#07090e] text-white"
        >
            <div className="absolute inset-0 bg-black">
                <video
                    ref={introVideoRef}
                    key={introVideoSrc}
                    src={introVideoSrc}
                    className="absolute inset-0 h-full w-full object-cover transition-opacity duration-500"
                    style={{ opacity: videoPhase === 'intro' ? 1 : 0, zIndex: videoPhase === 'intro' ? 3 : 1 }}
                    muted={muted}
                    playsInline
                    preload="auto"
                    autoPlay
                    controls={false}
                    disablePictureInPicture
                    controlsList="nodownload noplaybackrate noremoteplayback nofullscreen"
                    loop={!hasFlatSpecificVideo}
                    onEnded={handleIntroEnded}
                    onError={() => {
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
                        preload="auto"
                        controls={false}
                        disablePictureInPicture
                        controlsList="nodownload noplaybackrate noremoteplayback nofullscreen"
                        onEnded={finalizeBackNavigation}
                        onError={finalizeBackNavigation}
                    />
                ) : null}
            </div>

            <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_18%,rgba(220,194,124,0.14),transparent_34%),linear-gradient(90deg,rgba(7,9,14,0.8)_0%,rgba(7,9,14,0.34)_42%,rgba(7,9,14,0.68)_100%)]" />
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(7,9,14,0.72)_0%,rgba(7,9,14,0.18)_28%,rgba(7,9,14,0.62)_100%)]" />

            <div
                className={`relative z-10 min-h-screen px-3 pb-24 pt-4 transition-opacity duration-500 sm:px-5 lg:px-6 lg:pb-28 lg:pt-6 2xl:px-8 ${
                    isExitTransitionActive || !shouldShowDetailPanels
                        ? 'pointer-events-none opacity-0'
                        : 'opacity-100'
                }`}
            >
                <div className="mx-auto flex min-h-[calc(100vh-2rem)] w-full max-w-none flex-col">
                    <div className="fixed inset-x-0 bottom-6 z-20 flex justify-center px-4">
                        <div className="flex flex-wrap items-center justify-center gap-2 rounded-full border border-white/10 bg-[#0d1016]/78 px-3 py-3 shadow-[0_18px_50px_rgba(0,0,0,0.35)] backdrop-blur-[24px]">
                            <button
                                type="button"
                                onClick={toggleMute}
                                className="inline-flex items-center gap-2 rounded-full border border-white/14 bg-white/[0.05] px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/82 backdrop-blur-[20px] transition hover:border-white/24 hover:bg-white/[0.08]"
                            >
                                {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                                {muted ? 'Muted' : 'Audio On'}
                            </button>
                            <button
                                type="button"
                                onClick={(event) => {
                                    event.preventDefault();
                                    event.stopPropagation();
                                    void goFullscreen();
                                }}
                                className="inline-flex items-center gap-2 rounded-full border border-white/14 bg-white/[0.05] px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/82 backdrop-blur-[20px] transition hover:border-white/24 hover:bg-white/[0.08]"
                            >
                                <Maximize2 className="h-4 w-4" />
                                {isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
                            </button>
                            <a
                                href={`${WHATSAPP_URL}${flat.flat}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 rounded-full bg-[#dcc27c] px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#17130b] transition hover:bg-[#e7cd85]"
                            >
                                <MessageCircle className="h-4 w-4" />
                                Enquire
                            </a>
                        </div>
                    </div>

                    <div className="mt-5 grid flex-1 gap-5 lg:grid-cols-[380px_370px] lg:justify-between lg:px-1 xl:grid-cols-[400px_390px] 2xl:grid-cols-[420px_410px]">
                        <div className="min-h-0 w-full lg:mt-10">
                            <div className="rounded-[36px] border border-white/10 bg-[linear-gradient(135deg,rgba(8,11,17,0.82),rgba(8,11,17,0.46))] p-3 shadow-[0_24px_80px_rgba(0,0,0,0.28)] backdrop-blur-[28px] sm:p-4 lg:h-[calc(100vh-11rem)] lg:overflow-hidden">
                                <div
                                    ref={mainPanelRef}
                                    className="flex min-h-0 flex-col gap-4 lg:h-full lg:overflow-y-auto lg:pr-1"
                                >
                                    <div className="flex shrink-0 flex-col rounded-[28px] border border-white/8 bg-[linear-gradient(180deg,rgba(5,8,12,0.62),rgba(5,8,12,0.28))] p-4 backdrop-blur-[22px]">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <span className="inline-flex items-center gap-2 rounded-full border border-[#dcc27c]/20 bg-[#dcc27c]/8 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.22em] text-[#dcc27c]">
                                                <Sparkles className="h-3.5 w-3.5" />
                                                Aadhya Serene
                                            </span>
                                            <span
                                                className={`inline-flex rounded-full border px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.22em] ${
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
                                            <h1 className="mt-3 font-serif text-[32px] leading-[0.94] text-[#f4efe5] sm:text-[36px]">
                                                Apartment {flat.flat}
                                            </h1>
                                            <p className="mt-3 text-[12px] leading-6 text-white/58">
                                                A calmer expression of premium living shaped with balanced proportions, refined daylight, and everyday ease.
                                            </p>
                                            {useVideoFallback ? (
                                                <p className="mt-3 rounded-full border border-white/12 bg-white/[0.05] px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/58">
                                                    Sample exterior video shown while the flat-specific preview is unavailable.
                                                </p>
                                            ) : null}
                                        </div>

                                        <div className="mt-4 rounded-[22px] border border-white/8 bg-white/[0.03] p-3.5">
                                            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/34">
                                                Curated Summary
                                            </p>
                                            <div className="mt-3 space-y-2.5">
                                                <div className="flex items-center justify-between border-b border-white/8 pb-2">
                                                    <span className="text-[10px] uppercase tracking-[0.16em] text-white/36">Typology</span>
                                                    <span className="text-[13px] font-medium text-white/88">{flat.type}</span>
                                                </div>
                                                <div className="flex items-center justify-between border-b border-white/8 pb-2">
                                                    <span className="text-[10px] uppercase tracking-[0.16em] text-white/36">Area</span>
                                                    <span className="text-[13px] font-medium text-white/88">{flat.area} sqft</span>
                                                </div>
                                                <div className="flex items-center justify-between border-b border-white/8 pb-2">
                                                    <span className="text-[10px] uppercase tracking-[0.16em] text-white/36">Facing</span>
                                                    <span className="text-[13px] font-medium text-white/88">{facingLabel}</span>
                                                </div>
                                                <div className="flex items-center justify-between border-b border-white/8 pb-2">
                                                    <span className="text-[10px] uppercase tracking-[0.16em] text-white/36">Level</span>
                                                    <span className="text-[13px] font-medium text-white/88">{floorLabel}</span>
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <span className="text-[10px] uppercase tracking-[0.16em] text-white/36">Balconies</span>
                                                    <span className="text-[13px] font-medium text-white/88">{flat.balconies}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="mt-4 grid gap-2">
                                            <div className="rounded-[18px] border border-white/8 bg-white/[0.03] px-3.5 py-3">
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
                                            className="mt-4 inline-flex cursor-pointer items-center justify-center gap-2 rounded-full border border-white/14 bg-white/[0.05] px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-white/82 backdrop-blur-[20px] transition hover:border-white/24 hover:bg-white/[0.08]"
                                        >
                                            <ArrowLeft className="h-4 w-4" />
                                            Back to Apartments
                                        </button>
                                    </div>

                                    <div className="rounded-[30px] border border-white/8 bg-[linear-gradient(180deg,rgba(7,10,15,0.56),rgba(7,10,15,0.24))] p-4 backdrop-blur-[18px] lg:pt-8">
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
                                                <h2 className="mt-2 text-[26px] font-medium tracking-[0.02em] text-[#f4efe5]">
                                                    Room Dimensions
                                                </h2>
                                            </div>
                                            <p className="max-w-[34ch] text-[13px] leading-6 text-white/48">
                                                Every room is proportioned for practical comfort while preserving a clean,
                                                elevated planning language throughout the residence.
                                            </p>
                                        </div>

                                        <div className="mt-5 grid gap-2">
                                            {flat.rooms.map((room, index) => (
                                                <RoomCard key={`${room.name}-${index}`} room={room} />
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="min-h-0 lg:sticky lg:top-6 lg:self-start">
                            <div
                                ref={sidebarPanelRef}
                                className="rounded-[30px] border border-white/10 bg-[linear-gradient(180deg,rgba(5,7,12,0.96),rgba(5,7,12,0.84))] p-3 shadow-[0_28px_90px_rgba(0,0,0,0.4)] backdrop-blur-[30px] sm:p-4 lg:max-h-[calc(100vh-5rem)] lg:overflow-y-auto"
                            >
                                <div className="space-y-4">
                            <div className="rounded-[24px] border border-white/8 bg-[linear-gradient(180deg,rgba(5,8,12,0.78),rgba(5,8,12,0.52))] p-4">
                                <div className="mb-4 flex items-center justify-between gap-3">
                                    <div>
                                        <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-white/34">
                                            Floor Plan
                                        </p>
                                        <h2 className="mt-2 text-[20px] font-medium text-[#f4efe5]">
                                            Residence layout
                                        </h2>
                                    </div>
                                    <span className="rounded-full border border-white/12 bg-white/[0.04] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/55">
                                        {flat.flat}
                                    </span>
                                </div>

                                <div className="overflow-hidden rounded-[22px] border border-white/10 bg-black/25">
                                    {!floorPlanError ? (
                                        <img
                                            src={planSrc}
                                            alt={`Floor plan of apartment ${flat.flat}`}
                                            className="h-[260px] w-full object-cover transition duration-500 hover:scale-[1.02]"
                                            draggable={false}
                                            onError={() => setFloorPlanError(true)}
                                        />
                                    ) : (
                                        <div className="flex h-[260px] flex-col items-center justify-center bg-black/20 px-6 text-center">
                                            <Fullscreen className="h-10 w-10 text-[#dcc27c]" />
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
                                        className="inline-flex items-center justify-center gap-2 rounded-full border border-white/14 bg-white/[0.05] px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/82 transition hover:border-white/24 hover:bg-white/[0.08]"
                                    >
                                        <Maximize2 className="h-4 w-4" />
                                        Open Plan
                                    </a>
                                    <a
                                        href={`${WHATSAPP_URL}${flat.flat}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center justify-center gap-2 rounded-full bg-[#dcc27c] px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#17130b] transition hover:bg-[#e7cd85]"
                                    >
                                        <MessageCircle className="h-4 w-4" />
                                        Discuss
                                    </a>
                                </div>
                            </div>

                            <div className="rounded-[24px] border border-white/8 bg-[linear-gradient(180deg,rgba(5,8,12,0.78),rgba(5,8,12,0.52))] p-4">
                                <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-white/34">
                                    Interior Preview
                                </p>
                                <h2 className="mt-2 text-[20px] font-medium text-[#f4efe5]">
                                    Sample walkthrough
                                </h2>

                                <button
                                    type="button"
                                    onClick={() => router.push(interiorPanosHref)}
                                    className="group mt-4 block w-full overflow-hidden rounded-[22px] border border-white/10 bg-black/25 text-left"
                                >
                                    <div className="relative">
                                        <img
                                            src={INTERIOR_START_PREVIEW_URL}
                                            alt="Interior walkthrough"
                                            className="h-[210px] w-full object-cover transition duration-500 group-hover:scale-[1.03]"
                                            draggable={false}
                                            onError={(event) => {
                                                event.currentTarget.style.opacity = '0.3';
                                            }}
                                        />
                                        <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent_0%,rgba(8,11,17,0.24)_40%,rgba(8,11,17,0.88)_100%)]" />
                                        <div className="absolute bottom-[40%] left-1/2 -translate-x-1/2 flex items-end justify-between gap-4">
                                          
                                            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-white/18 bg-white/12 text-white backdrop-blur-md transition group-hover:scale-105 group-hover:bg-white/16">
                                                <Play className="ml-0.5 h-4 w-4 fill-current" />
                                            </span>
                                        </div>
                                    </div>
                                </button>

                                <div className="mt-4 rounded-[24px] border border-white/8 bg-[linear-gradient(180deg,rgba(5,8,12,0.74),rgba(5,8,12,0.48))] px-4 py-4">
                                    <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/36">
                                        Design Note
                                    </p>
                                    <p className="mt-3 text-[13px] leading-6 text-white/56">
                                        The residence is positioned as a calm, daylight-led home with a more
                                        understated luxury language across proportion, flow, and private outdoor edges.
                                    </p>
                                </div>
                            </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
