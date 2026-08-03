import type { Metadata } from 'next';
import { CuentaContent } from '@/components/pages/CuentaContent';

export const metadata: Metadata = {
  title: 'Cuenta',
  robots: { index: false, follow: false },
};

export default function CuentaPage() {
  return <CuentaContent />;
}
