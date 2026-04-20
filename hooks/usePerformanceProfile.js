'use client';

import { useEffect, useMemo, useState } from 'react';
import useResponsiveViewport from './useResponsiveViewport';

function detectPerformanceSignals() {
    if (typeof window === 'undefined') {
        return {
            shouldReduceMotion: false,
            saveData: false,
            effectiveType: '',
            deviceMemory: 8,
            hardwareConcurrency: 8,
        };
    }

    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;

    return {
        shouldReduceMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
        saveData: Boolean(connection?.saveData),
        effectiveType: connection?.effectiveType?.toLowerCase?.() ?? '',
        deviceMemory: Number.isFinite(navigator.deviceMemory) ? navigator.deviceMemory : 8,
        hardwareConcurrency: Number.isFinite(navigator.hardwareConcurrency) ? navigator.hardwareConcurrency : 8,
    };
}

export default function usePerformanceProfile() {
    const viewport = useResponsiveViewport();
    const [signals, setSignals] = useState(detectPerformanceSignals);

    useEffect(() => {
        if (typeof window === 'undefined') {
            return undefined;
        }

        const reducedMotionMedia = window.matchMedia('(prefers-reduced-motion: reduce)');
        const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;

        const updateSignals = () => {
            setSignals(detectPerformanceSignals());
        };

        updateSignals();
        reducedMotionMedia.addEventListener('change', updateSignals);
        connection?.addEventListener?.('change', updateSignals);

        return () => {
            reducedMotionMedia.removeEventListener('change', updateSignals);
            connection?.removeEventListener?.('change', updateSignals);
        };
    }, []);

    return useMemo(() => {
        const slowNetwork = /(^|slow-)?2g|3g/.test(signals.effectiveType);
        const lowMemory = signals.deviceMemory <= 4;
        const lowCpu = signals.hardwareConcurrency <= 4;
        const isConstrainedDevice =
            viewport.isTabletOrBelow
            || signals.shouldReduceMotion
            || signals.saveData
            || slowNetwork
            || lowMemory
            || lowCpu;

        return {
            ...viewport,
            ...signals,
            slowNetwork,
            lowMemory,
            lowCpu,
            isConstrainedDevice,
            shouldConserveData: signals.saveData || slowNetwork || lowMemory || viewport.isMobile,
            allowAdvancedEffects: !isConstrainedDevice,
            preferredVideoQuality: isConstrainedDevice ? '1080p' : '1440p',
        };
    }, [signals, viewport]);
}
