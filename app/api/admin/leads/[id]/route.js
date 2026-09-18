import mongoose from 'mongoose';
import { NextResponse } from 'next/server';
import { getLeadScopeFilter, requireAdmin } from '../../../../../lib/admin-auth';
import { connectMongo } from '../../../../../lib/mongodb';
import { Notification, WhatsAppConversation } from '../../../../../lib/models';
import { serializeLeadGroup } from '../../../../../lib/admin-lead-read-model';
import { getResolvedLeadBucketConfig } from '../../../../../lib/lead-bucket-settings';

export async function GET(request, { params }) {
    const auth = await requireAdmin();
    if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

    await connectMongo();
    const { id } = await params;
    if (!mongoose.isValidObjectId(id)) {
        return NextResponse.json({ error: 'Lead not found.' }, { status: 404 });
    }
    const leadScope = getLeadScopeFilter(auth.user);
    if (!leadScope) {
        return NextResponse.json({ error: 'Lead source access is not configured.' }, { status: 403 });
    }

    const currentLead = await Notification.findOne({ _id: id, ...leadScope }).lean();
    if (!currentLead) {
        return NextResponse.json({ error: 'Lead not found or outside your scope.' }, { status: 404 });
    }

    const [records, bucketConfig, conversation] = await Promise.all([
        Notification.find({ ...leadScope, phone: currentLead.phone }).sort({ createdAt: -1 }).lean(),
        getResolvedLeadBucketConfig(),
        WhatsAppConversation.findOne({
            phoneNumber: currentLead.phone,
            ...(auth.user.role === 'lead_partner' ? { source: auth.user.leadSource } : {}),
        }).lean(),
    ]);

    return NextResponse.json({
        lead: serializeLeadGroup(records, conversation, bucketConfig),
        canWrite: ['super_admin', 'manager', 'sales_executive'].includes(auth.user.role),
    });
}
