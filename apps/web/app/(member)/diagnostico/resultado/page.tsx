import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { PerfilContent } from '@/components/pages/PerfilContent';
import { isEarlyAccessMode } from '@/lib/product-phase';

export const metadata: Metadata = {
  title: 'Tu resultado',
  robots: { index: false, follow: false },
};

export default function DiagnosticResultPage() {
  if (isEarlyAccessMode()) {
    redirect('/perfil');
  }

  return <PerfilContent />;
}
