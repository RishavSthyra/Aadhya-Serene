import PrivacyPolicyPage from '@/components/PrivacyPolicyPage';
import { createPageMetadata } from '@/lib/seo';

export const metadata = createPageMetadata({
  title: 'Privacy Policy',
  description:
    'Read the Aadhya Serene privacy policy for information about enquiries, brochure requests, WhatsApp conversations, site visits, and how project data is handled.',
  path: '/privacy-policy',
  keywords: [
    'Aadhya Serene privacy policy',
    'Aadhya Serene data policy',
    'real estate enquiry privacy policy',
    'Aadhya Serene WhatsApp privacy',
  ],
});

export default function PrivacyPolicyRoute() {
  return <PrivacyPolicyPage />;
}
