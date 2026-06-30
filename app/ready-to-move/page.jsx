import ReadyToMoveLandingPage from '@/components/ReadyToMoveLandingPage';
import GoogleAdsTag from '@/components/GoogleAdsTag';

export const metadata = {
  title: 'Aadhya Serene | Near Possession Homes',
  description:
    'Explore the Aadhya Serene near-possession landing page with North Bangalore advantages, lifestyle highlights, delivery trust, and an enquiry flow.',
};

export default function ReadyToMovePage() {
  return (
    <>
      <GoogleAdsTag />
      <ReadyToMoveLandingPage />
    </>
  );
}
