export const CALL_DISPOSITION_ANSWERED = 'answered';
export const CALL_DISPOSITION_NOT_ANSWERED = 'not_answered';
export const CALL_DISPOSITION_SWITCHED_OFF = 'switched_off';
export const CALL_DISPOSITION_INVALID_NUMBER = 'invalid_number';

export const CALL_DISPOSITION_OPTIONS = [
    CALL_DISPOSITION_ANSWERED,
    CALL_DISPOSITION_NOT_ANSWERED,
    CALL_DISPOSITION_SWITCHED_OFF,
    CALL_DISPOSITION_INVALID_NUMBER,
];

export const CALL_DISPOSITION_LABELS = {
    [CALL_DISPOSITION_ANSWERED]: 'Answered',
    [CALL_DISPOSITION_NOT_ANSWERED]: 'Not answered',
    [CALL_DISPOSITION_SWITCHED_OFF]: 'Switched off',
    [CALL_DISPOSITION_INVALID_NUMBER]: 'Invalid number',
};

export const ANSWERED_OUTCOME_DETAILS_SHARED = 'details_shared';
export const ANSWERED_OUTCOME_SITE_VISIT_BOOKED = 'site_visit_booked';
export const ANSWERED_OUTCOME_CALLBACK_REQUESTED = 'callback_requested';

export const ANSWERED_CALL_OUTCOME_OPTIONS = [
    ANSWERED_OUTCOME_DETAILS_SHARED,
    ANSWERED_OUTCOME_SITE_VISIT_BOOKED,
    ANSWERED_OUTCOME_CALLBACK_REQUESTED,
];

export const ANSWERED_CALL_OUTCOME_LABELS = {
    [ANSWERED_OUTCOME_DETAILS_SHARED]: 'Details shared',
    [ANSWERED_OUTCOME_SITE_VISIT_BOOKED]: 'Site visit booked',
    [ANSWERED_OUTCOME_CALLBACK_REQUESTED]: 'Asked to call back',
};

export const LEAD_BUCKET_NEW = 'new_lead';
export const LEAD_BUCKET_SITE_VISIT_BOOKED = 'site_visit_booked';
export const LEAD_BUCKET_CALLBACK_REQUESTED = 'callback_requested';
export const LEAD_BUCKET_DEAD = 'dead';

export const LEAD_STAGE_NEW = 'new_lead';
export const LEAD_STAGE_NOT_ANSWERED = 'not_answered';
export const LEAD_STAGE_ANSWERED = 'answered';
export const LEAD_STAGE_QUALIFIED = 'qualified';
export const LEAD_STAGE_SITE_VISIT_BOOKED = 'site_visit_booked';
export const LEAD_STAGE_SITE_VISIT_DONE = 'site_visit_done';
export const LEAD_STAGE_BOOKING_DONE = 'booking_done';
export const LEAD_STAGE_WON = 'won';
export const LEAD_STAGE_DEAD = 'dead';

// Kept only so historical lifecycle events can still be read as Dead. New
// lifecycle actions must use LEAD_STAGE_DEAD instead.
export const LEAD_STAGE_LOST = 'lost';
export const LEAD_STAGE_SITE_VISIT_NO_SHOW = 'site_visit_no_show';

export const LEAD_STAGE_OPTIONS = [
    LEAD_STAGE_NEW,
    LEAD_STAGE_NOT_ANSWERED,
    LEAD_STAGE_ANSWERED,
    LEAD_STAGE_QUALIFIED,
    LEAD_STAGE_SITE_VISIT_BOOKED,
    LEAD_STAGE_SITE_VISIT_DONE,
    LEAD_STAGE_BOOKING_DONE,
    LEAD_STAGE_WON,
    LEAD_STAGE_DEAD,
];

export const LEAD_STAGE_LABELS = {
    [LEAD_STAGE_NEW]: 'New Lead',
    [LEAD_STAGE_NOT_ANSWERED]: 'Not Answered',
    [LEAD_STAGE_ANSWERED]: 'Answered',
    [LEAD_STAGE_QUALIFIED]: 'Qualified',
    [LEAD_STAGE_SITE_VISIT_BOOKED]: 'Site Visit Booked',
    [LEAD_STAGE_SITE_VISIT_DONE]: 'Site Visit Completed',
    [LEAD_STAGE_BOOKING_DONE]: 'Booking Done',
    [LEAD_STAGE_WON]: 'Won',
    [LEAD_STAGE_DEAD]: 'Dead',
};

export const LEAD_STAGE_NEXT = {
    [LEAD_STAGE_NEW]: [LEAD_STAGE_NOT_ANSWERED, LEAD_STAGE_ANSWERED, LEAD_STAGE_DEAD],
    [LEAD_STAGE_NOT_ANSWERED]: [LEAD_STAGE_ANSWERED, LEAD_STAGE_DEAD],
    [LEAD_STAGE_ANSWERED]: [LEAD_STAGE_QUALIFIED, LEAD_STAGE_DEAD],
    [LEAD_STAGE_QUALIFIED]: [LEAD_STAGE_SITE_VISIT_BOOKED, LEAD_STAGE_DEAD],
    [LEAD_STAGE_SITE_VISIT_BOOKED]: [LEAD_STAGE_SITE_VISIT_DONE],
    [LEAD_STAGE_SITE_VISIT_DONE]: [LEAD_STAGE_BOOKING_DONE, LEAD_STAGE_DEAD],
    [LEAD_STAGE_BOOKING_DONE]: [LEAD_STAGE_WON, LEAD_STAGE_DEAD],
    [LEAD_STAGE_WON]: [],
    [LEAD_STAGE_DEAD]: [],
};

const LEGACY_LEAD_STAGE_TYPES = [LEAD_STAGE_LOST, LEAD_STAGE_SITE_VISIT_NO_SHOW];

function normalizeLifecycleStageType(type) {
    if (type === LEAD_STAGE_LOST) return LEAD_STAGE_DEAD;
    if (type === LEAD_STAGE_SITE_VISIT_NO_SHOW) return LEAD_STAGE_SITE_VISIT_BOOKED;
    return type;
}

const LEAD_STAGE_EVENT_TYPES = [...LEAD_STAGE_OPTIONS, ...LEGACY_LEAD_STAGE_TYPES];

export const LEAD_STAGE_CONFIG = LEAD_STAGE_OPTIONS.map((key, index) => ({
    key,
    label: LEAD_STAGE_LABELS[key],
    order: index + 1,
    className: key === LEAD_STAGE_WON
        ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
        : key === LEAD_STAGE_DEAD
            ? 'border-red-200 bg-red-50 text-red-700'
            : key === LEAD_STAGE_SITE_VISIT_BOOKED || key === LEAD_STAGE_SITE_VISIT_DONE
                ? 'border-violet-200 bg-violet-50 text-violet-700'
                : 'border-[#111]/10 bg-[#fafafa] text-[#374151]',
}));

export function canAdvanceLeadStage(currentStage, nextStage) {
    return LEAD_STAGE_NEXT[currentStage]?.includes(nextStage) || false;
}

export const LEAD_BUCKET_OPTIONS = [
    LEAD_BUCKET_NEW,
    LEAD_BUCKET_SITE_VISIT_BOOKED,
    LEAD_BUCKET_CALLBACK_REQUESTED,
];

export const CALLBACK_STATUS_NONE = 'none';
export const CALLBACK_STATUS_PENDING = 'pending';
export const CALLBACK_STATUS_COMPLETED = 'completed';
export const CALLBACK_STATUS_CANCELLED = 'cancelled';
export const CALLBACK_STATUS_OPTIONS = [
    CALLBACK_STATUS_NONE,
    CALLBACK_STATUS_PENDING,
    CALLBACK_STATUS_COMPLETED,
    CALLBACK_STATUS_CANCELLED,
];

export const DEFAULT_LEAD_BUCKET_CONFIG = [
    {
        key: LEAD_BUCKET_NEW,
        label: 'New Leads',
        description: 'Leads not yet moved to a qualified outcome.',
        order: 1,
        enabled: true,
        color: 'slate',
    },
    {
        key: LEAD_BUCKET_SITE_VISIT_BOOKED,
        label: 'Site Visit Booked',
        description: 'Customers with a booked site visit.',
        order: 2,
        enabled: true,
        color: 'emerald',
    },
    {
        key: LEAD_BUCKET_CALLBACK_REQUESTED,
        label: 'Asked for Callback',
        description: 'Customers who asked the team to call back.',
        order: 3,
        enabled: true,
        color: 'violet',
    },
];

export function normalizeCallDisposition(value) {
    const normalized = String(value || '').trim().toLowerCase();
    return CALL_DISPOSITION_OPTIONS.includes(normalized) ? normalized : '';
}

export function normalizeAnsweredOutcomes(value, callDisposition = '') {
    if (normalizeCallDisposition(callDisposition) !== CALL_DISPOSITION_ANSWERED) {
        return [];
    }

    const values = Array.isArray(value) ? value : value ? [value] : [];
    return [...new Set(values
        .map((item) => String(item || '').trim().toLowerCase())
        .filter((item) => ANSWERED_CALL_OUTCOME_OPTIONS.includes(item)))];
}

export function isValidCallbackDueAt(value) {
    if (!value) return false;
    const date = new Date(value);
    return !Number.isNaN(date.getTime());
}

export function normalizeCallbackDueAt(value) {
    if (!isValidCallbackDueAt(value)) return '';
    return new Date(value).toISOString();
}

export function getOriginalLeadDate(recordOrRecords) {
    const records = Array.isArray(recordOrRecords) ? recordOrRecords : [recordOrRecords];
    const dateCandidates = [
        records.map((record) => record?.createdAt),
        records.map((record) => record?.originalSubmittedAt),
        records.map((record) => record?.metadata?.externalLead?.submittedAt),
    ];

    for (const candidates of dateCandidates) {
        const validDates = candidates
            .filter(Boolean)
            .map((candidate) => new Date(candidate))
            .filter((date) => !Number.isNaN(date.getTime()))
            .sort((left, right) => left.getTime() - right.getTime());
        if (validDates.length) return validDates[0].toISOString();
    }

    return '';
}

export function normalizeLeadBucket(value) {
    const normalized = String(value || '').trim().toLowerCase();
    return LEAD_BUCKET_OPTIONS.includes(normalized) ? normalized : LEAD_BUCKET_NEW;
}

export function isCallbackDue(callback, now = new Date()) {
    if (callback?.status !== CALLBACK_STATUS_PENDING || !callback?.dueAt) {
        return false;
    }

    const dueAt = new Date(callback.dueAt);
    return !Number.isNaN(dueAt.getTime()) && dueAt.getTime() <= new Date(now).getTime();
}

function eventDate(value) {
    const candidate = value && typeof value === 'object' && 'occurredAt' in value
        ? value.occurredAt
        : value;
    const date = new Date(candidate || 0);
    return Number.isNaN(date.getTime()) ? 0 : date.getTime();
}

function safeIso(value) {
    if (!value) return '';
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? '' : date.toISOString();
}

function eventKey(event) {
    return String(event?.eventKey || '').trim();
}

export function deriveLeadLifecycle(records = []) {
    const events = [];
    const explicitStates = [];
    let hasLegacyDead = false;
    let whatsappCallbackRequested = false;

    for (const record of records) {
        if (record?.leadStatus === 'dead' || record?.salesLeadStatus === 'dead') {
            hasLegacyDead = true;
        }

        if (record?.metadata?.whatsappJourney?.callbackRequested) {
            whatsappCallbackRequested = true;
        }

        if (record?.leadLifecycle) {
            explicitStates.push(record.leadLifecycle);
            for (const event of record.leadLifecycle.events || []) {
                events.push(event);
            }
        }

        for (const callLog of record?.callLogs || []) {
            const outcomes = normalizeAnsweredOutcomes(
                callLog.answeredOutcomes,
                callLog.callOutcome || callLog.callStatus,
            );
            const occurredAt = callLog.createdAt || callLog.callDate;
            const sourceKey = callLog.idempotencyKey || String(callLog._id || '');
            for (const outcome of outcomes) {
                events.push({
                    eventKey: sourceKey ? `call:${sourceKey}:${outcome}` : '',
                    type: outcome,
                    occurredAt,
                    callbackDueAt: callLog.callbackDueAt,
                    callbackStatus: callLog.callbackStatus,
                });
            }
        }
    }

    events.sort((left, right) => eventDate(left) - eventDate(right));

    const lifecycle = {
        bucket: hasLegacyDead ? LEAD_BUCKET_DEAD : LEAD_BUCKET_NEW,
        callback: {
            status: CALLBACK_STATUS_NONE,
            dueAt: '',
            updatedAt: '',
        },
        siteVisitBookedAt: '',
        events: [],
    };

    const seenEventKeys = new Set();
    for (const event of events) {
        const key = eventKey(event);
        if (key && seenEventKeys.has(key)) continue;
        if (key) seenEventKeys.add(key);
        lifecycle.events.push(event);

        const normalizedEventType = normalizeLifecycleStageType(event.type);

        if (normalizedEventType === LEAD_STAGE_DEAD) {
            lifecycle.bucket = LEAD_BUCKET_DEAD;
        }

        if (event.type === ANSWERED_OUTCOME_SITE_VISIT_BOOKED) {
            lifecycle.bucket = LEAD_BUCKET_SITE_VISIT_BOOKED;
            lifecycle.siteVisitBookedAt = event.occurredAt || lifecycle.siteVisitBookedAt;
        }

        if (event.type === ANSWERED_OUTCOME_CALLBACK_REQUESTED || event.type === 'whatsapp_callback_requested') {
            lifecycle.callback = {
                status: event.callbackStatus || CALLBACK_STATUS_PENDING,
                dueAt: event.callbackDueAt || '',
                updatedAt: event.occurredAt || '',
            };
            if (lifecycle.bucket !== LEAD_BUCKET_SITE_VISIT_BOOKED && lifecycle.callback.status === CALLBACK_STATUS_PENDING) {
                lifecycle.bucket = LEAD_BUCKET_CALLBACK_REQUESTED;
            }
        }

        if (
            event.type === 'callback_completed'
            || event.type === 'callback_cancelled'
            || event.type === 'callback_rescheduled'
        ) {
            const isRescheduled = event.type === 'callback_rescheduled';
            lifecycle.callback = {
                status: isRescheduled
                    ? CALLBACK_STATUS_PENDING
                    : event.type === 'callback_completed'
                        ? CALLBACK_STATUS_COMPLETED
                        : CALLBACK_STATUS_CANCELLED,
                dueAt: safeIso(event.callbackDueAt) || lifecycle.callback.dueAt || '',
                updatedAt: safeIso(event.occurredAt) || lifecycle.callback.updatedAt || '',
            };
            if (isRescheduled) {
                if (lifecycle.bucket !== LEAD_BUCKET_SITE_VISIT_BOOKED) {
                    lifecycle.bucket = LEAD_BUCKET_CALLBACK_REQUESTED;
                }
            } else if (lifecycle.bucket === LEAD_BUCKET_CALLBACK_REQUESTED) {
                lifecycle.bucket = lifecycle.siteVisitBookedAt
                    ? LEAD_BUCKET_SITE_VISIT_BOOKED
                    : LEAD_BUCKET_NEW;
            }
        }
    }

    const latestExplicitState = explicitStates
        .filter((state) => state?.stateUpdatedAt || state?.updatedAt || state?.bucket)
        .sort((left, right) => {
            const leftDate = left?.stateUpdatedAt || left?.updatedAt || 0;
            const rightDate = right?.stateUpdatedAt || right?.updatedAt || 0;
            return eventDate(rightDate) - eventDate(leftDate);
        })[0];

    if (latestExplicitState) {
        if (latestExplicitState.bucket === LEAD_BUCKET_DEAD) {
            lifecycle.bucket = LEAD_BUCKET_DEAD;
        } else if (latestExplicitState.bucket === LEAD_BUCKET_SITE_VISIT_BOOKED) {
            lifecycle.bucket = LEAD_BUCKET_SITE_VISIT_BOOKED;
        } else if (latestExplicitState.bucket === LEAD_BUCKET_CALLBACK_REQUESTED
            && lifecycle.bucket !== LEAD_BUCKET_SITE_VISIT_BOOKED) {
            lifecycle.bucket = LEAD_BUCKET_CALLBACK_REQUESTED;
        } else if (latestExplicitState.bucket === LEAD_BUCKET_NEW) {
            lifecycle.bucket = LEAD_BUCKET_NEW;
        }

        if (latestExplicitState.callbackStatus && latestExplicitState.callbackStatus !== CALLBACK_STATUS_NONE) {
            lifecycle.callback = {
                status: latestExplicitState.callbackStatus,
                dueAt: safeIso(latestExplicitState.callbackDueAt) || lifecycle.callback.dueAt,
                updatedAt: safeIso(latestExplicitState.callbackUpdatedAt) || lifecycle.callback.updatedAt,
            };
        }
    }

    if (
        lifecycle.bucket === LEAD_BUCKET_NEW
        && whatsappCallbackRequested
        && lifecycle.callback.status === CALLBACK_STATUS_NONE
    ) {
        lifecycle.bucket = LEAD_BUCKET_CALLBACK_REQUESTED;
    }

    if (hasLegacyDead) {
        lifecycle.bucket = LEAD_BUCKET_DEAD;
    }

    lifecycle.callback.dueAt = lifecycle.callback.dueAt || '';
    lifecycle.callback.updatedAt = lifecycle.callback.updatedAt || '';
    lifecycle.siteVisitBookedAt = lifecycle.siteVisitBookedAt || '';
    return lifecycle;
}

export function hasPendingCallback(lifecycle = {}, records = []) {
    if (lifecycle?.callback?.status === CALLBACK_STATUS_PENDING) return true;
    if (lifecycle?.callback?.status && lifecycle.callback.status !== CALLBACK_STATUS_NONE) return false;
    if (lifecycle?.callbackStatus === CALLBACK_STATUS_PENDING) return true;
    if (lifecycle?.callbackStatus && lifecycle.callbackStatus !== CALLBACK_STATUS_NONE) return false;

    return records.some((record) => (
        record?.callLogs?.some((callLog) => (
            (callLog?.answeredOutcomes || []).includes(ANSWERED_OUTCOME_CALLBACK_REQUESTED)
            && (!callLog.callbackStatus || callLog.callbackStatus === CALLBACK_STATUS_PENDING)
        ))
    ));
}

export function getLeadOperationalBucket(lifecycle = {}, records = []) {
    if (lifecycle?.bucket === LEAD_BUCKET_DEAD) {
        return LEAD_BUCKET_DEAD;
    }
    if (hasPendingCallback(lifecycle, records)) {
        return LEAD_BUCKET_CALLBACK_REQUESTED;
    }
    return LEAD_BUCKET_NEW;
}

function latestEventOfType(events, types) {
    return [...(events || [])]
        .filter((event) => (
            types.includes(event?.type)
            && (!event?.source || event.source === 'admin_lifecycle')
        ))
        .sort((left, right) => eventDate(right) - eventDate(left))[0] || null;
}

export function getLeadStage(lifecycle = {}, records = []) {
    const events = lifecycle?.events || [];
    const callLogs = records.flatMap((record) => record?.callLogs || []);
    const hasDeadStatus = records.some((record) => (
        record?.leadStatus === 'dead' || record?.salesLeadStatus === 'dead'
    ));
    const latestStageEvent = latestEventOfType(events, LEAD_STAGE_EVENT_TYPES);
    if (latestStageEvent?.type) return normalizeLifecycleStageType(latestStageEvent.type);
    if (hasDeadStatus) return LEAD_STAGE_DEAD;

    const hasSharedDetails = callLogs.some((call) => (
        Array.isArray(call?.answeredOutcomes)
        && call.answeredOutcomes.includes(ANSWERED_OUTCOME_DETAILS_SHARED)
    ));
    if (hasSharedDetails) return LEAD_STAGE_QUALIFIED;

    const latestCall = [...callLogs]
        .filter((call) => call?.callOutcome || call?.callStatus)
        .sort((left, right) => eventDate(right.createdAt || right.callDate) - eventDate(left.createdAt || left.callDate))[0];
    const latestOutcome = latestCall?.callOutcome || latestCall?.callStatus;
    if (latestOutcome === CALL_DISPOSITION_ANSWERED) return LEAD_STAGE_ANSWERED;
    if (CALL_DISPOSITION_OPTIONS.includes(latestOutcome)) return LEAD_STAGE_NOT_ANSWERED;

    return LEAD_STAGE_NEW;
}

export function getLeadStageLabel(stage) {
    return LEAD_STAGE_LABELS[stage] || LEAD_STAGE_LABELS[LEAD_STAGE_NEW];
}

export function getLeadStageConfig(stage) {
    return LEAD_STAGE_CONFIG.find((item) => item.key === stage) || LEAD_STAGE_CONFIG[0];
}

export function isTerminalLeadStage(stage) {
    return [LEAD_STAGE_WON, LEAD_STAGE_DEAD].includes(stage);
}

export function getLeadBucketLabel(bucket, config = DEFAULT_LEAD_BUCKET_CONFIG) {
    if (bucket === LEAD_BUCKET_DEAD) return 'Dead';
    return config.find((item) => item.key === bucket)?.label
        || DEFAULT_LEAD_BUCKET_CONFIG.find((item) => item.key === bucket)?.label
        || 'New Leads';
}
