import type { Metadata } from 'next';
import Script from 'next/script';
import { Barlow_Condensed, Geist, Hanken_Grotesk } from 'next/font/google';
import './globals.css';
import { AuthSessionProvider } from '@/components/auth-session-provider';
import { cn } from '@/lib/utils';

const geist = Geist({ subsets: ['latin'], variable: '--font-sans' });

/** Barlow Condensed — secondary fallback if self-hosted Bitte BC fails to load */
const bitteFallback = Barlow_Condensed({
  subsets: ['latin'],
  weight: ['600', '700', '800'],
  variable: '--font-bitte-fallback',
  display: 'swap',
});

/** Body, UI, labels — pairs with condensed industrial display */
const hanken = Hanken_Grotesk({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  style: ['normal', 'italic'],
  variable: '--font-hanken',
  display: 'swap',
});

export const viewport = {
  themeColor: '#0a0a0a',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export const metadata: Metadata = {
  title: {
    default: 'Maximus Kratos — Sistema Operativo para la Vida',
    template: '%s | Maximus Kratos',
  },
  description:
    'Maximus Kratos analiza quién eres, identifica quién puedes llegar a ser y construye un sistema personalizado para llevarte ahí.',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Maximus Kratos',
  },
  icons: {
    apple: '/icons/apple-touch-icon.png',
  },
  openGraph: {
    type: 'website',
    locale: 'es_CL',
    siteName: 'Maximus Kratos',
    title: 'Maximus Kratos — Sistema Operativo para la Vida',
    description:
      'Maximus Kratos analiza quién eres, identifica quién puedes llegar a ser y construye un sistema personalizado para llevarte ahí.',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="es"
      className={cn('dark', bitteFallback.variable, hanken.variable, 'font-sans', geist.variable)}
    >
      <body>
        <Script id="reload-scroll-top" strategy="beforeInteractive">
          {`(function(){try{if('scrollRestoration'in history)history.scrollRestoration='manual';var n=performance.getEntriesByType('navigation')[0];if(n&&n.type==='reload'&&location.hash){history.replaceState(null,'',location.pathname+location.search);scrollTo(0,0);}}catch(e){}})();`}
        </Script>
        <AuthSessionProvider>{children}</AuthSessionProvider>
      </body>
    </html>
  );
}
