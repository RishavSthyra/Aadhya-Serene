import { NextResponse } from 'next/server';
import { requireAdmin } from '../../../../lib/admin-auth';
import {
    getDefaultLeadBucketConfig,
    isValidLeadBucketConfig,
    normalizeLeadBucketConfig,
} from '../../../../lib/lead-bucket-config';
import { connectMongo } from '../../../../lib/mongodb';
import { AdminSetting } from '../../../../lib/models';
import { LEAD_BUCKET_CONFIG_SETTING_KEY } from '../../../../lib/lead-bucket-settings';

const LEAD_BUCKET_CONFIG_KEY = LEAD_BUCKET_CONFIG_SETTING_KEY;
const SETTINGS_WRITE_ROLES = ['super_admin', 'manager'];

function serializeConfig(value) {
    return normalizeLeadBucketConfig(value).map((item) => ({ ...item }));
}

export async function GET() {
    const auth = await requireAdmin();
    if (auth.error) {
        return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    await connectMongo();
    const setting = await AdminSetting.findOne({ key: LEAD_BUCKET_CONFIG_KEY }).lean();
    const config = setting && isValidLeadBucketConfig(setting.value)
        ? serializeConfig(setting.value)
        : getDefaultLeadBucketConfig();

    return NextResponse.json({
        key: LEAD_BUCKET_CONFIG_KEY,
        config,
        defaultsUsed: !setting || !isValidLeadBucketConfig(setting.value),
    });
}

export async function PATCH(request) {
    const auth = await requireAdmin(SETTINGS_WRITE_ROLES);
    if (auth.error) {
        return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    let body;
    try {
        body = await request.json();
    } catch {
        return NextResponse.json({ error: 'Request body must be valid JSON.' }, { status: 400 });
    }

    const value = body?.config ?? body?.value;
    if (!isValidLeadBucketConfig(value)) {
        return NextResponse.json({
            error: 'Bucket configuration must contain exactly the supported buckets with valid labels, descriptions, order, enabled, and color values.',
        }, { status: 400 });
    }

    const config = serializeConfig(value);
    await connectMongo();
    const setting = await AdminSetting.findOneAndUpdate(
        { key: LEAD_BUCKET_CONFIG_KEY },
        {
            $set: {
                value: config,
                updatedBy: auth.user._id,
            },
        },
        { new: true, upsert: true, setDefaultsOnInsert: true },
    ).lean();

    return NextResponse.json({
        key: LEAD_BUCKET_CONFIG_KEY,
        config: serializeConfig(setting?.value || config),
        defaultsUsed: false,
    });
}
