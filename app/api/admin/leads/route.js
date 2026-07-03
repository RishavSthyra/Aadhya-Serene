import { NextResponse } from 'next/server';
import { requireAdmin } from '../../../../lib/admin-auth';
import { connectMongo } from '../../../../lib/mongodb';
import { Notification } from '../../../../lib/models';

function serializeLead(lead) {
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
        createdAt: lead.createdAt ? new Date(lead.createdAt).toISOString() : '',
        updatedAt: lead.updatedAt ? new Date(lead.updatedAt).toISOString() : '',
    };
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

    return NextResponse.json({
        leads: leads.map(serializeLead),
    });
}
