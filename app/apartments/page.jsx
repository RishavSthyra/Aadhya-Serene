import Apartments from '../../components/Apartments';
import { createPageMetadata } from '@/lib/seo';

export const metadata = createPageMetadata({
  title: 'Apartments',
  description:
    'Browse available 2 and 3 BHK apartments at Aadhya Serene with floor-wise availability, sizes, facing, balconies, and detailed residence information.',
  path: '/apartments',
  keywords: [
    'Aadhya Serene apartments',
    '2 BHK apartments Thanisandra',
    '3 BHK apartments Thanisandra',
    'apartment availability Bengaluru',
    'floor plans Aadhya Serene',
  ],
});

export default function Page() {
  return <Apartments />;
}
