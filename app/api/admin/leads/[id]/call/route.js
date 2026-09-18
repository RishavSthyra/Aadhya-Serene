import mongoose from 'mongoose';
import { NextResponse } from 'next/server';
import { getLeadScopeFilter, requireAdmin, WRITE_ROLES } from '../../../../../../lib/admin-auth';
import { connectMongo } from '../../../../../../lib/mongodb';
import { Notification } from '../../../../../../lib/models';
import {
    DaffytelC2CError,
    getDefaultDaffytelAgent,
    initiateDaffytelC2C,
    normalizeDaffytelAgent,
    normalizeDaffytelMobile,
} from '../../../../../../lib/daffytel-c2c';

export const runtime = 'nodejs';

const RECENT_CALL_COOLDOWN_MS = 60_000;
const recentCallAttempts = new Map();

function pruneRecentCallAttempts(now) {
    for (const [key, timestamp] of recentCallAttempts) {
        if (now - timestamp >= RECENT_CALL_COOLDOWN_MS) recentCallAttempts.delete(key);
    }
}

function jsonError(error) {
    if (error instanceof DaffytelC2CError) {
        return NextResponse.json({ error: error.message, code: error.code }, { status: error.status });
    }
    return NextResponse.json({ error: 'Unable to start the call.' }, { status: 500 });
}

export async function POST(request, { params }) {
    const auth = await requireAdmin(WRITE_ROLES);
    if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

    let body = {};
    try {
        body = await request.json();
    } catch {
        return NextResponse.json({ error: 'Request body must be valid JSON.' }, { status: 400 });
    }

    const extension = String(body?.extension || '').trim();
    if (extension && !/^\d+$/.test(extension)) {
        return NextResponse.json({ error: 'Extension must contain only numbers.' }, { status: 400 });
    }

    const { id } = await params;
    if (!mongoose.isValidObjectId(id)) {
        return NextResponse.json({ error: 'Lead not found.' }, { status: 404 });
    }

    let attemptKey = '';
    try {
        await connectMongo();
        const leadScope = getLeadScopeFilter(auth.user);
        const lead = await Notification.findOne({ _id: id, ...leadScope }).lean();
        if (!lead) {
            return NextResponse.json({ error: 'Lead not found or outside your scope.' }, { status: 404 });
        }

        const attemptKey = `${String(auth.user._id)}:${String(lead._id)}`;
        const now = Date.now();
        pruneRecentCallAttempts(now);
        const previousAttemptAt = recentCallAttempts.get(attemptKey);
        if (previousAttemptAt && now - previousAttemptAt < RECENT_CALL_COOLDOWN_MS) {
            return NextResponse.json(
                { error: 'A click-to-call request was already accepted for this lead. Please wait before trying again.', code: 'call_cooldown' },
                { status: 429 },
            );
        }
        const configuredAgent = auth.user.role === 'sales_executive'
            ? String(auth.user.daffytelAgentId || '').trim()
            : getDefaultDaffytelAgent();
        if (!configuredAgent) {
            throw new DaffytelC2CError('Your Daffytel agent ID is not configured. Ask an administrator to add it to your user account.', {
                status: 503,
                code: 'missing_agent_configuration',
            });
        }
        const agent = normalizeDaffytelAgent(configuredAgent, 'Daffytel agent identifier');
        const caller = normalizeDaffytelMobile(lead.phone, 'lead mobile number');
        const result = await initiateDaffytelC2C({
            agent,
            caller,
            extension,
            customParam1: 'Aadhya Serene',
            customParam2: String(lead._id),
            customParam3: String(lead.source || lead.channel || 'admin'),
        });

        recentCallAttempts.set(attemptKey, now);
        return NextResponse.json({
            success: true,
            accepted: result.accepted,
            providerRequestId: result.providerRequestId,
        });
    } catch (error) {
        return jsonError(error);
    }
}
