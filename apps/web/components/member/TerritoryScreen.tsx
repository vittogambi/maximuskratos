'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { getAccessToken } from '@/lib/auth-storage';
import { fetchTerritory } from '@/lib/journey-api';
import { apiDiagnosticStartTerritory } from '@/lib/api';
import { MemberPage } from './MemberPage';
import { MemberTabs } from './MemberTabs';

type Props = { territory: string };

type TerritoryPayload = {
  label?: string;
  coverage?: { settled?: number; required?: number; state?: string };
  plans?: { id: string; title: string; stage: string; isFocus: boolean }[];
};

export function TerritoryScreen({ territory }: Props) {
  const [payload, setPayload] = useState<TerritoryPayload | null>(null);
  const [tab, setTab] = useState<'discover' | 'design' | 'act'>('discover');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = getAccessToken();
    if (!token) {
      setError('Inicia sesión para ver este ámbito.');
      return;
    }
    fetchTerritory(token, territory)
      .then((raw) => setPayload(raw as TerritoryPayload))
      .catch(() => setError('No se pudo leer el ámbito.'));
  }, [territory]);

  const label = typeof payload?.label === 'string' ? payload.label : territory;

  if (error) {
    return (
      <MemberPage title="Ámbito" intro={error}>
        <Link href="/panel" className="mk-m-link">
          Volver al inicio
        </Link>
      </MemberPage>
    );
  }

  if (!payload) {
    return (
      <MemberPage title="Ámbito" intro="Leyendo cobertura y planes.">
        <div className="mk-m-skeleton" aria-hidden />
      </MemberPage>
    );
  }

  const coverage = payload.coverage;

  return (
    <MemberPage eyebrow="MK · ÁMBITO" title={label} intro="Descubre, diseña y actúa en este ámbito.">
      <MemberTabs
        labelledBy="mk-ambito-phases"
        active={tab}
        onChange={(id) => setTab(id as typeof tab)}
        tabs={[
          { id: 'discover', label: 'Descubre' },
          { id: 'design', label: 'Diseña' },
          { id: 'act', label: 'Actúa' },
        ]}
      />
      <div role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`}>
        {tab === 'discover' ? (
          <>
            <p className="mk-m-muted">
              {coverage?.settled ?? 0} de {coverage?.required ?? 0} respuestas. Estado: {coverage?.state ?? 'sin empezar'}.
            </p>
            <button
              type="button"
              className="mk-m-btn"
              onClick={() => {
                const token = getAccessToken();
                if (!token) {
                  window.location.href = '/login';
                  return;
                }
                void apiDiagnosticStartTerritory(token, territory).then(() => {
                  window.location.href = '/diagnostico';
                });
              }}
            >
              Continuar cuestionario del ámbito
            </button>
          </>
        ) : null}
        {tab === 'design' ? (
          <>
            {(payload.plans ?? []).length === 0 ? (
              <p className="mk-m-muted">No hay planes en este ámbito todavía.</p>
            ) : (
              <ul className="mk-m-plain-list">
                {(payload.plans ?? []).map((plan) => (
                  <li key={plan.id}>
                    <Link href="/planes" className="mk-m-link">
                      {plan.title}
                    </Link>
                    {plan.isFocus ? <span className="mk-m-muted"> · foco</span> : null}
                    <span className="mk-m-muted"> · {plan.stage}</span>
                  </li>
                ))}
              </ul>
            )}
            <Link href="/disenar" className="mk-m-btn">
              Diseñar plan
            </Link>
          </>
        ) : null}
        {tab === 'act' ? (
          <Link href="/semana" className="mk-m-btn">
            Ir a la semana
          </Link>
        ) : null}
      </div>
    </MemberPage>
  );
}
