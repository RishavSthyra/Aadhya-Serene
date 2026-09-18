const DEFAULT_C2C_URL = 'https://qkonnect.io/api/ctc-makecall-global.php';
const DEFAULT_CALL_PRIORITY = '2';
const DEFAULT_TIMEOUT_MS = 10000;
const DEFAULT_LOGIN_ID = '';

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
        return {
            accepted: true,
            providerRequestId: getResponseId(payload),
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
    return configuredMobile || '8967871326';
}
