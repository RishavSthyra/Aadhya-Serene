export const SITE_VARIANTS = {
  APP: 'app',
  MARKETING: 'marketing',
};

export function getSiteVariantFromHost(hostname = '') {
  const normalizedHost = String(hostname).toLowerCase().trim();

  if (normalizedHost === 'app.aadhyaserene.com' || normalizedHost.startsWith('app.')) {
    return SITE_VARIANTS.APP;
  }

  return SITE_VARIANTS.MARKETING;
}

export function isReadyToMoveExperience(pathname = '/', siteVariant = SITE_VARIANTS.MARKETING) {
  return pathname.startsWith('/ready-to-move')
    || (pathname === '/' && siteVariant !== SITE_VARIANTS.APP);
}
