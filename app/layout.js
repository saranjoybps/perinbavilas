import { Playfair_Display, Inter, Cormorant_Garamond } from 'next/font/google';
import './globals.css';
import AuthProvider from '@/context/AuthContext';
import LenisProvider from '@/context/LenisContext';
import Navbar from '@/components/ui/Navbar';
import LoadingScreen from '@/components/ui/LoadingScreen';
import ScrollProgress from '@/components/ui/ScrollProgress';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
  display: 'swap',
});

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  variable: '--font-cormorant',
  display: 'swap',
});

export const metadata = {
  title: 'Perinba Vilas — Family Legacy',
  description: 'A legacy carried through generations with unity, warmth, and tradition.',
  openGraph: {
    title: 'Perinba Vilas',
    description: 'A legacy carried through generations.',
    type: 'website',
  },
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${playfair.variable} ${cormorant.variable}`}
      suppressHydrationWarning
    >
      <body>
        <AuthProvider>
          <LenisProvider>
            <ScrollProgress />
            <LoadingScreen />
            <Navbar />
            {children}
          </LenisProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
