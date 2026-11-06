import type { Metadata } from 'next';
import { Suspense } from 'react';
import { DesignStudio } from '@/components/member/DesignStudio';

export const metadata: Metadata = { title: 'Diseñar', robots: { index: false, follow: false } };

export default async function DisenarPage({
  searchParams,
}: {
  searchParams: Promise<{ territorio?: string }>;
}) {
  const { territorio } = await searchParams;
  return (
    <Suspense fallback={<p className="mk-m-muted">Cargando diseñar.</p>}>
      <DesignStudio territory={territorio ?? null} />
    </Suspense>
  );
}
