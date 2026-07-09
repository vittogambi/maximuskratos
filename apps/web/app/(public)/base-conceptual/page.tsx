import type { Metadata } from 'next';
import { BaseConceptualContent } from '@/components/pages/base-conceptual-content';

export const metadata: Metadata = {
  title: 'Base conceptual',
  description:
    'La promesa de Maximus Kratos se apoya en cuatro dimensiones reales: propósito, autodominio, cuerpo y orden financiero y vital.',
};

export default function BaseConceptualPage() {
  return <BaseConceptualContent />;
}
