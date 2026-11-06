'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { getAccessToken } from '@/lib/auth-storage';
import { fetchMemory, type MemoryView } from '@/lib/journey-api';
import { planStageLabel } from '@/lib/territory-ui-copy';
import { MemberPage } from './MemberPage';

export function MemoryScreen() {
  const searchParams = useSearchParams();
  const documentsRequested = searchParams.get('vista') === 'documentos';
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
      .catch(() => setError('No pudimos cargar tu memoria. Inténtalo nuevamente.'));
  }, []);

  if (error) {
    return (
      <MemberPage title="Memoria" intro={error}>
        <button type="button" className="mk-mx__action" onClick={() => window.location.reload()}>
          Reintentar
        </button>
      </MemberPage>
    );
  }

  if (!data) {
    return (
      <MemberPage title="Memoria" intro="Cargando tu memoria…">
        <div className="mk-m-skeleton" aria-hidden />
      </MemberPage>
    );
  }

  const plans = Array.isArray(data.plans) ? data.plans : [];
  const draft = data.draftPurpose && typeof data.draftPurpose === 'object'
    ? data.draftPurpose as { statement?: string | null }
    : null;

  return (
    <MemberPage
      eyebrow="MK · MEMORIA"
      title="Memoria"
      intro="Aquí puedes volver a tus logros, las direcciones que has definido y los planes que cerraste. Lo que registraste se conserva como parte de tu recorrido."
    >
      {documentsRequested ? (
        <p className="mk-m-callout" role="status">
          No hay una vista de documentos ni un perfil. Esta pantalla muestra planes y direcciones guardadas.
        </p>
      ) : null}
      {data.signedContract ? (
        <section className="mk-m-section">
          <h2 className="mk-m-section-title">Contrato firmado</h2>
          <p className="mk-m-muted">Puedes consultarlo, pero no modificarlo desde aquí.</p>
        </section>
      ) : null}
      {draft ? (
        <section className="mk-m-section">
          <h2 className="mk-m-section-title">
            {draft.statement ? 'Propósito en borrador' : 'Todavía no escribiste una dirección'}
          </h2>
          <Link href="/proposito" className="mk-m-link">
            {draft.statement ? 'Continuar en propósito' : 'Ir a tu dirección'}
          </Link>
        </section>
      ) : null}
      {Array.isArray(data.directionHistory) && data.directionHistory.length > 0 ? (
        <section className="mk-m-section">
          <h2 className="mk-m-section-title">Historial de dirección</h2>
          <ul className="mk-m-plain-list">
            {data.directionHistory.map((row) => (
              <li key={row.id}>
                {row.statement ? (
                  <>v{row.revision}: {row.statement}</>
                ) : row.crossPossibility ? (
                  <>
                    v{row.revision}: guardaste una posibilidad en el cruce. No es una dirección que hayas escrito.
                    <span className="mk-m-muted"> Propuesta: {row.crossPossibility}</span>
                  </>
                ) : (
                  <>v{row.revision}: todavía no hay una frase de dirección.</>
                )}
                {row.desiredChange ? <span className="mk-m-muted">. {row.desiredChange}</span> : null}
              </li>
            ))}
          </ul>
        </section>
      ) : null}
      <section className="mk-m-section">
        <h2 className="mk-m-section-title">Planes</h2>
        {plans.length === 0 ? (
          <p className="mk-m-muted">Todavía no hay planes en memoria.</p>
        ) : (
          <ul className="mk-m-plain-list">
            {plans.map((plan, index) => {
              const row = plan as {
                id?: string;
                title?: string;
                stage?: string;
                learningNote?: string | null;
                outcome?: string;
                whyItMatters?: string | null;
                directionStatement?: string | null;
              };
              const key = row.id ?? `plan-${index}`;
              return (
                <li key={key}>
                  <span>{row.title ?? 'Plan'}</span>
                  {row.stage ? <span className="mk-m-muted">. {planStageLabel(row.stage)}</span> : null}
                  {row.outcome ? <p className="mk-m-muted">Buscaba: {row.outcome}</p> : null}
                  {row.whyItMatters ? <p className="mk-m-muted">Por qué: {row.whyItMatters}</p> : null}
                  {row.directionStatement ? <p className="mk-m-muted">Dirección entonces: {row.directionStatement}</p> : null}
                  {row.learningNote ? <p className="mk-m-muted">Aprendizaje: {row.learningNote}</p> : null}
                </li>
              );
            })}
          </ul>
        )}
      </section>
      <p className="mk-m-muted">
        <Link href="/diagnostico/resultado" className="mk-m-link">
          Qué quedó guardado del cuestionario
        </Link>
      </p>
    </MemberPage>
  );
}
