'use client';

import { useParams } from 'next/navigation';
import { useState } from 'react';
import { getAccessToken } from '@/lib/auth-storage';
import { MemberPage } from '@/components/member/MemberPage';

export default function PlanLogroPage() {
  const params = useParams<{ planId: string }>();
  const [message, setMessage] = useState<string | null>(null);

  async function declare() {
    const token = getAccessToken();
    if (!token) {
      setMessage('Inicia sesión.');
      return;
    }
    const { apiBaseUrl } = await import('@/lib/api');
    const res = await fetch(`${apiBaseUrl()}/api/v1/journey/plans/${params.planId}/achievement`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ confirm: true }),
    });
    const body = await res.json().catch(() => ({}));
    setMessage(typeof body.message === 'string' ? body.message : res.ok ? 'Logro registrado.' : 'No se pudo declarar el logro.');
  }

  return (
    <MemberPage title="Declarar logro" intro="Confirma que el criterio del plan se cumplió.">
      <button type="button" className="mk-m-btn" onClick={() => void declare()}>
        Confirmar logro
      </button>
      {message ? <p className="mk-m-muted">{message}</p> : null}
    </MemberPage>
  );
}
