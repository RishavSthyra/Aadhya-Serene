import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { connectMongo } from './mongodb';
import { AdminUser } from './models';
import { SALES_EXECUTIVE_ROLE } from './lead-assignment';

export const ADMIN_COOKIE = 'aadhya_admin_session';
export const ADMIN_ROLES = ['super_admin', 'manager', 'sales_executive', 'channel_partner', 'lead_partner'];
export const WRITE_ROLES = ['super_admin', 'manager', 'sales_executive'];
export const INVENTORY_VIEW_ROLES = ['super_admin', 'manager', 'sales_executive', 'channel_partner'];
export const INVENTORY_WRITE_ROLES = ['super_admin', 'manager'];
export const LEAD_PARTNER_ROLE = 'lead_partner';
export const LEAD_PARTNER_SOURCES = ['aurum_analytica', '99acres', 'magicbricks'];

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
        leadSource: user.leadSource || '',
    };
}

export function signAdminToken(user) {
    return jwt.sign(
        {
            sub: String(user._id),
            email: user.email,
            role: user.role,
            leadSource: user.leadSource || '',
        },
        jwtSecret(),
        { expiresIn: '7d' },
    );
}

// This is intentionally used in API queries as well as the UI. Hiding navigation
// alone must never give an external partner access to another source's lead data.
export function getLeadScopeFilter(user) {
    if (user?.role === SALES_EXECUTIVE_ROLE) {
        return { assignedSalesExecutiveId: String(user._id || '') };
    }

    if (user?.role !== LEAD_PARTNER_ROLE) {
        return {};
    }

    if (!LEAD_PARTNER_SOURCES.includes(user.leadSource)) {
        return null;
    }

    return { source: user.leadSource };
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
