import Contact from '../../components/Contact';
import { createPageMetadata } from '@/lib/seo';

export const metadata = createPageMetadata({
  title: 'Contact and Site Visit',
  description:
    'Contact Aadhya Serene to enquire about pricing, availability, brochures, and site visits for premium apartments in Thanisandra, Bengaluru.',
  path: '/contact',
  keywords: [
    'contact Aadhya Serene',
    'book site visit Thanisandra apartment',
    'Aadhya Serene brochure',
    'Aadhya Serene enquiry',
  ],
});

export default function Page() {
  return <Contact />;
}
