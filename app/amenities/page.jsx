import Amenities from '../../components/Amenities';
import { createPageMetadata } from '@/lib/seo';

export const metadata = createPageMetadata({
  title: 'Amenities',
  description:
    'Explore rooftop leisure, fitness, family, and lifestyle amenities at Aadhya Serene, a premium apartment community in Thanisandra, Bengaluru.',
  path: '/amenities',
  keywords: [
    'Aadhya Serene amenities',
    'apartment amenities in Thanisandra',
    'clubhouse and rooftop amenities Bengaluru',
    'premium lifestyle apartments Bengaluru',
  ],
});

export default async function Page({ searchParams }) {
  const resolvedSearchParams = await searchParams;
  const initialAmenity = typeof resolvedSearchParams?.amenity === 'string'
    ? resolvedSearchParams.amenity
    : null;

  return <Amenities initialAmenity={initialAmenity} />;
}
