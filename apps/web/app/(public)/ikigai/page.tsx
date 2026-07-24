import type { Metadata } from 'next';
import { IkigaiContent } from '@/components/pages/ikigai-content';

export const metadata: Metadata = {
  title: 'IKIGAI',
  description:
    'El IKIGAI en Maximus Kratos: un eje de dirección entre significado, capacidad, contribución y sostenibilidad, integrado al Marco Central y al Perfil Maestro.',
};

export default function IkigaiPage() {
  return <IkigaiContent />;
}
