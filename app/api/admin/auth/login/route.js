import bcrypt from 'bcryptjs';
import { NextResponse } from 'next/server';
import { ADMIN_COOKIE, publicUser, signAdminToken } from '../../../../../lib/admin-auth';
import { connectMongo } from '../../../../../lib/mongodb';
import { AdminUser } from '../../../../../lib/models';

const COOKIE_MAX_AGE = 60 * 60 * 24 * 7;

export async function POST(request) {
    try {
        const body = await request.json();
        const email = String(body.email || '').trim().toLowerCase();
        const password = String(body.password || '');

        const mongooseConn = await connectMongo();
        const dbName =
            mongooseConn?.connection?.db?.databaseName
            || process.env.MONGODB_DB
            || 'AadhyaSerene';
        const user = await AdminUser.findOne({ email });
        const passwordMatches = user ? await bcrypt.compare(password, user.passwordHash) : false;

        console.log('[admin-login-debug]', {
            email,
            dbName,
            userFound: Boolean(user),
            userActive: Boolean(user?.active),
            passwordMatches,
        });

        if (!user?.active || !passwordMatches) {
            return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 });
        }

        const token = signAdminToken(user);
        const response = NextResponse.json({ user: publicUser(user) });
        response.cookies.set(ADMIN_COOKIE, token, {
            httpOnly: true,
            sameSite: 'lax',
            secure: process.env.NODE_ENV === 'production',
            path: '/',
            maxAge: COOKIE_MAX_AGE,
        });

        return response;
    } catch (error) {
        console.error('Unable to log in admin user', error);
        return NextResponse.json({ error: 'Unable to log in' }, { status: 500 });
    }
}
