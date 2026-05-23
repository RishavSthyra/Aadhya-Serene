import { NextResponse } from 'next/server';
import { connectMongo } from '../../../lib/mongodb';
import { Flat } from '../../../lib/models';
import { seedFlats } from '../../../lib/flat-seed';

export async function GET() {
    try {
        await connectMongo();

        let flats = await Flat.find({}).sort({ flat: 1 }).lean();
        if (flats.length === 0) {
            await seedFlats({ overwrite: true });
            flats = await Flat.find({}).sort({ flat: 1 }).lean();
        }

        return NextResponse.json(
            { flats },
            {
                headers: {
                    'Cache-Control': 'no-store',
                },
            },
        );
    } catch (error) {
        console.error('Unable to load flats', error);
        return NextResponse.json({ error: 'Unable to load flats' }, { status: 500 });
    }
}
