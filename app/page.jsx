import HomePageClient from './HomePageClient';
import { createPageMetadata } from '@/lib/seo';

export const metadata = createPageMetadata({
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

export default function Page() {
  return <HomePageClient />;
}
