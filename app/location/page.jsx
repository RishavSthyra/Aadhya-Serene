import LocationMapShell from '@/components/Location/LocationMapShell';
import { createPageMetadata } from '@/lib/seo';

export const metadata = createPageMetadata({
  title: 'Thanisandra Location and Connectivity',
  description:
    'See where Aadhya Serene is located in Thanisandra, North Bengaluru with quick access to tech parks, schools, hospitals, and key road networks.',
  path: '/location',
  keywords: [
    'Aadhya Serene location',
    'Thanisandra connectivity',
    'apartments near Manyata Tech Park',
    'North Bengaluru apartment location',
  ],
});

export default function Page() {
  return <LocationMapShell />;
}
