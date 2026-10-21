'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { getAccessToken } from '@/lib/auth-storage';
import { fetchMemory, type MemoryView } from '@/lib/journey-api';
import { MemberPage } from './MemberPage';

export function MemoryScreen() {
  const [data, setData] = useState<MemoryView | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = getAccessToken();
    if (!token) {
      setError('Inicia sesión para ver tu memoria.');
      return;
    }
    fetchMemory(token)
      .then(setData)
      .catch(() => setError('No se pudo leer la memoria.'));
  }, []);

  if (error) {
    return (
      <MemberPage title="Memoria" intro={error}>
        <p className="mk-m-muted">Reintenta en un momento.</p>
      </MemberPage>
    );
  }

  if (!data) {
    return (
      <MemberPage title="Memoria" intro="Recuperando lo que guardaste.">
        <div className="mk-m-skeleton" aria-hidden />
      </MemberPage>
    );
  }

  const plans = Array.isArray(data.plans) ? data.plans : [];

  return (
    <MemberPage
      eyebrow="MK · MEMORIA"
      title="Memoria"
      intro="Logros, propósito y planes cerrados. Nada se reescribe desde aquí."
    >
      {data.signedContract ? (
        <section className="mk-m-section">
          <h2 className="mk-m-section-title">Contrato firmado</h2>
          <p className="mk-m-muted">Conservado en solo lectura.</p>
        </section>
      ) : null}
      {data.draftPurpose ? (
        <section className="mk-m-section">
          <h2 className="mk-m-section-title">Propósito en borrador</h2>
          <Link href="/proposito" className="mk-m-link">
            Continuar en propósito
          </Link>
        </section>
      ) : null}
      <section className="mk-m-section">
        <h2 className="mk-m-section-title">Planes</h2>
        {plans.length === 0 ? (
          <p className="mk-m-muted">Todavía no hay planes en memoria.</p>
        ) : (
          <ul className="mk-m-plain-list">
            {plans.map((plan, index) => {
              const row = plan as { id?: string; title?: string; stage?: string };
              const key = row.id ?? `plan-${index}`;
              return (
                <li key={key}>
                  <span>{row.title ?? 'Plan'}</span>
                  {row.stage ? <span className="mk-m-muted"> · {row.stage}</span> : null}
                </li>
              );
            })}
          </ul>
        )}
      </section>
      <p className="mk-m-muted">
        <Link href="/diagnostico/resultado" className="mk-m-link">
          Ver auditoría histórica
        </Link>
      </p>
    </MemberPage>
  );
}
