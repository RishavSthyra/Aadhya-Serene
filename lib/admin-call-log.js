export const CALL_LOG_STATUS_OPTIONS = ['answered', 'not_answered'];
export const CALL_LOG_REMARK_MAX_LENGTH = 5000;

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

export function getCallLogFieldErrors(input) {
    const callDate = normalizeCallLogDate(input?.callDate);
    const callStatus = collapseWhitespace(input?.callStatus);
    const remark = normalizeCallLogRemark(input?.remark);
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

    return fieldErrors;
}

export function normalizeCallLogInput(input) {
    const callDate = normalizeCallLogDate(input?.callDate);
    const callStatus = collapseWhitespace(input?.callStatus);
    const remark = normalizeCallLogRemark(input?.remark);

    return {
        callDate,
        callStatus,
        remark,
    };
}
