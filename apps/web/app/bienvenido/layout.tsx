import { buildPageMetadata } from '@/lib/seo';

export const metadata = buildPageMetadata({
  title: 'Bienvenido',
  description: 'Redirección al panel Maximus Kratos.',
  path: '/bienvenido',
  noIndex: true,
});

export default function BienvenidoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
