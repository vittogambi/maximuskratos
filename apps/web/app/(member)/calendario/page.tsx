import type { Metadata } from 'next';
import { ComingSoon } from '@/components/journey/ComingSoon';

export const metadata: Metadata = { title: 'Calendario', robots: { index: false, follow: false } };

export default function CalendarPage() {
  return (
    <ComingSoon
      title="Calendario"
      body="Aquí encontrarás las acciones del plan en su día, el registro de la semana y el cierre de la revisión."
    />
  );
}
