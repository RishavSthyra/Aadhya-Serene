import TermsAndConditionsPage from '@/components/TermsAndConditionsPage';
import { createPageMetadata } from '@/lib/seo';

export const metadata = createPageMetadata({
  title: 'Terms & Conditions',
  description:
    'Read the Aadhya Serene terms and conditions for website usage, project information, brochure requests, enquiries, and communication rules.',
  path: '/terms-and-conditions',
  keywords: [
    'Aadhya Serene terms and conditions',
    'Aadhya Serene terms of service',
    'real estate website terms and conditions',
    'Aadhya Serene brochure terms',
  ],
});

export default function TermsAndConditionsRoute() {
  return <TermsAndConditionsPage />;
}
