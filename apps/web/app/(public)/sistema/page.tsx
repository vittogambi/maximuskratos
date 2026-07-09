import type { Metadata } from 'next';
import { SistemaContent } from '@/components/pages/sistema-content';

export const metadata: Metadata = {
  title: 'El Sistema',
  description:
    'Visualiza tu tablero de control: claridad, dirección y consistencia en una plataforma que se activa por etapas.',
};

export default function SistemaPage() {
  return <SistemaContent />;
}
