import type { Metadata } from 'next';
import { SistemaContent } from '@/components/pages/sistema-content';

export const metadata: Metadata = {
  title: 'El Sistema',
  description:
    'La plataforma Maximus Kratos en web y móvil: diagnóstico, blueprint de vida y ejecución diaria con una sola cuenta.',
};

export default function SistemaPage() {
  return <SistemaContent />;
}
