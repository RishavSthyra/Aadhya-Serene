import {
    ADMIN_FEEDBACK_BUDGET_OPTIONS,
    ADMIN_FEEDBACK_CONFIGURATION_OPTIONS,
    ADMIN_FEEDBACK_LOCATION_MAX_LENGTH,
} from './admin-feedback';
import {
    CALL_DISPOSITION_ANSWERED,
    CALL_DISPOSITION_OPTIONS,
    normalizeAnsweredOutcomes,
    normalizeCallDisposition,
    normalizeCallbackDueAt,
    ANSWERED_CALL_OUTCOME_OPTIONS,
} from './lead-lifecycle';
import {
    SALES_LEAD_STATUS_OPTIONS,
    normalizeSalesLeadStatus,
} from './lead-status';

export const CALL_LOG_STATUS_OPTIONS = CALL_DISPOSITION_OPTIONS;
export const CALL_LOG_REMARK_MAX_LENGTH = 5000;

export function serializeCallLog(callLog, fallbackOutcome = '') {
    if (!callLog) return null;
    const iso = (value) => value?.toISOString?.() || value || '';
    return {
        id: String(callLog._id),
        callDate: callLog.callDate || '',
        callStatus: callLog.callOutcome || callLog.callStatus || fallbackOutcome,
        callOutcome: callLog.callOutcome || callLog.callStatus || fallbackOutcome,
        answeredOutcomes: Array.isArray(callLog.answeredOutcomes) ? callLog.answeredOutcomes : [],
        callbackDueAt: iso(callLog.callbackDueAt),
        callbackStatus: callLog.callbackStatus || 'none',
        leadStatus: callLog.leadStatus || '',
        remark: callLog.remark || '',
        sharedRequirements: Boolean(callLog.sharedRequirements),
        budget: callLog.budget || '',
        configuration: callLog.configuration || '',
        location: callLog.location || '',
        authorName: callLog.authorName || 'Sales Team',
        authorEmail: callLog.authorEmail || '',
        idempotencyKey: callLog.idempotencyKey || '',
        provider: callLog.provider || '',
        providerCallId: callLog.providerCallId || '',
        providerRequestId: callLog.providerRequestId || '',
        providerAgent: callLog.providerAgent || '',
        providerCaller: callLog.providerCaller || '',
        providerStatus: callLog.providerStatus || '',
        providerHangupCause: callLog.providerHangupCause || '',
        durationSeconds: Number.isFinite(callLog.durationSeconds) ? callLog.durationSeconds : null,
        ivrDurationSeconds: Number.isFinite(callLog.ivrDurationSeconds) ? callLog.ivrDurationSeconds : null,
        transferDurationSeconds: Number.isFinite(callLog.transferDurationSeconds) ? callLog.transferDurationSeconds : null,
        recordingUrl: callLog.recordingUrl || '',
        providerStartedAt: iso(callLog.providerStartedAt),
        providerEndedAt: iso(callLog.providerEndedAt),
        providerUpdatedAt: iso(callLog.providerUpdatedAt),
        createdAt: iso(callLog.createdAt),
        updatedAt: iso(callLog.updatedAt),
    };
}

export const CALL_LOG_ANSWERED_OUTCOME_OPTIONS = ANSWERED_CALL_OUTCOME_OPTIONS;
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
    const callOutcome = normalizeCallDisposition(input?.callOutcome || input?.callStatus);
    const remark = normalizeCallLogRemark(input?.remark);
    const answeredOutcomes = normalizeAnsweredOutcomes(input?.answeredOutcomes, callOutcome);
    const callbackDueAt = normalizeCallbackDueAt(input?.callbackDueAt);
    const sharedRequirements = normalizeCallLogSharedRequirements(input?.sharedRequirements);
    const budget = normalizeRequirementValue(input?.budget, CALL_LOG_BUDGET_OPTIONS);
    const configuration = normalizeRequirementValue(input?.configuration, CALL_LOG_CONFIGURATION_OPTIONS);
    const locationChoice = normalizeCallLogLocationChoice(input?.locationChoice);
    const location = normalizeCallLogLocation(input?.location);
    const fieldErrors = {};

    if (!callDate) {
        fieldErrors.callDate = 'Select a valid call date.';
    }

    if (!CALL_LOG_STATUS_OPTIONS.includes(callOutcome)) {
        fieldErrors.callOutcome = 'Select a valid call outcome.';
    }

    if (callOutcome === CALL_DISPOSITION_ANSWERED && !answeredOutcomes.length) {
        fieldErrors.answeredOutcomes = 'Select at least one answered-call outcome.';
    }

    if (callOutcome !== CALL_DISPOSITION_ANSWERED && (input?.answeredOutcomes || []).length) {
        fieldErrors.answeredOutcomes = 'Answered-call outcomes require an Answered call.';
    }

    if (input?.callbackDueAt && !callbackDueAt) {
        fieldErrors.callbackDueAt = 'Enter a valid callback date and time.';
    }

    if (answeredOutcomes.includes('callback_requested') && !callbackDueAt) {
        fieldErrors.callbackDueAt = 'Set a callback date and time.';
    }

    if (!remark) {
        fieldErrors.remark = 'Remark is required.';
    }

    if (remark.length > CALL_LOG_REMARK_MAX_LENGTH) {
        fieldErrors.remark = `Remark must be ${CALL_LOG_REMARK_MAX_LENGTH} characters or fewer.`;
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
    const callOutcome = normalizeCallDisposition(input?.callOutcome || input?.callStatus);
    const answeredOutcomes = normalizeAnsweredOutcomes(input?.answeredOutcomes, callOutcome);
    const callbackDueAt = normalizeCallbackDueAt(input?.callbackDueAt);
    const remark = normalizeCallLogRemark(input?.remark);
    const rawLeadStatus = String(input?.leadStatus || '').trim();
    const leadStatus = rawLeadStatus ? normalizeSalesLeadStatus(rawLeadStatus) : '';
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
        callStatus: callOutcome,
        callOutcome,
        answeredOutcomes,
        callbackDueAt,
        callbackStatus: answeredOutcomes.includes('callback_requested') ? 'pending' : 'none',
        idempotencyKey: String(input?.idempotencyKey || '').trim().slice(0, 160),
        leadStatus,
        remark,
        sharedRequirements: sharedRequirements && !allRequirementsNotMentioned,
        budget: allRequirementsNotMentioned ? '' : budget,
        configuration: allRequirementsNotMentioned ? '' : configuration,
        location: allRequirementsNotMentioned ? '' : location,
    };
}
