import { NextResponse } from 'next/server';
import { requireAdmin, WRITE_ROLES } from '../../../../../../lib/admin-auth';
import { connectMongo } from '../../../../../../lib/mongodb';
import { Notification } from '../../../../../../lib/models';

export async function POST(request, { params }) {
    const auth = await requireAdmin(WRITE_ROLES);
    if (auth.error) {
        return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const body = await request.json();
    const text = String(body.text || '').trim();
    if (!text || text.length > 5000) {
        return NextResponse.json(
            { error: 'Remark must be between 1 and 5000 characters.' },
            { status: 400 },
        );
    }

    await connectMongo();
    const { id } = await params;
    const lead = await Notification.findByIdAndUpdate(
        id,
        {
            $push: {
                salesRemarks: {
                    text,
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
                authorName: latestRemark.authorName,
                authorEmail: latestRemark.authorEmail,
                createdAt: latestRemark.createdAt?.toISOString?.() || '',
                updatedAt: latestRemark.updatedAt?.toISOString?.() || '',
            }
            : null,
    }, { status: 201 });
}
