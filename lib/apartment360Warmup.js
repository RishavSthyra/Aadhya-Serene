'use client';

let activeWarmupCleanup = null;
let viewerModulePromise = null;
const transitionPrimePromises = new Map();

async function loadViewerModule() {
    if (!viewerModulePromise) {
        viewerModulePromise = import('../components/Apartment360Viewer/index.jsx');
    }

    return viewerModulePromise;
}

export async function warmApartment360Frames({
    isConstrainedDevice = false,
    includeInteractionFrames = false,
} = {}) {
    if (typeof window === 'undefined') {
        return () => {};
    }

    try {
        const module = await loadViewerModule();

        if (typeof activeWarmupCleanup === 'function') {
            activeWarmupCleanup();
        }

        activeWarmupCleanup = module.scheduleApartment360FrameWarmup?.({
            isConstrainedDevice,
            includeInteractionFrames,
        }) ?? null;

        return activeWarmupCleanup ?? (() => {});
    } catch {
        return () => {};
    }
}

export function primeApartment360FramesForTransition({
    isConstrainedDevice = false,
} = {}) {
    if (typeof window === 'undefined') {
        return Promise.resolve(false);
    }

    const cacheKey = isConstrainedDevice ? 'constrained' : 'default';
    const existingPromise = transitionPrimePromises.get(cacheKey);
    if (existingPromise) {
        return existingPromise;
    }

    const primePromise = (async () => {
        try {
            const module = await loadViewerModule();
            return module.prewarmApartment360FramesForTransition?.({
                isConstrainedDevice,
            }) ?? false;
        } catch {
            return false;
        }
    })();

    transitionPrimePromises.set(cacheKey, primePromise);
    return primePromise;
}
