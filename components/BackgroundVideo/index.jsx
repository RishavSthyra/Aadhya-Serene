'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    isBackgroundTransitionActive,
    setBackgroundTransitionState,
} from '@/lib/background-transition';
import {
    HOME_PRELOADER_COMPLETE_EVENT,
    isHomePreloaderComplete,
} from '@/lib/home-loader';
import {
    cacheAssetOnce,
    isAssetCachePending,
    prefetchAssetsInChunks,
    registerAssetCacheServiceWorker,
} from '@/lib/client-asset-cache';
import usePerformanceProfile from '@/hooks/usePerformanceProfile';
import styles from './background-video.module.css';

const S3_AMENITIES_BASE = 'https://aadhya-serene-assets-v2.s3.amazonaws.com/videos/amenities';
const R2_AMENITIES_BASE = 'https://cdn.sthyra.com/AADHYA%20SERENE/videos/amenities';
const HOME_VIDEO = 'https://cdn.sthyra.com/AADHYA%20SERENE/videos/Aadhya%20Serene%20Home%20Page.mp4';
const HOME_POSTER = 'https://cdn.sthyra.com/AADHYA%20SERENE/images/Aadhya%20Serene%20Home%20Page%20-%20First%20Frame.avif';

const APARTMENTS_TRANSITION = {
    safe: 'https://cdn.sthyra.com/AADHYA%20SERENE/videos/AADHYA_SERENE_OPTIMIZED/3-1_1920w_60fps_h264_safe.mp4',
    premium: 'https://cdn.sthyra.com/AADHYA%20SERENE/videos/AADHYA_SERENE_OPTIMIZED/3-1_2560w_60fps_h264_premium.mp4',
    ultra: 'https://cdn.sthyra.com/AADHYA%20SERENE/videos/AADHYA_SERENE_OPTIMIZED/3-1_3200w_60fps_h264_ultra.mp4',
};
const APARTMENTS_LOOP = 'https://cdn.sthyra.com/AADHYA%20SERENE/videos/3-2-av1.mp4';
const AMENITY_VIDEO_QUALITY = '1080p';

const LOCAL_VIDEO_FALLBACKS = {
    '3-1': '/assets/background-video/mobile/apartments-transition.mp4',
    '3-2': '/assets/background-video/mobile/apartments-loop.mp4',
};

const BACKGROUND_POSTERS = {
    home: HOME_POSTER,
    about: HOME_POSTER,
    apartments: 'https://cdn.sthyra.com/AADHYA%20SERENE/videos/first_frame_3_1%20(1).jpg',
    contact: HOME_POSTER,
    amenities: 'https://cdn.sthyra.com/AADHYA%20SERENE/images/umbrella-chair2.jpg',
    location: HOME_POSTER,
    'project-overview': HOME_POSTER,
};

const R2_AMENITY_SLUGS = new Set([
    'badminton',
    'basketball',
    'gymnasium',
    'swimmingPool',
]);

function getAmenityVideoSource(amenity) {
    const base = R2_AMENITY_SLUGS.has(amenity)
        ? R2_AMENITIES_BASE
        : S3_AMENITIES_BASE;

    return `${base}/${amenity}/${AMENITY_VIDEO_QUALITY}/${amenity}-h264.mp4`;
}

const APARTMENTS_LOOP_HOLD_MS = 0;
const HLS_MIN_START_BUFFER_AHEAD_SECONDS = 2.4;
const MP4_MIN_START_BUFFER_AHEAD_SECONDS = 2.2;
const LOOP_MIN_START_BUFFER_AHEAD_SECONDS = 1.2;
const HLS_FULLY_BUFFERED_TOLERANCE_SECONDS = 0.15;
const HOME_HLS_CONFIG = {
    enableWorker: true,
    lowLatencyMode: false,
    capLevelToPlayerSize: true,
    startLevel: 0,
    startFragPrefetch: true,
    testBandwidth: false,
    abrEwmaDefaultEstimate: 8000000,
    maxBufferLength: 45,
    maxMaxBufferLength: 90,
    backBufferLength: 30,
};

const LAYOUT_CONFIG = {
    home: {
        transition: HOME_VIDEO,
        loop: HOME_VIDEO,
    },
    about: {
        transition: HOME_VIDEO,
        loop: HOME_VIDEO,
    },
    apartments: {
        transition: APARTMENTS_TRANSITION,
        loop: APARTMENTS_LOOP,
        transitionAssetId: '3-1',
        loopAssetId: '3-2',
        loopHoldMs: APARTMENTS_LOOP_HOLD_MS,
    },
    walkthrough: {
        transition: APARTMENTS_TRANSITION,
        loop: APARTMENTS_LOOP,
        transitionAssetId: '3-1',
        loopAssetId: '3-2',
    },
    location: {
        transition: HOME_VIDEO,
        loop: HOME_VIDEO,
    },
    contact: {
        transition: HOME_VIDEO,
        loop: HOME_VIDEO,
    },
    'project-overview': {
        transition: HOME_VIDEO,
        loop: HOME_VIDEO,
    },
    amenities: {
        transition: getAmenityVideoSource('rooftopLeisureDeck'),
        loop: getAmenityVideoSource('rooftopLeisureDeck'),
    },
    'amenities-rooftopLeisureDeck': {
        transition: getAmenityVideoSource('rooftopLeisureDeck'),
        loop: getAmenityVideoSource('rooftopLeisureDeck'),
    },
    'amenities-childrensPlayArea': {
        transition: getAmenityVideoSource('childrensPlayArea'),
        loop: getAmenityVideoSource('childrensPlayArea'),
    },
    'amenities-swimmingPool': {
        transition: getAmenityVideoSource('swimmingPool'),
        loop: getAmenityVideoSource('swimmingPool'),
    },
    'amenities-gymnasium': {
        transition: getAmenityVideoSource('gymnasium'),
        loop: getAmenityVideoSource('gymnasium'),
    },
    'amenities-indoorGames': {
        transition: getAmenityVideoSource('indoorGames'),
        loop: getAmenityVideoSource('indoorGames'),
    },
    'amenities-clubhouse': {
        transition: getAmenityVideoSource('clubhouse'),
        loop: getAmenityVideoSource('clubhouse'),
    },
    'amenities-basketball': {
        transition: getAmenityVideoSource('basketball'),
        loop: getAmenityVideoSource('basketball'),
    },
    'amenities-badminton': {
        transition: getAmenityVideoSource('badminton'),
        loop: getAmenityVideoSource('badminton'),
    },
};

const DEFAULT_CONFIG = {
    transition: HOME_VIDEO,
    loop: HOME_VIDEO,
};
const PRELOAD_LAYOUTS = {
    home: ['apartments'],
    about: ['apartments', 'home'],
    apartments: ['home'],
};

function buildResolutionVariantUrl(source, quality) {
    if (typeof source !== 'string' || !quality) {
        return null;
    }

    if (!/\/(2160p|1440p|1080p|720p)\//.test(source)) {
        return null;
    }

    return source.replace(/\/(2160p|1440p|1080p|720p)\//, `/${quality}/`);
}

function uniqueSources(sources) {
    return [...new Set(sources.filter(Boolean))];
}

function resolveVideoVariant(source, profile) {
    if (!source || typeof source !== 'object') {
        return source;
    }

    if (profile.shouldConserveData || profile.isMobile || profile.isConstrainedDevice) {
        return source.safe ?? source.premium ?? source.ultra;
    }

    if (profile.veryHighCapabilityDesktop) {
        return source.ultra ?? source.premium ?? source.safe;
    }

    return source.premium ?? source.safe ?? source.ultra;
}

function isHlsSource(source) {
    return typeof source === 'string' && source.toLowerCase().includes('.m3u8');
}

function canPlayHlsNatively(video) {
    if (!video) return false;

    return ['application/vnd.apple.mpegurl', 'application/x-mpegURL']
        .some((mimeType) => video.canPlayType(mimeType) !== '');
}

function getBufferedAhead(video) {
    if (!video || video.buffered.length === 0) {
        return 0;
    }

    const currentTime = video.currentTime;

    for (let index = 0; index < video.buffered.length; index += 1) {
        const rangeStart = video.buffered.start(index);
        const rangeEnd = video.buffered.end(index);

        if (currentTime >= rangeStart && currentTime <= rangeEnd) {
            return Math.max(0, rangeEnd - currentTime);
        }
    }

    return 0;
}

function hasEnoughStartupBuffer(video, minimumSeconds) {
    if (!video) return false;

    const duration = Number.isFinite(video.duration) ? video.duration : 0;
    const bufferedAhead = getBufferedAhead(video);
    const almostFullDuration = duration > 0
        ? Math.max(0, duration - HLS_FULLY_BUFFERED_TOLERANCE_SECONDS)
        : minimumSeconds;

    return video.readyState >= 3
        || bufferedAhead >= Math.min(minimumSeconds, almostFullDuration)
        || (duration > 0 && bufferedAhead >= almostFullDuration);
}

function addBufferReadinessListeners(video, callback) {
    const events = ['progress', 'loadeddata', 'canplay', 'canplaythrough', 'durationchange', 'timeupdate'];

    events.forEach((eventName) => {
        video.addEventListener(eventName, callback);
    });

    return () => {
        events.forEach((eventName) => {
            video.removeEventListener(eventName, callback);
        });
    };
}

export default function BackgroundVideo({ layout = 'home', playing = true, replayKey = 0 }) {
    const {
        isMobile,
        isTablet,
        isSafari,
        isIOS,
        isConstrainedDevice,
        shouldConserveData,
        preferredVideoQuality,
        veryHighCapabilityDesktop,
    } = usePerformanceProfile();
    const transitionRef = useRef(null);
    const loopRef = useRef(null);
    const transitionHlsRef = useRef(null);
    const loopHlsRef = useRef(null);
    const transitionLoadIdRef = useRef(0);
    const loopLoadIdRef = useRef(0);
    const hlsModulePromiseRef = useRef(null);
    const transitionSourceIndexRef = useRef(0);
    const loopSourceIndexRef = useRef(0);
    const [showLoop, setShowLoop] = useState(false);

    const config = LAYOUT_CONFIG[layout] ?? DEFAULT_CONFIG;
    const transitionPreloadMode = shouldConserveData ? 'metadata' : 'auto';
    const loopPreloadMode = shouldConserveData ? 'metadata' : 'auto';
    const transitionIsHls = isHlsSource(config.transition);
    const shouldWaitForStartupBuffer = !shouldConserveData;
    const shouldEagerlyPrepareLoop = veryHighCapabilityDesktop && !transitionIsHls;
    const shouldDeferLoopPreloadForHls = !shouldConserveData && transitionIsHls && layout !== 'home';
    const shouldHideBackground = layout === 'location' || layout === 'project-overview';
    const posterSrc = BACKGROUND_POSTERS[layout] ?? BACKGROUND_POSTERS.home;
    const transitionReadyEvent = shouldConserveData ? 'loadedmetadata' : 'loadeddata';
    const transitionReadyStateThreshold = shouldConserveData ? 1 : 2;
    const loopReadyEvent = shouldConserveData ? 'loadedmetadata' : 'loadeddata';
    const loopReadyStateThreshold = shouldConserveData ? 1 : 2;

    useEffect(() => {
        void registerAssetCacheServiceWorker();
    }, []);

    useEffect(() => {
        if (!shouldHideBackground) return;

        setShowLoop(false);
        setBackgroundTransitionState(layout, false);
        window.dispatchEvent(new CustomEvent('bg-transition-ended', { detail: { layout } }));
    }, [layout, shouldHideBackground]);

    const getSourceCandidates = useCallback((source, assetId) => {
        if (!source) return [];

        const localFallbackSource = assetId ? LOCAL_VIDEO_FALLBACKS[assetId] : null;
        const preferredMp4Source = assetId
            ? null
            : buildResolutionVariantUrl(source, preferredVideoQuality);

        if (isHlsSource(source)) {
            return uniqueSources([source, preferredMp4Source, localFallbackSource]);
        }

        if ((isTablet || isSafari || isIOS || isConstrainedDevice) && preferredMp4Source) {
            return uniqueSources([preferredMp4Source, source, localFallbackSource]);
        }

        return uniqueSources([source, localFallbackSource]);
    }, [isConstrainedDevice, isIOS, isSafari, isTablet, preferredVideoQuality]);

    const getHlsModule = useCallback(() => {
        if (!hlsModulePromiseRef.current) {
            hlsModulePromiseRef.current = import('hls.js')
                .then((module) => module.default ?? module)
                .catch((error) => {
                    hlsModulePromiseRef.current = null;
                    throw error;
                });
        }

        return hlsModulePromiseRef.current;
    }, []);

    const destroyHlsInstance = useCallback((target) => {
        const ref = target === 'loop' ? loopHlsRef : transitionHlsRef;
        ref.current?.destroy();
        ref.current = null;
    }, []);

    const videoVariantProfile = useMemo(() => ({
        isMobile,
        isConstrainedDevice,
        shouldConserveData,
        veryHighCapabilityDesktop,
    }), [isConstrainedDevice, isMobile, shouldConserveData, veryHighCapabilityDesktop]);
    const transitionSource = useMemo(
        () => resolveVideoVariant(config.transition, videoVariantProfile),
        [config.transition, videoVariantProfile],
    );
    const loopSource = useMemo(
        () => resolveVideoVariant(config.loop, videoVariantProfile),
        [config.loop, videoVariantProfile],
    );

    const transitionSources = useMemo(
        () => getSourceCandidates(transitionSource, config.transitionAssetId),
        [config.transitionAssetId, getSourceCandidates, transitionSource],
    );
    const transitionSourcesKey = useMemo(
        () => transitionSources.join('|'),
        [transitionSources],
    );

    const loopSources = useMemo(
        () => getSourceCandidates(loopSource, config.loopAssetId),
        [config.loopAssetId, getSourceCandidates, loopSource],
    );
    const loopSourcesKey = useMemo(
        () => loopSources.join('|'),
        [loopSources],
    );
    const hasDistinctLoopAsset = transitionSourcesKey !== loopSourcesKey;

    useEffect(() => {
        if (shouldHideBackground || shouldConserveData) {
            return undefined;
        }

        let cancelled = false;
        const timeoutIds = [];
        let removeTransitionEndListener = null;
        const layoutsToWarm = PRELOAD_LAYOUTS[layout] ?? [];

        const warmLayout = (layoutToWarm) => {
            if (cancelled) return;

            const layoutConfig = LAYOUT_CONFIG[layoutToWarm];
            if (!layoutConfig) return;

            const warmTransitionSource = resolveVideoVariant(
                layoutConfig.transition,
                videoVariantProfile,
            );
            const warmLoopSource = resolveVideoVariant(
                layoutConfig.loop,
                videoVariantProfile,
            );
            const warmTransitionCandidates = getSourceCandidates(
                warmTransitionSource,
                layoutConfig.transitionAssetId,
            );
            const warmLoopCandidates = getSourceCandidates(
                warmLoopSource,
                layoutConfig.loopAssetId,
            );

            prefetchAssetsInChunks([
                BACKGROUND_POSTERS[layoutToWarm],
                warmTransitionCandidates[0],
                warmLoopCandidates[0],
            ], {
                chunkSize: 1,
                concurrency: 1,
                priority: 'low',
                gapMs: veryHighCapabilityDesktop ? 420 : 760,
                idleTimeoutMs: 2400,
            });
        };

        const scheduleWarmLayouts = () => {
            layoutsToWarm.forEach((layoutToWarm, index) => {
                const timeoutId = window.setTimeout(() => {
                    warmLayout(layoutToWarm);
                }, index === 0 ? 120 : 1000);

                timeoutIds.push(timeoutId);
            });
        };

        if (isBackgroundTransitionActive(layout)) {
            const handleTransitionEnded = (event) => {
                if (event.detail?.layout && event.detail.layout !== layout) {
                    return;
                }

                removeTransitionEndListener?.();
                removeTransitionEndListener = null;
                scheduleWarmLayouts();
            };

            window.addEventListener('bg-transition-ended', handleTransitionEnded);
            removeTransitionEndListener = () => {
                window.removeEventListener('bg-transition-ended', handleTransitionEnded);
            };
        } else {
            scheduleWarmLayouts();
        }

        return () => {
            cancelled = true;
            removeTransitionEndListener?.();
            timeoutIds.forEach((timeoutId) => window.clearTimeout(timeoutId));
        };
    }, [
        getSourceCandidates,
        layout,
        shouldConserveData,
        shouldHideBackground,
        veryHighCapabilityDesktop,
        videoVariantProfile,
    ]);

    const primeVideoElement = useCallback((video) => {
        if (!video) return;

        video.muted = true;
        video.defaultMuted = true;
        video.autoplay = false;
        video.playsInline = true;
        video.controls = false;
        video.disablePictureInPicture = true;
        video.setAttribute('muted', '');
        video.setAttribute('playsinline', '');
        video.setAttribute('webkit-playsinline', 'true');
        video.setAttribute('disablepictureinpicture', '');
        video.setAttribute('controlslist', 'nodownload noplaybackrate noremoteplayback nofullscreen');
    }, []);

    const loadVideoCandidate = useCallback((video, sources, index, options = {}) => {
        const { shouldLoop = false, preload = 'auto', target = 'transition' } = options;
        const source = sources[index];
        const loadIdRef = target === 'loop' ? loopLoadIdRef : transitionLoadIdRef;
        const loadId = loadIdRef.current + 1;

        if (!video || !source) {
            return false;
        }

        loadIdRef.current = loadId;
        destroyHlsInstance(target);
        primeVideoElement(video);
        video.pause();
        video.loop = shouldLoop;
        video.preload = preload;

        if (isHlsSource(source)) {
            video.removeAttribute('src');
            video.load();

            if (canPlayHlsNatively(video)) {
                video.src = source;
                video.load();
                return true;
            }

            getHlsModule()
                .then((Hls) => {
                    if (loadIdRef.current !== loadId) return;

                    if (!Hls.isSupported()) {
                        console.error('[BackgroundVideo] HLS is not supported in this browser/runtime.', {
                            layout,
                            source,
                            target,
                        });
                        video.dispatchEvent(new Event('error'));
                        return;
                    }

                    const hls = new Hls({
                        ...HOME_HLS_CONFIG,
                        ...(isConstrainedDevice
                            ? {
                                maxBufferLength: 20,
                                maxMaxBufferLength: 36,
                                backBufferLength: 12,
                            }
                            : {}),
                    });

                    const hlsRef = target === 'loop' ? loopHlsRef : transitionHlsRef;
                    hlsRef.current = hls;
                    hls.attachMedia(video);
                    hls.on(Hls.Events.MEDIA_ATTACHED, () => {
                        if (loadIdRef.current !== loadId) return;
                        hls.loadSource(source);
                    });
                    hls.on(Hls.Events.ERROR, (_, data) => {
                        if (data?.fatal && loadIdRef.current === loadId) {
                            console.error('[BackgroundVideo] Fatal HLS playback error.', {
                                layout,
                                source,
                                target,
                                details: data,
                            });
                            video.dispatchEvent(new Event('error'));
                        }
                    });
                })
                .catch((error) => {
                    if (loadIdRef.current === loadId) {
                        console.error('[BackgroundVideo] Failed to initialize hls.js.', {
                            layout,
                            source,
                            target,
                            error,
                        });
                        video.dispatchEvent(new Event('error'));
                    }
                });

            return true;
        }

        if (isAssetCachePending(source)) {
            cacheAssetOnce(source, {
                priority: target === 'transition' ? 'high' : 'low',
            }).finally(() => {
                if (loadIdRef.current !== loadId) return;
                video.src = source;
                video.load();
            });
            return true;
        }

        video.src = source;
        video.load();

        return true;
    }, [destroyHlsInstance, getHlsModule, isConstrainedDevice, layout, primeVideoElement]);

    useEffect(() => () => {
        destroyHlsInstance('transition');
        destroyHlsInstance('loop');
    }, [destroyHlsInstance]);

    useEffect(() => {
        primeVideoElement(transitionRef.current);
        primeVideoElement(loopRef.current);
    }, [primeVideoElement, layout, replayKey]);

    const loadTransitionCandidate = useCallback((index = 0) => {
        const transitionVideo = transitionRef.current;
        transitionSourceIndexRef.current = index;

        return loadVideoCandidate(transitionVideo, transitionSources, index, {
            preload: transitionPreloadMode,
            target: 'transition',
        });
    }, [loadVideoCandidate, transitionPreloadMode, transitionSources]);

    const loadLoopCandidate = useCallback((index = 0) => {
        const loopVideo = loopRef.current;
        loopSourceIndexRef.current = index;

        if (!hasDistinctLoopAsset) {
            return false;
        }

        return loadVideoCandidate(loopVideo, loopSources, index, {
            shouldLoop: true,
            preload: loopPreloadMode,
            target: 'loop',
        });
    }, [hasDistinctLoopAsset, loadVideoCandidate, loopPreloadMode, loopSources]);

    useEffect(() => {
        const transitionVideo = transitionRef.current;
        const loopVideo = loopRef.current;
        if (!transitionVideo || !loopVideo) return;

        let cancelled = false;
        let started = false;
        let loopPrepared = false;
        let firstLoopPrepareFrame = null;
        let secondLoopPrepareFrame = null;
        let deferredLoopPreloadCleanup = null;
        let deferredTransitionStartCleanup = null;
        let removeHomePreloaderListener = null;
        let transitionReady = false;
        let homePreloaderReleased = layout !== 'home' || isHomePreloaderComplete();

        const prepareLoopVideo = () => {
            if (cancelled || loopPrepared) return;
            loopPrepared = true;
            deferredLoopPreloadCleanup?.();
            deferredLoopPreloadCleanup = null;

            if (hasDistinctLoopAsset && loopSources.length > 0) {
                loadLoopCandidate(0);
            } else {
                loopVideo.pause();
                loopVideo.removeAttribute('src');
                loopVideo.load();
            }
        };

        const startTransition = () => {
            if (cancelled || started) return;
            started = true;

            setShowLoop(false);
            setBackgroundTransitionState(layout, true);
            window.dispatchEvent(new CustomEvent('bg-transition-started', { detail: { layout } }));

            if (playing) {
                transitionVideo.currentTime = 0;
                transitionVideo.play().catch(() => { });
            }

            if (shouldEagerlyPrepareLoop) {
                firstLoopPrepareFrame = requestAnimationFrame(() => {
                    firstLoopPrepareFrame = null;
                    secondLoopPrepareFrame = requestAnimationFrame(() => {
                        secondLoopPrepareFrame = null;
                        prepareLoopVideo();
                    });
                });
            } else if (shouldDeferLoopPreloadForHls) {
                const maybePrepareLoopAfterBuffer = () => {
                    const bufferedAhead = getBufferedAhead(transitionVideo);
                    const duration = Number.isFinite(transitionVideo.duration)
                        ? transitionVideo.duration
                        : 0;
                    const hasNearlyFullBuffer = duration > 0
                        && bufferedAhead >= Math.max(0, duration - HLS_FULLY_BUFFERED_TOLERANCE_SECONDS);

                    if (hasNearlyFullBuffer) {
                        prepareLoopVideo();
                    }
                };

                transitionVideo.addEventListener('progress', maybePrepareLoopAfterBuffer);
                transitionVideo.addEventListener('timeupdate', maybePrepareLoopAfterBuffer);
                deferredLoopPreloadCleanup = () => {
                    transitionVideo.removeEventListener('progress', maybePrepareLoopAfterBuffer);
                    transitionVideo.removeEventListener('timeupdate', maybePrepareLoopAfterBuffer);
                };

                maybePrepareLoopAfterBuffer();
            }
        };

        const startTransitionWhenAllowed = () => {
            if (cancelled || !transitionReady) return;
            if (!homePreloaderReleased) return;

            startTransitionWhenBuffered();
        };

        const startTransitionWhenBuffered = () => {
            if (!shouldWaitForStartupBuffer) {
                startTransition();
                return;
            }

            const maybeStartWhenBuffered = () => {
                const minimumBuffer = transitionIsHls
                    ? HLS_MIN_START_BUFFER_AHEAD_SECONDS
                    : MP4_MIN_START_BUFFER_AHEAD_SECONDS;

                if (hasEnoughStartupBuffer(transitionVideo, minimumBuffer)) {
                    deferredTransitionStartCleanup?.();
                    deferredTransitionStartCleanup = null;
                    startTransition();
                }
            };

            deferredTransitionStartCleanup = addBufferReadinessListeners(
                transitionVideo,
                maybeStartWhenBuffered,
            );

            maybeStartWhenBuffered();
        };

        setBackgroundTransitionState(layout, true);
        transitionSourceIndexRef.current = 0;
        loopSourceIndexRef.current = 0;
        loopVideo.pause();
        loopVideo.removeAttribute('src');
        loopVideo.load();

        if (!loadTransitionCandidate(0)) {
            setBackgroundTransitionState(layout, false);
            window.dispatchEvent(new CustomEvent('bg-transition-ended', { detail: { layout } }));
            return undefined;
        }

        if (!homePreloaderReleased) {
            const handleHomePreloaderComplete = () => {
                homePreloaderReleased = true;
                startTransitionWhenAllowed();
            };

            window.addEventListener(HOME_PRELOADER_COMPLETE_EVENT, handleHomePreloaderComplete);
            removeHomePreloaderListener = () => {
                window.removeEventListener(HOME_PRELOADER_COMPLETE_EVENT, handleHomePreloaderComplete);
            };
        }

        const handleTransitionReady = () => {
            transitionVideo.removeEventListener(transitionReadyEvent, handleTransitionReady);
            transitionReady = true;
            startTransitionWhenAllowed();
        };

        const handleTransitionError = () => {
            const nextIndex = transitionSourceIndexRef.current + 1;
            if (nextIndex < transitionSources.length && loadTransitionCandidate(nextIndex)) {
                return;
            }

            console.error('[BackgroundVideo] Transition video failed with no remaining fallback sources.', {
                layout,
                sources: transitionSources,
            });
            setBackgroundTransitionState(layout, false);
            window.dispatchEvent(new CustomEvent('bg-transition-ended', { detail: { layout } }));
        };

        transitionVideo.addEventListener(transitionReadyEvent, handleTransitionReady);
        transitionVideo.addEventListener('error', handleTransitionError);

        if (transitionVideo.readyState >= transitionReadyStateThreshold) {
            transitionReady = true;
            startTransitionWhenAllowed();
        }

        return () => {
            cancelled = true;
            if (firstLoopPrepareFrame !== null) {
                cancelAnimationFrame(firstLoopPrepareFrame);
            }
            if (secondLoopPrepareFrame !== null) {
                cancelAnimationFrame(secondLoopPrepareFrame);
            }
            deferredLoopPreloadCleanup?.();
            deferredTransitionStartCleanup?.();
            removeHomePreloaderListener?.();
            transitionVideo.removeEventListener(transitionReadyEvent, handleTransitionReady);
            transitionVideo.removeEventListener('error', handleTransitionError);
        };
    }, [
        config.loopHoldMs,
        hasDistinctLoopAsset,
        layout,
        loopSourcesKey,
        playing,
        replayKey,
        shouldEagerlyPrepareLoop,
        shouldDeferLoopPreloadForHls,
        shouldWaitForStartupBuffer,
        transitionIsHls,
        transitionSourcesKey,
    ]);

    useEffect(() => {
        const transitionVideo = transitionRef.current;
        const loopVideo = loopRef.current;
        if (!transitionVideo || !loopVideo) return;

        if (layout === 'home' && !showLoop && !isHomePreloaderComplete()) {
            transitionVideo.pause();
            return;
        }

        if (playing) {
            const activeVideo = showLoop ? loopVideo : transitionVideo;
            activeVideo.play().catch(() => { });
            return;
        }

        transitionVideo.pause();
        loopVideo.pause();
    }, [playing, showLoop]);

    const handleTransitionEnded = () => {
        const transitionVideo = transitionRef.current;
        const loopVideo = loopRef.current;
        if (!transitionVideo) return;

        if (!hasDistinctLoopAsset || !loopVideo || loopSources.length === 0) {
            transitionVideo.currentTime = 0;
            transitionVideo.loop = true;
            transitionVideo.play().catch(() => { });
            setShowLoop(false);
            setBackgroundTransitionState(layout, false);
            window.dispatchEvent(new CustomEvent('bg-transition-ended', { detail: { layout } }));
            return;
        }

        let revealed = false;
        let holdTimer = null;

        const finishTransition = () => {
            setBackgroundTransitionState(layout, false);
            window.dispatchEvent(new CustomEvent('bg-transition-ended', { detail: { layout } }));
        };

        const revealLoop = () => {
            if (revealed) return;
            revealed = true;
            loopVideo.removeEventListener('playing', revealLoop);

            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    transitionVideo.pause();
                    setShowLoop(true);

                    if (config.loopHoldMs > 0) {
                        holdTimer = window.setTimeout(finishTransition, config.loopHoldMs);
                    } else {
                        finishTransition();
                    }
                });
            });
        };

        const startLoopPlayback = () => {
            loopVideo.currentTime = 0;
            loopVideo.addEventListener('playing', revealLoop);

            loopVideo.play().then(() => {
                if (loopVideo.readyState >= 2) {
                    revealLoop();
                }
            }).catch(() => {
                if (holdTimer !== null) {
                    window.clearTimeout(holdTimer);
                }
                loopVideo.removeEventListener('playing', revealLoop);
                setBackgroundTransitionState(layout, false);
                window.dispatchEvent(new CustomEvent('bg-transition-ended', { detail: { layout } }));
            });
        };

        const startLoopWhenBuffered = () => {
            if (shouldConserveData) {
                startLoopPlayback();
                return;
            }

            let removeLoopBufferListeners = null;

            const maybeStartLoop = () => {
                if (hasEnoughStartupBuffer(loopVideo, LOOP_MIN_START_BUFFER_AHEAD_SECONDS)) {
                    removeLoopBufferListeners?.();
                    removeLoopBufferListeners = null;
                    startLoopPlayback();
                }
            };

            removeLoopBufferListeners = addBufferReadinessListeners(loopVideo, maybeStartLoop);
            maybeStartLoop();
        };

        if (!loopVideo.getAttribute('src')) {
            const handleLoopReady = () => {
                startLoopWhenBuffered();
            };

            loopVideo.addEventListener(loopReadyEvent, handleLoopReady, { once: true });

            if (!loadLoopCandidate(0)) {
                setBackgroundTransitionState(layout, false);
                window.dispatchEvent(new CustomEvent('bg-transition-ended', { detail: { layout } }));
                return;
            }

            if (loopVideo.readyState >= loopReadyStateThreshold) {
                loopVideo.removeEventListener(loopReadyEvent, handleLoopReady);
                startLoopWhenBuffered();
            }

            return;
        }

        startLoopWhenBuffered();
    };

    const handleLoopError = () => {
        const transitionVideo = transitionRef.current;
        const loopVideo = loopRef.current;
        const nextIndex = loopSourceIndexRef.current + 1;

        if (loopVideo && nextIndex < loopSources.length && loadLoopCandidate(nextIndex)) {
            return;
        }

        if (!transitionVideo) return;

        transitionVideo.loop = true;
        transitionVideo.play().catch(() => { });
        setShowLoop(false);
        setBackgroundTransitionState(layout, false);
        window.dispatchEvent(new CustomEvent('bg-transition-ended', { detail: { layout } }));
    };

    if (shouldHideBackground) {
        return null;
    }

    return (
        <div
            className={styles.mediaRoot}
            data-layout={layout}
            style={{
                backgroundColor: '#050608',
                backgroundImage: posterSrc
                    ? layout === 'home'
                        ? `url(${posterSrc})`
                        : `linear-gradient(180deg, rgba(7,9,14,0.16), rgba(7,9,14,0.44)), url(${posterSrc})`
                    : layout === 'home'
                        ? 'none'
                        : 'linear-gradient(180deg, rgba(7,9,14,0.22), rgba(7,9,14,0.58))',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
                backgroundSize: 'cover',
            }}
        >
            <video
                id="bg-video-transition"
                ref={transitionRef}
                className={styles.video}
                style={{
                    opacity: showLoop ? 0 : 1,
                    transition: 'opacity 0.42s ease',
                    zIndex: showLoop ? 0 : 1,
                }}
                muted
                playsInline
                controls={false}
                disablePictureInPicture
                controlsList="nodownload noplaybackrate noremoteplayback nofullscreen"
                preload={transitionPreloadMode}
                poster={posterSrc ?? undefined}
                onEnded={handleTransitionEnded}
            />
            <video
                ref={loopRef}
                className={styles.video}
                style={{
                    opacity: showLoop ? 1 : 0,
                    transition: 'opacity 0.42s ease',
                    zIndex: showLoop ? 1 : 0,
                }}
                muted
                playsInline
                loop
                controls={false}
                disablePictureInPicture
                controlsList="nodownload noplaybackrate noremoteplayback nofullscreen"
                preload={loopPreloadMode}
                poster={posterSrc ?? undefined}
                onError={handleLoopError}
            />
        </div>
    );
}
