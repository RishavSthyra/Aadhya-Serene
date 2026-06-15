import { headers } from 'next/headers';
import HomePageClient from './HomePageClient';
import ReadyToMoveLandingPage from '@/components/ReadyToMoveLandingPage';
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
  title: 'Aadhya Serene | Ready To Move Homes',
  description:
    'Explore the Aadhya Serene ready-to-move landing page with North Bangalore advantages, lifestyle highlights, delivered-project trust, and a booking enquiry flow.',
  path: '/',
  keywords: [
    'ready to move homes in North Bangalore',
    'Aadhya Serene ready to move',
    '2 BHK ready to move apartments',
    '3 BHK ready to move apartments',
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

  return <ReadyToMoveLandingPage />;
}
