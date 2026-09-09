'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { LabNav } from '@/components/admin/lab/lab-nav';
import { LabCard, Skeleton } from '@/components/admin/lab/primitives';
import { labApi, type LabRuleCoverage } from '@/lib/lab-api';
import { humanError } from '@/lib/lab-ui/format';

const MODE_LABEL: Record<string, string> = {
  HUMAN: 'Humano',
  QA: 'QA',
  FIDELITY: 'Fidelidad',
  DIRECTION: 'Dirección',
  FUTURE: 'Futuro',
  NOT_APPLICABLE: 'No aplica',
};

export default function LabCoveragePage() {
  const [coverage, setCoverage] = useState<LabRuleCoverage | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    labApi
      .ruleCoverage()
      .then(setCoverage)
      .catch((err) => setError(humanError(err, 'No pudimos cargar la cobertura.').message));
  }, []);

  return (
    <div className="lab">
      <LabNav />
      <header className="lab-hero">
        <Link className="lab-btn lab-btn--ghost" href="/admin/lab/tech">
          Volver a Detalles técnicos
        </Link>
        <h1 className="admin-page-header__title">Cobertura metodológica</h1>
        <p className="lab-lead">Tabla técnica. No forma parte del recorrido diario.</p>
      </header>
      {error ? <p className="lab-error">{error}</p> : null}
      {!coverage ? (
        <Skeleton lines={10} />
      ) : (
        <div className="lab-stack">
          <LabCard title="Resumen">
            <p className="lab-lead">
              {(coverage.by_mode ?? [])
                .map((item) => `${MODE_LABEL[item.mode] ?? item.mode} ${item.covered} / ${item.total}`)
                .join('. ')}
            </p>
            {coverage.gaps.length ? (
              <p className="lab-muted">{coverage.gaps.length} huecos.</p>
            ) : (
              <p className="lab-muted">Sin huecos visibles en esta tabla.</p>
            )}
          </LabCard>
          <LabCard title="Reglas e interpretaciones">
            <div className="lab-simple-list">
              {coverage.rows.map((row) => (
                <article key={row.id} className="lab-simple-row">
                  <div>
                    <h3 className="lab-h4">{row.id}</h3>
                    <p className="lab-muted">{row.label}</p>
                    <p className="lab-muted">
                      {MODE_LABEL[row.mode ?? ''] ?? row.mode ?? row.kind}. {row.status}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          </LabCard>
        </div>
      )}
    </div>
  );
}
