import type { Metadata } from 'next';
import Script from 'next/script';
import { Barlow_Condensed, Geist, Hanken_Grotesk, Noto_Serif } from 'next/font/google';
import './globals.css';
import { AuthSessionProvider } from '@/components/auth-session-provider';
import {
  organizationJsonLd,
  serializeJsonLd,
  websiteJsonLd,
} from '@/lib/schema';
import { buildRootMetadata } from '@/lib/seo';
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

/** Classical Greek — concept cards (Bitte BC has no Greek glyphs) */
const notoSerif = Noto_Serif({
  subsets: ['latin', 'greek'],
  weight: ['400', '600'],
  variable: '--font-noto-serif',
  display: 'swap',
});

export const viewport = {
  themeColor: '#0a0a0a',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export const metadata: Metadata = buildRootMetadata();

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="es"
      className={cn('dark', bitteFallback.variable, hanken.variable, notoSerif.variable, 'font-sans', geist.variable)}
      // The mk-intro-flag beforeInteractive script sets data-mk-intro pre-hydration.
      suppressHydrationWarning
    >
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: serializeJsonLd(organizationJsonLd(), websiteJsonLd()),
          }}
        />
        <Script id="reload-scroll-top" strategy="beforeInteractive">
          {`(function(){try{if('scrollRestoration'in history)history.scrollRestoration='manual';var n=performance.getEntriesByType('navigation')[0];if(n&&n.type==='reload'&&location.hash){history.replaceState(null,'',location.pathname+location.search);scrollTo(0,0);}}catch(e){}})();`}
        </Script>
        <Script id="mk-intro-flag" strategy="beforeInteractive">
          {`(function(){try{var p=location.pathname;var publicPaths=['/','/manifiesto','/marco-central','/sistema','/precios','/contacto','/eventos','/ikigai','/privacidad','/terminos'];var isPublic=publicPaths.indexOf(p)!==-1;if(!isPublic)return;if(sessionStorage.getItem('mk_intro_seen'))return;if(window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches){sessionStorage.setItem('mk_intro_seen','1');return;}document.documentElement.setAttribute('data-mk-intro','1');}catch(e){}})();`}
        </Script>
        <AuthSessionProvider>{children}</AuthSessionProvider>
      </body>
    </html>
  );
}
