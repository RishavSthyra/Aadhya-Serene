import { flatsData } from './flats.js';
import { connectMongo } from './mongodb.js';
import { Flat } from './models.js';

export function getSeedFlats() {
    return flatsData.map((flat) => ({
        ...flat,
        status: 'available',
        rooms: flat.rooms.map((room) => ({ ...room })),
    }));
}

export async function seedFlats({ overwrite = true } = {}) {
    await connectMongo();
    const seedFlatsData = getSeedFlats();

    if (!overwrite) {
        const count = await Flat.countDocuments();
        if (count > 0) {
            return { inserted: 0, matched: count, total: count };
        }
    }

    const operations = seedFlatsData.map((flat) => ({
        updateOne: {
            filter: { flat: flat.flat },
            update: { $set: flat },
            upsert: true,
        },
    }));

    const result = await Flat.bulkWrite(operations, { ordered: false });
    const total = await Flat.countDocuments();

    return {
        inserted: result.upsertedCount,
        matched: result.matchedCount,
        modified: result.modifiedCount,
        total,
    };
}
