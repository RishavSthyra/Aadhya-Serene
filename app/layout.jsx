import './globals.css';
import Nav from './components/Nav';
import GlobalBackground from '@/components/GlobalBackground';

export const metadata = { title: 'Aadhya Serene' };

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <GlobalBackground />
        <Nav />
        {children}
      </body>
    </html>
  );
}
