import type { Metadata } from 'next';
import { Suspense } from 'react';
import { PlansIndex } from '@/components/member/PlansIndex';

export const metadata: Metadata = { title: 'Tus planes', robots: { index: false, follow: false } };

export default function PlansPage() {
  return (
    <Suspense fallback={<div className="mk-plans-wrap"><div className="mk-mx-skeleton" aria-hidden><span /><span /></div></div>}>
      <PlansIndex />
    </Suspense>
  );
}
