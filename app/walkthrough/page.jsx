import Walkthrough from '../../components/Walkthrough';
import { createPageMetadata } from '@/lib/seo';

export const metadata = createPageMetadata({
  title: 'Project Walkthrough',
  description:
    'Take a guided walkthrough of Aadhya Serene and explore the project experience, architecture, approach, and key spaces before your site visit.',
  path: '/walkthrough',
  keywords: [
    'Aadhya Serene walkthrough',
    'project walkthrough Thanisandra',
    'apartment virtual tour Bengaluru',
    'Aadhya Serene project experience',
  ],
});

export default function Page() {
  return <Walkthrough />;
}

