import type { Metadata } from 'next';
import { PerfilContent } from '@/components/pages/PerfilContent';

export const metadata: Metadata = {
  title: 'Mi Perfil | Maximus Kratos',
  robots: { index: false, follow: false },
};

export default function PerfilPage() {
  return <PerfilContent />;
}
