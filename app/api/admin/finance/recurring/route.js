import { NextResponse } from 'next/server';
import { requireAdmin, WRITE_ROLES } from '../../../../../lib/admin-auth';
import { buildRecurringFinanceSnapshot, normalizeRecurringPaymentInput } from '../../../../../lib/finance';
import { connectMongo } from '../../../../../lib/mongodb';
import { RecurringPayment } from '../../../../../lib/models';

export async function GET() {
    const auth = await requireAdmin(WRITE_ROLES);
    if (auth.error) {
        return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    await connectMongo();
    const records = await RecurringPayment.find({})
        .sort({ type: 1, name: 1, startDate: 1 })
        .lean();

    return NextResponse.json(buildRecurringFinanceSnapshot(records));
}

export async function POST(request) {
    const auth = await requireAdmin(WRITE_ROLES);
    if (auth.error) {
        return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    try {
        const body = await request.json();
        const payload = normalizeRecurringPaymentInput(body, { source: 'manual' });

        await connectMongo();
        const created = await RecurringPayment.create({
            ...payload,
            createdBy: auth.user._id,
            updatedBy: auth.user._id,
        });

        return NextResponse.json({
            payment: buildRecurringFinanceSnapshot([created.toObject()]).payments[0],
        }, { status: 201 });
    } catch (error) {
        const message = error?.code === 11000
            ? 'A matching recurring payment already exists.'
            : (error?.message || 'Unable to create recurring payment.');
        return NextResponse.json({ error: message }, { status: 400 });
    }
}
