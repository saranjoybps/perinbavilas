import { Playfair_Display, Inter, Cormorant_Garamond } from 'next/font/google';
import './globals.css';
import AuthProvider from '@/context/AuthContext';
import LenisProvider from '@/context/LenisContext';
import WelcomeGateProvider from '@/context/WelcomeGateContext';
import Navbar from '@/components/ui/Navbar';
import LoadingScreen from '@/components/ui/LoadingScreen';
import ScrollProgress from '@/components/ui/ScrollProgress';
import EnvelopeGate from '@/components/ui/EnvelopeGate';

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
      <head>
        {/* Runs before paint — covers home until welcome gate is ready (avoids hero flash) */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var p=location.pathname;if(p!=='/'&&p!=='')return;var f=/(?:^|[?&])welcome=1(?:&|$)/.test(location.search);var o=localStorage.getItem('pv-welcome-opened')==='1';var root=document.documentElement;if(f||!o){root.classList.add('pv-welcome-pending');}else{root.classList.add('pv-home-booting');}setTimeout(function(){root.classList.remove('pv-welcome-pending');root.classList.remove('pv-home-booting');},4000);}catch(e){}})();`,
          }}
        />
      </head>
      <body>
        <AuthProvider>
          <LenisProvider>
            <WelcomeGateProvider>
              <ScrollProgress />
              <LoadingScreen />
              <EnvelopeGate />
              <Navbar />
              {children}
            </WelcomeGateProvider>
          </LenisProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
