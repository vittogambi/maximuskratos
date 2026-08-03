import { buildPageMetadata } from '@/lib/seo';

export const metadata = buildPageMetadata({
  title: 'Restablecer contraseña',
  description: 'Define una nueva contraseña para tu cuenta Maximus Kratos.',
  path: '/reset-password',
  noIndex: true,
});

export default function ResetPasswordLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
