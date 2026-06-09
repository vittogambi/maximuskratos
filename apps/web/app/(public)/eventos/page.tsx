import type { Metadata } from 'next';
import { EventosContent } from '@/components/pages/eventos-content';

export const metadata: Metadata = {
  title: 'Eventos',
  description:
    'Eventos presenciales Maximus Kratos — jornadas intensivas de diagnóstico, estrategia y alineación de vida.',
};

export default function EventosPage() {
  return <EventosContent />;
}
