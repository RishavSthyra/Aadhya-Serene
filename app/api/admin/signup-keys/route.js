import crypto from 'crypto';
import { NextResponse } from 'next/server';
import { requireAdmin } from '../../../../lib/admin-auth';
import { connectMongo } from '../../../../lib/mongodb';
import { SignupKey } from '../../../../lib/models';

const VALID_ROLES = ['super_admin', 'manager', 'channel_partner'];

export async function GET() {
    const auth = await requireAdmin(['super_admin']);
    if (auth.error) {
        return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    await connectMongo();
    const keys = await SignupKey.find({})
        .sort({ createdAt: -1 })
        .limit(30)
        .lean();

    return NextResponse.json({ keys });
}

export async function POST(request) {
    const auth = await requireAdmin(['super_admin']);
    if (auth.error) {
        return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const body = await request.json();
    const role = VALID_ROLES.includes(body.role) ? body.role : 'channel_partner';
    const key = `AS-${role.toUpperCase().replace(/_/g, '-')}-${crypto
        .randomBytes(12)
        .toString('hex')
        .toUpperCase()}`;

    await connectMongo();
    const signupKey = await SignupKey.create({
        key,
        role,
        createdBy: auth.user._id,
    });

    return NextResponse.json({ key: signupKey }, { status: 201 });
}
