import type { Metadata } from 'next';
import { QuienesSomosContent } from '@/components/pages/quienes-somos-content';

export const metadata: Metadata = {
  title: 'Quiénes Somos',
  description:
    'Por qué existe Maximus Kratos: origen, creencias y la decisión de construir un sistema operativo para la vida.',
};

export default function QuienesSomosPage() {
  return <QuienesSomosContent />;
}
