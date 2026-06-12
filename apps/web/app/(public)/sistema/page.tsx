import type { Metadata } from 'next';
import { SistemaContent } from '@/components/pages/sistema-content';

export const metadata: Metadata = {
  title: 'El Sistema',
  description:
    'Visualiza el Sistema Operativo para la Vida. Claridad, dirección y consistencia en una plataforma que se activa por etapas.',
};

export default function SistemaPage() {
  return <SistemaContent />;
}
