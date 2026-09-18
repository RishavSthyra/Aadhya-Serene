import { NextResponse } from 'next/server';
import { getLeadScopeFilter, requireAdmin, WRITE_ROLES } from '../../../../../../lib/admin-auth';
import { connectMongo } from '../../../../../../lib/mongodb';
import { Notification } from '../../../../../../lib/models';

function serializeNote(note) {
    return {
        id: String(note._id),
        type: note.type || 'note',
        text: note.text || '',
        authorName: note.authorName || 'Sales Team',
        authorEmail: note.authorEmail || '',
        createdAt: note.createdAt?.toISOString?.() || note.createdAt || '',
        updatedAt: note.updatedAt?.toISOString?.() || note.updatedAt || '',
    };
}

export async function POST(request, { params }) {
    const auth = await requireAdmin(WRITE_ROLES);
    if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

    let body;
    try {
        body = await request.json();
    } catch {
        return NextResponse.json({ error: 'Request body must be valid JSON.' }, { status: 400 });
    }

    const text = String(body?.text || '').trim();
    if (!text) return NextResponse.json({ error: 'Note text is required.' }, { status: 400 });
    if (text.length > 5000) return NextResponse.json({ error: 'Note must be 5000 characters or fewer.' }, { status: 400 });

    await connectMongo();
    const { id } = await params;
    const leadScope = getLeadScopeFilter(auth.user);
    const lead = await Notification.findOneAndUpdate(
        { _id: id, ...leadScope },
        {
            $push: {
                salesRemarks: {
                    type: 'note',
                    text,
                    budget: '',
                    configuration: '',
                    location: '',
                    notes: '',
                    authorName: auth.user.name || 'Sales Team',
                    authorEmail: auth.user.email || '',
                },
            },
        },
        { new: true },
    ).lean();

    if (!lead) return NextResponse.json({ error: 'Lead not found or outside your scope.' }, { status: 404 });
    return NextResponse.json({ note: serializeNote(lead.salesRemarks?.at(-1)) }, { status: 201 });
}
