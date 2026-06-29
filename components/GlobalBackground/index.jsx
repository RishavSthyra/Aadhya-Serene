'use client';

import React, { useEffect, useState, useRef } from 'react';
import { usePathname } from 'next/navigation';
import BackgroundVideo from '../BackgroundVideo';
import { isReadyToMoveExperience } from '@/lib/site-variant';
import {
    consumeSkipNextApartmentsReplay,
    isBackgroundTransitionActive,
    setBackgroundTransitionState,
} from '@/lib/background-transition';

export default function GlobalBackground({ siteVariant }) {
    const pathname = usePathname();
    const isLandingRoute = isReadyToMoveExperience(pathname, siteVariant);
    const [layout, setLayout] = useState('home');
    const [playing, setPlaying] = useState(true);
    const prevPathname = useRef(pathname);

    useEffect(() => {
        if (isLandingRoute) {
            return;
        }

        // Sync layout with current route unless eager transition fired
        let newLayout = 'home';                                     
        if (pathname.includes('/project-overview')) newLayout = 'project-overview';
        else if (pathname.includes('/about')) newLayout = 'home';
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

        if (isEnteringApartmentsPage && !shouldSkipApartmentsReplay) {
            setBackgroundTransitionState('apartments', false);
            window.dispatchEvent(new CustomEvent('bg-transition-ended', {
                detail: { layout: 'apartments' },
            }));
        }

        // We just navigated to a new route, but the layout didn't fundamentally change
        if (
            newLayout === layout
            && didPathChange
            && !isEnteringApartmentsPage
            && !isBackgroundTransitionActive(newLayout)
        ) {
            // Because no new transition video will play, instantly unblock any listening UI
            window.dispatchEvent(new CustomEvent('bg-transition-ended', {
                detail: { layout: newLayout },
            }));
        }

        prevPathname.current = pathname;
        setLayout(newLayout);

        // Keep the global background actively playing across routes unless
        // a page explicitly pauses it.
        setPlaying(true);
    }, [isLandingRoute, pathname]); // <-- IMPORTANT: 'layout' removed to prevent overwriting custom events

    useEffect(() => {
        if (isLandingRoute) {
            return undefined;
        }

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
    }, [isLandingRoute]);

    if (isLandingRoute) {
        return null;
    }

    return <BackgroundVideo layout={layout} playing={playing} />;
}
