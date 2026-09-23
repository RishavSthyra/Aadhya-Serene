import { NextResponse } from 'next/server';
import { requireAdmin } from '../../../../../lib/admin-auth';
import { connectMongo } from '../../../../../lib/mongodb';
import { DaffytelWebhookEvent, Notification } from '../../../../../lib/models';

export const runtime = 'nodejs';

function serializeWebhookEvent(event) {
    if (!event) return null;

    return {
        id: String(event._id),
        outcome: event.outcome || '',
        httpStatus: event.httpStatus || 0,
        providerCallId: event.providerCallId || '',
        providerStatus: event.providerStatus || '',
        leadId: event.leadId || '',
        matchedLeadId: event.matchedLeadId || '',
        matchedCallLogId: event.matchedCallLogId || '',
        callerTail: event.callerTail || '',
        agent: event.agent || '',
        error: event.error || '',
        payloadKeys: event.payloadKeys || [],
        createdAt: event.createdAt?.toISOString?.() || '',
    };
}

function serializeCallLog(record, callLog) {
    if (!record || !callLog) return null;

    return {
        leadId: String(record._id),
        leadName: record.name || '',
        phoneTail: String(record.phone || '').replace(/\D/g, '').slice(-4),
        callLogId: String(callLog._id),
        providerCallId: callLog.providerCallId || '',
        providerRequestId: callLog.providerRequestId || '',
        providerStatus: callLog.providerStatus || '',
        providerEventKey: callLog.providerEventKey || '',
        durationSeconds: callLog.durationSeconds ?? null,
        recordingUrl: callLog.recordingUrl || '',
        providerUpdatedAt: callLog.providerUpdatedAt?.toISOString?.() || '',
        createdAt: callLog.createdAt?.toISOString?.() || '',
    };
}

export async function GET() {
    const auth = await requireAdmin(['super_admin', 'manager']);
    if (auth.error) {
        return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    await connectMongo();

    const latestEvents = await DaffytelWebhookEvent.find({})
        .sort({ createdAt: -1 })
        .limit(10)
        .lean();
    const latestMatchedEvent = latestEvents.find((event) => event.outcome === 'updated' || event.outcome === 'duplicate');

    const latestProviderLead = await Notification.findOne({ 'callLogs.provider': 'daffytel' })
        .sort({ 'callLogs.createdAt': -1, updatedAt: -1 })
        .select('name phone callLogs')
        .lean();
    const latestCallLog = latestProviderLead?.callLogs
        ?.filter((callLog) => callLog.provider === 'daffytel')
        ?.sort((left, right) => new Date(right.createdAt || 0) - new Date(left.createdAt || 0))[0];

    return NextResponse.json({
        configured: Boolean(String(process.env.DAFFYTEL_C2C_WEBHOOK_API || '').trim()),
        webhookUrl: 'https://www.aadhyaserene.com/api/webhooks/daffytel/call-status',
        latestEvent: serializeWebhookEvent(latestEvents[0]),
        latestMatchedEvent: serializeWebhookEvent(latestMatchedEvent),
        latestEvents: latestEvents.map(serializeWebhookEvent),
        latestClickToCall: serializeCallLog(latestProviderLead, latestCallLog),
    });
}
