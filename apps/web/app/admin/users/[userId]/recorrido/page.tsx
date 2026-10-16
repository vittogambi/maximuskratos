import { Suspense } from 'react';
import type { Metadata } from 'next';
import { RecorridoScreen } from '@/components/admin/recorrido-screen';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Recorrido',
  robots: { index: false, follow: false },
};

export default function RecorridoPage() {
  return (
    <Suspense fallback={<p>Leyendo el recorrido.</p>}>
      <RecorridoScreen />
    </Suspense>
  );
}
