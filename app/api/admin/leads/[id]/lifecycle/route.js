import crypto from 'crypto';
import { NextResponse } from 'next/server';
import { getLeadScopeFilter, requireAdmin, WRITE_ROLES } from '../../../../../../lib/admin-auth';
import {
    LEAD_STAGE_OPTIONS,
    canAdvanceLeadStage,
    deriveLeadLifecycle,
    getLeadStage,
    getLeadStageLabel,
} from '../../../../../../lib/lead-lifecycle';
import { connectMongo } from '../../../../../../lib/mongodb';
import { Notification } from '../../../../../../lib/models';

const EVENT_TYPES = new Set(LEAD_STAGE_OPTIONS);

function normalizeDate(value) {
    if (!value) return null;
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
}

function serializeEvent(event) {
    return {
        ...event,
        occurredAt: event.occurredAt?.toISOString?.() || event.occurredAt || '',
        scheduledAt: event.scheduledAt?.toISOString?.() || event.scheduledAt || '',
    };
}

export async function POST(request, { params }) {
    const auth = await requireAdmin(WRITE_ROLES);
    if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

    let body;
    try {
        body = await request.json();
    } catch {
        return NextResponse.json({ error: 'Request body must be valid JSON.' }, { status: 400 });
    }

    const type = String(body?.type || '').trim().toLowerCase();
    if (!EVENT_TYPES.has(type)) {
        return NextResponse.json({ error: 'Choose a valid lifecycle stage.' }, { status: 400 });
    }

    const scheduledAt = normalizeDate(body?.scheduledAt);
    if (type === 'site_visit_booked' && !scheduledAt) {
        return NextResponse.json({ error: 'Choose the site visit date and time.' }, { status: 400 });
    }
    if (type === 'site_visit_done' && !scheduledAt) {
        return NextResponse.json({ error: 'Confirm the completed site visit date and time.' }, { status: 400 });
    }

    const note = String(body?.note || '').trim().slice(0, 5000);
    await connectMongo();
    const { id } = await params;
    const leadScope = getLeadScopeFilter(auth.user);
    const currentLead = await Notification.findOne({ _id: id, ...leadScope }).lean();
    if (!currentLead) return NextResponse.json({ error: 'Lead not found or outside your scope.' }, { status: 404 });

    const phoneRecords = await Notification.find({ ...leadScope, phone: currentLead.phone }).lean();
    const currentStage = getLeadStage(deriveLeadLifecycle(phoneRecords), phoneRecords);
    if (currentStage !== type && !canAdvanceLeadStage(currentStage, type)) {
        return NextResponse.json({ error: `Move this lead from ${getLeadStageLabel(currentStage)} before choosing ${getLeadStageLabel(type)}.` }, { status: 409 });
    }

    const occurredAt = new Date();
    const eventKey = `stage:${crypto.createHash('sha256').update(JSON.stringify({
        phone: currentLead.phone,
        type,
        scheduledAt: scheduledAt?.toISOString() || '',
        note,
    })).digest('hex')}`;
    const event = {
        eventKey,
        type,
        occurredAt,
        actorName: auth.user.name || 'Sales Team',
        actorEmail: auth.user.email || '',
        source: 'admin_lifecycle',
        callId: '',
        callbackDueAt: null,
        callbackStatus: 'none',
        scheduledAt,
        note,
    };

    const savedLead = await Notification.findOneAndUpdate(
        { _id: id, ...leadScope, 'leadLifecycle.events.eventKey': { $ne: eventKey } },
        {
            $set: { 'leadLifecycle.stateUpdatedAt': occurredAt },
            $push: { 'leadLifecycle.events': event },
        },
        { new: true },
    ).lean();

    if (!savedLead) {
        const existingLead = await Notification.findOne({ _id: id, ...leadScope }).lean();
        const existingEvent = existingLead?.leadLifecycle?.events?.find((item) => item.eventKey === eventKey);
        if (existingEvent) {
            return NextResponse.json({ event: serializeEvent(existingEvent), idempotent: true });
        }
        return NextResponse.json({ error: 'Lifecycle changed before this action completed.' }, { status: 409 });
    }

    return NextResponse.json({
        event: serializeEvent(event),
        stage: type,
        stageLabel: getLeadStageLabel(type),
        idempotent: false,
    }, { status: 201 });
}
