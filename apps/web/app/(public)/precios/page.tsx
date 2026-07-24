import type { Metadata } from 'next';
import { PreciosContent } from '@/components/pages/precios-content';

export const metadata: Metadata = {
  title: 'Precios',
  description:
    'Un acceso a Maximus Kratos. Elige pagar mensual, trimestral, semestral o anual. Mismo contenido; más ahorro si pagas por adelantado.',
};

export default function PreciosPage() {
  return <PreciosContent />;
}
