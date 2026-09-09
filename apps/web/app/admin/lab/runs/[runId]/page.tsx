'use client';

import { use } from 'react';
import { LabSession } from '@/components/admin/lab-session';

export default function LabRunPage({
  params,
  searchParams,
}: {
  params: Promise<{ runId: string }>;
  searchParams: Promise<{ family?: string }>;
}) {
  const { runId } = use(params);
  const query = use(searchParams);
  return <LabSession runId={runId} focusFamilyId={query.family ?? null} />;
}
