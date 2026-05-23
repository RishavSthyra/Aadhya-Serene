import { NextResponse } from 'next/server';
import { connectMongo } from '../../../../lib/mongodb';
import { Flat } from '../../../../lib/models';

export async function GET(_request, { params }) {
    try {
        await connectMongo();
        const { id } = await params;
        const flat = await Flat.findOne({ flat: String(id).padStart(3, '0') }).lean();

        if (!flat) {
            return NextResponse.json({ error: 'Flat not found' }, { status: 404 });
        }

        return NextResponse.json(
            { flat },
            {
                headers: {
                    'Cache-Control': 'no-store',
                },
            },
        );
    } catch (error) {
        console.error('Unable to load flat', error);
        return NextResponse.json({ error: 'Unable to load flat' }, { status: 500 });
    }
}
