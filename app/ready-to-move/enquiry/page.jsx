import GoogleAdsTag from '@/components/GoogleAdsTag';
import EnquiryContactPage from '@/components/ReadyToMoveLandingPage/EnquiryContactPage';
import { createPageMetadata } from '@/lib/seo';

export const metadata = createPageMetadata({
  title: 'Contact Us',
  description:
    'Reach out to Aadhya Serene for pricing, floor plans, brochure requests, and site-visit support through our dedicated ready-to-move contact page.',
  path: '/ready-to-move/enquiry',
  keywords: [
    'Aadhya Serene contact page',
    'ready to move enquiry Bengaluru',
    'Aadhya Serene price sheet',
    'Aadhya Serene site visit form',
  ],
});

export default function ReadyToMoveEnquiryPage() {
  return (
    <>
      <GoogleAdsTag />
      <EnquiryContactPage />
    </>
  );
}
