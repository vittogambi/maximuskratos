'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { LabNav } from '@/components/admin/lab/lab-nav';
import { LabCard, Skeleton } from '@/components/admin/lab/primitives';
import { labApi, type LabFindingList, type LabObservationList } from '@/lib/lab-api';
import { humanError } from '@/lib/lab-ui/format';
import { labUiLabels } from '@/lib/lab-ui/labels';

export default function LabFindingsPage() {
  const [data, setData] = useState<LabFindingList | null>(null);
  const [observations, setObservations] = useState<LabObservationList | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([labApi.findings(), labApi.observations()])
      .then(([next, nextObs]) => {
        setData(next);
        setObservations(nextObs);
      })
      .catch((err) => setError(humanError(err, 'No pudimos cargar los hallazgos.').message));
  }, []);

  const findings = (data?.findings ?? []).filter((item) => item.status !== 'DISCARDED');
  const drafts = findings.filter((item) => item.status === 'DRAFT').length;
  const open = findings.filter(
    (item) => item.status === 'OPEN' || item.status === 'NEEDS_MORE_CASES' || item.status === 'WORTH_TESTING',
  ).length;
  const blocking = findings.filter(
    (item) =>
      item.blocks_matrix &&
      (item.status === 'OPEN' || item.status === 'NEEDS_MORE_CASES' || item.status === 'WORTH_TESTING'),
  ).length;

  const lead = (() => {
    if (!data) return null;
    if (findings.length === 0) return null;
    if (!open && drafts && !blocking) return drafts === 1 ? '1 borrador' : `${drafts} borradores`;
    const parts: string[] = [];
    if (open) parts.push(`${open} abiertos`);
    if (drafts) parts.push(drafts === 1 ? '1 borrador' : `${drafts} borradores`);
    parts.push(`${blocking} bloquean la Matriz`);
    return parts.join(' · ');
  })();
  const observedCount = observations?.questions.length ?? 0;

  return (
    <div className="lab">
      <LabNav />
      <header className="lab-hero">
        <h1 className="admin-page-header__title">Hallazgos</h1>
        {data ? (
          <p className="lab-lead">
            {lead}
          </p>
        ) : null}
      </header>
      {error ? (
        <div className="lab-alert lab-alert--danger" role="alert">
          <p className="lab-alert__title">{error}</p>
        </div>
      ) : null}
      <section>
        {!data ? (
          <Skeleton lines={4} />
        ) : findings.length === 0 ? (
          <div className="lab-empty">
            <p style={{ margin: 0 }}>Aún no hay hallazgos.</p>
          </div>
        ) : (
          <div className="lab-simple-list">
            {findings.map((item) => (
              <article key={item.id} className="lab-simple-row">
                <div>
                  <h2 className="lab-h4">
                    <Link href={`/admin/lab/findings/${item.id}`}>{item.title}</Link>
                  </h2>
                  <p className="lab-muted">
                    {labUiLabels.findingStatus(item.status)} · {labUiLabels.findingSeverity(item.severity)}
                  </p>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
      {observedCount > 0 ? (
        <section style={{ marginTop: '1.5rem' }}>
          <LabCard title="Preguntas observadas">
            <p>{observedCount} preguntas con observaciones.</p>
            <Link href="/admin/lab/findings/questions">Ver preguntas observadas</Link>
          </LabCard>
        </section>
      ) : null}
    </div>
  );
}
