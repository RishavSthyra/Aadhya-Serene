'use client';

let activeWarmupCleanup = null;
let viewerModulePromise = null;

async function loadViewerModule() {
    if (!viewerModulePromise) {
        viewerModulePromise = import('../components/Apartment360Viewer/index.jsx');
    }

    return viewerModulePromise;
}

export async function warmApartment360Frames({ isConstrainedDevice = false } = {}) {
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
        }) ?? null;

        return activeWarmupCleanup ?? (() => {});
    } catch {
        return () => {};
    }
}
