'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { getAccessToken } from '@/lib/auth-storage';
import { apiBaseUrl } from '@/lib/api';
import { MemberPage } from '@/components/member/MemberPage';

export default function PlanMantenerPage() {
  const params = useParams<{ planId: string }>();
  const [preview, setPreview] = useState<{ minimumAction?: { title: string; doneWhen: string } | null; reviewSignal?: string } | null>(null);

  useEffect(() => {
    const token = getAccessToken();
    if (!token) return;
    fetch(`${apiBaseUrl()}/api/v1/journey/plans/${params.planId}/maintenance/preview`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => (res.ok ? res.json() : null))
      .then(setPreview)
      .catch(() => setPreview(null));
  }, [params.planId]);

  return (
    <MemberPage title="Mantenimiento" intro="Un mínimo a partir de lo que funcionó y una señal para volver.">
      {preview?.minimumAction ? (
        <p className="mk-m-muted">
          Mínimo propuesto: {preview.minimumAction.title}. {preview.minimumAction.doneWhen}
        </p>
      ) : (
        <p className="mk-m-muted">Todavía no hay propuesta de mantenimiento.</p>
      )}
      {preview?.reviewSignal ? <p className="mk-m-muted">{preview.reviewSignal}</p> : null}
    </MemberPage>
  );
}
