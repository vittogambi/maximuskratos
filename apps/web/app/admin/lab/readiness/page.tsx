'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { LabNav } from '@/components/admin/lab/lab-nav';
import { LabCard, RadioCards, Skeleton } from '@/components/admin/lab/primitives';
import {
  labApi,
  type LabChangeSetRow,
  type LabFindingList,
  type LabReadiness,
  type LabRuleCoverage,
} from '@/lib/lab-api';
import { humanError } from '@/lib/lab-ui/format';

const DECISIONS = [
  { value: 'READY', label: 'Marcar Matriz v2 como lista' },
  { value: 'NOT_READY', label: 'Todavía no está lista' },
  { value: 'NEED_MORE_CASES', label: 'Necesitamos más casos' },
];

export default function LabReadinessPage() {
  const [data, setData] = useState<LabReadiness | null>(null);
  const [findings, setFindings] = useState<LabFindingList | null>(null);
  const [coverage, setCoverage] = useState<LabRuleCoverage | null>(null);
  const [accepted, setAccepted] = useState<LabChangeSetRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [decision, setDecision] = useState('');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    Promise.all([labApi.readiness(), labApi.findings(), labApi.ruleCoverage(), labApi.changeSets()])
      .then(([next, nextFindings, nextCoverage, nextSets]) => {
        setData(next);
        setFindings(nextFindings);
        setCoverage(nextCoverage);
        setAccepted(nextSets.changesets.filter((row) => row.status === 'ACCEPTED'));
      })
      .catch((err) => setError(humanError(err, 'No pudimos cargar esta pantalla.').message));
  }, []);

  const matrixFamilies = (data?.families ?? []).filter((family) => family.id !== 'purpose_silent');
  const familiesReviewed = matrixFamilies.filter((family) =>
    ['Validada', 'Con hallazgo', 'Necesita evidencia'].includes(family.status),
  ).length;
  const pendingFamilies = matrixFamilies.filter(
    (family) => family.status === 'Pendiente' || family.status === 'En revisión',
  ).length;
  const blockingFindings = (findings?.findings ?? []).filter(
    (item) => item.blocks_matrix && (item.status === 'OPEN' || item.status === 'NEEDS_MORE_CASES' || item.status === 'WORTH_TESTING'),
  ).length;
  const openImportant = (data?.findings.important_open ?? 0) + (data?.findings.critical_open ?? 0);
  const qa = coverage?.rows.filter((item) => item.kind === 'qa') ?? [];
  const qaCovered = qa.filter((item) => item.status === 'covered').length;
  const qaGap = qa.find((item) => item.status !== 'covered');
  const integrityIssues = (data?.integrity?.without_role ?? 0) + (data?.integrity?.broken_config ?? 0);
  const integrityOk = data?.integrity != null && integrityIssues === 0;
  const originPending = data?.review?.summary.fidelity_pending_matrix ?? 0;
  const recoveredMatrix = data?.review?.summary.fidelity_recovered_matrix ?? 0;
  const readyBlocked = Boolean(
    data && (pendingFamilies > 0 || openImportant > 0 || !integrityOk || Boolean(qaGap) || recoveredMatrix > 0),
  );

  const missing = [
    pendingFamilies ? `Terminar ${pendingFamilies} pruebas de casos.` : null,
    originPending ? `Resolver ${originPending} decisiones sobre información de los Excel.` : null,
    recoveredMatrix ? `Hay ${recoveredMatrix} decisiones que recuperan información para la Matriz.` : null,
    openImportant ? `Cerrar ${openImportant} hallazgos que bloquean la Matriz.` : null,
    !integrityOk ? 'Corregir integridad del banco de preguntas.' : null,
    qaGap ? qaGap.label : null,
  ].filter(Boolean) as string[];

  return (
    <div className="lab">
      <LabNav />
      <header className="lab-hero">
        <h1 className="admin-page-header__title">Estado de Matriz v2</h1>
      </header>
      {error ? (
        <div className="lab-alert lab-alert--danger">
          <p className="lab-alert__title">{error}</p>
        </div>
      ) : null}
      {!data ? (
        <Skeleton lines={8} />
      ) : (
        <div className="lab-stack">
          <LabCard title="Validación humana">
            <p className="lab-lead">
              {familiesReviewed} / {matrixFamilies.length || 12}
            </p>
          </LabCard>
          <LabCard title="Cobertura técnica">
            <p className="lab-lead">
              {qaCovered} / {qa.length}
            </p>
            {qaGap ? <p>{qaGap.label}.</p> : null}
          </LabCard>
          <LabCard title="Integridad diagnóstica">
            <p className="lab-lead">{integrityOk ? 'OK' : 'problema'}</p>
          </LabCard>
          <LabCard title="Hallazgos bloqueantes">
            <p className="lab-lead">{blockingFindings || openImportant}</p>
          </LabCard>
          <LabCard title="Decisiones de origen pendientes">
            <p className="lab-lead">{originPending}</p>
          </LabCard>

          <LabCard title="Qué falta">
            {missing.length === 0 ? (
              <p>No queda un bloqueo visible para Matriz v2.</p>
            ) : (
              <ul style={{ paddingLeft: '1.1rem' }}>
                {missing.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            )}
          </LabCard>

          <LabCard title="Otras capas de MK">
            <p>Dirección. En definición</p>
            <p>Motor de Intervención. No construido</p>
          </LabCard>

          <p>Versión actual: Matriz v2</p>
          {accepted.length ? (
            <p>
              <Link href="/admin/lab/versions">Crear versión candidata</Link>
            </p>
          ) : (
            <p className="lab-muted">No hay cambios aceptados para una nueva versión.</p>
          )}

          {readyBlocked ? (
            <p className="lab-muted">Todavía faltan revisiones antes de poder marcar la Matriz como lista.</p>
          ) : (
            <LabCard title="Cierre">
              <RadioCards name="ready-decision" value={decision} options={DECISIONS} onChange={setDecision} />
              <textarea
                className="lab-textarea"
                value={note}
                placeholder="Nota"
                onChange={(event) => setNote(event.target.value)}
              />
              <button
                type="button"
                className="lab-btn"
                disabled={busy || decision !== 'READY'}
                onClick={() => {
                  if (!data.candidate) return;
                  setBusy(true);
                  labApi
                    .decideReadiness({
                      candidate_ref: data.candidate.definition_ref,
                      decision,
                      note: note || null,
                    })
                    .then(() => labApi.readiness())
                    .then(setData)
                    .catch((err) => setError(humanError(err, 'No pudimos completar esta acción.').message))
                    .finally(() => setBusy(false));
                }}
              >
                Marcar Matriz v2 como lista
              </button>
            </LabCard>
          )}
        </div>
      )}
    </div>
  );
}
