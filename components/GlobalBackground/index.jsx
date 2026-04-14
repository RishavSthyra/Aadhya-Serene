'use client';

import React, { useEffect, useState, useRef } from 'react';
import { usePathname } from 'next/navigation';
import BackgroundVideo from '../BackgroundVideo';

export default function GlobalBackground() {
    const pathname = usePathname();
    const [layout, setLayout] = useState('home');
    const [playing, setPlaying] = useState(pathname !== '/');
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

        // We just navigated to a new route, but the layout didn't fundamentally change
        if (newLayout === layout && pathname !== prevPathname.current) {
            // Because no new transition video will play, instantly unblock any listening UI
            window.dispatchEvent(new CustomEvent('bg-transition-ended'));
        }

        prevPathname.current = pathname;
        setLayout(newLayout);

        // Turn playing ON immediately if we left home
        if (pathname !== '/') {
            setPlaying(true);
        }
    }, [pathname]); // <-- IMPORTANT: 'layout' removed to prevent overwriting custom events

    useEffect(() => {
        const handleLayout = (e) => setLayout(e.detail);
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

    return <BackgroundVideo layout={layout} playing={playing} />;
}
