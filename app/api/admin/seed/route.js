import { NextResponse } from 'next/server';
import { requireAdmin } from '../../../../lib/admin-auth';
import { seedFlats } from '../../../../lib/flat-seed';

export async function POST() {
    const auth = await requireAdmin(['super_admin']);
    if (auth.error) {
        return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const result = await seedFlats({ overwrite: true });
    return NextResponse.json({ ok: true, result });
}
