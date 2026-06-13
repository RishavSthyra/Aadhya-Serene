import ProjectOverviewBook from '@/components/ProjectOverviewBook';
import { createPageMetadata } from '@/lib/seo';

export const metadata = createPageMetadata({
  title: 'Project Overview',
  description:
    'Explore the Aadhya Serene project overview through an interactive book experience with the current project imagery.',
  path: '/project-overview',
  keywords: [
    'Aadhya Serene project overview',
    'Aadhya Serene brochure book',
    'Thanisandra apartment project overview',
    'Aadhya Serene gallery book',
  ],
});

export default function Page() {
  return <ProjectOverviewBook />;
}

