import { NextResponse } from 'next/server';
import { requireAdmin, WRITE_ROLES } from '../../../../../../lib/admin-auth';
import {
    getCallLogFieldErrors,
    normalizeCallLogInput,
} from '../../../../../../lib/admin-call-log';
import {
    LEAD_STATUS_ACTIVE,
    LEAD_STATUS_DEAD,
} from '../../../../../../lib/lead-status';
import { connectMongo } from '../../../../../../lib/mongodb';
import { Notification } from '../../../../../../lib/models';

export async function POST(request, { params }) {
    const auth = await requireAdmin(WRITE_ROLES);
    if (auth.error) {
        return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const body = await request.json();
    const fieldErrors = getCallLogFieldErrors(body);
    if (Object.keys(fieldErrors).length) {
        return NextResponse.json(
            { error: 'Please correct the highlighted fields.', fieldErrors },
            { status: 400 },
        );
    }

    const callLog = normalizeCallLogInput(body);

    await connectMongo();
    const { id } = await params;
    const currentLead = await Notification.findById(id).lean();

    if (!currentLead) {
        return NextResponse.json({ error: 'Lead not found.' }, { status: 404 });
    }

    await Notification.updateMany(
        { phone: currentLead.phone },
        {
            $set: {
                salesLeadStatus: callLog.leadStatus,
                leadStatus: callLog.leadStatus === LEAD_STATUS_DEAD
                    ? LEAD_STATUS_DEAD
                    : LEAD_STATUS_ACTIVE,
            },
        },
    );

    const lead = await Notification.findByIdAndUpdate(
        id,
        {
            $push: {
                callLogs: {
                    callDate: callLog.callDate,
                    callStatus: callLog.callStatus,
                    leadStatus: callLog.leadStatus,
                    remark: callLog.remark,
                    sharedRequirements: callLog.sharedRequirements,
                    budget: callLog.budget,
                    configuration: callLog.configuration,
                    location: callLog.location,
                    authorName: auth.user.name || 'Sales Team',
                    authorEmail: auth.user.email || '',
                },
            },
        },
        { new: true },
    ).lean();

    const latestCallLog = lead.callLogs?.at(-1);
    return NextResponse.json(
        {
            callLog: latestCallLog
                ? {
                    id: String(latestCallLog._id),
                    callDate: latestCallLog.callDate || '',
                    callStatus: latestCallLog.callStatus || '',
                    leadStatus: latestCallLog.leadStatus || callLog.leadStatus,
                    remark: latestCallLog.remark || '',
                    sharedRequirements: Boolean(latestCallLog.sharedRequirements),
                    budget: latestCallLog.budget || '',
                    configuration: latestCallLog.configuration || '',
                    location: latestCallLog.location || '',
                    authorName: latestCallLog.authorName || 'Sales Team',
                    authorEmail: latestCallLog.authorEmail || '',
                    createdAt: latestCallLog.createdAt?.toISOString?.() || '',
                    updatedAt: latestCallLog.updatedAt?.toISOString?.() || '',
                }
                : null,
            salesLeadStatus: callLog.leadStatus,
        },
        { status: 201 },
    );
}
