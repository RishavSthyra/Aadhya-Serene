/**
 * Flat data for AadhyaSerene — ported from ASW reference.
 * All 33 models with room dimensions, flat→model mapping, and video helpers.
 */

const CDN = 'https://du67w5n77drxm.cloudfront.net';
const RENDERS_CDN_4K = 'https://cdn.sthyra.com/AADHYA%20SERENE/renders';
const RENDERS_CDN_OPTIMIZED = 'https://cdn.sthyra.com/AADHYA%20SERENE/renders_optimized';
const FLAT_RENDER_FALLBACK_FRAMES = Object.freeze({
    A1: 'https://cdn.sthyra.com/AADHYA%20SERENE/images/rot360_webp/frame_0001.webp',
    A2: 'https://cdn.sthyra.com/AADHYA%20SERENE/images/rot360_webp/frame_0090.webp',
    A3: 'https://cdn.sthyra.com/AADHYA%20SERENE/images/rot360_webp/frame_0180.webp',
    A4: 'https://cdn.sthyra.com/AADHYA%20SERENE/images/rot360_webp/frame_0270.webp',
});
const FLAT_RENDER_VIEW_KEYS = Object.freeze(['A1', 'A2', 'A3', 'A4']);
const MAX_PRELOADED_FLAT_VIDEOS = 6;
const FLAT_VIDEO_READY_STATE = 2;
const FLAT_VIDEO_METADATA_READY_STATE = 1;
const preloadedFlatVideoElements = new Map();
const preloadedFlatVideoPromises = new Map();
const warmedFlatVideoIds = new Set();
let flatVideoWarmupRunId = 0;
let flatVideoWarmupIdleId = null;
let flatVideoWarmupTimeoutId = null;
let cachedFlatVideoDeliveryProfile = null;

/* ── Room dimensions per model ── */
const models = [
    { model: 1, type: '2 BHK', area: 1001, balconies: 0, facing: 'north', rooms: [{ name: 'Bedroom 1', size: "13' × 10'", icon: '🛏️' }, { name: 'Attached Toilet', size: "8'6\" × 4'3\"", icon: '🚿' }, { name: 'Bedroom 2', size: "13' × 7'8\"", icon: '🛏️' }, { name: 'Living Room', size: "16'10\" × 10'", icon: '🛋️' }, { name: 'Dining Room', size: "8'6\" × 12'7\"", icon: '🍽️' }, { name: 'Kitchen', size: "8'4\" × 7'8\"", icon: '🍳' }, { name: 'Common Toilet', size: "8' × 4'3\"", icon: '🚽' }, { name: 'Utility', size: "3'6\" × 8'6\"", icon: '🧺' }] },
    { model: 2, type: '2 BHK', area: 1001, balconies: 0, facing: 'north', rooms: [{ name: 'Bedroom 1', size: "13' × 10'", icon: '🛏️' }, { name: 'Attached Toilet', size: "8'6\" × 4'3\"", icon: '🚿' }, { name: 'Bedroom 2', size: "13' × 7'8\"", icon: '🛏️' }, { name: 'Living Room', size: "16'10\" × 10'", icon: '🛋️' }, { name: 'Dining Room', size: "8'6\" × 12'7\"", icon: '🍽️' }, { name: 'Kitchen', size: "8'4\" × 7'8\"", icon: '🍳' }, { name: 'Common Toilet', size: "8' × 4'3\"", icon: '🚽' }, { name: 'Utility', size: "3'6\" × 8'6\"", icon: '🧺' }] },
    { model: 3, type: '3 BHK', area: 1191, balconies: 0, facing: 'north', rooms: [{ name: 'Bedroom 1', size: "13' × 11'", icon: '🛏️' }, { name: 'Attached Toilet 1', size: "8' × 4'6\"", icon: '🚿' }, { name: 'Bedroom 2', size: "11' × 10'", icon: '🛏️' }, { name: 'Bedroom 3', size: "10' × 9'6\"", icon: '🛏️' }, { name: 'Living Room', size: "16' × 11'", icon: '🛋️' }, { name: 'Dining Room', size: "9' × 11'", icon: '🍽️' }, { name: 'Kitchen', size: "9' × 8'", icon: '🍳' }, { name: 'Common Toilet', size: "8' × 4'", icon: '🚽' }, { name: 'Utility', size: "4' × 7'", icon: '🧺' }] },
    { model: 4, type: '2 BHK', area: 1038, balconies: 0, facing: 'east', rooms: [{ name: 'Bedroom 1', size: "13' × 10'6\"", icon: '🛏️' }, { name: 'Attached Toilet', size: "8' × 4'6\"", icon: '🚿' }, { name: 'Bedroom 2', size: "12' × 8'", icon: '🛏️' }, { name: 'Living Room', size: "15' × 10'6\"", icon: '🛋️' }, { name: 'Dining Room', size: "9' × 11'", icon: '🍽️' }, { name: 'Kitchen', size: "8'6\" × 8'", icon: '🍳' }, { name: 'Common Toilet', size: "7'6\" × 4'", icon: '🚽' }, { name: 'Utility', size: "4' × 7'6\"", icon: '🧺' }] },
    { model: 5, type: '2 BHK', area: 1004, balconies: 0, facing: 'west', rooms: [{ name: 'Bedroom 1', size: "12'6\" × 10'", icon: '🛏️' }, { name: 'Attached Toilet', size: "8' × 4'3\"", icon: '🚿' }, { name: 'Bedroom 2', size: "12' × 8'", icon: '🛏️' }, { name: 'Living Room', size: "15' × 10'", icon: '🛋️' }, { name: 'Dining Room', size: "8'6\" × 11'", icon: '🍽️' }, { name: 'Kitchen', size: "8' × 7'8\"", icon: '🍳' }, { name: 'Common Toilet', size: "7'6\" × 4'", icon: '🚽' }, { name: 'Utility', size: "3'6\" × 8'", icon: '🧺' }] },
    { model: 6, type: '2 BHK', area: 1111, balconies: 0, facing: 'east', rooms: [{ name: 'Bedroom 1', size: "14' × 11'", icon: '🛏️' }, { name: 'Attached Toilet', size: "8'6\" × 5'", icon: '🚿' }, { name: 'Bedroom 2', size: "13' × 9'", icon: '🛏️' }, { name: 'Living Room', size: "16' × 11'", icon: '🛋️' }, { name: 'Dining Room', size: "9' × 12'", icon: '🍽️' }, { name: 'Kitchen', size: "9' × 8'", icon: '🍳' }, { name: 'Common Toilet', size: "8' × 4'6\"", icon: '🚽' }, { name: 'Utility', size: "4' × 8'", icon: '🧺' }] },
    { model: 7, type: '2 BHK', area: 1097, balconies: 0, facing: 'west', rooms: [{ name: 'Bedroom 1', size: "13'6\" × 10'6\"", icon: '🛏️' }, { name: 'Attached Toilet', size: "8'6\" × 4'6\"", icon: '🚿' }, { name: 'Bedroom 2', size: "12'6\" × 8'6\"", icon: '🛏️' }, { name: 'Living Room', size: "16' × 10'6\"", icon: '🛋️' }, { name: 'Dining Room', size: "9' × 11'6\"", icon: '🍽️' }, { name: 'Kitchen', size: "8'6\" × 8'", icon: '🍳' }, { name: 'Common Toilet', size: "8' × 4'3\"", icon: '🚽' }, { name: 'Utility', size: "4' × 8'", icon: '🧺' }] },
    { model: 8, type: '2 BHK', area: 1073, balconies: 1, facing: 'north', rooms: [{ name: 'Bedroom 1', size: "13' × 10'", icon: '🛏️' }, { name: 'Attached Toilet', size: "8'6\" × 4'3\"", icon: '🚿' }, { name: 'Bedroom 2', size: "13' × 7'8\"", icon: '🛏️' }, { name: 'Living Room', size: "16'10\" × 10'", icon: '🛋️' }, { name: 'Dining Room', size: "8'6\" × 12'7\"", icon: '🍽️' }, { name: 'Kitchen', size: "8'4\" × 7'8\"", icon: '🍳' }, { name: 'Common Toilet', size: "8' × 4'3\"", icon: '🚽' }, { name: 'Utility', size: "3'6\" × 8'6\"", icon: '🧺' }, { name: 'Balcony', size: "10' × 4'", icon: '🌿' }] },
    { model: 9, type: '2 BHK', area: 1062, balconies: 1, facing: 'north', rooms: [{ name: 'Bedroom 1', size: "13' × 10'", icon: '🛏️' }, { name: 'Attached Toilet', size: "8' × 4'6\"", icon: '🚿' }, { name: 'Bedroom 2', size: "12' × 8'", icon: '🛏️' }, { name: 'Living Room', size: "15' × 10'6\"", icon: '🛋️' }, { name: 'Dining Room', size: "9' × 11'", icon: '🍽️' }, { name: 'Kitchen', size: "8'6\" × 8'", icon: '🍳' }, { name: 'Common Toilet', size: "7'6\" × 4'", icon: '🚽' }, { name: 'Utility', size: "4' × 7'6\"", icon: '🧺' }, { name: 'Balcony', size: "9' × 4'", icon: '🌿' }] },
    { model: 10, type: '3 BHK', area: 1281, balconies: 1, facing: 'north', rooms: [{ name: 'Bedroom 1', size: "14' × 11'", icon: '🛏️' }, { name: 'Attached Toilet 1', size: "8'6\" × 5'", icon: '🚿' }, { name: 'Bedroom 2', size: "12' × 10'", icon: '🛏️' }, { name: 'Bedroom 3', size: "11' × 10'", icon: '🛏️' }, { name: 'Living Room', size: "17' × 11'", icon: '🛋️' }, { name: 'Dining Room', size: "9'6\" × 12'", icon: '🍽️' }, { name: 'Kitchen', size: "9'6\" × 8'6\"", icon: '🍳' }, { name: 'Common Toilet', size: "8' × 4'6\"", icon: '🚽' }, { name: 'Utility', size: "4' × 8'", icon: '🧺' }, { name: 'Balcony', size: "11' × 4'6\"", icon: '🌿' }] },
    { model: 11, type: '2 BHK', area: 1036, balconies: 0, facing: 'east', rooms: [{ name: 'Bedroom 1', size: "13' × 10'", icon: '🛏️' }, { name: 'Attached Toilet', size: "8' × 4'6\"", icon: '🚿' }, { name: 'Bedroom 2', size: "12' × 8'", icon: '🛏️' }, { name: 'Living Room', size: "15' × 10'", icon: '🛋️' }, { name: 'Dining Room', size: "9' × 10'6\"", icon: '🍽️' }, { name: 'Kitchen', size: "8'6\" × 7'6\"", icon: '🍳' }, { name: 'Common Toilet', size: "7'6\" × 4'", icon: '🚽' }, { name: 'Utility', size: "4' × 7'", icon: '🧺' }] },
    { model: 12, type: '2 BHK', area: 1172, balconies: 0, facing: 'east', rooms: [{ name: 'Bedroom 1', size: "14' × 11'", icon: '🛏️' }, { name: 'Attached Toilet', size: "8'6\" × 5'", icon: '🚿' }, { name: 'Bedroom 2', size: "13' × 9'6\"", icon: '🛏️' }, { name: 'Living Room', size: "16'6\" × 11'", icon: '🛋️' }, { name: 'Dining Room', size: "9'6\" × 12'", icon: '🍽️' }, { name: 'Kitchen', size: "9' × 8'6\"", icon: '🍳' }, { name: 'Common Toilet', size: "8' × 4'6\"", icon: '🚽' }, { name: 'Utility', size: "4'6\" × 8'", icon: '🧺' }] },
    { model: 13, type: '2 BHK', area: 1155, balconies: 0, facing: 'west', rooms: [{ name: 'Bedroom 1', size: "13'6\" × 11'", icon: '🛏️' }, { name: 'Attached Toilet', size: "8'6\" × 5'", icon: '🚿' }, { name: 'Bedroom 2', size: "13' × 9'", icon: '🛏️' }, { name: 'Living Room', size: "16' × 11'", icon: '🛋️' }, { name: 'Dining Room', size: "9' × 12'", icon: '🍽️' }, { name: 'Kitchen', size: "9' × 8'", icon: '🍳' }, { name: 'Common Toilet', size: "8' × 4'6\"", icon: '🚽' }, { name: 'Utility', size: "4' × 8'", icon: '🧺' }] },
    { model: 14, type: '2 BHK', area: 1043, balconies: 0, facing: 'east', rooms: [{ name: 'Bedroom 1', size: "13' × 10'6\"", icon: '🛏️' }, { name: 'Attached Toilet', size: "8' × 4'6\"", icon: '🚿' }, { name: 'Bedroom 2', size: "12' × 8'", icon: '🛏️' }, { name: 'Living Room', size: "15' × 10'6\"", icon: '🛋️' }, { name: 'Dining Room', size: "9' × 11'", icon: '🍽️' }, { name: 'Kitchen', size: "8'6\" × 8'", icon: '🍳' }, { name: 'Common Toilet', size: "7'6\" × 4'", icon: '🚽' }, { name: 'Utility', size: "4' × 7'6\"", icon: '🧺' }] },
    { model: 15, type: '2 BHK', area: 1076, balconies: 0, facing: 'east', rooms: [{ name: 'Bedroom 1', size: "13' × 10'", icon: '🛏️' }, { name: 'Attached Toilet', size: "8' × 4'6\"", icon: '🚿' }, { name: 'Bedroom 2', size: "12' × 8'", icon: '🛏️' }, { name: 'Living Room', size: "15' × 10'6\"", icon: '🛋️' }, { name: 'Dining Room', size: "9' × 11'", icon: '🍽️' }, { name: 'Kitchen', size: "8'6\" × 8'", icon: '🍳' }, { name: 'Common Toilet', size: "7'6\" × 4'", icon: '🚽' }, { name: 'Utility', size: "4' × 7'", icon: '🧺' }, { name: 'Pooja Room', size: "4' × 4'6\"", icon: '🪔' }] },
    { model: 16, type: '2 BHK', area: 1055, balconies: 0, facing: 'west', rooms: [{ name: 'Bedroom 1', size: "12'6\" × 10'6\"", icon: '🛏️' }, { name: 'Attached Toilet', size: "8' × 4'6\"", icon: '🚿' }, { name: 'Bedroom 2', size: "12' × 8'", icon: '🛏️' }, { name: 'Living Room', size: "15' × 10'6\"", icon: '🛋️' }, { name: 'Dining Room', size: "9' × 11'", icon: '🍽️' }, { name: 'Kitchen', size: "8'6\" × 7'6\"", icon: '🍳' }, { name: 'Common Toilet', size: "7'6\" × 4'", icon: '🚽' }, { name: 'Utility', size: "3'6\" × 8'", icon: '🧺' }] },
    { model: 17, type: '2 BHK', area: 1109, balconies: 0, facing: 'west', rooms: [{ name: 'Bedroom 1', size: "14' × 10'6\"", icon: '🛏️' }, { name: 'Attached Toilet', size: "8'6\" × 5'", icon: '🚿' }, { name: 'Bedroom 2', size: "13' × 9'", icon: '🛏️' }, { name: 'Living Room', size: "16' × 10'6\"", icon: '🛋️' }, { name: 'Dining Room', size: "9' × 11'6\"", icon: '🍽️' }, { name: 'Kitchen', size: "8'6\" × 8'", icon: '🍳' }, { name: 'Common Toilet', size: "8' × 4'3\"", icon: '🚽' }, { name: 'Utility', size: "4' × 8'", icon: '🧺' }] },
    { model: 18, type: '2 BHK', area: 1119, balconies: 2, facing: 'north', rooms: [{ name: 'Bedroom 1', size: "13' × 10'", icon: '🛏️' }, { name: 'Attached Toilet', size: "8'6\" × 4'3\"", icon: '🚿' }, { name: 'Bedroom 2', size: "13' × 7'8\"", icon: '🛏️' }, { name: 'Living Room', size: "16'10\" × 10'", icon: '🛋️' }, { name: 'Dining Room', size: "8'6\" × 12'7\"", icon: '🍽️' }, { name: 'Kitchen', size: "8'4\" × 7'8\"", icon: '🍳' }, { name: 'Common Toilet', size: "8' × 4'3\"", icon: '🚽' }, { name: 'Utility', size: "3'6\" × 8'6\"", icon: '🧺' }, { name: 'Balcony 1', size: "10' × 4'", icon: '🌿' }, { name: 'Balcony 2', size: "6' × 4'", icon: '🌿' }] },
    { model: 19, type: '2 BHK', area: 1108, balconies: 2, facing: 'north', rooms: [{ name: 'Bedroom 1', size: "13' × 10'", icon: '🛏️' }, { name: 'Attached Toilet', size: "8' × 4'6\"", icon: '🚿' }, { name: 'Bedroom 2', size: "12' × 8'", icon: '🛏️' }, { name: 'Living Room', size: "15' × 10'6\"", icon: '🛋️' }, { name: 'Dining Room', size: "9' × 11'", icon: '🍽️' }, { name: 'Kitchen', size: "8'6\" × 8'", icon: '🍳' }, { name: 'Common Toilet', size: "7'6\" × 4'", icon: '🚽' }, { name: 'Utility', size: "4' × 7'6\"", icon: '🧺' }, { name: 'Balcony 1', size: "9' × 4'", icon: '🌿' }, { name: 'Balcony 2', size: "6' × 4'", icon: '🌿' }] },
    { model: 20, type: '3 BHK', area: 1373, balconies: 2, facing: 'north', rooms: [{ name: 'Bedroom 1', size: "14' × 11'6\"", icon: '🛏️' }, { name: 'Attached Toilet 1', size: "8'6\" × 5'", icon: '🚿' }, { name: 'Bedroom 2', size: "12'6\" × 10'", icon: '🛏️' }, { name: 'Bedroom 3', size: "11'6\" × 10'", icon: '🛏️' }, { name: 'Living Room', size: "17' × 11'6\"", icon: '🛋️' }, { name: 'Dining Room', size: "10' × 12'", icon: '🍽️' }, { name: 'Kitchen', size: "10' × 8'6\"", icon: '🍳' }, { name: 'Common Toilet', size: "8'6\" × 4'6\"", icon: '🚽' }, { name: 'Utility', size: "4'6\" × 8'", icon: '🧺' }, { name: 'Balcony 1', size: "11' × 4'6\"", icon: '🌿' }, { name: 'Balcony 2', size: "6' × 4'6\"", icon: '🌿' }] },
    { model: 21, type: '2 BHK', area: 1076, balconies: 0, facing: 'east', rooms: [{ name: 'Bedroom 1', size: "13' × 10'6\"", icon: '🛏️' }, { name: 'Attached Toilet', size: "8' × 4'6\"", icon: '🚿' }, { name: 'Bedroom 2', size: "12' × 8'", icon: '🛏️' }, { name: 'Living Room', size: "15' × 10'6\"", icon: '🛋️' }, { name: 'Dining Room', size: "9' × 11'", icon: '🍽️' }, { name: 'Kitchen', size: "8'6\" × 8'", icon: '🍳' }, { name: 'Common Toilet', size: "7'6\" × 4'", icon: '🚽' }, { name: 'Utility', size: "4' × 7'6\"", icon: '🧺' }] },
    { model: 22, type: '2 BHK', area: 1044, balconies: 0, facing: 'west', rooms: [{ name: 'Bedroom 1', size: "12'6\" × 10'", icon: '🛏️' }, { name: 'Attached Toilet', size: "8' × 4'3\"", icon: '🚿' }, { name: 'Bedroom 2', size: "12' × 8'", icon: '🛏️' }, { name: 'Living Room', size: "15' × 10'", icon: '🛋️' }, { name: 'Dining Room', size: "8'6\" × 11'", icon: '🍽️' }, { name: 'Kitchen', size: "8' × 7'8\"", icon: '🍳' }, { name: 'Common Toilet', size: "7'6\" × 4'", icon: '🚽' }, { name: 'Utility', size: "3'6\" × 8'", icon: '🧺' }] },
    { model: 23, type: '2 BHK', area: 1204, balconies: 0, facing: 'east', rooms: [{ name: 'Bedroom 1', size: "14' × 11'6\"", icon: '🛏️' }, { name: 'Attached Toilet', size: "8'6\" × 5'", icon: '🚿' }, { name: 'Bedroom 2', size: "13' × 10'", icon: '🛏️' }, { name: 'Living Room', size: "16'6\" × 11'6\"", icon: '🛋️' }, { name: 'Dining Room', size: "10' × 12'", icon: '🍽️' }, { name: 'Kitchen', size: "9'6\" × 8'6\"", icon: '🍳' }, { name: 'Common Toilet', size: "8' × 4'6\"", icon: '🚽' }, { name: 'Utility', size: "4'6\" × 8'", icon: '🧺' }] },
    { model: 24, type: '2 BHK', area: 1193, balconies: 0, facing: 'west', rooms: [{ name: 'Bedroom 1', size: "14' × 11'", icon: '🛏️' }, { name: 'Attached Toilet', size: "8'6\" × 5'", icon: '🚿' }, { name: 'Bedroom 2', size: "13' × 9'6\"", icon: '🛏️' }, { name: 'Living Room', size: "16'6\" × 11'", icon: '🛋️' }, { name: 'Dining Room', size: "9'6\" × 12'", icon: '🍽️' }, { name: 'Kitchen', size: "9' × 8'6\"", icon: '🍳' }, { name: 'Common Toilet', size: "8' × 4'6\"", icon: '🚽' }, { name: 'Utility', size: "4'6\" × 8'", icon: '🧺' }] },
    { model: 25, type: '2 BHK', area: 1079, balconies: 0, facing: 'east', rooms: [{ name: 'Bedroom 1', size: "13' × 10'6\"", icon: '🛏️' }, { name: 'Attached Toilet', size: "8' × 4'6\"", icon: '🚿' }, { name: 'Bedroom 2', size: "12' × 8'", icon: '🛏️' }, { name: 'Living Room', size: "15' × 10'6\"", icon: '🛋️' }, { name: 'Dining Room', size: "9' × 11'", icon: '🍽️' }, { name: 'Kitchen', size: "8'6\" × 8'", icon: '🍳' }, { name: 'Common Toilet', size: "7'6\" × 4'", icon: '🚽' }, { name: 'Utility', size: "4' × 7'6\"", icon: '🧺' }] },
    { model: 26, type: '2 BHK', area: 1070, balconies: 0, facing: 'east', rooms: [{ name: 'Bedroom 1', size: "13' × 10'", icon: '🛏️' }, { name: 'Attached Toilet', size: "8' × 4'6\"", icon: '🚿' }, { name: 'Bedroom 2', size: "12' × 8'", icon: '🛏️' }, { name: 'Living Room', size: "15' × 10'", icon: '🛋️' }, { name: 'Dining Room', size: "9' × 10'6\"", icon: '🍽️' }, { name: 'Kitchen', size: "8'6\" × 7'6\"", icon: '🍳' }, { name: 'Common Toilet', size: "7'6\" × 4'", icon: '🚽' }, { name: 'Utility', size: "4' × 7'", icon: '🧺' }] },
    { model: 27, type: '2 BHK', area: 1114, balconies: 0, facing: 'east', rooms: [{ name: 'Bedroom 1', size: "14' × 10'6\"", icon: '🛏️' }, { name: 'Attached Toilet', size: "8'6\" × 5'", icon: '🚿' }, { name: 'Bedroom 2', size: "13' × 9'", icon: '🛏️' }, { name: 'Living Room', size: "16' × 10'6\"", icon: '🛋️' }, { name: 'Dining Room', size: "9' × 11'6\"", icon: '🍽️' }, { name: 'Kitchen', size: "8'6\" × 8'", icon: '🍳' }, { name: 'Common Toilet', size: "8' × 4'3\"", icon: '🚽' }, { name: 'Utility', size: "4' × 8'", icon: '🧺' }] },
    { model: 28, type: '2 BHK', area: 1112, balconies: 0, facing: 'west', rooms: [{ name: 'Bedroom 1', size: "14' × 10'6\"", icon: '🛏️' }, { name: 'Attached Toilet', size: "8'6\" × 5'", icon: '🚿' }, { name: 'Bedroom 2', size: "13' × 9'", icon: '🛏️' }, { name: 'Living Room', size: "16' × 10'6\"", icon: '🛋️' }, { name: 'Dining Room', size: "9' × 11'6\"", icon: '🍽️' }, { name: 'Kitchen', size: "8'6\" × 8'", icon: '🍳' }, { name: 'Common Toilet', size: "8' × 4'3\"", icon: '🚽' }, { name: 'Utility', size: "4' × 8'", icon: '🧺' }] },
    { model: 29, type: '2 BHK', area: 1153, balconies: 0, facing: 'west', rooms: [{ name: 'Bedroom 1', size: "13'6\" × 11'", icon: '🛏️' }, { name: 'Attached Toilet', size: "8'6\" × 5'", icon: '🚿' }, { name: 'Bedroom 2', size: "13' × 9'6\"", icon: '🛏️' }, { name: 'Living Room', size: "16' × 11'", icon: '🛋️' }, { name: 'Dining Room', size: "9' × 12'", icon: '🍽️' }, { name: 'Kitchen', size: "9' × 8'", icon: '🍳' }, { name: 'Common Toilet', size: "8' × 4'6\"", icon: '🚽' }, { name: 'Utility', size: "4' × 8'", icon: '🧺' }] },
    { model: 30, type: '2 BHK', area: 1070, balconies: 1, facing: 'east', rooms: [{ name: 'Bedroom 1', size: "13' × 10'", icon: '🛏️' }, { name: 'Attached Toilet', size: "8' × 4'6\"", icon: '🚿' }, { name: 'Bedroom 2', size: "12' × 8'", icon: '🛏️' }, { name: 'Living Room', size: "15' × 10'", icon: '🛋️' }, { name: 'Dining Room', size: "9' × 10'6\"", icon: '🍽️' }, { name: 'Kitchen', size: "8'6\" × 7'6\"", icon: '🍳' }, { name: 'Common Toilet', size: "7'6\" × 4'", icon: '🚽' }, { name: 'Utility', size: "4' × 7'", icon: '🧺' }, { name: 'Balcony', size: "8' × 4'", icon: '🌿' }] },
    { model: 31, type: '2 BHK', area: 1290, balconies: 3, facing: 'east', rooms: [{ name: 'Bedroom 1', size: "14' × 11'6\"", icon: '🛏️' }, { name: 'Attached Toilet', size: "8'6\" × 5'", icon: '🚿' }, { name: 'Bedroom 2', size: "13' × 10'", icon: '🛏️' }, { name: 'Living Room', size: "17' × 11'", icon: '🛋️' }, { name: 'Dining Room', size: "10' × 12'", icon: '🍽️' }, { name: 'Kitchen', size: "10' × 8'6\"", icon: '🍳' }, { name: 'Common Toilet', size: "8'6\" × 4'6\"", icon: '🚽' }, { name: 'Utility', size: "4'6\" × 8'", icon: '🧺' }, { name: 'Balcony 1', size: "10' × 5'", icon: '🌿' }, { name: 'Balcony 2', size: "8' × 4'", icon: '🌿' }, { name: 'Balcony 3', size: "6' × 4'", icon: '🌿' }] },
    { model: 32, type: '2 BHK', area: 1178, balconies: 2, facing: 'west', rooms: [{ name: 'Bedroom 1', size: "14' × 11'", icon: '🛏️' }, { name: 'Attached Toilet', size: "8'6\" × 5'", icon: '🚿' }, { name: 'Bedroom 2', size: "13' × 9'6\"", icon: '🛏️' }, { name: 'Living Room', size: "16'6\" × 11'", icon: '🛋️' }, { name: 'Dining Room', size: "9'6\" × 12'", icon: '🍽️' }, { name: 'Kitchen', size: "9' × 8'6\"", icon: '🍳' }, { name: 'Common Toilet', size: "8' × 4'6\"", icon: '🚽' }, { name: 'Utility', size: "4'6\" × 8'", icon: '🧺' }, { name: 'Balcony 1', size: "10' × 4'6\"", icon: '🌿' }, { name: 'Balcony 2', size: "6' × 4'", icon: '🌿' }] },
    { model: 33, type: '2 BHK', area: 1498, balconies: 3, facing: 'west', rooms: [{ name: 'Bedroom 1', size: "15' × 12'", icon: '🛏️' }, { name: 'Attached Toilet', size: "9' × 5'6\"", icon: '🚿' }, { name: 'Bedroom 2', size: "14' × 10'6\"", icon: '🛏️' }, { name: 'Living Room', size: "18' × 12'", icon: '🛋️' }, { name: 'Dining Room', size: "10'6\" × 13'", icon: '🍽️' }, { name: 'Kitchen', size: "10'6\" × 9'", icon: '🍳' }, { name: 'Common Toilet', size: "8'6\" × 5'", icon: '🚽' }, { name: 'Utility', size: "5' × 9'", icon: '🧺' }, { name: 'Balcony 1', size: "12' × 5'", icon: '🌿' }, { name: 'Balcony 2', size: "8' × 4'6\"", icon: '🌿' }, { name: 'Balcony 3', size: "7' × 4'", icon: '🌿' }] },
];

/* ── flat → model assignment (132 total, matching GLB + live website) ── */
const flatModelMap = {
    // Ground floor (12 flats: 002-013)
    '002': { model: 1, status: 'available' }, '003': { model: 2, status: 'available' },
    '004': { model: 1, status: 'available' }, '005': { model: 2, status: 'available' },
    '006': { model: 1, status: 'available' }, '007': { model: 2, status: 'available' },
    '008': { model: 1, status: 'available' }, '009': { model: 3, status: 'available' },
    '010': { model: 4, status: 'available' }, '011': { model: 5, status: 'available' },
    '012': { model: 6, status: 'available' }, '013': { model: 7, status: 'available' },

    // Floor 1 (18 flats: 101-118)
    '101': { model: 8, status: 'available' }, '102': { model: 8, status: 'available' },
    '103': { model: 8, status: 'available' }, '104': { model: 8, status: 'available' },
    '105': { model: 8, status: 'available' }, '106': { model: 8, status: 'available' },
    '107': { model: 8, status: 'available' }, '108': { model: 9, status: 'available' },
    '109': { model: 10, status: 'available' }, '110': { model: 11, status: 'available' },
    '111': { model: 5, status: 'available' }, '112': { model: 12, status: 'available' },
    '113': { model: 7, status: 'available' }, '114': { model: 13, status: 'available' },
    '115': { model: 14, status: 'available' }, '116': { model: 15, status: 'available' },
    '117': { model: 16, status: 'available' }, '118': { model: 17, status: 'available' },

    // Floor 2 (18 flats: 201-218)
    '201': { model: 18, status: 'available' }, '202': { model: 18, status: 'available' },
    '203': { model: 18, status: 'available' }, '204': { model: 18, status: 'available' },
    '205': { model: 18, status: 'available' }, '206': { model: 18, status: 'available' },
    '207': { model: 18, status: 'available' }, '208': { model: 19, status: 'available' },
    '209': { model: 20, status: 'available' }, '210': { model: 21, status: 'available' },
    '211': { model: 22, status: 'available' }, '212': { model: 23, status: 'available' },
    '213': { model: 24, status: 'available' }, '214': { model: 25, status: 'available' },
    '215': { model: 26, status: 'available' }, '216': { model: 27, status: 'available' },
    '217': { model: 28, status: 'available' }, '218': { model: 29, status: 'available' },

    // Floor 3 (18 flats: 301-318)
    '301': { model: 18, status: 'available' }, '302': { model: 18, status: 'available' },
    '303': { model: 18, status: 'available' }, '304': { model: 18, status: 'available' },
    '305': { model: 18, status: 'available' }, '306': { model: 18, status: 'available' },
    '307': { model: 18, status: 'available' }, '308': { model: 19, status: 'available' },
    '309': { model: 20, status: 'available' }, '310': { model: 21, status: 'available' },
    '311': { model: 22, status: 'available' }, '312': { model: 23, status: 'available' },
    '313': { model: 24, status: 'available' }, '314': { model: 25, status: 'available' },
    '315': { model: 26, status: 'available' }, '316': { model: 27, status: 'available' },
    '317': { model: 28, status: 'available' }, '318': { model: 29, status: 'available' },

    // Floor 4 (22 flats: 401-422)
    '401': { model: 18, status: 'available' }, '402': { model: 18, status: 'available' },
    '403': { model: 18, status: 'available' }, '404': { model: 18, status: 'available' },
    '405': { model: 18, status: 'available' }, '406': { model: 18, status: 'sold out' },
    '407': { model: 18, status: 'available' }, '408': { model: 19, status: 'available' },
    '409': { model: 20, status: 'available' }, '410': { model: 21, status: 'available' },
    '411': { model: 22, status: 'available' }, '412': { model: 23, status: 'available' },
    '413': { model: 24, status: 'available' }, '414': { model: 25, status: 'available' },
    '415': { model: 26, status: 'available' }, '416': { model: 27, status: 'available' },
    '417': { model: 28, status: 'available' }, '418': { model: 29, status: 'available' },
    '419': { model: 30, status: 'available' }, '420': { model: 31, status: 'available' },
    '421': { model: 32, status: 'available' }, '422': { model: 33, status: 'available' },

    // Floor 5 (22 flats: 501-522)
    '501': { model: 18, status: 'available' }, '502': { model: 18, status: 'available' },
    '503': { model: 18, status: 'available' }, '504': { model: 18, status: 'available' },
    '505': { model: 18, status: 'available' }, '506': { model: 18, status: 'available' },
    '507': { model: 18, status: 'available' }, '508': { model: 19, status: 'available' },
    '509': { model: 20, status: 'available' }, '510': { model: 21, status: 'available' },
    '511': { model: 22, status: 'available' }, '512': { model: 23, status: 'available' },
    '513': { model: 24, status: 'available' }, '514': { model: 25, status: 'available' },
    '515': { model: 26, status: 'available' }, '516': { model: 27, status: 'available' },
    '517': { model: 28, status: 'available' }, '518': { model: 29, status: 'available' },
    '519': { model: 30, status: 'available' }, '520': { model: 31, status: 'available' },
    '521': { model: 32, status: 'available' }, '522': { model: 33, status: 'available' },

    // Floor 6 (22 flats: 601-622)
    '601': { model: 18, status: 'available' }, '602': { model: 18, status: 'available' },
    '603': { model: 18, status: 'available' }, '604': { model: 18, status: 'available' },
    '605': { model: 18, status: 'available' }, '606': { model: 18, status: 'available' },
    '607': { model: 18, status: 'available' }, '608': { model: 19, status: 'available' },
    '609': { model: 20, status: 'available' }, '610': { model: 21, status: 'available' },
    '611': { model: 22, status: 'available' }, '612': { model: 23, status: 'available' },
    '613': { model: 24, status: 'available' }, '614': { model: 25, status: 'available' },
    '615': { model: 26, status: 'available' }, '616': { model: 27, status: 'available' },
    '617': { model: 28, status: 'available' }, '618': { model: 29, status: 'available' },
    '619': { model: 30, status: 'available' }, '620': { model: 31, status: 'available' },
    '621': { model: 32, status: 'available' }, '622': { model: 33, status: 'available' },
};

const modelMap = new Map(models.map((m) => [m.model, m]));  



/* ── Video helpers ── */
// All flats have exterior video assets on CloudFront
// Pattern: /videos/flats/flat_XXX_exterior_1-{angle}/{quality}/flat_XXX_exterior_1-{angle}-{codec}.{ext}
const flatsWithVideo = new Set(Object.keys(flatModelMap));

/** Returns the flat ID to use for video (always returns the flat's own ID).
 *  Returns null only if the flat ID is invalid.
 */
export function flatVideoFallbackId(flatId) {
    return flatsWithVideo.has(flatId) ? flatId : null;
}

export function normalizeFlatViewKey(viewKey) {
    if (typeof viewKey !== 'string') {
        return 'A1';
    }

    const normalizedViewKey = viewKey.trim().toUpperCase();
    return FLAT_RENDER_VIEW_KEYS.includes(normalizedViewKey) ? normalizedViewKey : 'A1';
}

export function flatViewAngleFromKey(viewKey) {
    return FLAT_RENDER_VIEW_KEYS.indexOf(normalizeFlatViewKey(viewKey)) + 1;
}

export function flatViewKeyFromAngle(angle = 1) {
    const normalizedAngle = Math.min(
        FLAT_RENDER_VIEW_KEYS.length,
        Math.max(1, Math.round(Number(angle) || 1)),
    );
    return FLAT_RENDER_VIEW_KEYS[normalizedAngle - 1];
}

export function flatViewKeyFromFrame(frameNumber = 1) {
    const normalizedFrame = ((Math.round(frameNumber) % 360) + 360) % 360;
    return FLAT_RENDER_VIEW_KEYS[Math.round(normalizedFrame / 90) % FLAT_RENDER_VIEW_KEYS.length];
}

export function flatRenderFallbackPoster(viewKey) {
    const normalizedViewKey = normalizeFlatViewKey(viewKey);
    return FLAT_RENDER_FALLBACK_FRAMES[normalizedViewKey] ?? FLAT_RENDER_FALLBACK_FRAMES.A1;
}

function readFlatVideoEnvironmentSignals() {
    if (typeof window === 'undefined' || typeof navigator === 'undefined') {
        return {
            connectionType: '',
            downlinkMbps: 0,
            saveData: false,
            deviceMemoryGb: 0,
            cpuThreads: 0,
            screenPixelsWide: 0,
            pixelRatio: 1,
        };
    }

    const connection =
        navigator.connection ||
        navigator.mozConnection ||
        navigator.webkitConnection;
    const viewportWidth = Math.max(
        window.innerWidth || 0,
        window.screen?.width || 0,
    );
    const pixelRatio = Math.max(window.devicePixelRatio || 1, 1);

    return {
        connectionType: String(connection?.effectiveType || '').toLowerCase(),
        downlinkMbps: Number(connection?.downlink || 0),
        saveData: Boolean(connection?.saveData),
        deviceMemoryGb: Number(navigator.deviceMemory || 0),
        cpuThreads: Number(navigator.hardwareConcurrency || 0),
        screenPixelsWide: Math.round(viewportWidth * pixelRatio),
        pixelRatio,
    };
}

export function getFlatVideoDeliveryProfile(forceRefresh = false) {
    if (!forceRefresh && cachedFlatVideoDeliveryProfile) {
        return cachedFlatVideoDeliveryProfile;
    }

    const signals = readFlatVideoEnvironmentSignals();
    const isConstrainedNetwork =
        signals.saveData ||
        signals.connectionType.includes('2g') ||
        signals.connectionType.includes('3g') ||
        (signals.downlinkMbps > 0 && signals.downlinkMbps < 2.5);
    const isSlowNetwork =
        isConstrainedNetwork ||
        signals.connectionType.includes('slow') ||
        (signals.downlinkMbps > 0 && signals.downlinkMbps < 8);
    const isHighResolutionScreen =
        signals.screenPixelsWide >= 1800 || signals.pixelRatio >= 2;
    const isStrongDevice =
        signals.cpuThreads >= 8 &&
        (signals.deviceMemoryGb === 0 || signals.deviceMemoryGb >= 8) &&
        isHighResolutionScreen;
    const hasFastNetwork =
        !signals.saveData &&
        !signals.connectionType.includes('2g') &&
        !signals.connectionType.includes('3g') &&
        (signals.connectionType === '' || signals.connectionType === '4g') &&
        (signals.downlinkMbps === 0 || signals.downlinkMbps >= 14);
    const use4kRenders = hasFastNetwork && isStrongDevice;

    cachedFlatVideoDeliveryProfile = {
        tier: use4kRenders ? '4k' : 'optimized',
        baseCdn: use4kRenders ? RENDERS_CDN_4K : RENDERS_CDN_OPTIMIZED,
        isConstrainedNetwork,
        isSlowNetwork,
        isStrongDevice,
        hasFastNetwork,
        ...signals,
    };

    return cachedFlatVideoDeliveryProfile;
}

function resolveFlatVideoBaseCdn() {
    return getFlatVideoDeliveryProfile().baseCdn;
}

export function flatVideoSrc(flatId, angle = 1) {
    return `${resolveFlatVideoBaseCdn()}/flat_${flatId}_exterior_1-${angle}.mp4`;
}

export function flatVideoMp4Src(flatId, angle = 1) {
    return flatVideoSrc(flatId, angle);
}

export function flatReverseVideoSrc(flatId) {
    return `${resolveFlatVideoBaseCdn()}/reversed-flat_${flatId}_exterior_1-1.mp4`;
}

export function supportsFlatRenderVideoPlayback() {
    if (typeof document === 'undefined') {
        return true;
    }

    const videoElement = document.createElement('video');

    if (!videoElement?.canPlayType) {
        return false;
    }

    return Boolean(
        videoElement.canPlayType('video/mp4; codecs="avc1.42E01E, mp4a.40.2"') ||
        videoElement.canPlayType('video/mp4; codecs="avc1.4D401E, mp4a.40.2"') ||
        videoElement.canPlayType('video/mp4') ||
        videoElement.canPlayType('video/webm; codecs="vp9,opus"') ||
        videoElement.canPlayType('video/webm; codecs="vp8,vorbis"') ||
        videoElement.canPlayType('video/webm')
    );
}

function trimPreloadedFlatVideos() {
    while (preloadedFlatVideoElements.size > MAX_PRELOADED_FLAT_VIDEOS) {
        const oldestEntry = preloadedFlatVideoElements.entries().next().value;
        if (!oldestEntry) return;

        const [oldestFlatId, videoElement] = oldestEntry;
        preloadedFlatVideoElements.delete(oldestFlatId);
        preloadedFlatVideoPromises.delete(oldestFlatId);

        if (videoElement) {
            videoElement.pause();
            videoElement.removeAttribute('src');
            videoElement.load();
        }
    }
}

function waitForPreloadedFlatVideo(videoElement, timeoutMs = 3200, readyState = FLAT_VIDEO_READY_STATE) {
    if (!videoElement) {
        return Promise.resolve(false);
    }

    if (videoElement.readyState >= readyState) {
        return Promise.resolve(true);
    }

    return new Promise((resolve) => {
        let settled = false;

        const finish = (result) => {
            if (settled) return;
            settled = true;
            window.clearTimeout(timeoutId);
            videoElement.removeEventListener('loadedmetadata', handleReady);
            videoElement.removeEventListener('loadeddata', handleReady);
            videoElement.removeEventListener('canplay', handleReady);
            videoElement.removeEventListener('error', handleError);
            resolve(result);
        };

        const handleReady = () => {
            if (videoElement.readyState >= readyState) {
                finish(true);
            }
        };
        const handleError = () => finish(false);
        const timeoutId = window.setTimeout(() => finish(false), timeoutMs);

        videoElement.addEventListener('loadedmetadata', handleReady, { once: true });
        videoElement.addEventListener('loadeddata', handleReady, { once: true });
        videoElement.addEventListener('canplay', handleReady, { once: true });
        videoElement.addEventListener('error', handleError, { once: true });
    });
}

function trackFlatVideoWarmState(flatId, readinessPromise) {
    return readinessPromise.then((result) => {
        if (result) {
            warmedFlatVideoIds.add(flatId);
        }

        return result;
    });
}

function unloadTransientVideoElement(videoElement) {
    if (!videoElement) return;

    videoElement.pause();
    videoElement.removeAttribute('src');
    videoElement.load();
}

function getFlatVideoWarmupProfile(options = {}) {
    if (typeof navigator === 'undefined') {
        return {
            delayMs: 520,
            timeoutMs: 2200,
            idleTimeoutMs: 900,
            maxWarmups: 10,
        };
    }

    const deliveryProfile = getFlatVideoDeliveryProfile();
    const isConstrained = deliveryProfile.isConstrainedNetwork;
    const isSlowConnection = deliveryProfile.isSlowNetwork;
    const use4kRenders = deliveryProfile.tier === '4k';

    return {
        delayMs: options.delayMs ?? (isConstrained ? 2200 : isSlowConnection ? 1200 : 520),
        timeoutMs: options.timeoutMs ?? (isConstrained ? 900 : isSlowConnection ? 1400 : use4kRenders ? 2600 : 2200),
        idleTimeoutMs: options.idleTimeoutMs ?? (isConstrained ? 2200 : isSlowConnection ? 1400 : 900),
        maxWarmups: options.maxWarmups ?? (isConstrained ? 0 : isSlowConnection ? 6 : use4kRenders ? 14 : 10),
    };
}

function clearFlatVideoWarmupSchedule() {
    if (typeof window === 'undefined') {
        return;
    }

    if (flatVideoWarmupIdleId !== null && typeof window.cancelIdleCallback === 'function') {
        window.cancelIdleCallback(flatVideoWarmupIdleId);
    }

    if (flatVideoWarmupTimeoutId !== null) {
        window.clearTimeout(flatVideoWarmupTimeoutId);
    }

    flatVideoWarmupIdleId = null;
    flatVideoWarmupTimeoutId = null;
}

function buildFlatVideoWarmupQueue(prioritizeFlatIds = [], maxWarmups = Infinity) {
    const seenFlatIds = new Set();
    const orderedFlatIds = [];

    prioritizeFlatIds.forEach((flatId) => {
        const resolvedFlatId = flatVideoFallbackId(flatId);
        if (!resolvedFlatId || seenFlatIds.has(resolvedFlatId)) {
            return;
        }

        seenFlatIds.add(resolvedFlatId);
        orderedFlatIds.push(resolvedFlatId);
    });

    flatsData.forEach(({ id }) => {
        const resolvedFlatId = flatVideoFallbackId(id);
        if (!resolvedFlatId || seenFlatIds.has(resolvedFlatId)) {
            return;
        }

        seenFlatIds.add(resolvedFlatId);
        orderedFlatIds.push(resolvedFlatId);
    });

    return orderedFlatIds
        .filter((flatId) => !warmedFlatVideoIds.has(flatId))
        .slice(0, maxWarmups);
}

function warmFlatVideoMetadata(flatId, timeoutMs = 2200) {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
        return Promise.resolve(false);
    }

    if (!supportsFlatRenderVideoPlayback()) {
        return Promise.resolve(false);
    }

    const resolvedFlatId = flatVideoFallbackId(flatId);
    if (!resolvedFlatId) {
        return Promise.resolve(false);
    }

    if (warmedFlatVideoIds.has(resolvedFlatId)) {
        return Promise.resolve(true);
    }

    const existingVideo = preloadedFlatVideoElements.get(resolvedFlatId);
    if (existingVideo) {
        return trackFlatVideoWarmState(
            resolvedFlatId,
            waitForPreloadedFlatVideo(existingVideo, timeoutMs, FLAT_VIDEO_METADATA_READY_STATE),
        );
    }

    const videoElement = document.createElement('video');
    videoElement.preload = 'metadata';
    videoElement.muted = true;
    videoElement.defaultMuted = true;
    videoElement.playsInline = true;
    videoElement.crossOrigin = 'anonymous';
    videoElement.setAttribute('muted', '');
    videoElement.setAttribute('playsinline', '');
    videoElement.setAttribute('webkit-playsinline', 'true');
    videoElement.setAttribute('fetchpriority', 'low');
    videoElement.src = flatVideoSrc(resolvedFlatId, 1);
    videoElement.load();

    return trackFlatVideoWarmState(
        resolvedFlatId,
        waitForPreloadedFlatVideo(videoElement, timeoutMs, FLAT_VIDEO_METADATA_READY_STATE)
            .finally(() => {
                unloadTransientVideoElement(videoElement);
            }),
    );
}

function queueFlatVideoWarmupStep(runId, queue, profile) {
    if (typeof window === 'undefined' || runId !== flatVideoWarmupRunId) {
        return;
    }

    const runWarmup = async () => {
        if (runId !== flatVideoWarmupRunId) {
            return;
        }

        const nextFlatId = queue.shift();
        if (!nextFlatId) {
            clearFlatVideoWarmupSchedule();
            return;
        }

        await warmFlatVideoMetadata(nextFlatId, profile.timeoutMs);

        if (runId !== flatVideoWarmupRunId || !queue.length) {
            if (!queue.length) {
                clearFlatVideoWarmupSchedule();
            }
            return;
        }

        queueFlatVideoWarmupStep(runId, queue, profile);
    };

    clearFlatVideoWarmupSchedule();

    if (typeof window.requestIdleCallback === 'function') {
        flatVideoWarmupIdleId = window.requestIdleCallback(() => {
            flatVideoWarmupIdleId = null;
            void runWarmup();
        }, { timeout: profile.idleTimeoutMs });
        return;
    }

    flatVideoWarmupTimeoutId = window.setTimeout(() => {
        flatVideoWarmupTimeoutId = null;
        void runWarmup();
    }, profile.delayMs);
}

export function cancelIdleFlatVideoWarmup() {
    flatVideoWarmupRunId += 1;
    clearFlatVideoWarmupSchedule();
}

export function scheduleIdleFlatVideoWarmup(options = {}) {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
        return () => {};
    }

    const profile = getFlatVideoWarmupProfile(options);
    const queue = buildFlatVideoWarmupQueue(options.prioritizeFlatIds, profile.maxWarmups);
    if (!queue.length) {
        return () => {};
    }

    flatVideoWarmupRunId += 1;
    const runId = flatVideoWarmupRunId;

    queueFlatVideoWarmupStep(runId, queue, profile);

    return () => {
        if (flatVideoWarmupRunId === runId) {
            cancelIdleFlatVideoWarmup();
        }
    };
}

export function preloadFlatEntryVideo(flatId, options = {}) {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
        return Promise.resolve(false);
    }

    if (!supportsFlatRenderVideoPlayback()) {
        return Promise.resolve(false);
    }

    const resolvedFlatId = flatVideoFallbackId(flatId);
    if (!resolvedFlatId) {
        return Promise.resolve(false);
    }

    const {
        aggressive = false,
        timeoutMs = 3200,
    } = options;

    const existingVideo = preloadedFlatVideoElements.get(resolvedFlatId);
    if (existingVideo) {
        preloadedFlatVideoElements.delete(resolvedFlatId);
        preloadedFlatVideoElements.set(resolvedFlatId, existingVideo);

        if (aggressive && existingVideo.readyState < FLAT_VIDEO_READY_STATE) {
            existingVideo.preload = 'auto';
            existingVideo.setAttribute('fetchpriority', 'high');
            existingVideo.load();
            const readinessPromise = trackFlatVideoWarmState(
                resolvedFlatId,
                waitForPreloadedFlatVideo(existingVideo, timeoutMs),
            );
            preloadedFlatVideoPromises.set(resolvedFlatId, readinessPromise);
            return readinessPromise;
        }

        if (existingVideo.readyState >= FLAT_VIDEO_READY_STATE) {
            warmedFlatVideoIds.add(resolvedFlatId);
            return Promise.resolve(true);
        }

        const existingPromise = preloadedFlatVideoPromises.get(resolvedFlatId);
        if (existingPromise) {
            return existingPromise;
        }

        const readinessPromise = trackFlatVideoWarmState(
            resolvedFlatId,
            waitForPreloadedFlatVideo(existingVideo, timeoutMs),
        );
        preloadedFlatVideoPromises.set(resolvedFlatId, readinessPromise);
        return readinessPromise;
    }

    const videoElement = document.createElement('video');
    videoElement.preload = aggressive ? 'auto' : 'metadata';
    videoElement.muted = true;
    videoElement.playsInline = true;
    videoElement.defaultMuted = true;
    videoElement.crossOrigin = 'anonymous';
    videoElement.setAttribute('muted', '');
    videoElement.setAttribute('playsinline', '');
    videoElement.setAttribute('webkit-playsinline', 'true');
    videoElement.setAttribute('fetchpriority', aggressive ? 'high' : 'low');
    videoElement.src = flatVideoSrc(resolvedFlatId, 1);
    videoElement.load();

    preloadedFlatVideoElements.set(resolvedFlatId, videoElement);
    trimPreloadedFlatVideos();

    const readinessPromise = trackFlatVideoWarmState(
        resolvedFlatId,
        waitForPreloadedFlatVideo(videoElement, timeoutMs),
    );
    preloadedFlatVideoPromises.set(resolvedFlatId, readinessPromise);
    return readinessPromise;
}

export function floorPlanSrc(flatId) {
    return `${CDN}/images/flats/floorplans/Floor_Plan_${flatId}.avif`;
}

export const WALKTHROUGH_VIDEO = 'https://cdn.sthyra.com/AADHYA%20SERENE/videos/3-1-av1.mp4';

/* ── Build hydrated flat list ── */
export const flatsData = Object.entries(flatModelMap)
    .map(([flatId, { model: modelId, status }]) => {
        const m = modelMap.get(modelId); 
        const firstDigit = flatId[0];
        return {
            id: flatId,
            flat: flatId,
            model: modelId,
            type: m.type,
            area: m.area,
            balconies: m.balconies,
            facing: m.facing,
            status,
            floor: firstDigit === '0' ? 'G' : firstDigit,
            rooms: m.rooms,
        };
    })
    .sort((a, b) => a.flat.localeCompare(b.flat));


    // console.log("flatData : ",flatsData)

export function getFlatById(flatId) {
    return flatsData.find((f) => f.flat === flatId);
}
