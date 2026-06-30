import { headers } from 'next/headers';
import HomePageClient from './HomePageClient';
import ReadyToMoveLandingPage from '@/components/ReadyToMoveLandingPage';
import GoogleAdsTag from '@/components/GoogleAdsTag';
import { createPageMetadata } from '@/lib/seo';
import { getSiteVariantFromHost, SITE_VARIANTS } from '@/lib/site-variant';

const APP_HOME_ORIGIN = 'https://app.aadhyaserene.com';

const appHomeMetadataBase = createPageMetadata({
  title: 'Luxury Apartments in Thanisandra, Bengaluru',
  description:
    'Discover Aadhya Serene, premium 2 and 3 BHK apartments in Thanisandra, Bengaluru with curated amenities, walkthroughs, floor plans, and location insights.',
  path: '/',
  keywords: [
    'Aadhya Serene',
    'luxury apartments in Thanisandra',
    '2 BHK apartments in North Bengaluru',
    '3 BHK apartments in North Bengaluru',
    'premium apartments in Bengaluru',
  ],
});

const appHomeMetadata = {
  ...appHomeMetadataBase,
  alternates: {
    canonical: `${APP_HOME_ORIGIN}/`,
  },
  openGraph: {
    ...appHomeMetadataBase.openGraph,
    url: `${APP_HOME_ORIGIN}/`,
  },
};

const readyToMoveMetadata = createPageMetadata({
  title: 'Aadhya Serene | Near Possession Homes',
  description:
    'Explore the Aadhya Serene near-possession landing page with North Bangalore advantages, lifestyle highlights, delivery trust, and an enquiry flow.',
  path: '/',
  keywords: [
    'near possession homes in North Bangalore',
    'Aadhya Serene near possession',
    '2 BHK near possession apartments',
    '3 BHK near possession apartments',
    'apartments near Manyata Tech Park',
  ],
});

export async function generateMetadata() {
  const headerStore = await headers();
  const siteVariant = getSiteVariantFromHost(headerStore.get('host'));

  if (siteVariant === SITE_VARIANTS.APP) {
    return appHomeMetadata;
  }

  return readyToMoveMetadata;
}

export default async function Page() {
  const headerStore = await headers();
  const siteVariant = getSiteVariantFromHost(headerStore.get('host'));

  if (siteVariant === SITE_VARIANTS.APP) {
    return <HomePageClient />;
  }

  return (
    <>
      <GoogleAdsTag />
      <ReadyToMoveLandingPage />
    </>
  );
}
