'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { setBackgroundTransitionState } from '@/lib/background-transition';
import {
    HOME_PRELOADER_COMPLETE_EVENT,
    isHomePreloaderComplete,
} from '@/lib/home-loader';
import useResponsiveViewport from '@/hooks/useResponsiveViewport';
import styles from './background-video.module.css';

const S3_BUCKET = 'https://aadhya-serene-assets-v2.s3.amazonaws.com';
const HOMEPAGE_VIDEO_CDN = `${S3_BUCKET}/videos/homepage`;

const HOME_TRANSITION = 'https://cdn.sthyra.com/AADHYA%20SERENE/videos/1-1-Av1.mp4';
const HOME_LOOP = 'https://cdn.sthyra.com/AADHYA%20SERENE/videos/1-2-Vp9.mp4';
const ABOUT_TRANSITION = 'https://cdn.sthyra.com/AADHYA%20SERENE/videos/2-1-Av1.mp4';
const ABOUT_LOOP = 'https://cdn.sthyra.com/AADHYA%20SERENE/videos/2-2-av1.mp4';
const APARTMENTS_TRANSITION = 'https://cdn.sthyra.com/AADHYA%20SERENE/videos/3-1-av1.mp4';
const APARTMENTS_LOOP = 'https://cdn.sthyra.com/AADHYA%20SERENE/videos/3-2-av1.mp4';

const MOBILE_VIDEO_FALLBACKS = {
    [HOME_TRANSITION]: '/assets/background-video/mobile/home-transition.mp4',
    [HOME_LOOP]: '/assets/background-video/mobile/home-loop.mp4',
    [ABOUT_TRANSITION]: '/assets/background-video/mobile/about-transition.mp4',
    [ABOUT_LOOP]: '/assets/background-video/mobile/about-loop.mp4',
    [APARTMENTS_TRANSITION]: '/assets/background-video/mobile/apartments-transition.mp4',
    [APARTMENTS_LOOP]: '/assets/background-video/mobile/apartments-loop.mp4',
};

const BACKGROUND_POSTERS = {
    home: '/assets/background-video/posters/home.jpg',
    about: '/assets/background-video/posters/about.jpg',
    apartments: '/assets/apartments/transition-poster.jpg',
    walkthrough: '/assets/apartments/transition-poster.jpg',
    contact: '/assets/background-video/posters/about.jpg',
    amenities: 'https://cdn.sthyra.com/AADHYA%20SERENE/images/umbrella-chair2.jpg',
};

const APARTMENTS_LOOP_HOLD_MS = 0;
const HLS_MIN_START_BUFFER_AHEAD_SECONDS = 2.4;
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
        transition: HOME_TRANSITION,
        loop: HOME_LOOP,
        transitionAssetId: '1-1',
        loopAssetId: '1-2',
    },
    about: {
        transition: ABOUT_TRANSITION,
        loop: ABOUT_LOOP,
        transitionAssetId: '2-1',
        loopAssetId: '2-2',
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
        transition: ABOUT_TRANSITION,
        loop: ABOUT_LOOP,
        transitionAssetId: '2-1',
        loopAssetId: '2-2',
    },
    contact: {
        transition: ABOUT_TRANSITION,
        loop: ABOUT_LOOP,
        transitionAssetId: '2-1',
        loopAssetId: '2-2',
    },
    amenities: {
        transition: `${S3_BUCKET}/videos/amenities/rooftopLeisureDeck/2160p/rooftopLeisureDeck-h264.mp4`,
        loop: `${S3_BUCKET}/videos/amenities/rooftopLeisureDeck/2160p/rooftopLeisureDeck-h264.mp4`,
    },
    'amenities-rooftopLeisureDeck': {
        transition: `${S3_BUCKET}/videos/amenities/rooftopLeisureDeck/2160p/rooftopLeisureDeck-h264.mp4`,
        loop: `${S3_BUCKET}/videos/amenities/rooftopLeisureDeck/2160p/rooftopLeisureDeck-h264.mp4`,
    },
    'amenities-childrensPlayArea': {
        transition: `${S3_BUCKET}/videos/amenities/childrensPlayArea/2160p/childrensPlayArea-h264.mp4`,
        loop: `${S3_BUCKET}/videos/amenities/childrensPlayArea/2160p/childrensPlayArea-h264.mp4`,
    },
    'amenities-swimmingPool': {
        transition: `${S3_BUCKET}/videos/amenities/swimmingPool/2160p/swimmingPool-h264.mp4`,
        loop: `${S3_BUCKET}/videos/amenities/swimmingPool/2160p/swimmingPool-h264.mp4`,
    },
    'amenities-gymnasium': {
        transition: `${S3_BUCKET}/videos/amenities/gymnasium/2160p/gymnasium-h264.mp4`,
        loop: `${S3_BUCKET}/videos/amenities/gymnasium/2160p/gymnasium-h264.mp4`,
    },
    'amenities-indoorGames': {
        transition: `${S3_BUCKET}/videos/amenities/indoorGames/2160p/indoorGames-h264.mp4`,
        loop: `${S3_BUCKET}/videos/amenities/indoorGames/2160p/indoorGames-h264.mp4`,
    },
    'amenities-clubhouse': {
        transition: `${S3_BUCKET}/videos/amenities/clubhouse/2160p/clubhouse-h264.mp4`,
        loop: `${S3_BUCKET}/videos/amenities/clubhouse/2160p/clubhouse-h264.mp4`,
    },
    'amenities-basketball': {
        transition: `${S3_BUCKET}/videos/amenities/basketball/2160p/basketball-h264.mp4`,
        loop: `${S3_BUCKET}/videos/amenities/basketball/2160p/basketball-h264.mp4`,
    },
    'amenities-badminton': {
        transition: `${S3_BUCKET}/videos/amenities/badminton/2160p/badminton-h264.mp4`,
        loop: `${S3_BUCKET}/videos/amenities/badminton/2160p/badminton-h264.mp4`,
    },
};

const DEFAULT_CONFIG = {
    transition: HOME_TRANSITION,
    loop: HOME_LOOP,
    transitionAssetId: '1-1',
    loopAssetId: '1-2',
};

function buildHomepageVideoUrl(assetId, quality = '1080p', codec = 'h264') {
    return `${HOMEPAGE_VIDEO_CDN}/${assetId}/${quality}/${assetId}-${codec}.mp4`;
}

function uniqueSources(sources) {
    return [...new Set(sources.filter(Boolean))];
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

export default function BackgroundVideo({ layout = 'home', playing = true, replayKey = 0 }) {
    const { isMobile, isTablet, isSafari, isIOS } = useResponsiveViewport();
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
    const [shouldConserveData, setShouldConserveData] = useState(false);

    const config = LAYOUT_CONFIG[layout] ?? DEFAULT_CONFIG;
    const transitionPreloadMode = 'auto';
    const loopPreloadMode = shouldConserveData ? 'metadata' : 'auto';
    const transitionIsHls = isHlsSource(config.transition);
    const shouldWaitForHlsStartupBuffer = transitionIsHls && layout === 'home';
    const shouldEagerlyPrepareLoop = !shouldConserveData && !transitionIsHls;
    const shouldDeferLoopPreloadForHls = !shouldConserveData && transitionIsHls && layout !== 'home';
    const shouldHideBackground = layout === 'location';
    const posterSrc = BACKGROUND_POSTERS[layout] ?? BACKGROUND_POSTERS.home;
    const transitionReadyEvent = shouldConserveData ? 'loadedmetadata' : 'loadeddata';
    const transitionReadyStateThreshold = shouldConserveData ? 1 : 2;
    const loopReadyEvent = shouldConserveData ? 'loadedmetadata' : 'loadeddata';
    const loopReadyStateThreshold = shouldConserveData ? 1 : 2;

    useEffect(() => {
        if (!shouldHideBackground) return;

        setShowLoop(false);
        setBackgroundTransitionState(layout, false);
        window.dispatchEvent(new CustomEvent('bg-transition-ended'));
    }, [layout, shouldHideBackground]);

    useEffect(() => {
        if (typeof window === 'undefined') return undefined;

        const reducedMotionMedia = window.matchMedia('(prefers-reduced-motion: reduce)');
        const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;

        const updatePreference = () => {
            const shouldAvoidHeavyPlayback = connection?.saveData
                || /(^|slow-)?2g|3g/.test(connection?.effectiveType ?? '');

            setShouldConserveData(
                isMobile
                || reducedMotionMedia.matches
                || shouldAvoidHeavyPlayback
            );
        };

        updatePreference();
        reducedMotionMedia.addEventListener('change', updatePreference);
        connection?.addEventListener?.('change', updatePreference);

        return () => {
            reducedMotionMedia.removeEventListener('change', updatePreference);
            connection?.removeEventListener?.('change', updatePreference);
        };
    }, [isMobile]);

    const getSourceCandidates = useCallback((source, assetId) => {
        if (!source) return [];

        const fallbackSource = MOBILE_VIDEO_FALLBACKS[source];
        const preferredMp4Source = assetId
            ? buildHomepageVideoUrl(
                assetId,
                isTablet ? '1440p' : isMobile ? '1080p' : '1440p',
                'h264',
            )
            : null;

        if (isHlsSource(source)) {
            return uniqueSources([source, preferredMp4Source, fallbackSource]);
        }

        if (shouldConserveData && fallbackSource) {
            return uniqueSources([fallbackSource, preferredMp4Source, source]);
        }

        if ((isTablet || isSafari || isIOS) && preferredMp4Source) {
            return uniqueSources([preferredMp4Source, source]);
        }

        return [source];
    }, [isIOS, isSafari, isTablet, shouldConserveData]);

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

    const transitionSources = useMemo(
        () => getSourceCandidates(config.transition, config.transitionAssetId),
        [config.transition, config.transitionAssetId, getSourceCandidates],
    );
    const transitionSourcesKey = useMemo(
        () => transitionSources.join('|'),
        [transitionSources],
    );

    const loopSources = useMemo(
        () => getSourceCandidates(config.loop, config.loopAssetId),
        [config.loop, config.loopAssetId, getSourceCandidates],
    );
    const loopSourcesKey = useMemo(
        () => loopSources.join('|'),
        [loopSources],
    );

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

        video.src = source;
        video.load();

        return true;
    }, [destroyHlsInstance, getHlsModule, layout, primeVideoElement]);

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

        return loadVideoCandidate(loopVideo, loopSources, index, {
            shouldLoop: true,
            preload: loopPreloadMode,
            target: 'loop',
        });
    }, [loadVideoCandidate, loopPreloadMode, loopSources]);

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

            if (loopSources.length > 0) {
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
            window.dispatchEvent(new CustomEvent('bg-transition-started'));

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
            if (!shouldWaitForHlsStartupBuffer) {
                startTransition();
                return;
            }

            const maybeStartWhenBuffered = () => {
                const bufferedAhead = getBufferedAhead(transitionVideo);
                const duration = Number.isFinite(transitionVideo.duration)
                    ? transitionVideo.duration
                    : 0;
                const hasNearlyFullBuffer = duration > 0
                    && bufferedAhead >= Math.max(0, duration - HLS_FULLY_BUFFERED_TOLERANCE_SECONDS);

                if (
                    bufferedAhead >= HLS_MIN_START_BUFFER_AHEAD_SECONDS
                    || hasNearlyFullBuffer
                ) {
                    deferredTransitionStartCleanup?.();
                    deferredTransitionStartCleanup = null;
                    startTransition();
                }
            };

            transitionVideo.addEventListener('progress', maybeStartWhenBuffered);
            transitionVideo.addEventListener('loadeddata', maybeStartWhenBuffered);
            transitionVideo.addEventListener('canplay', maybeStartWhenBuffered);
            transitionVideo.addEventListener('durationchange', maybeStartWhenBuffered);
            deferredTransitionStartCleanup = () => {
                transitionVideo.removeEventListener('progress', maybeStartWhenBuffered);
                transitionVideo.removeEventListener('loadeddata', maybeStartWhenBuffered);
                transitionVideo.removeEventListener('canplay', maybeStartWhenBuffered);
                transitionVideo.removeEventListener('durationchange', maybeStartWhenBuffered);
            };

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
            window.dispatchEvent(new CustomEvent('bg-transition-ended'));
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
            window.dispatchEvent(new CustomEvent('bg-transition-ended'));
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
        layout,
        loopSourcesKey,
        playing,
        replayKey,
        shouldEagerlyPrepareLoop,
        shouldDeferLoopPreloadForHls,
        shouldWaitForHlsStartupBuffer,
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

        if (!loopVideo || loopSources.length === 0) {
            setBackgroundTransitionState(layout, false);
            window.dispatchEvent(new CustomEvent('bg-transition-ended'));
            return;
        }

        let revealed = false;
        let holdTimer = null;

        const finishTransition = () => {
            setBackgroundTransitionState(layout, false);
            window.dispatchEvent(new CustomEvent('bg-transition-ended'));
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
                window.dispatchEvent(new CustomEvent('bg-transition-ended'));
            });
        };

        if (!loopVideo.getAttribute('src')) {
            const handleLoopReady = () => {
                startLoopPlayback();
            };

            loopVideo.addEventListener(loopReadyEvent, handleLoopReady, { once: true });

            if (!loadLoopCandidate(0)) {
                setBackgroundTransitionState(layout, false);
                window.dispatchEvent(new CustomEvent('bg-transition-ended'));
                return;
            }

            if (loopVideo.readyState >= loopReadyStateThreshold) {
                loopVideo.removeEventListener(loopReadyEvent, handleLoopReady);
                startLoopPlayback();
            }

            return;
        }

        startLoopPlayback();
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
        window.dispatchEvent(new CustomEvent('bg-transition-ended'));
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
                    ? `linear-gradient(180deg, rgba(7,9,14,0.16), rgba(7,9,14,0.44)), url(${posterSrc})`
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
