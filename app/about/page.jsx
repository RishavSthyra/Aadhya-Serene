import About from '../../components/About';
import { createPageMetadata } from '@/lib/seo';

export const metadata = createPageMetadata({
  title: 'About the Project',
  description:
    'Learn about Aadhya Serene in Thanisandra, Bengaluru with project highlights, unit sizes, approvals, design intent, and key details for buyers.',
  path: '/about',
  keywords: [
    'Aadhya Serene project overview',
    'Aadhya Serene approvals',
    'Thanisandra apartment project',
    'North Bengaluru residential project',
  ],
});

export default function Page() {
  return <About />;
}
