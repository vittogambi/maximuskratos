'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { labApi, type LabCaseRow } from '@/lib/lab-api';
import { humanError } from '@/lib/lab-ui/format';
import { labUiLabels } from '@/lib/lab-ui/labels';
import { getLabRunHumanStatus, matrixTrackLabel } from '@/lib/lab-ui/status';

export function CaseCard({
  item,
  compactActions,
  familyId,
  reviewLabel,
}: {
  item: LabCaseRow;
  compactActions?: boolean;
  familyId?: string;
  reviewLabel?: string;
}) {
  const router = useRouter();
  const [simulating, setSimulating] = useState(false);
  const [simError, setSimError] = useState<string | null>(null);
  const run = item.latest_run;
  const canSimulate = run?.status === 'REVEALED';
  const familyDone = familyId
    ? Boolean(item.family_reviews?.[familyId]?.case_done)
    : item.matrix_review_complete;
  const progress = {
    status: run?.status ?? 'COLLECTING',
    has_expectation: run?.has_expectation,
    has_review: run?.has_review,
    has_case_verdict: run?.has_case_verdict,
    has_purpose: run?.has_purpose,
    has_product_review: run?.has_product_review,
    has_findings: item.has_findings,
  };
  const status = getLabRunHumanStatus(progress);
  const cta = familyDone ? 'Ver revisión' : 'Continuar';
  const runHref = run
    ? `/admin/lab/runs/${run.id}${familyId ? `?family=${encodeURIComponent(familyId)}` : ''}`
    : null;
  const statusLabel = reviewLabel ?? matrixTrackLabel(progress);
  const statusTone = reviewLabel ? (reviewLabel === 'Revisada' ? 'done' : 'pending') : status.tone;
  return (
    <article className="lab-casecard">
      <div className="lab-casecard__top">
        <h3 className="lab-case__title">{item.label}</h3>
        {item.casebook_key ? null : <span className="lab-badge">{labUiLabels.caseKind(item.kind)}</span>}
      </div>
      <p className="lab-case__desc">{item.story?.trim() || 'Este caso todavía no tiene historia cargada.'}</p>
      {item.test_intent && !familyId ? <p className="lab-case__intent">Qué estamos probando: {item.test_intent}</p> : null}
      <div className="lab-casecard__top">
        <span className={`lab-status lab-status--${statusTone}`}>
          <span className="lab-status__dot" aria-hidden="true" />
          <span style={{ fontSize: 13 }}>{statusLabel}</span>
        </span>
        <div className="lab-case__side">
          {run && runHref ? (
            <Link className={familyDone ? 'lab-btn lab-btn--ghost' : 'lab-btn'} href={runHref}>
              {cta}
            </Link>
          ) : (
            <Link className="lab-btn lab-btn--ghost" href={`/admin/lab/cases/${item.id}`}>
              Ver caso
            </Link>
          )}
          {canSimulate && !compactActions ? (
            <details className="lab-details" style={{ margin: 0, padding: '0.4rem 0.7rem' }}>
              <summary>Más acciones</summary>
              <button
                type="button"
                className="lab-btn lab-btn--ghost"
                disabled={simulating}
                onClick={() => {
                  setSimulating(true);
                  setSimError(null);
                  labApi
                    .duplicateCase(item.id)
                    .then((created) => router.push(`/admin/lab/runs/${created.run.id}`))
                    .catch((err) => setSimError(humanError(err, 'No pudimos crear la simulación.').message))
                    .finally(() => setSimulating(false));
                }}
              >
                Crear simulación desde este caso
              </button>
            </details>
          ) : null}
        </div>
      </div>
      {simError ? <p className="lab-hint">{simError}</p> : null}
    </article>
  );
}
