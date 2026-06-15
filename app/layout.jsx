import './globals.css';
import { headers } from 'next/headers';
import Nav from './components/Nav';
import GlobalBackground from '@/components/GlobalBackground';
import { rootMetadata } from '@/lib/seo';
import { getSiteVariantFromHost } from '@/lib/site-variant';
import { Cormorant_Garamond, DM_Sans, Quicksand } from 'next/font/google';

const sansFont = DM_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

const displayFont = Quicksand({
  subsets: ['latin'],
  variable: '--font-display',
  weight: ['500', '600', '700'],
  display: 'swap',
});

const heroFont = Cormorant_Garamond({
  subsets: ['latin'],
  variable: '--font-hero',
  weight: ['400', '500', '600'],
  display: 'swap',
});

export const metadata = rootMetadata;

export default async function RootLayout({ children }) {
  const headerStore = await headers();
  const siteVariant = getSiteVariantFromHost(headerStore.get('host'));

  return (
    <html lang="en" suppressHydrationWarning>
      <body
        suppressHydrationWarning
        className={`${sansFont.variable} ${displayFont.variable} ${heroFont.variable}`}
      >
        <GlobalBackground siteVariant={siteVariant} />
        <Nav siteVariant={siteVariant} />
        {children}
      </body>
    </html>
  );
}
