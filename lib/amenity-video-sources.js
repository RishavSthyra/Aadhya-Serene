export const S3_AMENITIES_BASE = 'https://aadhya-serene-assets-v2.s3.amazonaws.com/videos/amenities';
export const R2_AMENITIES_BASE = 'https://cdn.sthyra.com/AADHYA%20SERENE/videos/amenities';
export const AMENITY_VIDEO_QUALITY = '720p';
export const AMENITY_VIDEO_PREMIUM_QUALITY = '1080p';

const R2_AMENITY_SLUGS = new Set([
    'rooftopLeisureDeck',
    'childrensPlayArea',
    'badminton',
    'basketball',
    'gymnasium',
    'swimmingPool',
]);

export const AMENITY_SLUGS = [
    'rooftopLeisureDeck',
    'childrensPlayArea',
    'swimmingPool',
    'gymnasium',
    'indoorGames',
    'clubhouse',
    'basketball',
    'badminton',
];

export function getAmenityVideoBase(amenity) {
    return R2_AMENITY_SLUGS.has(amenity)
        ? R2_AMENITIES_BASE
        : S3_AMENITIES_BASE;
}

export function getAmenityVideoSource(amenity, quality = AMENITY_VIDEO_QUALITY) {
    return `${getAmenityVideoBase(amenity)}/${amenity}/${quality}/${amenity}-h264.mp4`;
}

export function getAmenityVideoVariant(amenity) {
    return {
        safe: getAmenityVideoSource(amenity, AMENITY_VIDEO_QUALITY),
        premium: getAmenityVideoSource(amenity, AMENITY_VIDEO_PREMIUM_QUALITY),
        ultra: getAmenityVideoSource(amenity, AMENITY_VIDEO_PREMIUM_QUALITY),
    };
}

export function getAmenityVideoSources(qualities = [AMENITY_VIDEO_QUALITY]) {
    const normalizedQualities = [...new Set(qualities.filter(Boolean))];

    return AMENITY_SLUGS.flatMap((amenity) => (
        normalizedQualities.map((quality) => getAmenityVideoSource(amenity, quality))
    ));
}
