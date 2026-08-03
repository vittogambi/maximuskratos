import type { Metadata } from 'next';
import { RutaContent } from '@/components/pages/RutaContent';

export const metadata: Metadata = {
  title: 'Ruta MK',
  robots: { index: false, follow: false },
};

export default function RutaPage() {
  return <RutaContent />;
}
