import { NextResponse } from 'next/server';
import { getLeadScopeFilter, requireAdmin, WRITE_ROLES } from '../../../../../../lib/admin-auth';
import {
    getAdminFeedbackFieldErrors,
    normalizeAdminFeedbackInput,
} from '../../../../../../lib/admin-feedback';
import { connectMongo } from '../../../../../../lib/mongodb';
import { Notification } from '../../../../../../lib/models';

export async function POST(request, { params }) {
    const auth = await requireAdmin(WRITE_ROLES);
    if (auth.error) {
        return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const body = await request.json();
    const fieldErrors = getAdminFeedbackFieldErrors(body);
    if (Object.keys(fieldErrors).length) {
        return NextResponse.json(
            { error: 'Please correct the highlighted fields.', fieldErrors },
            { status: 400 },
        );
    }
    const feedback = normalizeAdminFeedbackInput(body);

    await connectMongo();
    const { id } = await params;
    const leadScope = getLeadScopeFilter(auth.user);
    if (!leadScope) {
        return NextResponse.json({ error: 'Lead source access is not configured.' }, { status: 403 });
    }

    const lead = await Notification.findOneAndUpdate(
        { _id: id, ...leadScope },
        {
            $push: {
                salesRemarks: {
                    type: 'feedback',
                    text: feedback.text,
                    budget: feedback.budget,
                    configuration: feedback.configuration,
                    location: feedback.location,
                    notes: feedback.notes,
                    authorName: auth.user.name || 'Sales Team',
                    authorEmail: auth.user.email || '',
                },
            },
        },
        { new: true },
    ).lean();

    if (!lead) {
        return NextResponse.json({ error: 'Lead not found.' }, { status: 404 });
    }

    const latestRemark = lead.salesRemarks?.at(-1);
    return NextResponse.json({
        remark: latestRemark
            ? {
                id: String(latestRemark._id),
                text: latestRemark.text,
                budget: latestRemark.budget || '',
                configuration: latestRemark.configuration || '',
                location: latestRemark.location || '',
                notes: latestRemark.notes || '',
                authorName: latestRemark.authorName,
                authorEmail: latestRemark.authorEmail,
                createdAt: latestRemark.createdAt?.toISOString?.() || '',
                updatedAt: latestRemark.updatedAt?.toISOString?.() || '',
            }
            : null,
    }, { status: 201 });
}
