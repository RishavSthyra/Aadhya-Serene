import GoogleAdsTag from '@/components/GoogleAdsTag';
import PopupLeadRoute from '@/components/ReadyToMoveLandingPage/PopupLeadRoute';

export const metadata = {
  title: 'Aadhya Serene | Enquiry Form',
  description:
    'Submit your Aadhya Serene enquiry for pricing, floor plans, and a free site visit.',
};

export default function ReadyToMoveEnquiryPage() {
  return (
    <>
      <GoogleAdsTag />
      <PopupLeadRoute />
    </>
  );
}
