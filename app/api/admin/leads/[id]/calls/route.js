import crypto from 'crypto';
import { NextResponse } from 'next/server';
import { getLeadScopeFilter, requireAdmin, WRITE_ROLES } from '../../../../../../lib/admin-auth';
import {
    getCallLogFieldErrors,
    normalizeCallLogInput,
    serializeCallLog,
} from '../../../../../../lib/admin-call-log';
import {
    ANSWERED_OUTCOME_CALLBACK_REQUESTED,
    ANSWERED_OUTCOME_SITE_VISIT_BOOKED,
    CALLBACK_STATUS_PENDING,
    LEAD_BUCKET_CALLBACK_REQUESTED,
    LEAD_BUCKET_NEW,
    LEAD_BUCKET_SITE_VISIT_BOOKED,
    deriveLeadLifecycle,
    getLeadBucketLabel,
    getLeadStage,
    getLeadStageLabel,
} from '../../../../../../lib/lead-lifecycle';
import { connectMongo } from '../../../../../../lib/mongodb';
import { Notification } from '../../../../../../lib/models';

function getEventKey(input, phone) {
    return input.idempotencyKey || crypto.createHash('sha256')
        .update(JSON.stringify({
            phone,
            callDate: input.callDate,
            callOutcome: input.callOutcome || input.callStatus,
            answeredOutcomes: input.answeredOutcomes || [],
            callbackDueAt: input.callbackDueAt || '',
            remark: input.remark || '',
            sharedRequirements: Boolean(input.sharedRequirements),
            budget: input.budget || '',
            configuration: input.configuration || '',
            location: input.location || '',
        }))
        .digest('hex');
}


function buildLifecycleUpdate(callLog, eventKey, currentLifecycle, auth) {
    const events = callLog.answeredOutcomes.map((type) => ({
        eventKey: `call:${eventKey}:${type}`,
        type,
        occurredAt: new Date(),
        actorName: auth.user.name || 'Sales Team',
        actorEmail: auth.user.email || '',
        source: 'admin_call',
        callId: eventKey,
        callbackDueAt: type === ANSWERED_OUTCOME_CALLBACK_REQUESTED ? callLog.callbackDueAt || null : null,
        callbackStatus: type === ANSWERED_OUTCOME_CALLBACK_REQUESTED ? CALLBACK_STATUS_PENDING : 'none',
    }));

    const hasSiteVisit = callLog.answeredOutcomes.includes(ANSWERED_OUTCOME_SITE_VISIT_BOOKED);
    const hasCallback = callLog.answeredOutcomes.includes(ANSWERED_OUTCOME_CALLBACK_REQUESTED);
    const currentBucket = currentLifecycle?.bucket || LEAD_BUCKET_NEW;
    const bucket = hasSiteVisit || currentBucket === LEAD_BUCKET_SITE_VISIT_BOOKED
        ? LEAD_BUCKET_SITE_VISIT_BOOKED
        : hasCallback
            ? LEAD_BUCKET_CALLBACK_REQUESTED
            : currentBucket;

    return {
        events,
        bucket,
        callbackStatus: hasCallback ? CALLBACK_STATUS_PENDING : currentLifecycle?.callback?.status || 'none',
        callbackDueAt: hasCallback ? callLog.callbackDueAt || null : currentLifecycle?.callback?.dueAt || null,
        callbackUpdatedAt: hasCallback ? new Date() : currentLifecycle?.callback?.updatedAt || null,
        siteVisitBookedAt: hasSiteVisit
            ? new Date()
            : currentLifecycle?.siteVisitBookedAt || null,
    };
}

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
    const leadScope = getLeadScopeFilter(auth.user);
    const currentLead = await Notification.findOne({ _id: id, ...leadScope }).lean();

    if (!currentLead) {
        return NextResponse.json({ error: 'Lead not found or outside your scope.' }, { status: 404 });
    }

    const phoneRecords = await Notification.find({ ...leadScope, phone: currentLead.phone }).lean();
    const currentLifecycle = deriveLeadLifecycle(phoneRecords);
    const eventKey = getEventKey(callLog, currentLead.phone);
    const existingCall = phoneRecords
        .flatMap((record) => record.callLogs || [])
        .find((item) => item.idempotencyKey === eventKey);
    if (existingCall) {
        return NextResponse.json({
            callLog: serializeCallLog(existingCall, callLog.callOutcome),
            lifecycle: { ...currentLifecycle, bucketLabel: getLeadBucketLabel(currentLifecycle.bucket) },
            stage: getLeadStage(currentLifecycle, phoneRecords),
            stageLabel: getLeadStageLabel(getLeadStage(currentLifecycle, phoneRecords)),
            idempotent: true,
        });
    }


    const lifecycleUpdate = buildLifecycleUpdate(callLog, eventKey, currentLifecycle, auth);
    const savedLead = await Notification.findOneAndUpdate(
        {
            _id: id,
            ...leadScope,
            'callLogs.idempotencyKey': { $ne: eventKey },
        },
        {
            $set: {
                'leadLifecycle.bucket': lifecycleUpdate.bucket,
                'leadLifecycle.callbackStatus': lifecycleUpdate.callbackStatus,
                'leadLifecycle.callbackDueAt': lifecycleUpdate.callbackDueAt,
                'leadLifecycle.callbackUpdatedAt': lifecycleUpdate.callbackUpdatedAt,
                'leadLifecycle.siteVisitBookedAt': lifecycleUpdate.siteVisitBookedAt,
                'leadLifecycle.stateUpdatedAt': new Date(),
            },
            $push: {
                callLogs: {
                    callDate: callLog.callDate,
                    callStatus: callLog.callOutcome,
                    callOutcome: callLog.callOutcome,
                    answeredOutcomes: callLog.answeredOutcomes,
                    callbackDueAt: callLog.callbackDueAt || null,
                    callbackStatus: callLog.callbackStatus,
                    idempotencyKey: eventKey,
                    // Preserve the old field for historical readers without using it as the new bucket.
                    leadStatus: callLog.leadStatus,
                    remark: callLog.remark,
                    sharedRequirements: callLog.sharedRequirements,
                    budget: callLog.budget,
                    configuration: callLog.configuration,
                    location: callLog.location,
                    authorName: auth.user.name || 'Sales Team',
                    authorEmail: auth.user.email || '',
                },
                'leadLifecycle.events': { $each: lifecycleUpdate.events },
            },
        },
        { new: true },
    ).lean();

    if (!savedLead) {
        const retryRecords = await Notification.find({ ...leadScope, phone: currentLead.phone }).lean();
        const retryCall = retryRecords
            .flatMap((record) => record.callLogs || [])
            .find((item) => item.idempotencyKey === eventKey);
        if (retryCall) {
            const retryLifecycle = deriveLeadLifecycle(retryRecords);
            return NextResponse.json({
                callLog: serializeCallLog(retryCall, callLog.callOutcome),
                lifecycle: { ...retryLifecycle, bucketLabel: getLeadBucketLabel(retryLifecycle.bucket) },
                stage: getLeadStage(retryLifecycle, retryRecords),
                stageLabel: getLeadStageLabel(getLeadStage(retryLifecycle, retryRecords)),
                idempotent: true,
            });
        }
        return NextResponse.json({ error: 'Lead could not be updated.' }, { status: 409 });
    }

    const latestCallLog = savedLead.callLogs?.at(-1);
    const phoneRecordsAfter = await Notification.find({ ...leadScope, phone: currentLead.phone }).lean();
    const nextLifecycle = deriveLeadLifecycle(phoneRecordsAfter);
    return NextResponse.json(
        {
            callLog: serializeCallLog(latestCallLog, callLog.callOutcome),
            lifecycle: {
                ...nextLifecycle,
                bucketLabel: getLeadBucketLabel(nextLifecycle.bucket),
            },
            stage: getLeadStage(nextLifecycle, phoneRecordsAfter),
            stageLabel: getLeadStageLabel(getLeadStage(nextLifecycle, phoneRecordsAfter)),
            idempotent: false,
        },
        { status: 201 },
    );
}
