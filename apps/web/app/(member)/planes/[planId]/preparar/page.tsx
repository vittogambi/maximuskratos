'use client';

import { Suspense } from 'react';
import { MenA1PrioritiesWorkspace } from '@/components/journey/MenA1PrioritiesWorkspace';
import { useParams, useSearchParams } from 'next/navigation';

function PrepararContent() {
  const params = useParams<{ planId: string }>();
  const searchParams = useSearchParams();
  const weekStart = searchParams.get('weekStart') ?? undefined;
  const territory = searchParams.get('territorio') ?? 'mentalidad';
  return (
    <MenA1PrioritiesWorkspace territory={territory} planId={params.planId} weekStart={weekStart} />
  );
}

export default function PrepararPrioridadesPage() {
  return (
    <Suspense fallback={<div className="mk-plans-wrap"><p className="mk-mx-next__body">Cargando.</p></div>}>
      <PrepararContent />
    </Suspense>
  );
}
