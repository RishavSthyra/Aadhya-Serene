import { NextResponse } from 'next/server';
import { requireAdmin, WRITE_ROLES } from '../../../../../../lib/admin-auth';
import {
    getCallLogFieldErrors,
    normalizeCallLogInput,
} from '../../../../../../lib/admin-call-log';
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
    const lead = await Notification.findByIdAndUpdate(
        id,
        {
            $push: {
                callLogs: {
                    callDate: callLog.callDate,
                    callStatus: callLog.callStatus,
                    remark: callLog.remark,
                    authorName: auth.user.name || 'Sales Team',
                    authorEmail: auth.user.email || '',
                },
            },
        },
        { new: true },
    ).lean();

    if (!lead) {
        return NextResponse.json({ error: 'Lead not found.' }, { status: 404 });
    }

    const latestCallLog = lead.callLogs?.at(-1);
    return NextResponse.json(
        {
            callLog: latestCallLog
                ? {
                    id: String(latestCallLog._id),
                    callDate: latestCallLog.callDate || '',
                    callStatus: latestCallLog.callStatus || '',
                    remark: latestCallLog.remark || '',
                    authorName: latestCallLog.authorName || 'Sales Team',
                    authorEmail: latestCallLog.authorEmail || '',
                    createdAt: latestCallLog.createdAt?.toISOString?.() || '',
                    updatedAt: latestCallLog.updatedAt?.toISOString?.() || '',
                }
                : null,
        },
        { status: 201 },
    );
}
