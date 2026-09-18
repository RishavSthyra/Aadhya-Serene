import crypto from 'crypto';
import mongoose from 'mongoose';
import { NextResponse } from 'next/server';
import { connectMongo } from '../../../../../lib/mongodb';
import { Notification } from '../../../../../lib/models';
import {
    getDaffytelWebhookSecretFromPayload,
    parseDaffytelCallStatusPayload,
    verifyDaffytelWebhookSecret,
} from '../../../../../lib/daffytel-c2c';

export const runtime = 'nodejs';

const MATCH_WINDOW_MS = 30 * 60 * 1000;

function response(body, status = 200) {
    return NextResponse.json(body, { status });
}

function getBearerToken(request) {
    const authorization = request.headers.get('authorization') || '';
    return authorization.toLowerCase().startsWith('bearer ')
        ? authorization.slice(7).trim()
        : '';
}

async function readPayload(request) {
    const contentType = request.headers.get('content-type') || '';
    if (contentType.toLowerCase().includes('application/json')) {
        try {
            return await request.json();
        } catch {
            return null;
        }
    }

    try {
        const form = await request.formData();
        return Object.fromEntries([...form.entries()].map(([key, value]) => [key, String(value)]));
    } catch {
        return null;
    }
}

function getEventKey(event) {
    return event.providerCallId
        ? `daffytel:${event.providerCallId}:${event.providerStatus}:${event.durationSeconds ?? ''}:${event.recordingUrl}`
        : crypto.createHash('sha256').update(JSON.stringify({
            leadId: event.leadId,
            caller: event.caller,
            agent: event.agent,
            providerStatus: event.providerStatus,
            durationSeconds: event.durationSeconds,
            recordingUrl: event.recordingUrl,
            providerHangupCause: event.providerHangupCause,
            providerStartedAt: event.providerStartedAt?.toISOString?.() || '',
            providerEndedAt: event.providerEndedAt?.toISOString?.() || '',
        })).digest('hex');
}

function safeObjectId(value) {
    return mongoose.isValidObjectId(value) ? new mongoose.Types.ObjectId(value) : null;
}

function buildProviderUpdate(event, eventKey) {
    const set = {
        'callLogs.$.callStatus': event.callOutcome,
        'callLogs.$.callOutcome': event.callOutcome,
        'callLogs.$.provider': event.provider,
        'callLogs.$.providerAgent': event.agent,
        'callLogs.$.providerCaller': event.caller,
        'callLogs.$.providerStatus': event.providerStatus,
        'callLogs.$.providerEventKey': eventKey,
        'callLogs.$.providerUpdatedAt': new Date(),
    };

    if (event.providerCallId) set['callLogs.$.providerCallId'] = event.providerCallId;
    if (event.providerHangupCause) set['callLogs.$.providerHangupCause'] = event.providerHangupCause;
    if (event.durationSeconds !== null) set['callLogs.$.durationSeconds'] = event.durationSeconds;
    if (event.ivrDurationSeconds !== null) set['callLogs.$.ivrDurationSeconds'] = event.ivrDurationSeconds;
    if (event.transferDurationSeconds !== null) set['callLogs.$.transferDurationSeconds'] = event.transferDurationSeconds;
    if (event.recordingUrl) set['callLogs.$.recordingUrl'] = event.recordingUrl;
    if (event.providerStartedAt) set['callLogs.$.providerStartedAt'] = event.providerStartedAt;
    if (event.providerEndedAt) set['callLogs.$.providerEndedAt'] = event.providerEndedAt;
    return set;
}

function findCandidateRecord(records, event) {
    const eventTimestamp = event.providerEndedAt?.getTime?.() || event.providerStartedAt?.getTime?.() || Date.now();
    const candidates = records.flatMap((record) => (record.callLogs || []).map((callLog) => ({ record, callLog })));
    const matchingProviderCall = event.providerCallId
        ? candidates.find(({ callLog }) => (
            callLog.providerCallId === event.providerCallId
            || callLog.providerRequestId === event.providerCallId
        ))
        : null;
    if (matchingProviderCall) return matchingProviderCall;

    const recentCandidates = candidates.filter(({ callLog }) => {
        if (callLog.provider || callLog.providerCallId || callLog.providerRequestId) return false;
        const timestamp = new Date(callLog.createdAt || callLog.callDate || 0).getTime();
        return Number.isFinite(timestamp) && Math.abs(eventTimestamp - timestamp) <= MATCH_WINDOW_MS;
    });
    if (event.agent) {
        const normalizedAgent = event.agent.replace(/\s/g, '').toLowerCase();
        const agentCandidates = recentCandidates.filter(({ record, callLog }) => (
            String(callLog.providerAgent || '').replace(/\s/g, '').toLowerCase() === normalizedAgent
            || String(record.assignedSalesExecutiveId || '').toLowerCase() === normalizedAgent
            || String(record.assignedSalesExecutiveEmail || '').toLowerCase() === normalizedAgent
            || String(record.assignedSalesExecutiveName || '').replace(/\s/g, '').toLowerCase() === normalizedAgent
        ));
        if (agentCandidates.length === 1) return agentCandidates[0];
        return null;
    }
    return recentCandidates.length === 1 ? recentCandidates[0] : null;
}

export async function POST(request) {
    const payload = await readPayload(request);
    const configuredSecret = String(process.env.DAFFYTEL_C2C_WEBHOOK_API || '').trim();
    if (!configuredSecret) return response({ received: false, error: 'Webhook is not configured.' }, 503);

    const querySecret = new URL(request.url).searchParams.get('webhook_secret') || '';
    const providedSecret = getDaffytelWebhookSecretFromPayload(payload)
        || request.headers.get('x-webhook-secret')
        || getBearerToken(request)
        || querySecret;
    if (!verifyDaffytelWebhookSecret(providedSecret, configuredSecret)) {
        return response({ received: false, error: 'Invalid webhook secret.' }, 401);
    }

    const event = parseDaffytelCallStatusPayload(payload);
    if (!event) return response({ received: false, error: 'Invalid webhook payload.' }, 400);

    const eventKey = getEventKey(event);
    await connectMongo();

    const leadId = safeObjectId(event.leadId);
    let records = [];
    if (leadId) {
        const lead = await Notification.findById(leadId).lean();
        if (lead) records = [lead];
    } else if (event.caller) {
        const digits = event.caller.replace(/\D/g, '');
        const normalizedCaller = digits.length === 12 && digits.startsWith('91')
            ? digits.slice(2)
            : digits.length === 11 && digits.startsWith('0')
                ? digits.slice(1)
                : digits;
        if (normalizedCaller.length === 10) {
            records = await Notification.find({ phone: { $regex: `${normalizedCaller}$` } }).lean();
        }
    }

    if (!records.length) return response({ received: false, error: 'No matching lead.' }, 409);

    const matchingProviderCall = event.providerCallId
        ? records.flatMap((record) => (record.callLogs || []).map((callLog) => ({ record, callLog })))
            .find(({ callLog }) => (
                callLog.providerCallId === event.providerCallId
                || callLog.providerRequestId === event.providerCallId
            ))
        : null;
    if (matchingProviderCall?.callLog.providerEventKey === eventKey) {
        return response({ received: true, duplicate: true });
    }
    if (matchingProviderCall) {
        const updated = await Notification.findOneAndUpdate(
            {
                _id: matchingProviderCall.record._id,
                'callLogs._id': matchingProviderCall.callLog._id,
                'callLogs.providerCallId': { $in: ['', event.providerCallId] },
                'callLogs.providerRequestId': { $in: ['', event.providerCallId] },
                'callLogs.providerEventKey': { $ne: eventKey },
            },
            { $set: buildProviderUpdate(event, eventKey) },
            { new: true },
        ).lean();
        return response({ received: true, updated: Boolean(updated), providerCallId: event.providerCallId });
    }

    const candidate = findCandidateRecord(records, event);
    if (!candidate) return response({ received: false, error: 'No matching call.' }, 409);

    const isDuplicate = candidate.callLog.providerEventKey === eventKey;
    if (isDuplicate) return response({ received: true, duplicate: true });

    const filter = {
        _id: candidate.record._id,
        'callLogs._id': candidate.callLog._id,
        'callLogs.providerEventKey': { $ne: eventKey },
        ...(event.providerCallId ? { 'callLogs.providerCallId': { $in: ['', event.providerCallId] } } : {}),
    };
    const update = { $set: buildProviderUpdate(event, eventKey) };
    const updated = await Notification.findOneAndUpdate(filter, update, { new: true }).lean();
    if (!updated) return response({ received: true, duplicate: true });

    return response({ received: true, updated: true, providerCallId: event.providerCallId || '' });
}

export async function GET() {
    return response({ error: 'Method not allowed.' }, 405);
}

