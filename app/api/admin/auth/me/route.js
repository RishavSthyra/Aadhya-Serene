import { NextResponse } from 'next/server';
import { getCurrentAdmin, publicUser } from '../../../../../lib/admin-auth';

export async function GET() {
    const user = await getCurrentAdmin();

    if (!user) {
        return NextResponse.json({ user: null }, { status: 401 });
    }

    return NextResponse.json({ user: publicUser(user) });
}
