'use client';

import Link from 'next/link';
import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FacilitatorBrief } from '@/components/admin/lab/step-case';
import { ErrorNote, LabCard, Skeleton } from '@/components/admin/lab/primitives';
import { labApi, type LabCaseDetail } from '@/lib/lab-api';
import { humanError } from '@/lib/lab-ui/format';
import { labUiLabels } from '@/lib/lab-ui/labels';
import { getLabRunHumanStatus } from '@/lib/lab-ui/status';

export default function LabCasePage({ params }: { params: Promise<{ caseId: string }> }) {
  const { caseId } = use(params);
  const router = useRouter();
  const [item, setItem] = useState<LabCaseDetail | null>(null);
  const [error, setError] = useState<ReturnType<typeof humanError> | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    labApi
      .case(caseId)
      .then(setItem)
      .catch((err) => setError(humanError(err, 'No pudimos cargar este caso.')));
  }, [caseId]);

  if (!item) {
    return <div className="lab">{error ? <ErrorNote error={error} /> : <Skeleton lines={5} />}</div>;
  }

  return (
    <div className="lab">
      <header className="lab-casehead">
        <Link className="lab-btn lab-btn--ghost" href="/admin/lab">
          Volver a casos
        </Link>
        <div className="lab-casehead__top">
          <h1 className="lab-casehead__title">{item.label}</h1>
        </div>
        <div className="lab-case__meta">
          {item.runs.some((run) => run.status === 'REVEALED') && item.test_intent ? (
            <p className="lab-case__intent">Qué estamos probando: {item.test_intent}</p>
          ) : (
            <span className="lab-badge">{labUiLabels.caseKind(item.kind)}</span>
          )}
        </div>
        {item.runs.some((run) => run.status === 'REVEALED') ? (
          <div className="lab-actions" style={{ marginTop: '0.75rem' }}>
            <button
              type="button"
              className="lab-btn"
              disabled={busy}
              onClick={() => {
                setBusy(true);
                labApi
                  .duplicateCase(item.id)
                  .then((created) => router.push(`/admin/lab/runs/${created.run.id}`))
                  .catch((err) => setError(humanError(err, 'No pudimos simular este caso.')))
                  .finally(() => setBusy(false));
              }}
            >
              Simular otras respuestas
            </button>
          </div>
        ) : null}
      </header>

      <LabCard title="La situación">
        <p className="lab-lead" style={{ whiteSpace: 'pre-line' }}>
          {item.expert_context?.trim() || 'Este caso todavía no tiene historia cargada.'}
        </p>
      </LabCard>

      <div style={{ marginTop: '1.25rem' }}>
        <LabCard title="Sesiones de este caso">
          {item.runs.length === 0 ? (
            <p className="lab-muted">Todavía no hay ninguna sesión abierta para este caso.</p>
          ) : (
            <div className="lab-caselist">
              {item.runs.map((run) => (
                <div key={run.id} className="lab-picked__item">
                  <span>{getLabRunHumanStatus(run).label}</span>
                  <Link className="lab-btn lab-btn--ghost" href={`/admin/lab/runs/${run.id}`}>
                    Abrir
                  </Link>
                </div>
              ))}
            </div>
          )}
        </LabCard>
      </div>

      {item.facilitator_note ? (
        <div style={{ marginTop: '1.25rem' }}>
          <FacilitatorBrief note={item.facilitator_note} />
        </div>
      ) : null}
    </div>
  );
}
