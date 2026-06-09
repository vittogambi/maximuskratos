import type { Metadata } from 'next';
import { Hanken_Grotesk, Libre_Caslon_Text, Geist } from 'next/font/google';
import './globals.css';
import { AuthSessionProvider } from '@/components/auth-session-provider';
import { cn } from '@/lib/utils';

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

const caslon = Libre_Caslon_Text({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-caslon',
  display: 'swap',
});

const hanken = Hanken_Grotesk({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-hanken',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'Maximus Kratos — Sistema Operativo para la Vida',
    template: '%s | Maximus Kratos',
  },
  description:
    'Maximus Kratos analiza quién eres, identifica quién puedes llegar a ser y construye un sistema personalizado para llevarte ahí.',
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
    <html lang="es" className={cn("dark", caslon.variable, hanken.variable, "font-sans", geist.variable)}>
      <body>
        <AuthSessionProvider>{children}</AuthSessionProvider>
      </body>
    </html>
  );
}
