import { NextResponse } from 'next/server';
import { requireAdmin, WRITE_ROLES } from '../../../../../lib/admin-auth';
import { connectMongo } from '../../../../../lib/mongodb';
import { Flat } from '../../../../../lib/models';

const VALID_STATUSES = ['available', 'sold out', 'blocked', 'reserved'];

export async function PATCH(request, { params }) {
    const auth = await requireAdmin(WRITE_ROLES);
    if (auth.error) {
        return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const body = await request.json();
    const status = String(body.status || '').trim().toLowerCase();

    if (!VALID_STATUSES.includes(status)) {
        return NextResponse.json({ error: 'Invalid flat status.' }, { status: 400 });
    }

    await connectMongo();
    const { id } = await params;
    const flat = await Flat.findOneAndUpdate(
        { flat: String(id).padStart(3, '0') },
        { $set: { status } },
        { new: true },
    ).lean();

    if (!flat) {
        return NextResponse.json({ error: 'Flat not found.' }, { status: 404 });
    }

    return NextResponse.json({ flat });
}
