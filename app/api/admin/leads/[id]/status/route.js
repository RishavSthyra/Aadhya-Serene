import { NextResponse } from 'next/server';
import { getLeadScopeFilter, requireAdmin, WRITE_ROLES } from '../../../../../../lib/admin-auth';
import {
    LEAD_STATUS_OPTIONS,
    normalizeLeadStatus,
    SALES_LEAD_STATUS_DEAD,
} from '../../../../../../lib/lead-status';
import {
    LEAD_BUCKET_DEAD,
    LEAD_BUCKET_NEW,
} from '../../../../../../lib/lead-lifecycle';
import crypto from 'crypto';
import { connectMongo } from '../../../../../../lib/mongodb';
import { Notification } from '../../../../../../lib/models';

export async function PATCH(request, { params }) {
    const auth = await requireAdmin(WRITE_ROLES);
    if (auth.error) {
        return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const body = await request.json();
    const leadStatus = String(body?.leadStatus || '').trim().toLowerCase();

    if (!LEAD_STATUS_OPTIONS.includes(leadStatus)) {
        return NextResponse.json({ error: 'Invalid lead status.' }, { status: 400 });
    }

    await connectMongo();
    const { id } = await params;
    const leadScope = getLeadScopeFilter(auth.user);
    if (!leadScope) {
        return NextResponse.json({ error: 'Lead source access is not configured.' }, { status: 403 });
    }

    const lead = await Notification.findOne({ _id: id, ...leadScope }).lean();

    if (!lead) {
        return NextResponse.json({ error: 'Lead not found.' }, { status: 404 });
    }

    const occurredAt = new Date();
    const eventType = leadStatus === 'dead' ? 'dead_marked' : 'dead_restored';
    const eventKey = `compatibility:${eventType}:${crypto.createHash('sha256')
        .update(`${lead.phone}:${eventType}:${occurredAt.toISOString()}`)
        .digest('hex')}`;
    const lifecycleUpdate = leadStatus === 'dead'
        ? {
            bucket: LEAD_BUCKET_DEAD,
            leadStatus: normalizeLeadStatus(leadStatus),
            salesLeadStatus: SALES_LEAD_STATUS_DEAD,
        }
        : {
            bucket: LEAD_BUCKET_NEW,
            leadStatus: normalizeLeadStatus(leadStatus),
            salesLeadStatus: '',
        };

    await Notification.updateMany(
        {
            phone: lead.phone,
            ...leadScope,
            'leadLifecycle.events.eventKey': { $ne: eventKey },
        },
        {
            $set: {
                leadStatus: lifecycleUpdate.leadStatus,
                salesLeadStatus: lifecycleUpdate.salesLeadStatus,
                'leadLifecycle.bucket': lifecycleUpdate.bucket,
                'leadLifecycle.stateUpdatedAt': occurredAt,
            },
            $push: {
                'leadLifecycle.events': {
                    eventKey,
                    type: eventType,
                    occurredAt,
                    actorName: auth.user.name || 'Sales Team',
                    actorEmail: auth.user.email || '',
                    source: 'admin_status_compatibility',
                    callId: '',
                    callbackDueAt: null,
                    callbackStatus: 'none',
                },
            },
        },
    );

    const updatedLead = await Notification.findOne({ _id: id, ...leadScope }).lean();
    if (!updatedLead) {
        return NextResponse.json({ error: 'Lead could not be updated.' }, { status: 409 });
    }

    return NextResponse.json({
        lead: {
            id: String(updatedLead._id),
            leadStatus: updatedLead.leadStatus || '',
            salesLeadStatus: updatedLead.salesLeadStatus || '',
            bucketKey: updatedLead.leadLifecycle?.bucket || LEAD_BUCKET_NEW,
        },
    });
}
