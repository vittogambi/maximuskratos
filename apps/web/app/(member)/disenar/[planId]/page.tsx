'use client';

import { Suspense } from 'react';
import { useParams } from 'next/navigation';
import { DesignStudio } from '@/components/member/DesignStudio';

export default function DisenarPlanPage() {
  const params = useParams<{ planId: string }>();
  return (
    <Suspense fallback={<p className="mk-m-muted">Cargando el borrador.</p>}>
      <DesignStudio planId={params.planId} />
    </Suspense>
  );
}
