import { NextResponse } from 'next/server';
import { requireAdmin, WRITE_ROLES } from '../../../../../../lib/admin-auth';
import {
    buildRecurringFinanceSnapshot,
    normalizeRecurringCsvRows,
} from '../../../../../../lib/finance';
import { connectMongo } from '../../../../../../lib/mongodb';
import { RecurringPayment } from '../../../../../../lib/models';

function ensureUniqueMatchKeys(rows) {
    const seen = new Set();
    rows.forEach(({ rowNumber, payload }) => {
        if (seen.has(payload.matchKey)) {
            throw new Error(`Duplicate CSV row detected for ${payload.name} at row ${rowNumber}.`);
        }
        seen.add(payload.matchKey);
    });
}

export async function POST(request) {
    const auth = await requireAdmin(WRITE_ROLES);
    if (auth.error) {
        return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    try {
        const body = await request.json();
        const mode = String(body.mode || 'upsert').trim().toLowerCase();
        const csvText = String(body.csvText || '');

        if (!csvText.trim()) {
            return NextResponse.json({ error: 'CSV file is empty.' }, { status: 400 });
        }

        if (!['upsert', 'replace_all'].includes(mode)) {
            return NextResponse.json({ error: 'Invalid import mode.' }, { status: 400 });
        }

        if (mode === 'replace_all' && auth.user.role !== 'super_admin') {
            return NextResponse.json({ error: 'Only a Super Admin can replace all recurring payments.' }, { status: 403 });
        }

        const normalizedRows = normalizeRecurringCsvRows(csvText);
        if (!normalizedRows.length) {
            return NextResponse.json({ error: 'No valid CSV rows were found.' }, { status: 400 });
        }

        ensureUniqueMatchKeys(normalizedRows);

        await connectMongo();
        const importBatchId = crypto.randomUUID();

        if (mode === 'replace_all') {
            await RecurringPayment.deleteMany({});
            const inserted = await RecurringPayment.insertMany(
                normalizedRows.map(({ payload }) => ({
                    ...payload,
                    importBatchId,
                    source: 'csv',
                    createdBy: auth.user._id,
                    updatedBy: auth.user._id,
                })),
                { ordered: true },
            );

            const records = await RecurringPayment.find({})
                .sort({ type: 1, name: 1, startDate: 1 })
                .lean();

            return NextResponse.json({
                mode,
                importedCount: inserted.length,
                createdCount: inserted.length,
                updatedCount: 0,
                snapshot: buildRecurringFinanceSnapshot(records),
            });
        }

        const existing = await RecurringPayment.find({
            matchKey: { $in: normalizedRows.map(({ payload }) => payload.matchKey) },
        })
            .select({ _id: 1, matchKey: 1 })
            .lean();
        const existingByMatchKey = new Map(existing.map((item) => [item.matchKey, item]));
        let createdCount = 0;
        let updatedCount = 0;

        await RecurringPayment.bulkWrite(
            normalizedRows.map(({ payload }) => {
                if (existingByMatchKey.has(payload.matchKey)) {
                    updatedCount += 1;
                } else {
                    createdCount += 1;
                }

                return {
                    updateOne: {
                        filter: { matchKey: payload.matchKey },
                        update: {
                            $set: {
                                ...payload,
                                source: 'csv',
                                importBatchId,
                                updatedBy: auth.user._id,
                            },
                            $setOnInsert: {
                                createdBy: auth.user._id,
                            },
                        },
                        upsert: true,
                    },
                };
            }),
            { ordered: true },
        );

        const records = await RecurringPayment.find({})
            .sort({ type: 1, name: 1, startDate: 1 })
            .lean();

        return NextResponse.json({
            mode,
            importedCount: normalizedRows.length,
            createdCount,
            updatedCount,
            snapshot: buildRecurringFinanceSnapshot(records),
        });
    } catch (error) {
        return NextResponse.json(
            { error: error?.message || 'Unable to import recurring payments CSV.' },
            { status: 400 },
        );
    }
}
