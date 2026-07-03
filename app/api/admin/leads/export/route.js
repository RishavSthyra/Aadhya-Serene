import { NextResponse } from 'next/server';
import { requireAdmin } from '../../../../../lib/admin-auth';
import { connectMongo } from '../../../../../lib/mongodb';
import { Notification } from '../../../../../lib/models';

function escapeCsv(value) {
    const text = String(value ?? '');
    if (text.includes('"') || text.includes(',') || text.includes('\n') || text.includes('\r')) {
        return `"${text.replaceAll('"', '""')}"`;
    }

    return text;
}

function buildCsvRow(values) {
    return values.map(escapeCsv).join(',');
}

export async function GET() {
    const auth = await requireAdmin();
    if (auth.error) {
        return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    await connectMongo();
    const leads = await Notification.find({})
        .sort({ createdAt: -1 })
        .lean();

    const header = [
        'submitted_at',
        'updated_at',
        'project_name',
        'channel',
        'source',
        'name',
        'phone',
        'email',
        'request_type',
        'request_label',
        'preferred_time',
        'message',
        'email_status',
        'email_sent_at',
        'email_error',
        'whatsapp_status',
        'whatsapp_sent_at',
        'whatsapp_error',
        'host',
        'origin',
        'referer',
        'user_agent',
        'client_ip',
        'business_name',
        'wa_step',
        'wa_selected_option',
        'wa_unit_type',
        'wa_budget',
        'wa_visit_time',
        'wa_call_time',
        'wa_last_incoming_text',
        'metadata_json',
    ];

    const rows = leads.map((lead) => {
        const metadata = lead.metadata || {};
        const requestContext = metadata.requestContext || {};
        const whatsappJourney = metadata.whatsappJourney || {};

        return buildCsvRow([
            lead.createdAt ? new Date(lead.createdAt).toISOString() : '',
            lead.updatedAt ? new Date(lead.updatedAt).toISOString() : '',
            lead.projectName || '',
            lead.channel || '',
            lead.source || '',
            lead.name || '',
            lead.phone || '',
            lead.email || '',
            lead.requestType || '',
            lead.requestLabel || '',
            lead.preferredTime || '',
            lead.message || '',
            lead.emailDelivery?.status || '',
            lead.emailDelivery?.sentAt ? new Date(lead.emailDelivery.sentAt).toISOString() : '',
            lead.emailDelivery?.error || '',
            lead.whatsappDelivery?.status || '',
            lead.whatsappDelivery?.sentAt ? new Date(lead.whatsappDelivery.sentAt).toISOString() : '',
            lead.whatsappDelivery?.error || '',
            requestContext.host || '',
            requestContext.origin || '',
            requestContext.referer || '',
            requestContext.userAgent || '',
            requestContext.clientIp || '',
            metadata.businessName || '',
            whatsappJourney.step || '',
            whatsappJourney.selectedOption || '',
            whatsappJourney.unitType || '',
            whatsappJourney.budget || '',
            whatsappJourney.visitTime || '',
            whatsappJourney.callTime || '',
            whatsappJourney.lastIncomingText || '',
            JSON.stringify(metadata || {}),
        ]);
    });

    const csv = [buildCsvRow(header), ...rows].join('\n');

    return new NextResponse(csv, {
        status: 200,
        headers: {
            'Content-Type': 'text/csv; charset=utf-8',
            'Content-Disposition': 'attachment; filename="aadhya-serene-leads.csv"',
            'Cache-Control': 'no-store',
        },
    });
}
