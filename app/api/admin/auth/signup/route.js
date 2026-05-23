import bcrypt from 'bcryptjs';
import { NextResponse } from 'next/server';
import { ADMIN_COOKIE, publicUser, signAdminToken } from '../../../../../lib/admin-auth';
import { connectMongo } from '../../../../../lib/mongodb';
import { AdminUser, SignupKey } from '../../../../../lib/models';

const COOKIE_MAX_AGE = 60 * 60 * 24 * 7;

function normalizeRole(role) {
    return ['super_admin', 'manager', 'channel_partner'].includes(role)
        ? role
        : 'channel_partner';
}

export async function POST(request) {
    try {
        const body = await request.json();
        const name = String(body.name || '').trim();
        const email = String(body.email || '').trim().toLowerCase();
        const password = String(body.password || '');
        const requestedRole = normalizeRole(body.role);
        const secretKey = String(body.secretKey || '').trim();

        if (!name || !email || password.length < 8 || !secretKey) {
            return NextResponse.json(
                { error: 'Name, email, 8+ character password, and secret key are required.' },
                { status: 400 },
            );
        }

        await connectMongo();

        const userCount = await AdminUser.countDocuments();
        let role = requestedRole;
        let signupKey = null;

        if (userCount === 0 && secretKey === process.env.ADMIN_BOOTSTRAP_SECRET) {
            role = 'super_admin';
        } else {
            signupKey = await SignupKey.findOne({
                key: secretKey,
                active: true,
                usedAt: { $exists: false },
            });

            if (!signupKey) {
                return NextResponse.json({ error: 'Invalid or used signup key.' }, { status: 403 });
            }

            role = signupKey.role;
        }

        const existing = await AdminUser.findOne({ email });
        if (existing) {
            return NextResponse.json({ error: 'This email already has an admin account.' }, { status: 409 });
        }

        const passwordHash = await bcrypt.hash(password, 12);
        const user = await AdminUser.create({ name, email, passwordHash, role });

        if (signupKey) {
            signupKey.usedBy = user._id;
            signupKey.usedAt = new Date();
            signupKey.active = false;
            await signupKey.save();
        }

        const token = signAdminToken(user);
        const response = NextResponse.json({ user: publicUser(user) }, { status: 201 });
        response.cookies.set(ADMIN_COOKIE, token, {
            httpOnly: true,
            sameSite: 'lax',
            secure: process.env.NODE_ENV === 'production',
            path: '/',
            maxAge: COOKIE_MAX_AGE,
        });

        return response;
    } catch (error) {
        console.error('Unable to create admin user', error);
        return NextResponse.json({ error: 'Unable to create admin user' }, { status: 500 });
    }
}
