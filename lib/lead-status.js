export const LEAD_STATUS_ACTIVE = 'active';
export const LEAD_STATUS_DEAD = 'dead';
export const LEAD_STATUS_OPTIONS = [LEAD_STATUS_ACTIVE, LEAD_STATUS_DEAD];

export function normalizeLeadStatus(value) {
    return value === LEAD_STATUS_DEAD ? LEAD_STATUS_DEAD : LEAD_STATUS_ACTIVE;
}

export function isDeadLead(lead) {
    return normalizeLeadStatus(lead?.leadStatus) === LEAD_STATUS_DEAD;
}
