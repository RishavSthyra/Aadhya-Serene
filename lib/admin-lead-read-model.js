import { summarizeWhatsAppConversation } from './lead-temperature';
import { buildConversationActivity, buildLeadRecordActivity } from './lead-activity';
import {
    deriveLeadLifecycle,
    getLeadBucketLabel,
    getLeadOperationalBucket,
    getLeadStage,
    getLeadStageLabel,
    getOriginalLeadDate,
} from './lead-lifecycle';
import { getSalesLeadStatus, normalizeLeadStatus } from './lead-status';
import { LEAD_ASSIGNMENT_STATUS_UNASSIGNED } from './lead-assignment';

export function asIso(value) {
    if (!value) return '';
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? '' : date.toISOString();
}

function sortByNewestDate(left, right, key = 'createdAt') {
    return new Date(right?.[key] || 0).getTime() - new Date(left?.[key] || 0).getTime();
}

function uniqueValues(values) {
    return [...new Set(values.filter(Boolean))];
}

function serializeRemark(remark) {
    return {
        id: String(remark._id),
        type: remark.type || 'feedback',
        text: remark.text || '',
        budget: remark.budget || '',
        configuration: remark.configuration || '',
        location: remark.location || '',
        notes: remark.notes || '',
        authorName: remark.authorName || 'Sales Team',
        authorEmail: remark.authorEmail || '',
        createdAt: asIso(remark.createdAt),
        updatedAt: asIso(remark.updatedAt),
    };
}

function serializeCallLog(callLog) {
    const callOutcome = callLog.callOutcome || callLog.callStatus || '';

    return {
        id: String(callLog._id),
        callDate: callLog.callDate || '',
        callStatus: callOutcome,
        callOutcome,
        answeredOutcomes: Array.isArray(callLog.answeredOutcomes) ? callLog.answeredOutcomes : [],
        callbackDueAt: asIso(callLog.callbackDueAt),
        callbackStatus: callLog.callbackStatus || 'none',
        idempotencyKey: callLog.idempotencyKey || '',
        leadStatus: callLog.leadStatus || '',
        remark: callLog.remark || '',
        sharedRequirements: Boolean(callLog.sharedRequirements),
        budget: callLog.budget || '',
        configuration: callLog.configuration || '',
        location: callLog.location || '',
        authorName: callLog.authorName || 'Sales Team',
        authorEmail: callLog.authorEmail || '',
        createdAt: asIso(callLog.createdAt),
        updatedAt: asIso(callLog.updatedAt),
    };
}

function serializeSubmission(lead) {
    return {
        id: String(lead._id),
        source: lead.source || '',
        channel: lead.channel || '',
        name: lead.name || '',
        email: lead.email || '',
        requestType: lead.requestType || '',
        requestLabel: lead.requestLabel || '',
        preferredTime: lead.preferredTime || '',
        message: lead.message || '',
        assignedSalesExecutiveId: lead.assignedSalesExecutiveId || '',
        assignedSalesExecutiveName: lead.assignedSalesExecutiveName || '',
        assignedSalesExecutiveEmail: lead.assignedSalesExecutiveEmail || '',
        assignmentStatus: lead.assignmentStatus || LEAD_ASSIGNMENT_STATUS_UNASSIGNED,
        assignedAt: asIso(lead.assignedAt),
        metadata: lead.metadata || {},
        createdAt: asIso(lead.createdAt),
        updatedAt: asIso(lead.updatedAt),
    };
}

function buildGroupedLeadActivity(records, conversation) {
    const events = [
        ...records.flatMap((record) => buildLeadRecordActivity(record)),
        ...buildConversationActivity(conversation),
    ];

    return events.sort((left, right) => left.occurredAt.localeCompare(right.occurredAt));
}

export function serializeLeadGroup(records, conversation, bucketConfig) {
    const sortedRecords = [...records].sort((left, right) => sortByNewestDate(left, right, 'createdAt'));
    const latestRecord = sortedRecords[0];
    const names = uniqueValues(sortedRecords.map((record) => record.name || ''));
    const sources = uniqueValues(sortedRecords.map((record) => record.source || ''));
    const channels = uniqueValues(sortedRecords.map((record) => record.channel || ''));
    const emails = uniqueValues(sortedRecords.map((record) => record.email || ''));
    const salesRemarks = sortedRecords
        .flatMap((record) => (record.salesRemarks || []).map(serializeRemark))
        .sort((left, right) => sortByNewestDate(left, right, 'createdAt'));
    const callLogs = sortedRecords
        .flatMap((record) => (record.callLogs || []).map(serializeCallLog))
        .sort((left, right) => {
            const callDateComparison = (right.callDate || '').localeCompare(left.callDate || '');
            if (callDateComparison !== 0) return callDateComparison;
            return sortByNewestDate(left, right, 'createdAt');
        });
    const submissions = sortedRecords.map(serializeSubmission);
    const salesLeadStatus = getSalesLeadStatus(latestRecord);
    const lifecycle = deriveLeadLifecycle(sortedRecords);
    const operationalBucket = getLeadOperationalBucket(lifecycle, sortedRecords);
    const stage = getLeadStage(lifecycle, sortedRecords);
    const originalDate = getOriginalLeadDate(sortedRecords);
    const latestCall = callLogs[0] || null;
    const updatedAt = sortedRecords.reduce((latest, record) => {
        const currentValue = new Date(record.updatedAt || record.createdAt || 0).getTime();
        return currentValue > latest ? currentValue : latest;
    }, 0);

    return {
        id: String(latestRecord._id),
        projectName: latestRecord.projectName || '',
        source: latestRecord.source || '',
        sources,
        channel: latestRecord.channel || '',
        channels,
        name: latestRecord.name || '',
        names,
        phone: latestRecord.phone || '',
        email: latestRecord.email || emails[0] || '',
        emails,
        requestType: latestRecord.requestType || '',
        requestLabel: latestRecord.requestLabel || '',
        preferredTime: latestRecord.preferredTime || '',
        message: latestRecord.message || '',
        metadata: latestRecord.metadata || {},
        assignedSalesExecutiveId: latestRecord.assignedSalesExecutiveId || '',
        assignedSalesExecutiveName: latestRecord.assignedSalesExecutiveName || '',
        assignedSalesExecutiveEmail: latestRecord.assignedSalesExecutiveEmail || '',
        assignmentStatus: latestRecord.assignmentStatus || LEAD_ASSIGNMENT_STATUS_UNASSIGNED,
        assignedAt: asIso(latestRecord.assignedAt),
        salesLeadStatus,
        leadStatus: sortedRecords.some((record) => normalizeLeadStatus(record.leadStatus) === 'dead')
            ? 'dead'
            : 'active',
        lifecycle: {
            ...lifecycle,
            bucketLabel: getLeadBucketLabel(lifecycle.bucket, bucketConfig),
            operationalBucket,
        },
        bucketKey: operationalBucket,
        bucketLabel: getLeadBucketLabel(operationalBucket, bucketConfig),
        stage,
        stageLabel: getLeadStageLabel(stage),
        originalDate,
        latestCallDisposition: latestCall?.callOutcome || latestCall?.callStatus || '',
        latestCallAnsweredOutcomes: Array.isArray(latestCall?.answeredOutcomes)
            ? latestCall.answeredOutcomes
            : [],
        callback: lifecycle.callback,
        emailDelivery: latestRecord.emailDelivery || {},
        whatsappDelivery: latestRecord.whatsappDelivery || {},
        whatsapp: summarizeWhatsAppConversation(conversation),
        activity: buildGroupedLeadActivity(sortedRecords, conversation),
        salesRemarks,
        callLogs,
        submissions,
        createdAt: asIso(latestRecord.createdAt),
        updatedAt: updatedAt ? new Date(updatedAt).toISOString() : '',
        firstSeenAt: asIso(sortedRecords.at(-1)?.createdAt),
    };
}
