'use client';

import { useEffect, useState } from 'react';

export const MOBILE_MAX_WIDTH = 767;
export const TABLET_MAX_WIDTH = 1279;

function detectResponsiveViewport() {
    if (typeof window === 'undefined') {
        return {
            width: 1440,
            isMobile: false,
            isTablet: false,
            isTabletOrBelow: false,
            isDesktop: true,
            isTouch: false,
            isIOS: false,
            isSafari: false,
        };
    }

    const width = window.innerWidth;
    const userAgent = navigator.userAgent || '';
    const platform = navigator.platform || '';
    const maxTouchPoints = navigator.maxTouchPoints || 0;
    const coarsePointer = window.matchMedia('(pointer: coarse)').matches;

    const isIOS = /iPad|iPhone|iPod/i.test(userAgent)
        || (platform === 'MacIntel' && maxTouchPoints > 1);
    const isSafari = /Safari/i.test(userAgent)
        && !/Chrome|CriOS|Edg|OPR|Firefox|FxiOS|SamsungBrowser|Android/i.test(userAgent);

    const isMobile = width <= MOBILE_MAX_WIDTH;
    const isTablet = width > MOBILE_MAX_WIDTH && width <= TABLET_MAX_WIDTH;

    return {
        width,
        isMobile,
        isTablet,
        isTabletOrBelow: isMobile || isTablet,
        isDesktop: width > TABLET_MAX_WIDTH,
        isTouch: coarsePointer || maxTouchPoints > 0,
        isIOS,
        isSafari,
    };
}

export default function useResponsiveViewport() {
    const [viewport, setViewport] = useState(detectResponsiveViewport);

    useEffect(() => {
        const updateViewport = () => {
            setViewport(detectResponsiveViewport());
        };

        updateViewport();

        window.addEventListener('resize', updateViewport);
        window.addEventListener('orientationchange', updateViewport);

        return () => {
            window.removeEventListener('resize', updateViewport);
            window.removeEventListener('orientationchange', updateViewport);
        };
    }, []);

    return viewport;
}
