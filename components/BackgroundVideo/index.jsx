'use client';

import React, { useEffect, useRef, useState } from 'react';
import styles from './background-video.module.css';

const S3_BUCKET = 'https://aadhya-serene-assets-v2.s3.amazonaws.com';

const HOME_TRANSITION = 'https://cdn.sthyra.com/AADHYA%20SERENE/videos/1-1-Av1.mp4';
const HOME_LOOP = 'https://cdn.sthyra.com/AADHYA%20SERENE/videos/1-2-Vp9.mp4';
const ABOUT_TRANSITION = 'https://cdn.sthyra.com/AADHYA%20SERENE/videos/2-1-Av1.mp4';
const ABOUT_LOOP = 'https://cdn.sthyra.com/AADHYA%20SERENE/videos/2-2-av1.mp4';
const APARTMENTS_TRANSITION = 'https://cdn.sthyra.com/AADHYA%20SERENE/videos/3-1-av1.mp4';
const APARTMENTS_LOOP = 'https://cdn.sthyra.com/AADHYA%20SERENE/videos/3-2-av1.mp4';

const LAYOUT_CONFIG = {
    home: { transition: HOME_TRANSITION, loop: HOME_LOOP },
    about: { transition: ABOUT_TRANSITION, loop: ABOUT_LOOP },
    apartments: { transition: APARTMENTS_TRANSITION, loop: APARTMENTS_LOOP },
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

export default function BackgroundVideo({ layout = 'home', playing = true }) {
    const transitionRef = useRef(null);
    const loopRef = useRef(null);
    const [showLoop, setShowLoop] = useState(false);

    const config = LAYOUT_CONFIG[layout] ?? DEFAULT_CONFIG;

    useEffect(() => {
        const transitionVideo = transitionRef.current;
        const loopVideo = loopRef.current;
        if (!transitionVideo || !loopVideo) return;

        let cancelled = false;

        const startTransition = () => {
            if (cancelled) return;

            setShowLoop(false);
            window.dispatchEvent(new CustomEvent('bg-transition-started'));

            if (playing) {
                transitionVideo.play().catch(() => { });
            }
        };

        transitionVideo.pause();
        transitionVideo.src = config.transition;
        transitionVideo.loop = false;
        transitionVideo.preload = 'auto';

        const handleTransitionReady = () => {
            transitionVideo.removeEventListener('loadeddata', handleTransitionReady);
            startTransition();
        };

        transitionVideo.addEventListener('loadeddata', handleTransitionReady);
        transitionVideo.load();

        if (config.loop) {
            loopVideo.pause();
            loopVideo.src = config.loop;
            loopVideo.loop = true;
            loopVideo.preload = 'auto';
            loopVideo.load();
        } else {
            loopVideo.pause();
            loopVideo.removeAttribute('src');
            loopVideo.load();
        }

        if (transitionVideo.readyState >= 2) {
            startTransition();
        }

        return () => {
            cancelled = true;
            transitionVideo.removeEventListener('loadeddata', handleTransitionReady);
        };
    }, [config.loop, config.transition, layout, playing]);

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

        if (!loopVideo || !config.loop) {
            window.dispatchEvent(new CustomEvent('bg-transition-ended'));
            return;
        }

        let revealed = false;

        const revealLoop = () => {
            if (revealed) return;
            revealed = true;
            loopVideo.removeEventListener('playing', revealLoop);

            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    transitionVideo.pause();
                    setShowLoop(true);
                    window.dispatchEvent(new CustomEvent('bg-transition-ended'));
                });
            });
        };

        loopVideo.currentTime = 0;
        loopVideo.addEventListener('playing', revealLoop);

        loopVideo.play().then(() => {
            if (loopVideo.readyState >= 2) {
                revealLoop();
            }
        }).catch(() => {
            loopVideo.removeEventListener('playing', revealLoop);
            window.dispatchEvent(new CustomEvent('bg-transition-ended'));
        });
    };

    const handleLoopError = () => {
        const transitionVideo = transitionRef.current;
        if (!transitionVideo) return;

        transitionVideo.loop = true;
        transitionVideo.play().catch(() => { });
        setShowLoop(false);
        window.dispatchEvent(new CustomEvent('bg-transition-ended'));
    };

    return (
        <div className={styles.mediaRoot} data-layout={layout}>
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
                preload="auto"
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
                preload="auto"
                onError={handleLoopError}
            />
        </div>
    );
}
