import type { Metadata } from 'next';
import { MarcoCentralContent } from '@/components/pages/marco-central-content';

export const metadata: Metadata = {
  title: 'Marco Central',
  description:
    'Los 8 pilares del proceso de auditoría y autodescubrimiento de Maximus Kratos, y el marco filosófico que los sostiene: arquetipo, sombra y Hoja de Ruta de Propósito.',
};

export default function MarcoCentralPage() {
  return <MarcoCentralContent />;
}
