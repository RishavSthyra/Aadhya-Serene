import { AdminSetting } from './models';
import {
    getDefaultLeadBucketConfig,
    isValidLeadBucketConfig,
    normalizeLeadBucketConfig,
} from './lead-bucket-config';

export const LEAD_BUCKET_CONFIG_SETTING_KEY = 'lead_bucket_config';

export async function getResolvedLeadBucketConfig() {
    const setting = await AdminSetting.findOne({ key: LEAD_BUCKET_CONFIG_SETTING_KEY }).lean();
    if (!setting || !isValidLeadBucketConfig(setting.value)) {
        return getDefaultLeadBucketConfig();
    }

    return normalizeLeadBucketConfig(setting.value);
}
