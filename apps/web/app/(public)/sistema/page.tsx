import type { Metadata } from 'next';
import { SistemaContent } from '@/components/pages/sistema-content';

export const metadata: Metadata = {
  title: 'El Sistema',
  description:
    'Maximus Kratos: acceso anticipado abierto. Diagnóstico, Perfil Maestro, Ruta MK y apps se lanzan juntos próximamente.',
};

export default function SistemaPage() {
  return <SistemaContent />;
}
