'use client';

import React, { useRef, useEffect, useState } from 'react';
import styles from './background-video.module.css';

const S3_BUCKET = 'https://aadhya-serene-assets-v2.s3.amazonaws.com';
const mp4 = (n, a) => `${S3_BUCKET}/videos/homepage/${n}-${a}/2160p/${n}-${a}-h264.mp4`;

const LAYOUT_CONFIG = {
    home: { transition: mp4(1, 1), loop: mp4(1, 2) },
    about: { transition: mp4(2, 1), loop: mp4(2, 2) },
    apartments: { transition: mp4(3, 1), loop: null },
    walkthrough: { transition: mp4(3, 1), loop: mp4(3, 2) },
    location: { transition: mp4(2, 1), loop: mp4(2, 2) },
    contact: { transition: mp4(2, 1), loop: mp4(2, 2) },

    // Amenities mapped directly to S3 uploads
    'amenities': { transition: `${S3_BUCKET}/videos/amenities/rooftopLeisureDeck/2160p/rooftopLeisureDeck-h264.mp4`, loop: `${S3_BUCKET}/videos/amenities/rooftopLeisureDeck/2160p/rooftopLeisureDeck-h264.mp4` }, // Default entry
    'amenities-rooftopLeisureDeck': { transition: `${S3_BUCKET}/videos/amenities/rooftopLeisureDeck/2160p/rooftopLeisureDeck-h264.mp4`, loop: `${S3_BUCKET}/videos/amenities/rooftopLeisureDeck/2160p/rooftopLeisureDeck-h264.mp4` },
    'amenities-childrensPlayArea': { transition: `${S3_BUCKET}/videos/amenities/childrensPlayArea/2160p/childrensPlayArea-h264.mp4`, loop: `${S3_BUCKET}/videos/amenities/childrensPlayArea/2160p/childrensPlayArea-h264.mp4` },
    'amenities-swimmingPool': { transition: `${S3_BUCKET}/videos/amenities/swimmingPool/2160p/swimmingPool-h264.mp4`, loop: `${S3_BUCKET}/videos/amenities/swimmingPool/2160p/swimmingPool-h264.mp4` },
    'amenities-gymnasium': { transition: `${S3_BUCKET}/videos/amenities/gymnasium/2160p/gymnasium-h264.mp4`, loop: `${S3_BUCKET}/videos/amenities/gymnasium/2160p/gymnasium-h264.mp4` },
    'amenities-indoorGames': { transition: `${S3_BUCKET}/videos/amenities/indoorGames/2160p/indoorGames-h264.mp4`, loop: `${S3_BUCKET}/videos/amenities/indoorGames/2160p/indoorGames-h264.mp4` },
    'amenities-clubhouse': { transition: `${S3_BUCKET}/videos/amenities/clubhouse/2160p/clubhouse-h264.mp4`, loop: `${S3_BUCKET}/videos/amenities/clubhouse/2160p/clubhouse-h264.mp4` },
    'amenities-basketball': { transition: `${S3_BUCKET}/videos/amenities/basketball/2160p/basketball-h264.mp4`, loop: `${S3_BUCKET}/videos/amenities/basketball/2160p/basketball-h264.mp4` },
    'amenities-badminton': { transition: `${S3_BUCKET}/videos/amenities/badminton/2160p/badminton-h264.mp4`, loop: `${S3_BUCKET}/videos/amenities/badminton/2160p/badminton-h264.mp4` },
};
const DEFAULT_CONFIG = { transition: mp4(1, 1), loop: mp4(1, 2) };

/* ─────────────────────────────────────────────────────────
   BackgroundVideo — dual-video crossfade (no flicker)
   
   Two <video> elements live in the DOM at all times:
     • Video A: plays the transition clip (loop=false)
     • Video B: preloads the loop clip silently in the background
   When transition ends, B fades in and A fades out instantly.
   This eliminates the black frame from innerHTML-swap + load().
──────────────────────────────────────────────────────── */
export default function BackgroundVideo({ layout = 'home', playing = true }) {
    const refA = useRef(null); // transition video
    const refB = useRef(null); // loop video (preloaded)
    const [showLoop, setShowLoop] = useState(false);
    const [isTransitioningLayout, setIsTransitioningLayout] = useState(false);

    const config = LAYOUT_CONFIG[layout] ?? DEFAULT_CONFIG;

    /* When layout changes → reset both videos */
    useEffect(() => {
        setIsTransitioningLayout(true);
        setShowLoop(false);

        const a = refA.current;
        const b = refB.current;
        if (!a || !b) return;

        // Reconfigure A (transition — plays immediately)
        a.src = config.transition;
        a.loop = false;
        a.load();
        a.play().catch(() => { });
        window.dispatchEvent(new CustomEvent('bg-transition-started'));

        // Reconfigure B (loop — preload silently, paused)
        if (config.loop) {
            b.src = config.loop;
            b.loop = true;
            b.load();
        }
    }, [layout, config.transition, config.loop]);

    /* Handle Play/Pause from parent loader */
    useEffect(() => {
        const a = refA.current;
        if (!a) return;
        if (playing) {
            a.play().catch(() => { });
        } else {
            a.pause();
        }
    }, [playing]);

    /* Transition ended → crossfade to loop */
    const handleTransitionEnded = () => {
        window.dispatchEvent(new CustomEvent('bg-transition-ended'));

        const b = refB.current;
        if (!b || !config.loop) return;

        // Start playing the loop video slightly before transition ends
        // if possible, but here we trigger on ended.
        b.currentTime = 0;
        b.play().catch(() => { });

        // Delay hiding video A slightly to allow B to render its first frame
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                setShowLoop(true); // CSS fades B in, A out
            });
        });
    };

    /* Fallback: if loop video fails, just loop the transition */
    const handleLoopError = () => {
        const a = refA.current;
        if (!a) return;
        a.loop = true;
        a.play().catch(() => { });
        setShowLoop(false);
    };

    return (
        <div className={styles.mediaRoot} data-layout={layout}>
            {/* Video A — transition clip */}
            <video
                id="bg-video-transition"
                ref={refA}
                className={styles.video}
                style={{
                    opacity: isTransitioningLayout ? 0 : (showLoop ? 0 : 1),
                    transition: isTransitioningLayout ? 'none' : 'opacity 0.6s ease',
                    zIndex: showLoop ? 0 : 1,
                }}
                muted
                playsInline
                autoPlay
                preload="auto"
                onLoadedData={() => setIsTransitioningLayout(false)}
                onEnded={handleTransitionEnded}
            />
            {/* Video B — loop clip (preloaded, fades in when A ends) */}
            <video
                ref={refB}
                className={styles.video}
                style={{
                    opacity: isTransitioningLayout ? 0 : (showLoop ? 1 : 0),
                    transition: isTransitioningLayout ? 'none' : 'opacity 0.6s ease',
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
