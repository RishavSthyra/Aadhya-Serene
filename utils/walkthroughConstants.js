export const EXTERIOR_DATA = {
    NAV_URL: '/data/exterior/nav.json',
    SCENES_URL: '/data/exterior/scenes.json',
    TILE_BASE_URL: 'https://aadhya-serene-assets-v2.s3.amazonaws.com/panos/exterior/tiles',
    MINIMAP_BG_URL: 'https://aadhya-serene-assets-v2.s3.amazonaws.com/images/panos/minimap.avif',


    // Minimap configuration
    MINIMAP_WIDTH_DESKTOP: 398,
    MINIMAP_BOUNDS: {
        TOP_LEFT: { x: 16803.955979, y: 1445.559691 },
        BOTTOM_RIGHT: { x: -461.0575, y: -4402.729673 }
    },

    // Navigation configuration
    HOTSPOT_RADIUS: 1800,
    MAX_NEIGHBORS: 8,
};

export const VIEWER_OPTIONS = {
    controls: { mouseViewMode: 'drag' }
};

export const AUTOROTATE_OPTIONS = {
    yawSpeed: 0.03,
    targetPitch: 0,
    targetFov: Math.PI / 2
};

export const IDLE_TIME = 3000;


