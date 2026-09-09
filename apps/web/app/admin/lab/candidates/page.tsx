'use client';

import { useEffect, useState } from 'react';
import { ComposeAcceptedChanges } from '@/components/admin/lab/compose-accepted';
import { LabNav } from '@/components/admin/lab/lab-nav';
import { LabCard, Skeleton } from '@/components/admin/lab/primitives';
import { labApi, type LabCandidateList, type LabChangeSetRow, type LabContracts, type LabReplay } from '@/lib/lab-api';
import { humanError } from '@/lib/lab-ui/format';
import { labUiLabels } from '@/lib/lab-ui/labels';

export default function LabCandidatesPage() {
  const [data, setData] = useState<LabCandidateList | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [replay, setReplay] = useState<LabReplay | null>(null);
  const [contracts, setContracts] = useState<LabContracts | null>(null);
  const [busy, setBusy] = useState(false);
  const [composeIds, setComposeIds] = useState<string[]>([]);
  const [composeReason, setComposeReason] = useState('');
  const [accepted, setAccepted] = useState<LabChangeSetRow[]>([]);

  useEffect(() => {
    labApi
      .candidates()
      .then(setData)
      .catch((err) => setError(humanError(err, 'No pudimos cargar las versiones candidatas.').message));
    labApi
      .changeSets()
      .then((next) => setAccepted(next.changesets.filter((row) => row.status === 'ACCEPTED')))
      .catch(() => setAccepted([]));
  }, []);

  return (
    <div className="lab">
      <LabNav />
      <header className="lab-hero">
        <p className="lab-eyebrow">Laboratorio de metodología</p>
        <h1 className="admin-page-header__title">Versiones en prueba</h1>
      </header>
      {error ? (
        <div className="lab-alert lab-alert--danger">
          <p className="lab-alert__title">{error}</p>
        </div>
      ) : null}
      {!data ? (
        <Skeleton lines={4} />
      ) : (
        <div className="lab-stack">
          <LabCard title="Base actual">
            <p className="lab-domain__score">{data.base.definition_ref}</p>
            <p className="lab-muted">Esta versión no se modifica desde el Lab.</p>
          </LabCard>
          {data.candidates.length === 0 ? (
            <div className="lab-empty">
              <p style={{ margin: 0 }}>
                Todavía no hay una versión candidata. No hay cambios aceptados para una nueva versión.
              </p>
            </div>
          ) : (
            data.candidates.map((item) => (
              <article key={item.definition_ref} className="lab-card">
                <h2 className="lab-h2">{candidateTitle(item.definition_ref)}</h2>
                <p className="lab-muted">
                  Basada en: {item.base_definition_ref ? humanBase(item.base_definition_ref) : 'Matriz v2.0'}
                </p>
                <p className="lab-muted">{item.reason || 'Sin motivo registrado.'}</p>
                <p className="lab-muted">
                  Hallazgos abordados:{' '}
                  {item.finding ? `H-${String(item.finding.number).padStart(3, '0')}` : 'Ninguno'}
                </p>
                <p className="lab-muted">Casos reejecutados: {item.cases_tested}</p>
                <p className="lab-muted">
                  Más cerca de tu criterio: {item.impacts.improves}. Más lejos: {item.impacts.worsens}. Sin
                  diferencia relevante: {item.impacts.unchanged}. Necesitan revisión: {item.impacts.needs_review}.
                </p>
                <p className="lab-muted">Estado: {labUiLabels.definitionStatus(item.status)}</p>
                <p className="lab-q__id">Detalle técnico: {item.definition_ref}</p>
                <div className="lab-actions">
                  <button
                    type="button"
                    className="lab-btn"
                    disabled={busy || !item.changeset_id}
                    onClick={() => {
                      if (!item.changeset_id) return;
                      setBusy(true);
                      labApi
                        .replayReviewed({ changeset_id: item.changeset_id })
                        .then((next) => {
                          setReplay(next);
                          return labApi.contracts(item.definition_ref);
                        })
                        .then(setContracts)
                        .catch((err) =>
                          setError(humanError(err, 'No pudimos completar esta acción.').message),
                        )
                        .finally(() => setBusy(false));
                    }}
                  >
                    Volver a probar los casos
                  </button>
                </div>
              </article>
            ))
          )}
          <ComposeAcceptedChanges
            accepted={accepted}
            selected={composeIds}
            reason={composeReason}
            busy={busy}
            onToggle={(id) =>
              setComposeIds((current) =>
                current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
              )
            }
            onReason={setComposeReason}
            onCompose={() => {
              setBusy(true);
              labApi
                .composeCandidate({
                  changeset_ids: composeIds,
                  reason: composeReason.trim(),
                })
                .then(() => labApi.candidates())
                .then(setData)
                .catch((err) => setError(humanError(err, 'No pudimos completar esta acción.').message))
                .finally(() => setBusy(false));
            }}
          />
          {replay ? (
            <LabCard title="Última corrida">
              <p className="lab-muted">{replay.results.length} casos vueltos a probar.</p>
            </LabCard>
          ) : null}
          {contracts ? (
            <LabCard title="Contratos técnicos">
              <p className="lab-muted">
                Resultado: {labUiLabels.contract(contracts.overall)}. Alertas:{' '}
                {labUiLabels.contract(contracts.safety_invariants)}. Determinismo:{' '}
                {labUiLabels.contract(contracts.determinism)}.
              </p>
            </LabCard>
          ) : null}
        </div>
      )}
    </div>
  );
}

function candidateTitle(ref: string) {
  const match = ref.match(/@(\d+)$/);
  return match ? `Candidata ${match[1]}` : 'Versión candidata';
}

function humanBase(ref: string) {
  return ref.replace(/^matrix-/i, 'Matriz ').replace(/@\d+$/, '');
}
