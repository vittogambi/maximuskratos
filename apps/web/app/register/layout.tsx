import { buildPageMetadata } from '@/lib/seo';

export const metadata = buildPageMetadata({
  title: 'Crear cuenta',
  description: 'Crea tu cuenta de fundador en Maximus Kratos.',
  path: '/register',
  noIndex: true,
});

export default function RegisterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
