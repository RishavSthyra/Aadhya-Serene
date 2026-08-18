import { NextResponse } from 'next/server';
import { requireAdmin, WRITE_ROLES } from '../../../../../../lib/admin-auth';
import {
    LEAD_STATUS_OPTIONS,
    normalizeLeadStatus,
    SALES_LEAD_STATUS_DEAD,
} from '../../../../../../lib/lead-status';
import { connectMongo } from '../../../../../../lib/mongodb';
import { Notification } from '../../../../../../lib/models';

export async function PATCH(request, { params }) {
    const auth = await requireAdmin(WRITE_ROLES);
    if (auth.error) {
        return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const body = await request.json();
    const leadStatus = String(body?.leadStatus || '').trim().toLowerCase();

    if (!LEAD_STATUS_OPTIONS.includes(leadStatus)) {
        return NextResponse.json({ error: 'Invalid lead status.' }, { status: 400 });
    }

    await connectMongo();
    const { id } = await params;
    const lead = await Notification.findById(id).lean();

    if (!lead) {
        return NextResponse.json({ error: 'Lead not found.' }, { status: 404 });
    }

    const update =
        leadStatus === 'dead'
            ? {
                $set: {
                    leadStatus: normalizeLeadStatus(leadStatus),
                    salesLeadStatus: SALES_LEAD_STATUS_DEAD,
                },
            }
            : {
                $set: {
                    leadStatus: normalizeLeadStatus(leadStatus),
                },
            };

    await Notification.updateMany({ phone: lead.phone }, update);

    return NextResponse.json({
        lead: {
            id: String(lead._id),
            leadStatus: normalizeLeadStatus(leadStatus),
            salesLeadStatus: leadStatus === 'dead' ? SALES_LEAD_STATUS_DEAD : '',
        },
    });
}
