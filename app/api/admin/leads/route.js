import { NextResponse } from 'next/server';
import { getLeadScopeFilter, requireAdmin } from '../../../../lib/admin-auth';
import { connectMongo } from '../../../../lib/mongodb';
import { Notification, WhatsAppConversation } from '../../../../lib/models';
import { serializeLeadGroup } from '../../../../lib/admin-lead-read-model';
import { getLeadDateRangeFilter, hasLeadDateRange, isLeadDateInRange } from '../../../../lib/lead-date-filter';
import { getResolvedLeadBucketConfig } from '../../../../lib/lead-bucket-settings';

function sortByNewestDate(left, right, key = 'createdAt') {
    return new Date(right?.[key] || 0).getTime() - new Date(left?.[key] || 0).getTime();
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

    const [leads, bucketConfig] = await Promise.all([
        Notification.find(leadScope).sort({ createdAt: -1 }).lean(),
        getResolvedLeadBucketConfig(),
    ]);
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
        if (!leadsByPhone.has(phone)) leadsByPhone.set(phone, []);
        leadsByPhone.get(phone).push(lead);
    }

    const groupedLeads = [...leadsByPhone.values()]
        .map((records) => serializeLeadGroup(records, conversationByPhone.get(records[0]?.phone), bucketConfig))
        .filter((lead) => !hasLeadDateRange(dateRange) || isLeadDateInRange(lead.originalDate, dateRange))
        .sort((left, right) => sortByNewestDate(left, right, 'createdAt'));

    return NextResponse.json({ leads: groupedLeads });
}
