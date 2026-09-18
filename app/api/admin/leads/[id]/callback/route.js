import crypto from 'crypto';
import { NextResponse } from 'next/server';
import { getLeadScopeFilter, requireAdmin, WRITE_ROLES } from '../../../../../../lib/admin-auth';
import {
    CALLBACK_STATUS_CANCELLED,
    CALLBACK_STATUS_COMPLETED,
    CALLBACK_STATUS_PENDING,
    LEAD_BUCKET_CALLBACK_REQUESTED,
    LEAD_BUCKET_NEW,
    LEAD_BUCKET_SITE_VISIT_BOOKED,
    deriveLeadLifecycle,
    getLeadBucketLabel,
    isValidCallbackDueAt,
    normalizeCallbackDueAt,
} from '../../../../../../lib/lead-lifecycle';
import { connectMongo } from '../../../../../../lib/mongodb';
import { Notification } from '../../../../../../lib/models';

const CALLBACK_ACTIONS = ['complete', 'cancel', 'reschedule'];

function getPendingCallbackCycleKey(lifecycle) {
    return [...(lifecycle?.events || [])]
        .reverse()
        .find((event) => (
            (event.type === 'callback_requested'
                || event.type === 'whatsapp_callback_requested')
            && event.callbackStatus === CALLBACK_STATUS_PENDING
        ))?.eventKey || lifecycle?.callback?.updatedAt || lifecycle?.callback?.dueAt || '';
}

function getEventKey(input, phone, pendingCycleKey) {
    return String(input?.idempotencyKey || '').trim() || crypto.createHash('sha256')
        .update(JSON.stringify({
            phone,
            action: input?.action || '',
            dueAt: input?.dueAt || '',
            pendingCycleKey,
        }))
        .digest('hex');
}

function serializeLifecycle(lifecycle) {
    return {
        ...lifecycle,
        bucketLabel: getLeadBucketLabel(lifecycle.bucket),
        callback: {
            ...lifecycle.callback,
            dueAt: lifecycle.callback?.dueAt?.toISOString?.() || lifecycle.callback?.dueAt || '',
            updatedAt: lifecycle.callback?.updatedAt?.toISOString?.() || lifecycle.callback?.updatedAt || '',
        },
        siteVisitBookedAt: lifecycle.siteVisitBookedAt?.toISOString?.()
            || lifecycle.siteVisitBookedAt
            || '',
        events: (lifecycle.events || []).map((event) => ({
            ...event,
            occurredAt: event.occurredAt?.toISOString?.() || event.occurredAt || '',
            callbackDueAt: event.callbackDueAt?.toISOString?.() || event.callbackDueAt || '',
        })),
    };
}

function getLifecycleState(action, currentLifecycle, dueAt) {
    const hasSiteVisit = Boolean(currentLifecycle.siteVisitBookedAt);
    if (action === 'reschedule') {
        return {
            bucket: hasSiteVisit ? LEAD_BUCKET_SITE_VISIT_BOOKED : LEAD_BUCKET_CALLBACK_REQUESTED,
            callbackStatus: CALLBACK_STATUS_PENDING,
            callbackDueAt: dueAt,
        };
    }

    return {
        bucket: hasSiteVisit ? LEAD_BUCKET_SITE_VISIT_BOOKED : LEAD_BUCKET_NEW,
        callbackStatus: action === 'complete' ? CALLBACK_STATUS_COMPLETED : CALLBACK_STATUS_CANCELLED,
        callbackDueAt: currentLifecycle.callback.dueAt || null,
    };
}

export async function PATCH(request, { params }) {
    const auth = await requireAdmin(WRITE_ROLES);
    if (auth.error) {
        return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    let body;
    try {
        body = await request.json();
    } catch {
        return NextResponse.json({ error: 'Request body must be valid JSON.' }, { status: 400 });
    }

    const action = String(body?.action || '').trim().toLowerCase();
    if (!CALLBACK_ACTIONS.includes(action)) {
        return NextResponse.json({ error: 'Choose complete, cancel, or reschedule.' }, { status: 400 });
    }

    const dueAt = action === 'reschedule' ? normalizeCallbackDueAt(body?.dueAt) : '';
    if (action === 'reschedule' && (!dueAt || !isValidCallbackDueAt(dueAt))) {
        return NextResponse.json({ error: 'A valid callback date and time is required.' }, { status: 400 });
    }

    await connectMongo();
    const { id } = await params;
    const leadScope = getLeadScopeFilter(auth.user);
    const currentLead = await Notification.findOne({ _id: id, ...leadScope }).lean();
    if (!currentLead) {
        return NextResponse.json({ error: 'Lead not found or outside your scope.' }, { status: 404 });
    }

    const phoneRecords = await Notification.find({ ...leadScope, phone: currentLead.phone }).lean();
    const currentLifecycle = deriveLeadLifecycle(phoneRecords);
    const pendingCycleKey = getPendingCallbackCycleKey(currentLifecycle);
    const eventKey = getEventKey(body, currentLead.phone, pendingCycleKey);
    const existingEvent = phoneRecords
        .flatMap((record) => record.leadLifecycle?.events || [])
        .find((event) => event.eventKey === `callback:${eventKey}`);
    if (existingEvent) {
        return NextResponse.json({
            lifecycle: serializeLifecycle(currentLifecycle),
            idempotent: true,
        });
    }

    if (currentLifecycle.callback.status !== CALLBACK_STATUS_PENDING) {
        return NextResponse.json({ error: 'This lead has no pending callback.' }, { status: 409 });
    }

    const callbackRecord = phoneRecords.find((record) => (
        deriveLeadLifecycle([record]).callback.status === CALLBACK_STATUS_PENDING
    )) || currentLead;
    const targetId = callbackRecord._id;
    const nextState = getLifecycleState(action, currentLifecycle, dueAt);
    const eventType = action === 'complete'
        ? 'callback_completed'
        : action === 'cancel'
            ? 'callback_cancelled'
            : 'callback_rescheduled';
    const occurredAt = new Date();
    const event = {
        eventKey: `callback:${eventKey}`,
        type: eventType,
        occurredAt,
        actorName: auth.user.name || 'Sales Team',
        actorEmail: auth.user.email || '',
        source: 'admin_callback',
        callId: '',
        callbackDueAt: nextState.callbackDueAt || null,
        callbackStatus: nextState.callbackStatus,
    };

    const savedLead = await Notification.findOneAndUpdate(
        {
            _id: targetId,
            ...leadScope,
            'leadLifecycle.events.eventKey': { $ne: event.eventKey },
            $or: [
                { 'leadLifecycle.callbackStatus': CALLBACK_STATUS_PENDING },
                {
                    callLogs: {
                        $elemMatch: {
                            answeredOutcomes: 'callback_requested',
                            callbackStatus: { $in: [CALLBACK_STATUS_PENDING, null, ''] },
                        },
                    },
                },
                {
                    'leadLifecycle.events': {
                        $elemMatch: {
                            type: { $in: ['callback_requested', 'whatsapp_callback_requested', 'callback_rescheduled'] },
                            callbackStatus: { $in: [CALLBACK_STATUS_PENDING, null, ''] },
                        },
                    },
                },
            ],
        },
        {
            $set: {
                'leadLifecycle.bucket': nextState.bucket,
                'leadLifecycle.callbackStatus': nextState.callbackStatus,
                'leadLifecycle.callbackDueAt': nextState.callbackDueAt || null,
                'leadLifecycle.callbackUpdatedAt': occurredAt,
                'leadLifecycle.stateUpdatedAt': occurredAt,
            },
            $push: { 'leadLifecycle.events': event },
        },
        { new: true },
    ).lean();

    if (!savedLead) {
        const retryRecords = await Notification.find({ ...leadScope, phone: currentLead.phone }).lean();
        const existingEvent = retryRecords
            .flatMap((record) => record.leadLifecycle?.events || [])
            .find((item) => item.eventKey === event.eventKey);
        if (existingEvent) {
            return NextResponse.json({
                lifecycle: serializeLifecycle(deriveLeadLifecycle(retryRecords)),
                idempotent: true,
            });
        }
        return NextResponse.json({ error: 'Callback changed before this action completed.' }, { status: 409 });
    }

    const phoneRecordsAfter = await Notification.find({ ...leadScope, phone: currentLead.phone }).lean();
    return NextResponse.json({
        lifecycle: serializeLifecycle(deriveLeadLifecycle(phoneRecordsAfter)),
        idempotent: false,
    });
}
