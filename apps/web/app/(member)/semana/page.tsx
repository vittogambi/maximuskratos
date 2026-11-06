import type { Metadata } from 'next';
import { Suspense } from 'react';
import { CalendarScreen } from '@/components/journey/CalendarScreen';

export const metadata: Metadata = { title: 'Tu semana', robots: { index: false, follow: false } };

export default function SemanaPage() {
  return (
    <Suspense fallback={<p className="mk-m-muted">Cargando tu semana…</p>}>
      <CalendarScreen />
    </Suspense>
  );
}
