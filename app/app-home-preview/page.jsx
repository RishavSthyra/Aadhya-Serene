import { notFound } from 'next/navigation';
import HomePageClient from '../HomePageClient';

export const metadata = {
  title: 'App Home Preview',
  robots: {
    index: false,
    follow: false,
  },
};

export default function AppHomePreviewPage() {
  if (process.env.NODE_ENV !== 'development') {
    notFound();
  }

  return <HomePageClient />;
}
