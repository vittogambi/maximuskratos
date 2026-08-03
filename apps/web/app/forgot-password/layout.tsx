import { buildPageMetadata } from '@/lib/seo';

export const metadata = buildPageMetadata({
  title: 'Recuperar contraseña',
  description: 'Solicita un enlace para restablecer tu contraseña de Maximus Kratos.',
  path: '/forgot-password',
  noIndex: true,
});

export default function ForgotPasswordLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
