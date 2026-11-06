'use client';

import { Suspense } from 'react';
import { PlanDetailScreen } from '@/components/member/PlanDetailScreen';
import { useParams } from 'next/navigation';

function PlanDetailContent() {
  const params = useParams<{ planId: string }>();
  return <PlanDetailScreen planId={params.planId} />;
}

export default function PlanDetailPage() {
  return (
    <Suspense fallback={<div className="mk-plans-wrap"><div className="mk-mx-skeleton" aria-hidden><span /></div></div>}>
      <PlanDetailContent />
    </Suspense>
  );
}
