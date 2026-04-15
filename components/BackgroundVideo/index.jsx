'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { setBackgroundTransitionState } from '@/lib/background-transition';
import styles from './background-video.module.css';

const S3_BUCKET = 'https://aadhya-serene-assets-v2.s3.amazonaws.com';

const HOME_TRANSITION = 'https://cdn.sthyra.com/AADHYA%20SERENE/videos/1-1-Av1.mp4';
const HOME_LOOP = 'https://cdn.sthyra.com/AADHYA%20SERENE/videos/1-2-Vp9.mp4';
const ABOUT_TRANSITION = 'https://cdn.sthyra.com/AADHYA%20SERENE/videos/2-1-Av1.mp4';
const ABOUT_LOOP = 'https://cdn.sthyra.com/AADHYA%20SERENE/videos/2-2-av1.mp4';
const APARTMENTS_TRANSITION = 'https://cdn.sthyra.com/AADHYA%20SERENE/videos/3-1-av1.mp4';
const APARTMENTS_LOOP = 'https://cdn.sthyra.com/AADHYA%20SERENE/videos/3-2-av1.mp4';

const MOBILE_VIDEO_FALLBACKS = {};

const BACKGROUND_POSTERS = {
    home: 'https://cdn.sthyra.com/AADHYA%20SERENE/images/analog-landscape-city-with-buildings%20(1).jpg',
    about: 'https://cdn.sthyra.com/AADHYA%20SERENE/images/analog-landscape-city-with-buildings%20(1).jpg',
    apartments: null,
    walkthrough: null,
    contact: 'https://cdn.sthyra.com/AADHYA%20SERENE/images/analog-landscape-city-with-buildings%20(1).jpg',
    amenities: 'https://cdn.sthyra.com/AADHYA%20SERENE/images/umbrella-chair2.jpg',
};

const APARTMENTS_LOOP_HOLD_MS = 1000;

const LAYOUT_CONFIG = {
    home: { transition: HOME_TRANSITION, loop: HOME_LOOP },
    about: { transition: ABOUT_TRANSITION, loop: ABOUT_LOOP },
    apartments: {
        transition: APARTMENTS_TRANSITION,
        loop: APARTMENTS_LOOP,
        loopHoldMs: APARTMENTS_LOOP_HOLD_MS,
    },
    walkthrough: { transition: APARTMENTS_TRANSITION, loop: APARTMENTS_LOOP },
    location: { transition: ABOUT_TRANSITION, loop: ABOUT_LOOP },
    contact: { transition: ABOUT_TRANSITION, loop: ABOUT_LOOP },
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

const DEFAULT_CONFIG = { transition: HOME_TRANSITION, loop: HOME_LOOP };

export default function BackgroundVideo({ layout = 'home', playing = true, replayKey = 0 }) {
    const transitionRef = useRef(null);
    const loopRef = useRef(null);
    const transitionSourceIndexRef = useRef(0);
    const loopSourceIndexRef = useRef(0);
    const [showLoop, setShowLoop] = useState(false);
    const [shouldConserveData, setShouldConserveData] = useState(false);

    const config = LAYOUT_CONFIG[layout] ?? DEFAULT_CONFIG;
    const transitionPreloadMode = 'auto';
    const loopPreloadMode = shouldConserveData ? 'metadata' : 'auto';
    const shouldEagerlyPrepareLoop = !shouldConserveData;
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

        const mobileMedia = window.matchMedia('(max-width: 767px), (pointer: coarse)');
        const reducedMotionMedia = window.matchMedia('(prefers-reduced-motion: reduce)');
        const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;

        const updatePreference = () => {
            const shouldAvoidHeavyPlayback = connection?.saveData
                || /(^|slow-)?2g|3g/.test(connection?.effectiveType ?? '');

            setShouldConserveData(
                mobileMedia.matches
                || reducedMotionMedia.matches
                || shouldAvoidHeavyPlayback
            );
        };

        updatePreference();
        mobileMedia.addEventListener('change', updatePreference);
        reducedMotionMedia.addEventListener('change', updatePreference);
        connection?.addEventListener?.('change', updatePreference);

        return () => {
            mobileMedia.removeEventListener('change', updatePreference);
            reducedMotionMedia.removeEventListener('change', updatePreference);
            connection?.removeEventListener?.('change', updatePreference);
        };
    }, []);

    const getSourceCandidates = useCallback((source) => {
        if (!source) return [];

        const sources = [];
        sources.push(source);

        if (shouldConserveData && MOBILE_VIDEO_FALLBACKS[source]) {
            sources.push(MOBILE_VIDEO_FALLBACKS[source]);
        }

        return [...new Set(sources)];
    }, [shouldConserveData]);

    const transitionSources = useMemo(
        () => getSourceCandidates(config.transition),
        [config.transition, getSourceCandidates],
    );

    const loopSources = useMemo(
        () => getSourceCandidates(config.loop),
        [config.loop, getSourceCandidates],
    );

    const loadVideoCandidate = useCallback((video, sources, index, options = {}) => {
        const { shouldLoop = false, preload = 'auto' } = options;
        const source = sources[index];

        if (!video || !source) {
            return false;
        }

        video.pause();
        video.src = source;
        video.loop = shouldLoop;
        video.preload = preload;
        video.load();

        return true;
    }, []);

    const loadTransitionCandidate = useCallback((index = 0) => {
        const transitionVideo = transitionRef.current;
        transitionSourceIndexRef.current = index;

        return loadVideoCandidate(transitionVideo, transitionSources, index, {
            preload: transitionPreloadMode,
        });
    }, [loadVideoCandidate, transitionPreloadMode, transitionSources]);

    const loadLoopCandidate = useCallback((index = 0) => {
        const loopVideo = loopRef.current;
        loopSourceIndexRef.current = index;

        return loadVideoCandidate(loopVideo, loopSources, index, {
            shouldLoop: true,
            preload: loopPreloadMode,
        });
    }, [loadVideoCandidate, loopPreloadMode, loopSources]);

    useEffect(() => {
        const transitionVideo = transitionRef.current;
        const loopVideo = loopRef.current;
        if (!transitionVideo || !loopVideo) return;

        let cancelled = false;
        let started = false;
        let firstLoopPrepareFrame = null;
        let secondLoopPrepareFrame = null;

        const prepareLoopVideo = () => {
            if (cancelled) return;

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
            }
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

        const handleTransitionReady = () => {
            transitionVideo.removeEventListener(transitionReadyEvent, handleTransitionReady);
            startTransition();
        };

        const handleTransitionError = () => {
            const nextIndex = transitionSourceIndexRef.current + 1;
            if (nextIndex < transitionSources.length && loadTransitionCandidate(nextIndex)) {
                return;
            }

            setBackgroundTransitionState(layout, false);
            window.dispatchEvent(new CustomEvent('bg-transition-ended'));
        };

        transitionVideo.addEventListener(transitionReadyEvent, handleTransitionReady);
        transitionVideo.addEventListener('error', handleTransitionError);

        if (transitionVideo.readyState >= transitionReadyStateThreshold) {
            startTransition();
        }

        return () => {
            cancelled = true;
            if (firstLoopPrepareFrame !== null) {
                cancelAnimationFrame(firstLoopPrepareFrame);
            }
            if (secondLoopPrepareFrame !== null) {
                cancelAnimationFrame(secondLoopPrepareFrame);
            }
            transitionVideo.removeEventListener(transitionReadyEvent, handleTransitionReady);
            transitionVideo.removeEventListener('error', handleTransitionError);
        };
    }, [
        layout,
        loadLoopCandidate,
        loadTransitionCandidate,
        loopSources.length,
        playing,
        replayKey,
        shouldEagerlyPrepareLoop,
        transitionReadyEvent,
        transitionReadyStateThreshold,
        transitionSources.length,
    ]);

    useEffect(() => {
        const transitionVideo = transitionRef.current;
        const loopVideo = loopRef.current;
        if (!transitionVideo || !loopVideo) return;

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
                autoPlay
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
                preload={loopPreloadMode}
                poster={posterSrc ?? undefined}
                onError={handleLoopError}
            />
        </div>
    );
}
