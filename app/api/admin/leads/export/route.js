import { NextResponse } from 'next/server';
import { getLeadScopeFilter, requireAdmin } from '../../../../../lib/admin-auth';
import { LEAD_ASSIGNMENT_STATUS_UNASSIGNED } from '../../../../../lib/lead-assignment';
import { connectMongo } from '../../../../../lib/mongodb';
import { Notification } from '../../../../../lib/models';
import {
    deriveLeadLifecycle,
    getLeadBucketLabel,
    getLeadOperationalBucket,
    getLeadStage,
    getLeadStageLabel,
    getOriginalLeadDate,
} from '../../../../../lib/lead-lifecycle';
import { getLeadDateRangeFilter, hasLeadDateRange, isLeadDateInRange } from '../../../../../lib/lead-date-filter';
import { getResolvedLeadBucketConfig } from '../../../../../lib/lead-bucket-settings';
import { buildCsvRow } from '../../../../../lib/csv';

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

    const groupedByPhone = new Map();
    for (const lead of leads) {
        const key = lead.phone || String(lead._id);
        if (!groupedByPhone.has(key)) groupedByPhone.set(key, []);
        groupedByPhone.get(key).push(lead);
    }

    const groupedLeads = [...groupedByPhone.values()]
        .map((records) => {
            const sorted = [...records].sort((left, right) => new Date(right.createdAt || 0) - new Date(left.createdAt || 0));
            const latest = sorted[0];
            const originalDate = getOriginalLeadDate(sorted);
            const lifecycle = deriveLeadLifecycle(sorted);
            const stage = getLeadStage(lifecycle, sorted);
            return {
                records: sorted,
                lead: latest,
                originalDate,
                lifecycle,
                stage,
                stageLabel: getLeadStageLabel(stage),
                operationalBucket: getLeadOperationalBucket(lifecycle, sorted),
            };
        })
        .filter((group) => !hasLeadDateRange(dateRange) || isLeadDateInRange(group.originalDate, dateRange));


    const header = [
        'original_lead_date',
        'updated_at',
        'project_name',
        'lifecycle_bucket',
        'lifecycle_bucket_label',
        'lead_stage',
        'lead_stage_label',
        'callback_status',
        'callback_due_at',
        'latest_call_disposition',
        'answered_outcomes',
        'channel',
        'source',
        'name',
        'phone',
        'email',
        'request_type',
        'request_label',
        'preferred_time',
        'message',
        'assigned_sales_executive',
        'assigned_sales_executive_email',
        'assignment_status',
        'assigned_at',
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
        'legacy_lead_status',
        'legacy_sales_lead_status',
        'metadata_json',
    ];

    const rows = groupedLeads.map(({ lead, originalDate, lifecycle, stage, stageLabel, operationalBucket, records }) => {
        const metadata = lead.metadata || {};
        const requestContext = metadata.requestContext || {};
        const whatsappJourney = metadata.whatsappJourney || {};
        const callLogs = records.flatMap((record) => record.callLogs || []);
        const latestCall = [...callLogs].sort((left, right) => new Date(right.createdAt || right.callDate || 0) - new Date(left.createdAt || left.callDate || 0))[0];
        const answeredOutcomes = [...new Set(callLogs.flatMap((call) => call.answeredOutcomes || []))];

        return buildCsvRow([
            originalDate,
            lead.updatedAt ? new Date(lead.updatedAt).toISOString() : '',
            lead.projectName || '',
            operationalBucket || '',
            getLeadBucketLabel(operationalBucket, bucketConfig),
            stage || '',
            stageLabel || '',
            lifecycle.callback?.status || 'none',
            lifecycle.callback?.dueAt?.toISOString?.() || lifecycle.callback?.dueAt || '',
            latestCall?.callOutcome || latestCall?.callStatus || '',
            answeredOutcomes.join(', '),
            lead.channel || '',
            lead.source || '',
            lead.name || '',
            lead.phone || '',
            lead.email || '',
            lead.requestType || '',
            lead.requestLabel || '',
            lead.preferredTime || '',
            lead.message || '',
            lead.assignedSalesExecutiveName || 'Unassigned',
            lead.assignedSalesExecutiveEmail || '',
            lead.assignmentStatus || LEAD_ASSIGNMENT_STATUS_UNASSIGNED,
            lead.assignedAt ? new Date(lead.assignedAt).toISOString() : '',
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
            lead.leadStatus || '',
            lead.salesLeadStatus || '',
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
