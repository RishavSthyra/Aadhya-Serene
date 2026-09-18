import crypto from 'crypto';

const DEFAULT_C2C_URL = 'https://qkonnect.io/api/ctc-makecall-global.php';
const DEFAULT_CALL_PRIORITY = '2';
const DEFAULT_TIMEOUT_MS = 10000;
const DEFAULT_LOGIN_ID = '';
const WEBHOOK_SECRET_FIELDS = ['webhook_secret', 'webhookSecret', 'secret', 'api_key', 'apiKey'];
const WEBHOOK_CALL_ID_FIELDS = ['request_id', 'requestId', 'call_id', 'callId', 'id', 'unique_call_id', 'unique_call_token'];
const WEBHOOK_LEAD_ID_FIELDS = ['custom_param_2', 'customParam2', 'lead_id', 'leadId'];
const WEBHOOK_CALLER_FIELDS = ['caller', 'caller_number', 'callerNumber', 'customer_number', 'customerNumber', 'phone', 'mobile'];
const WEBHOOK_AGENT_FIELDS = ['agent', 'agent_id', 'agentId', 'login_id', 'loginId'];
const WEBHOOK_STATUS_FIELDS = ['call_status', 'callStatus', 'status', 'call_state', 'callState', 'disposition'];
const WEBHOOK_DURATION_FIELDS = ['total_call_duration', 'totalCallDuration', 'duration', 'call_duration', 'callDuration', 'total_duration'];
const WEBHOOK_IVR_DURATION_FIELDS = ['ivr_duration', 'ivrDuration'];
const WEBHOOK_TRANSFER_DURATION_FIELDS = ['call_transfer_duration', 'callTransferDuration', 'transfer_duration', 'transferDuration'];
const WEBHOOK_RECORDING_FIELDS = ['call_recording_url', 'callRecordingUrl', 'recording_url', 'recordingUrl', 'recording'];
const WEBHOOK_CAUSE_FIELDS = ['hangup_cause', 'hangupCause', 'cause', 'end_reason', 'endReason'];
const WEBHOOK_START_FIELDS = ['call_start_time', 'callStartTime', 'start_time', 'startTime', 'ringing_time', 'ringingTime'];
const WEBHOOK_END_FIELDS = ['call_end_time', 'callEndTime', 'end_time', 'endTime', 'completed_at', 'completedAt'];

export class DaffytelC2CError extends Error {
    constructor(message, { status = 502, code = 'provider_error', cause } = {}) {
        super(message, { cause });
        this.name = 'DaffytelC2CError';
        this.status = status;
        this.code = code;
    }
}

function readPositiveInteger(value, fallback) {
    const parsed = Number.parseInt(String(value || ''), 10);
    return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function digitsOnly(value) {
    return String(value || '').replace(/\D/g, '');
}

export function normalizeDaffytelAgent(value, label = 'agent identifier') {
    const agent = String(value || '').trim();
    const loginParts = agent.split('@');
    const isLoginId = loginParts.length === 2
        && loginParts[0].length > 0
        && /^[A-Za-z0-9._-]+$/.test(loginParts[0])
        && /^\d{10}$/.test(loginParts[1])
        && /^[6-9]/.test(loginParts[1]);

    if (isLoginId) return agent;
    return normalizeDaffytelMobile(agent, label);
}

export function normalizeDaffytelMobile(value, label = 'mobile number') {
    const digits = digitsOnly(value);
    const nationalDigits = digits.startsWith('91') && digits.length === 12
        ? digits.slice(2)
        : digits.startsWith('0') && digits.length === 11
            ? digits.slice(1)
            : digits;

    if (!/^\d{10}$/.test(nationalDigits) || !/^[6-9]/.test(nationalDigits)) {
        throw new DaffytelC2CError(`A valid ${label} is required.`, {
            status: 400,
            code: 'invalid_mobile',
        });
    }

    return nationalDigits;
}

function requiredEnv(name) {
    const value = String(process.env[name] || '').trim();
    if (!value) {
        throw new DaffytelC2CError('Click-to-call is not configured.', {
            status: 503,
            code: 'missing_configuration',
        });
    }
    return value;
}

function firstValue(payload, keys) {
    for (const key of keys) {
        const value = payload?.[key];
        if (value !== undefined && value !== null && String(value).trim()) {
            return String(value).trim();
        }
    }
    return '';
}

function normalizeWebhookDuration(value) {
    const parsed = Number.parseFloat(String(value || '').replace(',', '.'));
    return Number.isFinite(parsed) && parsed >= 0 ? Math.min(Math.round(parsed), 86400) : null;
}

function normalizeWebhookDate(value) {
    if (!value) return null;
    const numeric = Number(value);
    if (Number.isFinite(numeric) && numeric > 0) {
        const milliseconds = numeric < 100000000000 ? numeric * 1000 : numeric;
        const date = new Date(milliseconds);
        return Number.isNaN(date.getTime()) ? null : date;
    }
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
}

export function parseDaffytelCallStatusPayload(payload) {
    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return null;

    const providerStatus = firstValue(payload, WEBHOOK_STATUS_FIELDS).toLowerCase().replace(/[\s-]+/g, '_');
    if (!providerStatus) return null;
    const intermediateStatuses = new Set(['initiated', 'queued', 'ringing', 'trying', 'in_progress', 'connected_waiting']);
    const finalStatuses = new Set([
        'answered', 'connected', 'complete', 'completed', 'success', 'successful',
        'not_answered', 'no_answer', 'busy', 'missed', 'switched_off', 'switch_off',
        'phone_off', 'unreachable', 'invalid_number', 'invalid', 'wrong_number',
        'failed', 'failure', 'rejected', 'cancelled', 'canceled',
    ]);
    const status = ['answered', 'connected', 'complete', 'completed', 'success', 'successful'].includes(providerStatus)
        ? 'answered'
        : ['switched_off', 'switch_off', 'phone_off', 'unreachable'].includes(providerStatus)
            ? 'switched_off'
            : ['invalid_number', 'invalid', 'wrong_number'].includes(providerStatus)
                ? 'invalid_number'
                : ['not_answered', 'no_answer', 'busy', 'missed', 'failed', 'failure', 'rejected', 'cancelled', 'canceled'].includes(providerStatus)
                    ? 'not_answered'
                    : '';
    const isFinal = finalStatuses.has(providerStatus) && !intermediateStatuses.has(providerStatus);
    const callId = firstValue(payload, WEBHOOK_CALL_ID_FIELDS).slice(0, 160);
    const leadId = firstValue(payload, WEBHOOK_LEAD_ID_FIELDS).slice(0, 160);
    const caller = firstValue(payload, WEBHOOK_CALLER_FIELDS).slice(0, 80);
    const agent = firstValue(payload, WEBHOOK_AGENT_FIELDS).slice(0, 160);
    const durationSeconds = normalizeWebhookDuration(firstValue(payload, WEBHOOK_DURATION_FIELDS));
    const ivrDurationSeconds = normalizeWebhookDuration(firstValue(payload, WEBHOOK_IVR_DURATION_FIELDS));
    const transferDurationSeconds = normalizeWebhookDuration(firstValue(payload, WEBHOOK_TRANSFER_DURATION_FIELDS));
    const recordingUrl = firstValue(payload, WEBHOOK_RECORDING_FIELDS).slice(0, 2000);
    const providerHangupCause = firstValue(payload, WEBHOOK_CAUSE_FIELDS).slice(0, 240);
    const providerStartedAt = normalizeWebhookDate(firstValue(payload, WEBHOOK_START_FIELDS));
    const providerEndedAt = normalizeWebhookDate(firstValue(payload, WEBHOOK_END_FIELDS));

    if (!isFinal || !callId && !leadId && !caller) return null;
    return {
        provider: 'daffytel',
        providerCallId: callId,
        leadId,
        caller,
        agent,
        providerStatus,
        isFinal,
        callOutcome: status,
        durationSeconds,
        ivrDurationSeconds,
        transferDurationSeconds,
        recordingUrl,
        providerHangupCause,
        providerStartedAt,
        providerEndedAt,
        payload,
    };
}

export function normalizeDaffytelWebhookSecret(value) {
    return String(value || '').trim();
}

export function verifyDaffytelWebhookSecret(provided, expected) {
    const actualBuffer = Buffer.from(normalizeDaffytelWebhookSecret(provided));
    const expectedBuffer = Buffer.from(normalizeDaffytelWebhookSecret(expected));
    return actualBuffer.length > 0
        && actualBuffer.length === expectedBuffer.length
        && crypto.timingSafeEqual(actualBuffer, expectedBuffer);
}

export function getDaffytelWebhookSecretFromPayload(payload) {
    return firstValue(payload, WEBHOOK_SECRET_FIELDS);
}

function getProviderUrl() {
    const value = String(
        process.env.DAFFYTEL_C2C_URL
        || process.env.DAFFYTEL_C2C_API_URL
        || DEFAULT_C2C_URL,
    ).trim();
    try {
        const url = new URL(value);
        if (url.protocol !== 'https:') throw new Error('HTTPS required');
        return url;
    } catch (error) {
        throw new DaffytelC2CError('Click-to-call is not configured.', {
            status: 503,
            code: 'invalid_configuration',
            cause: error,
        });
    }
}

function getTimeoutMs() {
    return readPositiveInteger(process.env.DAFFYTEL_C2C_TIMEOUT_MS, DEFAULT_TIMEOUT_MS);
}

function getLoginId() {
    return String(process.env.DAFFYTEL_C2C_LOGIN_ID || DEFAULT_LOGIN_ID).trim();
}

function getAgentFromLoginId() {
    const loginId = getLoginId();
    const separatorIndex = loginId.lastIndexOf('@');
    return separatorIndex >= 0 ? loginId.slice(separatorIndex + 1).trim() : '';
}

function getResponseId(payload) {
    if (!payload || typeof payload !== 'object') return '';
    for (const key of ['request_id', 'requestId', 'call_id', 'callId', 'id']) {
        if (payload[key]) return String(payload[key]).slice(0, 160);
    }
    return '';
}

function getDaffytelResponseIds(payload) {
    if (!payload || typeof payload !== 'object') return { requestId: '', callId: '' };
    const requestId = ['request_id', 'requestId', 'providerRequestId']
        .map((key) => payload[key])
        .find((value) => value !== undefined && value !== null && String(value).trim());
    const callId = ['call_id', 'callId', 'id', 'providerCallId']
        .map((key) => payload[key])
        .find((value) => value !== undefined && value !== null && String(value).trim());
    return {
        requestId: String(requestId || '').slice(0, 160),
        callId: String(callId || '').slice(0, 160),
    };
}

function getResponseMessage(payload) {
    if (!payload || typeof payload !== 'object') return '';
    for (const key of ['message', 'msg', 'error', 'status_message']) {
        if (typeof payload[key] === 'string' && payload[key].trim()) return payload[key].trim().slice(0, 240);
    }
    return '';
}

function isProviderFailure(payload) {
    if (!payload || typeof payload !== 'object') return false;
    const status = typeof payload.status === 'string' ? payload.status.trim().toLowerCase() : '';
    return payload.success === false
        || ['error', 'fail', 'failed', 'failure', 'rejected'].includes(status)
        || Boolean(payload.error);
}

function isProviderSuccess(payload) {
    if (!payload || typeof payload !== 'object') return false;
    const status = typeof payload.status === 'string' ? payload.status.trim().toLowerCase() : '';
    return payload.success === true || ['ok', 'success', 'successful', 'accepted'].includes(status);
}

function getSafeProviderFailureMessage(providerMessage) {
    const normalizedMessage = String(providerMessage || '').toLowerCase();
    if (normalizedMessage.includes('api key')) {
        return 'The click-to-call provider rejected the configured API key.';
    }
    if (normalizedMessage.includes('agent')) {
        return 'The configured agent number is not registered with the click-to-call provider.';
    }
    if (normalizedMessage.includes('caller') || normalizedMessage.includes('customer')) {
        return 'The lead phone number was rejected by the click-to-call provider.';
    }
    return 'The call could not be started. Please try again.';
}

export function buildDaffytelC2CUrl({ agent, caller, extension = '', customParam1 = 'NA', customParam2 = 'NA', customParam3 = 'NA' }) {
    const apiKey = requiredEnv('DAFFYTEL_C2C_API_KEY');
    const url = getProviderUrl();
    const params = new URLSearchParams({
        api_key: apiKey,
        call_priority: DEFAULT_CALL_PRIORITY,
        agent: normalizeDaffytelAgent(agent, 'agent identifier'),
        caller: normalizeDaffytelMobile(caller, 'lead mobile number'),
        custom_param_1: String(customParam1 || 'NA').slice(0, 120),
        custom_param_2: String(customParam2 || 'NA').slice(0, 120),
        custom_param_3: String(customParam3 || 'NA').slice(0, 120),
    });

    if (extension) {
        const normalizedExtension = digitsOnly(extension);
        if (!/^\d+$/.test(normalizedExtension)) {
            throw new DaffytelC2CError('The Daffytel extension must contain only numbers.', {
                status: 400,
                code: 'invalid_extension',
            });
        }
        params.set('extension', normalizedExtension.slice(0, 40));
    }

    url.search = params.toString();
    return url;
}

export async function initiateDaffytelC2C(input) {
    const url = buildDaffytelC2CUrl(input);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), getTimeoutMs());

    try {
        const response = await fetch(url, {
            method: 'GET',
            cache: 'no-store',
            signal: controller.signal,
        });
        const rawBody = await response.text();
        let payload = null;
        try {
            payload = rawBody ? JSON.parse(rawBody) : null;
        } catch {
            payload = null;
        }

        if (!response.ok) {
            throw new DaffytelC2CError('The call could not be started. Please try again.', {
                status: 502,
                code: 'provider_rejected',
            });
        }

        const providerMessage = getResponseMessage(payload);
        if (isProviderFailure(payload)) {
            throw new DaffytelC2CError(getSafeProviderFailureMessage(providerMessage), {
                status: 502,
                code: 'provider_rejected',
                cause: providerMessage ? new Error(providerMessage) : undefined,
            });
        }

        // Qkonnect can return HTTP 200 with different success payload shapes.
        // Treat any 2xx response without an explicit failure as accepted; an
        // explicit { status: 'Fail' } or error field is handled above.
        const providerIds = getDaffytelResponseIds(payload);
        return {
            accepted: true,
            providerRequestId: providerIds.requestId || providerIds.callId,
            providerCallId: providerIds.callId,
        };
    } catch (error) {
        if (error instanceof DaffytelC2CError) throw error;
        if (error?.name === 'AbortError') {
            throw new DaffytelC2CError('The call provider took too long to respond.', {
                status: 504,
                code: 'provider_timeout',
                cause: error,
            });
        }
        throw new DaffytelC2CError('The call could not be started. Please try again.', {
            status: 502,
            code: 'provider_unavailable',
            cause: error,
        });
    } finally {
        clearTimeout(timeoutId);
    }
}

export function getDefaultDaffytelAgent() {
    const configuredAgent = String(process.env.DAFFYTEL_DEFAULT_AGENT || '').trim();
    if (configuredAgent) return configuredAgent;

    const loginId = getLoginId();
    if (loginId) return loginId;

    const configuredMobile = String(process.env.DAFFYTEL_DEFAULT_AGENT_MOBILE || '').trim();
    return configuredMobile;
}
