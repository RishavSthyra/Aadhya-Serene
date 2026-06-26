import { NextResponse } from 'next/server';
import { requireAdmin, WRITE_ROLES } from '../../../../../../lib/admin-auth';
import { buildRecurringFinanceSnapshot, normalizeRecurringPaymentInput } from '../../../../../../lib/finance';
import { connectMongo } from '../../../../../../lib/mongodb';
import { RecurringPayment } from '../../../../../../lib/models';

export async function PATCH(request, { params }) {
    const auth = await requireAdmin(WRITE_ROLES);
    if (auth.error) {
        return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    try {
        const body = await request.json();
        const payload = normalizeRecurringPaymentInput(body, { source: body?.source || 'manual' });
        const { id } = await params;

        await connectMongo();
        const updated = await RecurringPayment.findByIdAndUpdate(
            id,
            {
                ...payload,
                updatedBy: auth.user._id,
            },
            { new: true, runValidators: true },
        ).lean();

        if (!updated) {
            return NextResponse.json({ error: 'Recurring payment not found.' }, { status: 404 });
        }

        return NextResponse.json({
            payment: buildRecurringFinanceSnapshot([updated]).payments[0],
        });
    } catch (error) {
        const message = error?.code === 11000
            ? 'A matching recurring payment already exists.'
            : (error?.message || 'Unable to update recurring payment.');
        return NextResponse.json({ error: message }, { status: 400 });
    }
}

export async function DELETE(_request, { params }) {
    const auth = await requireAdmin(WRITE_ROLES);
    if (auth.error) {
        return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { id } = await params;

    await connectMongo();
    const deleted = await RecurringPayment.findByIdAndDelete(id);
    if (!deleted) {
        return NextResponse.json({ error: 'Recurring payment not found.' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
}
