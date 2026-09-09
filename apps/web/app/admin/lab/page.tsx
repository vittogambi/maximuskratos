'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { LabNav } from '@/components/admin/lab/lab-nav';
import { LabCard, Skeleton } from '@/components/admin/lab/primitives';
import { labApi, type LabReviewAgenda, type LabSessionProgress } from '@/lib/lab-api';
import { humanError } from '@/lib/lab-ui/format';

function familyAction(status: string) {
  if (status === 'Validada' || status === 'Con hallazgo' || status === 'Necesita evidencia') return 'Ver revisión';
  if (status === 'En revisión') return 'Continuar';
  return 'Revisar';
}

export default function LabInboxPage() {
  const [progress, setProgress] = useState<LabSessionProgress | null>(null);
  const [agenda, setAgenda] = useState<LabReviewAgenda | null>(null);
  const [error, setError] = useState<ReturnType<typeof humanError> | null>(null);

  useEffect(() => {
    Promise.all([labApi.sessionProgress(), labApi.reviewAgenda()])
      .then(([next, nextAgenda]) => {
        setProgress(next);
        setAgenda(nextAgenda);
      })
      .catch((err) => setError(humanError(err, 'No pudimos cargar las pruebas.')));
  }, []);

  const families = (progress?.families ?? []).filter(
    (item) => item.review_surface !== 'frontier' && item.id !== 'purpose_silent',
  );
  const reviewed = families.filter((item) => item.status !== 'Pendiente').length;
  const withFindings = families.filter((item) => item.status === 'Con hallazgo').length;

  return (
    <div className="lab">
      <LabNav />
      <header className="lab-hero">
        <h1 className="admin-page-header__title">Revisión de Matriz v2</h1>
        <p className="lab-lead">Revisa lo pendiente para poder cerrar Matriz v2.</p>
      </header>

      {error ? (
        <div className="lab-alert lab-alert--danger" role="alert">
          <p className="lab-alert__title">{error.message}</p>
        </div>
      ) : null}

      {!agenda ? (
        <Skeleton lines={8} />
      ) : (
        <div className="lab-stack">
          <LabCard title="Siguiente" tone="accent">
            <h2 className="lab-h2">{agenda.next.title}</h2>
            <p>{agenda.next.lead}</p>
            <div className="lab-actions">
              <Link className="lab-btn" href={agenda.next.href}>
                {agenda.next.cta}
              </Link>
            </div>
          </LabCard>

          {agenda.tracks.map((track) => {
            const complete = track.done >= track.total && track.total > 0;
            return (
              <LabCard key={track.id} title={track.title}>
                <p className="lab-lead">
                  {track.done} / {track.total}
                  {complete ? '. Completado' : ''}
                </p>
                <p>{track.question}</p>
                <div className="lab-actions">
                  <Link className={complete ? 'lab-btn lab-btn--ghost' : 'lab-btn'} href={track.href}>
                    {track.cta}
                  </Link>
                </div>
              </LabCard>
            );
          })}

          <p className="lab-muted">{agenda.rule}</p>
          <div className="lab-actions">
            <Link className="lab-btn lab-btn--ghost" href="/admin/lab/cases/new">
              Crear caso propio
            </Link>
          </div>
        </div>
      )}

      <section style={{ marginTop: '1.75rem' }} aria-label="Pruebas de Matriz">
        {!progress ? (
          <Skeleton lines={3} />
        ) : (
          <details className="lab-details">
            <summary>
              <span>
                Pruebas de Matriz. {reviewed} de {families.length} revisadas
                {withFindings ? `. ${withFindings} con hallazgos` : ''}
              </span>
              <span className="lab-details__open">Ver todas</span>
            </summary>
            <div className="lab-simple-list">
              {families.map((family) => (
                <article key={family.id} className="lab-simple-row">
                  <div>
                    <h3 className="lab-h4">{family.label}</h3>
                    <p className="lab-muted">{family.question ?? family.intent ?? '—'}</p>
                    <p className="lab-muted">{family.status}</p>
                  </div>
                  <Link href={`/admin/lab/families/${family.id}`}>{familyAction(family.status)}</Link>
                </article>
              ))}
            </div>
          </details>
        )}
      </section>
    </div>
  );
}
