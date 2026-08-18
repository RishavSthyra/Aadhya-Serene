import {
    ADMIN_FEEDBACK_BUDGET_OPTIONS,
    ADMIN_FEEDBACK_CONFIGURATION_OPTIONS,
    ADMIN_FEEDBACK_LOCATION_MAX_LENGTH,
} from './admin-feedback';
import {
    SALES_LEAD_STATUS_OPTIONS,
    normalizeSalesLeadStatus,
} from './lead-status';

export const CALL_LOG_STATUS_OPTIONS = ['answered', 'not_answered'];
export const CALL_LOG_REMARK_MAX_LENGTH = 5000;
export const CALL_LOG_REQUIREMENT_NOT_MENTIONED = 'not_mentioned';
export const CALL_LOG_LOCATION_CHOICE_MENTIONED = 'mentioned';
export const CALL_LOG_LOCATION_CHOICE_OPTIONS = [
    CALL_LOG_REQUIREMENT_NOT_MENTIONED,
    CALL_LOG_LOCATION_CHOICE_MENTIONED,
];
export const CALL_LOG_BUDGET_OPTIONS = [
    CALL_LOG_REQUIREMENT_NOT_MENTIONED,
    ...ADMIN_FEEDBACK_BUDGET_OPTIONS,
];
export const CALL_LOG_CONFIGURATION_OPTIONS = [
    CALL_LOG_REQUIREMENT_NOT_MENTIONED,
    ...ADMIN_FEEDBACK_CONFIGURATION_OPTIONS,
];

function collapseWhitespace(value) {
    return String(value || '').replace(/\s+/g, ' ').trim();
}

export function isValidCallLogDate(value) {
    return /^\d{4}-\d{2}-\d{2}$/.test(String(value || ''));
}

export function normalizeCallLogDate(value) {
    return isValidCallLogDate(value) ? String(value) : '';
}

export function normalizeCallLogRemark(value) {
    return String(value || '').trim().slice(0, CALL_LOG_REMARK_MAX_LENGTH);
}

export function normalizeCallLogSharedRequirements(value) {
    return Boolean(value);
}

export function normalizeCallLogLocationChoice(value) {
    return CALL_LOG_LOCATION_CHOICE_OPTIONS.includes(String(value || ''))
        ? String(value)
        : CALL_LOG_REQUIREMENT_NOT_MENTIONED;
}

export function normalizeCallLogLocation(value) {
    return collapseWhitespace(value).slice(0, ADMIN_FEEDBACK_LOCATION_MAX_LENGTH);
}

function normalizeRequirementValue(value, allowedOptions) {
    return allowedOptions.includes(String(value || ''))
        ? String(value)
        : CALL_LOG_REQUIREMENT_NOT_MENTIONED;
}

export function getCallLogFieldErrors(input) {
    const callDate = normalizeCallLogDate(input?.callDate);
    const callStatus = collapseWhitespace(input?.callStatus);
    const remark = normalizeCallLogRemark(input?.remark);
    const leadStatus = normalizeSalesLeadStatus(input?.leadStatus);
    const sharedRequirements = normalizeCallLogSharedRequirements(input?.sharedRequirements);
    const budget = normalizeRequirementValue(input?.budget, CALL_LOG_BUDGET_OPTIONS);
    const configuration = normalizeRequirementValue(input?.configuration, CALL_LOG_CONFIGURATION_OPTIONS);
    const locationChoice = normalizeCallLogLocationChoice(input?.locationChoice);
    const location = normalizeCallLogLocation(input?.location);
    const fieldErrors = {};

    if (!callDate) {
        fieldErrors.callDate = 'Select a valid call date.';
    }

    if (!CALL_LOG_STATUS_OPTIONS.includes(callStatus)) {
        fieldErrors.callStatus = 'Select a valid call status.';
    }

    if (!remark) {
        fieldErrors.remark = 'Remark is required.';
    }

    if (remark.length > CALL_LOG_REMARK_MAX_LENGTH) {
        fieldErrors.remark = `Remark must be ${CALL_LOG_REMARK_MAX_LENGTH} characters or fewer.`;
    }

    if (!SALES_LEAD_STATUS_OPTIONS.includes(String(input?.leadStatus || '').trim().toLowerCase())) {
        fieldErrors.leadStatus = 'Select a valid lead status.';
    }

    if (sharedRequirements) {
        if (!CALL_LOG_BUDGET_OPTIONS.includes(budget)) {
            fieldErrors.budget = 'Select a valid budget value.';
        }

        if (!CALL_LOG_CONFIGURATION_OPTIONS.includes(configuration)) {
            fieldErrors.configuration = 'Select a valid configuration value.';
        }

        if (!CALL_LOG_LOCATION_CHOICE_OPTIONS.includes(locationChoice)) {
            fieldErrors.locationChoice = 'Select a valid location value.';
        }

        if (
            locationChoice === CALL_LOG_LOCATION_CHOICE_MENTIONED
            && !location
        ) {
            fieldErrors.location = 'Enter the customer location or choose Not mentioned.';
        }

        if (String(input?.location || '').trim().length > ADMIN_FEEDBACK_LOCATION_MAX_LENGTH) {
            fieldErrors.location = `Location must be ${ADMIN_FEEDBACK_LOCATION_MAX_LENGTH} characters or fewer.`;
        }
    }

    return fieldErrors;
}

export function normalizeCallLogInput(input) {
    const callDate = normalizeCallLogDate(input?.callDate);
    const callStatus = collapseWhitespace(input?.callStatus);
    const remark = normalizeCallLogRemark(input?.remark);
    const leadStatus = normalizeSalesLeadStatus(input?.leadStatus);
    const sharedRequirements = normalizeCallLogSharedRequirements(input?.sharedRequirements);
    const budget = sharedRequirements
        ? normalizeRequirementValue(input?.budget, CALL_LOG_BUDGET_OPTIONS)
        : '';
    const configuration = sharedRequirements
        ? normalizeRequirementValue(input?.configuration, CALL_LOG_CONFIGURATION_OPTIONS)
        : '';
    const locationChoice = sharedRequirements
        ? normalizeCallLogLocationChoice(input?.locationChoice)
        : CALL_LOG_REQUIREMENT_NOT_MENTIONED;
    const location = sharedRequirements
        ? (locationChoice === CALL_LOG_LOCATION_CHOICE_MENTIONED
            ? normalizeCallLogLocation(input?.location)
            : CALL_LOG_REQUIREMENT_NOT_MENTIONED)
        : '';

    const allRequirementsNotMentioned = sharedRequirements
        && budget === CALL_LOG_REQUIREMENT_NOT_MENTIONED
        && configuration === CALL_LOG_REQUIREMENT_NOT_MENTIONED
        && locationChoice === CALL_LOG_REQUIREMENT_NOT_MENTIONED;

    return {
        callDate,
        callStatus,
        leadStatus,
        remark,
        sharedRequirements: sharedRequirements && !allRequirementsNotMentioned,
        budget: allRequirementsNotMentioned ? '' : budget,
        configuration: allRequirementsNotMentioned ? '' : configuration,
        location: allRequirementsNotMentioned ? '' : location,
    };
}
