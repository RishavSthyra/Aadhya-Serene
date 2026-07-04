export const APARTMENT_360_BASE = 'https://cdn.sthyra.com/AADHYA%20SERENE/images/webp_4k_150kb_noBirds';
export const APARTMENT_360_FILENAME_PREFIX = 'seq_A1A5';
export const APARTMENT_360_EXTENSION = 'webp';
export const APARTMENT_360_TOTAL_FRAMES = 720;
export const APARTMENT_360_FIRST_SOURCE_INDEX = 271;
export const APARTMENT_360_VIEW_COUNT = 4;
export const APARTMENT_360_FRAMES_PER_VIEW = APARTMENT_360_TOTAL_FRAMES / APARTMENT_360_VIEW_COUNT;
export const APARTMENT_360_SNAP_POINTS = [1, 180, 360, 540, 720];
export const APARTMENT_360_PRIMARY_PRELOAD_COUNT = 180;

export function normalizeApartment360Frame(frameNumber = 1) {
    return (((Math.round(frameNumber) - 1) % APARTMENT_360_TOTAL_FRAMES)
        + APARTMENT_360_TOTAL_FRAMES) % APARTMENT_360_TOTAL_FRAMES + 1;
}

export function apartment360AssetNumber(frameNumber = 1) {
    return APARTMENT_360_FIRST_SOURCE_INDEX + normalizeApartment360Frame(frameNumber) - 1;
}

export function apartment360FrameUrl(frameNumber = 1) {
    const assetNumber = apartment360AssetNumber(frameNumber);
    return `${APARTMENT_360_BASE}/${APARTMENT_360_FILENAME_PREFIX}.${String(assetNumber).padStart(4, '0')}.${APARTMENT_360_EXTENSION}`;
}

export function apartment360ViewIndexFromFrame(frameNumber = 1) {
    const normalizedFrame = ((Math.round(frameNumber) % APARTMENT_360_TOTAL_FRAMES)
        + APARTMENT_360_TOTAL_FRAMES) % APARTMENT_360_TOTAL_FRAMES;
    return Math.round(normalizedFrame / APARTMENT_360_FRAMES_PER_VIEW) % APARTMENT_360_VIEW_COUNT;
}
