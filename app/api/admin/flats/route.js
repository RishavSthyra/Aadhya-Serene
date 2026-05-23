import { NextResponse } from 'next/server';
import { requireAdmin } from '../../../../lib/admin-auth';
import { connectMongo } from '../../../../lib/mongodb';
import { Flat } from '../../../../lib/models';

export async function GET() {
    const auth = await requireAdmin();
    if (auth.error) {
        return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    await connectMongo();
    const flats = await Flat.find({}).sort({ flat: 1 }).lean();
    return NextResponse.json({ flats });
}
