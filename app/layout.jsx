import './globals.css';
import Nav from './components/Nav';
import GlobalBackground from '@/components/GlobalBackground';
import { rootMetadata } from '@/lib/seo';
import { DM_Sans, Quicksand } from 'next/font/google';

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

export const metadata = rootMetadata;

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        suppressHydrationWarning
        className={`${sansFont.variable} ${displayFont.variable}`}
      >
        <GlobalBackground />
        <Nav />
        {children}
      </body>
    </html>
  );
}
