'use client';

import React, { useEffect, useState, useRef } from 'react';
import { usePathname } from 'next/navigation';
import BackgroundVideo from '../BackgroundVideo';
import {
    consumeSkipNextApartmentsReplay,
    isBackgroundTransitionActive,
    setBackgroundTransitionState,
} from '@/lib/background-transition';

export default function GlobalBackground() {
    const pathname = usePathname();
    const [layout, setLayout] = useState('home');
    const [playing, setPlaying] = useState(true);
    const [replayKey, setReplayKey] = useState(0);
    const prevPathname = useRef(pathname);

    useEffect(() => {
        // Sync layout with current route unless eager transition fired
        let newLayout = 'home';
        if (pathname.includes('/about')) newLayout = 'about';
        else if (pathname.includes('/apartments')) newLayout = 'apartments';
        else if (pathname.includes('/amenities')) newLayout = 'amenities';
        else if (pathname.includes('/walkthrough')) newLayout = 'walkthrough';
        else if (pathname.includes('/location')) newLayout = 'location';
        else if (pathname.includes('/contact')) newLayout = 'contact';

        const didPathChange = pathname !== prevPathname.current;
        const isEnteringApartmentsPage = pathname === '/apartments' && didPathChange;
        const shouldSkipApartmentsReplay = isEnteringApartmentsPage
            ? consumeSkipNextApartmentsReplay()
            : false;

        if (isEnteringApartmentsPage && newLayout === layout && !shouldSkipApartmentsReplay) {
            setBackgroundTransitionState('apartments', true);
            setReplayKey((current) => current + 1);
        }

        if (isEnteringApartmentsPage && shouldSkipApartmentsReplay) {
            setBackgroundTransitionState('apartments', false);
            window.dispatchEvent(new CustomEvent('bg-transition-ended'));
        }

        // We just navigated to a new route, but the layout didn't fundamentally change
        if (
            newLayout === layout
            && didPathChange
            && !isEnteringApartmentsPage
            && !isBackgroundTransitionActive(newLayout)
        ) {
            // Because no new transition video will play, instantly unblock any listening UI
            window.dispatchEvent(new CustomEvent('bg-transition-ended'));
        }

        prevPathname.current = pathname;
        setLayout(newLayout);

        // Keep the global background actively playing across routes unless
        // a page explicitly pauses it.
        setPlaying(true);
    }, [pathname]); // <-- IMPORTANT: 'layout' removed to prevent overwriting custom events

    useEffect(() => {
        const handleLayout = (e) => {
            setBackgroundTransitionState(e.detail, true);
            setLayout(e.detail);
        };
        const handlePlay = () => setPlaying(true);
        const handlePause = () => setPlaying(false);

        window.addEventListener('bg-layout', handleLayout);
        window.addEventListener('bg-play', handlePlay);
        window.addEventListener('bg-pause', handlePause);

        return () => {
            window.removeEventListener('bg-layout', handleLayout);
            window.removeEventListener('bg-play', handlePlay);
            window.removeEventListener('bg-pause', handlePause);
        };
    }, []);

    return <BackgroundVideo layout={layout} playing={playing} replayKey={replayKey} />;
}
