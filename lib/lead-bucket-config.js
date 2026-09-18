import {
    DEFAULT_LEAD_BUCKET_CONFIG,
    LEAD_BUCKET_CALLBACK_REQUESTED,
    LEAD_BUCKET_NEW,
    LEAD_BUCKET_SITE_VISIT_BOOKED,
} from './lead-lifecycle';

const VALID_KEYS = [
    LEAD_BUCKET_NEW,
    LEAD_BUCKET_SITE_VISIT_BOOKED,
    LEAD_BUCKET_CALLBACK_REQUESTED,
];
const VALID_COLORS = ['slate', 'emerald', 'violet', 'blue', 'amber', 'rose'];
const LABEL_MAX_LENGTH = 80;
const DESCRIPTION_MAX_LENGTH = 180;

function normalizeText(value, fallback, maxLength) {
    const normalized = String(value || '').trim().slice(0, maxLength);
    return normalized || fallback;
}

export function normalizeLeadBucketConfig(value) {
    if (!Array.isArray(value)) return DEFAULT_LEAD_BUCKET_CONFIG.map((item) => ({ ...item }));

    const byKey = new Map(value.map((item) => [String(item?.key || '').trim(), item]));
    const normalized = VALID_KEYS.map((key, index) => {
        const fallback = DEFAULT_LEAD_BUCKET_CONFIG.find((item) => item.key === key);
        const item = byKey.get(key) || {};
        return {
            key,
            label: normalizeText(item.label, fallback.label, LABEL_MAX_LENGTH),
            description: normalizeText(item.description, fallback.description, DESCRIPTION_MAX_LENGTH),
            order: Number.isInteger(item.order) && item.order > 0 ? item.order : index + 1,
            enabled: item.enabled !== false,
            color: VALID_COLORS.includes(item.color) ? item.color : fallback.color,
        };
    });

    return normalized.sort((left, right) => left.order - right.order || VALID_KEYS.indexOf(left.key) - VALID_KEYS.indexOf(right.key));
}

export function isValidLeadBucketConfig(value) {
    if (!Array.isArray(value) || value.length !== VALID_KEYS.length) return false;
    const keys = value.map((item) => item?.key);
    return VALID_KEYS.every((key) => keys.includes(key)) && value.every((item) => (
        typeof item?.label === 'string'
        && item.label.trim().length > 0
        && item.label.length <= LABEL_MAX_LENGTH
        && typeof item?.description === 'string'
        && item.description.length <= DESCRIPTION_MAX_LENGTH
        && Number.isInteger(item.order)
        && item.order > 0
        && typeof item.enabled === 'boolean'
        && VALID_COLORS.includes(item.color)
    ));
}

export function getDefaultLeadBucketConfig() {
    return DEFAULT_LEAD_BUCKET_CONFIG.map((item) => ({ ...item }));
}

export { VALID_KEYS as LEAD_BUCKET_CONFIG_KEYS, VALID_COLORS as LEAD_BUCKET_CONFIG_COLORS };
