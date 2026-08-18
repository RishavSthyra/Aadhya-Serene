import { NextResponse } from 'next/server';
import { getLeadScopeFilter, requireAdmin } from '../../../../lib/admin-auth';
import { connectMongo } from '../../../../lib/mongodb';
import { Notification, WhatsAppConversation } from '../../../../lib/models';
import { summarizeWhatsAppConversation } from '../../../../lib/lead-temperature';
import { buildConversationActivity, buildLeadRecordActivity } from '../../../../lib/lead-activity';
import { getLeadDateRangeFilter } from '../../../../lib/lead-date-filter';
import {
    getSalesLeadStatus,
    normalizeLeadStatus,
} from '../../../../lib/lead-status';
import { LEAD_ASSIGNMENT_STATUS_UNASSIGNED } from '../../../../lib/lead-assignment';

function asIso(value) {
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
        text: remark.text || '',
        budget: remark.budget || '',
        configuration: remark.configuration || '',
        location: remark.location || '',
        notes: remark.notes || '',
        authorName: remark.authorName || 'Sales Team',
        authorEmail: remark.authorEmail || '',
        createdAt: remark.createdAt ? new Date(remark.createdAt).toISOString() : '',
        updatedAt: remark.updatedAt ? new Date(remark.updatedAt).toISOString() : '',
    };
}

function serializeCallLog(callLog) {
    return {
        id: String(callLog._id),
        callDate: callLog.callDate || '',
        callStatus: callLog.callStatus || '',
        leadStatus: callLog.leadStatus || '',
        remark: callLog.remark || '',
        sharedRequirements: Boolean(callLog.sharedRequirements),
        budget: callLog.budget || '',
        configuration: callLog.configuration || '',
        location: callLog.location || '',
        authorName: callLog.authorName || 'Sales Team',
        authorEmail: callLog.authorEmail || '',
        createdAt: callLog.createdAt ? new Date(callLog.createdAt).toISOString() : '',
        updatedAt: callLog.updatedAt ? new Date(callLog.updatedAt).toISOString() : '',
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

function serializeLeadGroup(records, conversation) {
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
            if (callDateComparison !== 0) {
                return callDateComparison;
            }

            return sortByNewestDate(left, right, 'createdAt');
        });
    const submissions = sortedRecords.map(serializeSubmission);
    const salesLeadStatus = getSalesLeadStatus(latestRecord);
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

export async function GET(request) {
    const auth = await requireAdmin();
    if (auth.error) {
        return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    await connectMongo();
    const leadScope = getLeadScopeFilter(auth.user);
    if (!leadScope) {
        return NextResponse.json({ error: 'Lead source access is not configured.' }, { status: 403 });
    }

    const dateRange = getLeadDateRangeFilter(new URL(request.url).searchParams);
    if (dateRange.error) {
        return NextResponse.json({ error: dateRange.error }, { status: 400 });
    }

    const leads = await Notification.find({ ...leadScope, ...dateRange.filter })
        .sort({ createdAt: -1 })
        .lean();
    const phoneNumbers = [...new Set(leads.map((lead) => lead.phone).filter(Boolean))];
    const conversations = phoneNumbers.length
        ? await WhatsAppConversation.find({ phoneNumber: { $in: phoneNumbers } }).lean()
        : [];
    const conversationByPhone = new Map(
        conversations.map((conversation) => [conversation.phoneNumber, conversation]),
    );

    const leadsByPhone = new Map();
    for (const lead of leads) {
        const phone = lead.phone || String(lead._id);
        if (!leadsByPhone.has(phone)) {
            leadsByPhone.set(phone, []);
        }
        leadsByPhone.get(phone).push(lead);
    }

    const groupedLeads = [...leadsByPhone.values()]
        .map((records) => serializeLeadGroup(records, conversationByPhone.get(records[0]?.phone)))
        .sort((left, right) => sortByNewestDate(left, right, 'createdAt'));

    return NextResponse.json({
        leads: groupedLeads,
    });
}
