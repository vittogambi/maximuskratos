import type { Metadata } from 'next';
import { QuienesSomosContent } from '@/components/pages/quienes-somos-content';

export const metadata: Metadata = {
  title: 'Quiénes Somos',
  description:
    'Maximus Kratos — sistemas de desarrollo humano de alta precisión basados en diagnóstico, marcos estructurados y ejecución.',
};

export default function QuienesSomosPage() {
  return <QuienesSomosContent />;
}
