export const SECONDARY_LEAD_EMAIL_SOURCES = Object.freeze([
    'ready_to_move_whatsapp_modal',
    'ready_to_move_landing',
    'contact_page',
]);

const SECONDARY_LEAD_EMAIL_SOURCE_SET = new Set(SECONDARY_LEAD_EMAIL_SOURCES);

export function isSecondaryLeadEmailSource(source) {
    return SECONDARY_LEAD_EMAIL_SOURCE_SET.has(String(source || '').trim().toLowerCase());
}
