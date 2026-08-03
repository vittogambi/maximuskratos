import type { Metadata } from 'next';
import { PerfilContent } from '@/components/pages/PerfilContent';

export const metadata: Metadata = {
  title: 'Mi Perfil',
  robots: { index: false, follow: false },
};

export default function PerfilPage() {
  return <PerfilContent />;
}
