import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { connectMongo } from './mongodb';
import { AdminUser } from './models';

export const ADMIN_COOKIE = 'aadhya_admin_session';
export const ADMIN_ROLES = ['super_admin', 'manager', 'channel_partner'];
export const WRITE_ROLES = ['super_admin', 'manager'];

function jwtSecret() {
    return process.env.JWT_SECRET || 'aadhya-serene-dev-secret';
}

export function publicUser(user) {
    if (!user) return null;

    return {
        id: String(user._id),
        name: user.name,
        email: user.email,
        role: user.role,
    };
}

export function signAdminToken(user) {
    return jwt.sign(
        {
            sub: String(user._id),
            email: user.email,
            role: user.role,
        },
        jwtSecret(),
        { expiresIn: '7d' },
    );
}

export async function getCurrentAdmin() {
    const cookieStore = await cookies();
    const token = cookieStore.get(ADMIN_COOKIE)?.value;

    if (!token) {
        return null;
    }

    try {
        const payload = jwt.verify(token, jwtSecret());
        await connectMongo();
        const user = await AdminUser.findById(payload.sub).lean();

        if (!user?.active) {
            return null;
        }

        return user;
    } catch {
        return null;
    }
}

export async function requireAdmin(roles = ADMIN_ROLES) {
    const user = await getCurrentAdmin();

    if (!user) {
        return { error: 'Unauthenticated', status: 401 };
    }

    if (!roles.includes(user.role)) {
        return { error: 'Forbidden', status: 403 };
    }

    return { user };
}
