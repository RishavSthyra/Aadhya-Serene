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
import { serializeCallLog as serializeAdminCallLog } from './admin-call-log';

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
    return serializeAdminCallLog(callLog);
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

export function serializeLeadGroup(records, conversation, bucketConfig, options = {}) {
    const summary = options.summary === true;
    const sortedRecords = [...records].sort((left, right) => sortByNewestDate(left, right, 'createdAt'));
    const latestRecord = sortedRecords[0];
    const names = uniqueValues(sortedRecords.map((record) => record.name || ''));
    const sources = uniqueValues(sortedRecords.map((record) => record.source || ''));
    const channels = uniqueValues(sortedRecords.map((record) => record.channel || ''));
    const emails = uniqueValues(sortedRecords.map((record) => record.email || ''));
    const salesRemarks = summary
        ? []
        : sortedRecords
            .flatMap((record) => (record.salesRemarks || []).map(serializeRemark))
            .sort((left, right) => sortByNewestDate(left, right, 'createdAt'));
    const sortedRawCallLogs = sortedRecords
        .flatMap((record) => record.callLogs || [])
        .sort((left, right) => {
            const callDateComparison = String(right.callDate || '').localeCompare(String(left.callDate || ''));
            if (callDateComparison !== 0) return callDateComparison;
            return sortByNewestDate(left, right, 'createdAt');
        });
    const callLogs = summary ? [] : sortedRawCallLogs.map(serializeCallLog);
    const submissions = summary
        ? sortedRecords.map((record) => ({
            id: String(record._id),
            source: record.source || '',
            channel: record.channel || '',
            name: record.name || '',
            requestLabel: record.requestLabel || '',
            message: record.message || '',
        }))
        : sortedRecords.map(serializeSubmission);
    const salesLeadStatus = getSalesLeadStatus(latestRecord);
    const lifecycle = deriveLeadLifecycle(sortedRecords);
    const operationalBucket = getLeadOperationalBucket(lifecycle, sortedRecords);
    const stage = getLeadStage(lifecycle, sortedRecords);
    const originalDate = getOriginalLeadDate(sortedRecords);
    const latestCall = summary ? sortedRawCallLogs[0] || null : callLogs[0] || null;
    const rawLatestFeedbackCall = sortedRawCallLogs.find((callLog) => callLog.sharedRequirements) || null;
    const latestFeedbackCall = summary
        ? (rawLatestFeedbackCall ? serializeCallLog(rawLatestFeedbackCall) : null)
        : callLogs.find((callLog) => callLog.sharedRequirements) || null;
    const whatsapp = summarizeWhatsAppConversation(conversation);
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
        metadata: summary
            ? { whatsappJourney: latestRecord.metadata?.whatsappJourney || null }
            : latestRecord.metadata || {},
        assignedSalesExecutiveId: latestRecord.assignedSalesExecutiveId || '',
        assignedSalesExecutiveName: latestRecord.assignedSalesExecutiveName || '',
        assignedSalesExecutiveEmail: latestRecord.assignedSalesExecutiveEmail || '',
        assignmentStatus: latestRecord.assignmentStatus || LEAD_ASSIGNMENT_STATUS_UNASSIGNED,
        assignedAt: asIso(latestRecord.assignedAt),
        salesLeadStatus,
        leadStatus: sortedRecords.some((record) => normalizeLeadStatus(record.leadStatus) === 'dead')
            ? 'dead'
            : 'active',
        lifecycle: summary
            ? {
                bucket: lifecycle.bucket,
                bucketLabel: getLeadBucketLabel(lifecycle.bucket, bucketConfig),
                operationalBucket,
                callback: lifecycle.callback,
                siteVisitBookedAt: lifecycle.siteVisitBookedAt,
            }
            : {
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
        whatsapp: summary
            ? {
                ...whatsapp,
                responses: uniqueValues(whatsapp.responses.map((response) => response.label))
                    .map((label) => ({ label })),
            }
            : whatsapp,
        activity: summary ? [] : buildGroupedLeadActivity(sortedRecords, conversation),
        salesRemarks,
        callLogs: summary ? [] : callLogs,
        latestFeedbackCall: summary ? latestFeedbackCall : null,
        submissions,
        createdAt: asIso(latestRecord.createdAt),
        updatedAt: updatedAt ? new Date(updatedAt).toISOString() : '',
        firstSeenAt: asIso(sortedRecords.at(-1)?.createdAt),
    };
}
