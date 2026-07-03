import UserDataDeletionPage from '@/components/UserDataDeletionPage';
import { createPageMetadata } from '@/lib/seo';

export const metadata = createPageMetadata({
  title: 'User Data Deletion',
  description:
    'Follow these Aadhya Serene user data deletion instructions to request removal of enquiry details shared through the website, Meta lead ads, or WhatsApp.',
  path: '/user-data-deletion',
  keywords: [
    'Aadhya Serene user data deletion',
    'Aadhya Serene data deletion request',
    'Meta user data deletion instructions',
    'real estate lead deletion request',
  ],
});

export default function UserDataDeletionRoute() {
  return <UserDataDeletionPage />;
}
