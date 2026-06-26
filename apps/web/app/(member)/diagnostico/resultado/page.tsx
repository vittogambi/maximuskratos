import type { Metadata } from 'next';
import { PerfilContent } from '@/components/pages/PerfilContent';

export const metadata: Metadata = {
  title: 'Tu resultado | Maximus Kratos',
  robots: { index: false, follow: false },
};

export default function DiagnosticResultPage() {
  return <PerfilContent />;
}
