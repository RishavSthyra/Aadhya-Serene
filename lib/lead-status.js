export const LEAD_STATUS_ACTIVE = 'active';
export const LEAD_STATUS_DEAD = 'dead';
export const LEAD_STATUS_OPTIONS = [LEAD_STATUS_ACTIVE, LEAD_STATUS_DEAD];

export const SALES_LEAD_STATUS_COLD = 'cold';
export const SALES_LEAD_STATUS_WARM = 'warm';
export const SALES_LEAD_STATUS_HOT = 'hot';
export const SALES_LEAD_STATUS_DEAD = 'dead';
export const SALES_LEAD_STATUS_OPTIONS = [
    SALES_LEAD_STATUS_COLD,
    SALES_LEAD_STATUS_WARM,
    SALES_LEAD_STATUS_HOT,
    SALES_LEAD_STATUS_DEAD,
];

export function normalizeLeadStatus(value) {
    return value === LEAD_STATUS_DEAD ? LEAD_STATUS_DEAD : LEAD_STATUS_ACTIVE;
}

export function normalizeSalesLeadStatus(value) {
    const normalizedValue = String(value || '').trim().toLowerCase();

    return SALES_LEAD_STATUS_OPTIONS.includes(normalizedValue)
        ? normalizedValue
        : SALES_LEAD_STATUS_COLD;
}

export function getSalesLeadStatus(lead) {
    if (lead?.salesLeadStatus) {
        return normalizeSalesLeadStatus(lead.salesLeadStatus);
    }

    if (normalizeLeadStatus(lead?.leadStatus) === LEAD_STATUS_DEAD) {
        return SALES_LEAD_STATUS_DEAD;
    }

    return SALES_LEAD_STATUS_COLD;
}

export function isDeadLead(lead) {
    return getSalesLeadStatus(lead) === SALES_LEAD_STATUS_DEAD;
}
