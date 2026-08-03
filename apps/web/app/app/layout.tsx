import { buildPageMetadata } from '@/lib/seo';

export const metadata = buildPageMetadata({
  title: 'App',
  description: 'Entrada a la aplicación Maximus Kratos.',
  path: '/app',
  noIndex: true,
});

export default function AppEntryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
