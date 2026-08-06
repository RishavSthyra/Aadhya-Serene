import { NextResponse } from 'next/server';
import { getLeadScopeFilter, requireAdmin } from '../../../../lib/admin-auth';
import { connectMongo } from '../../../../lib/mongodb';
import { Notification, WhatsAppConversation } from '../../../../lib/models';
import { summarizeWhatsAppConversation } from '../../../../lib/lead-temperature';
import { buildLeadActivity } from '../../../../lib/lead-activity';
import { getLeadDateRangeFilter } from '../../../../lib/lead-date-filter';

function serializeLead(lead, conversation) {
    return {
        id: String(lead._id),
        projectName: lead.projectName || '',
        source: lead.source || '',
        channel: lead.channel || '',
        name: lead.name || '',
        phone: lead.phone || '',
        email: lead.email || '',
        requestType: lead.requestType || '',
        requestLabel: lead.requestLabel || '',
        preferredTime: lead.preferredTime || '',
        message: lead.message || '',
        metadata: lead.metadata || {},
        emailDelivery: lead.emailDelivery || {},
        whatsappDelivery: lead.whatsappDelivery || {},
        whatsapp: summarizeWhatsAppConversation(conversation),
        activity: buildLeadActivity(lead, conversation),
        salesRemarks: (lead.salesRemarks || []).map((remark) => ({
            id: String(remark._id),
            text: remark.text || '',
            authorName: remark.authorName || 'Sales Team',
            authorEmail: remark.authorEmail || '',
            createdAt: remark.createdAt ? new Date(remark.createdAt).toISOString() : '',
            updatedAt: remark.updatedAt ? new Date(remark.updatedAt).toISOString() : '',
        })),
        createdAt: lead.createdAt ? new Date(lead.createdAt).toISOString() : '',
        updatedAt: lead.updatedAt ? new Date(lead.updatedAt).toISOString() : '',
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

    return NextResponse.json({
        leads: leads.map((lead) => serializeLead(lead, conversationByPhone.get(lead.phone))),
    });
}
