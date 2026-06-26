import type { Metadata } from 'next';
import { CuentaContent } from '@/components/pages/CuentaContent';

export const metadata: Metadata = {
  title: 'Cuenta | Maximus Kratos',
  robots: { index: false, follow: false },
};

export default function CuentaPage() {
  return <CuentaContent />;
}
