import type { Metadata } from 'next';
import { Suspense } from 'react';
import { WeekReviewScreen } from '@/components/journey/WeekReviewScreen';

export const metadata: Metadata = { title: 'Tu semana', robots: { index: false, follow: false } };

export default function SemanaRevisionPage() {
  return (
    <Suspense fallback={<div className="mk-week-wrap"><p className="mk-mx-next__body">Cargando la revisión…</p></div>}>
      <WeekReviewScreen />
    </Suspense>
  );
}
