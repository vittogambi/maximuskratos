'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { LabNav } from '@/components/admin/lab/lab-nav';
import { LabCard, RadioCards, Skeleton } from '@/components/admin/lab/primitives';
import { StepChange } from '@/components/admin/lab/step-change';
import {
  labApi,
  type LabCaseRow,
  type LabChangeOptions,
  type LabFinding,
  type LabGuidedChangeResult,
} from '@/lib/lab-api';
import { humanError } from '@/lib/lab-ui/format';
import {
  CONSISTENCY_OPTIONS,
  FINDING_STATUS_OPTIONS,
  labUiLabels,
} from '@/lib/lab-ui/labels';

export default function LabFindingDetailPage() {
  const params = useParams<{ findingId: string }>();
  const [finding, setFinding] = useState<LabFinding | null>(null);
  const [cases, setCases] = useState<LabCaseRow[]>([]);
  const [options, setOptions] = useState<LabChangeOptions | null>(null);
  const [changeResult, setChangeResult] = useState<LabGuidedChangeResult | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [linkId, setLinkId] = useState('');
  const [acceptedKey, setAcceptedKey] = useState('');
  const [rejectedKey, setRejectedKey] = useState('');
  const [consistencyAnswer, setConsistencyAnswer] = useState('');
  const [consistencyNotes, setConsistencyNotes] = useState('');
  const [decision, setDecision] = useState('');
  const [decisionReason, setDecisionReason] = useState('');

  useEffect(() => {
    Promise.all([labApi.finding(params.findingId), labApi.cases()])
      .then(([next, rows]) => {
        setFinding(next);
        setCases(rows);
        setDecision(next.decision ?? '');
        setDecisionReason(next.decision_reason ?? '');
        const runId = rows.find((row) => next.cases.some((item) => item.id === row.id))?.latest_run?.id;
        if (runId) {
          labApi.changeOptions(runId).then(setOptions).catch(() => undefined);
        }
      })
      .catch((err) => setError(humanError(err, 'No pudimos cargar este hallazgo.').message));
  }, [params.findingId]);

  const runId = cases.find((row) => finding?.cases.some((item) => item.id === row.id))?.latest_run?.id;

  async function refresh() {
    setFinding(await labApi.finding(params.findingId));
  }

  if (!finding) {
    return (
      <div className="lab">
        <LabNav />
        {error ? <p className="lab-error">{error}</p> : <Skeleton lines={6} />}
      </div>
    );
  }

  return (
    <div className="lab">
      <LabNav />
      <header className="lab-hero">
        <Link className="lab-back" href="/admin/lab/findings">
          Volver a hallazgos
        </Link>
        <p className="lab-eyebrow">{finding.code}</p>
        <h1 className="admin-page-header__title">{finding.title}</h1>
        {finding.status === 'DRAFT' ? (
          <p className="lab-lead">
            Borrador. No bloquea la Matriz.
            {finding.open_missing?.length ? ` Falta: ${finding.open_missing.join(', ')}.` : ''}
          </p>
        ) : null}
        <div className="lab-actions">
          {finding.status === 'DRAFT' && finding.ready_to_open ? (
            <button
              type="button"
              className="lab-btn"
              onClick={() => {
                labApi
                  .patchFinding(finding.id, { status: 'OPEN' })
                  .then(setFinding)
                  .catch((err) => setError(humanError(err, 'No pudimos abrir este hallazgo.').message));
              }}
            >
              Pasar a Abierto
            </button>
          ) : null}
          <button
            type="button"
            className="lab-btn lab-btn--ghost"
            onClick={() => {
              labApi
                .patchFinding(finding.id, {
                  status: 'DISCARDED',
                  decision: 'INVALIDO',
                  decision_reason: 'Hallazgo inválido o de prueba.',
                })
                .then(setFinding)
                .catch((err) => setError(humanError(err, 'No pudimos descartar este hallazgo.').message));
            }}
          >
            Descartar como inválido
          </button>
        </div>
        <div className="lab-case__meta">
          <span className="lab-badge">{labUiLabels.findingLayer(finding.layer)}</span>
          <span className="lab-badge">{labUiLabels.findingStatus(finding.status)}</span>
          <span className="lab-badge lab-badge--amber">{labUiLabels.findingSeverity(finding.severity)}</span>
        </div>
      </header>

      <div className="lab-stack">
        <LabCard title="Qué observaste">
          <p className="lab-muted">{finding.current_behavior}</p>
        </LabCard>
        <LabCard title="Qué debería ocurrir">
          <p className="lab-muted">{finding.rafa_expected_behavior}</p>
        </LabCard>
        {finding.content_change_required ? (
          <LabCard title="Cambio de contenido pendiente">
            <p className="lab-muted">
              Este hallazgo requiere un cambio de contenido en la definición. No se puede resolver solo
              con un cambio de regla.
            </p>
          </LabCard>
        ) : null}
        <LabCard title="Evidencia">
          <p className="lab-muted">{finding.hypothesis || 'Sin hipótesis registrada.'}</p>
        </LabCard>
        <LabCard title="Casos relacionados">
          {finding.cases.length === 0 ? (
            <p className="lab-muted">Todavía no hay casos vinculados.</p>
          ) : (
            <table className="lab-table">
              <thead>
                <tr>
                  <th>Caso</th>
                  <th>Tu criterio</th>
                  <th>Matriz</th>
                  <th>Diferencia</th>
                  <th>Sostiene el hallazgo</th>
                </tr>
              </thead>
              <tbody>
                {finding.cases.map((item) => (
                  <tr key={item.id}>
                    <td>{item.label}</td>
                    <td>{item.rafa_criterion ?? 'Sin registrar'}</td>
                    <td>{item.matrix_result ?? 'Sin registrar'}</td>
                    <td>{item.difference ?? 'Sin registrar'}</td>
                    <td>
                      <select
                        className="lab-select"
                        value={item.supports_finding ?? ''}
                        onChange={(event) => {
                          labApi
                            .findingLedger(finding.id, {
                              case_id: item.id,
                              supports_finding: event.target.value || null,
                            })
                            .then(setFinding)
                            .catch(() => undefined);
                        }}
                      >
                        <option value="">Sin marcar</option>
                        <option value="YES">Sí</option>
                        <option value="NO">No</option>
                        <option value="UNCLEAR">No está claro</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </LabCard>
        <LabCard title="Preguntas involucradas">
          {finding.observations?.length ? (
            <ul className="lab-muted" style={{ paddingLeft: '1.1rem' }}>
              {finding.observations.map((item) => (
                <li key={item.id}>
                  {item.question_id}: {item.note}
                </li>
              ))}
            </ul>
          ) : (
            <p className="lab-muted">Ninguna pregunta vinculada todavía.</p>
          )}
        </LabCard>
        <LabCard title="Casos donde apareció">
          <ul className="lab-muted" style={{ paddingLeft: '1.1rem' }}>
            {finding.cases.map((item) => (
              <li key={item.id}>{item.label}</li>
            ))}
          </ul>
          <div className="lab-actions">
            <select className="lab-select" value={linkId} onChange={(event) => setLinkId(event.target.value)}>
              <option value="">Vincular otro caso</option>
              {cases.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}
                </option>
              ))}
            </select>
            <button
              type="button"
              className="lab-btn lab-btn--ghost"
              disabled={!linkId}
              onClick={() => {
                labApi.linkFindingCases(finding.id, [linkId]).then(setFinding).catch(() => undefined);
              }}
            >
              Vincular
            </button>
          </div>
        </LabCard>
        <LabCard title="Respuestas citadas">
          <p className="lab-muted">{finding.evidence_ids.join(', ') || 'Ninguna respuesta seleccionada.'}</p>
        </LabCard>
        <LabCard title="Reglas">
          <p className="lab-muted">
            {finding.related_rules.length
              ? finding.related_rules.map((id) => `${labUiLabels.rule(id)} (${id})`).join('. ')
              : 'Sin reglas registradas.'}
          </p>
        </LabCard>
        <LabCard title="Evidencia a favor">
          <ul className="lab-muted" style={{ paddingLeft: '1.1rem' }}>
            {finding.cases.filter((item) => item.supports_finding === 'YES').map((item) => (
              <li key={item.id}>{item.label}</li>
            ))}
          </ul>
        </LabCard>
        <LabCard title="Evidencia que lo contradice">
          <ul className="lab-muted" style={{ paddingLeft: '1.1rem' }}>
            {finding.cases.filter((item) => item.supports_finding === 'NO').map((item) => (
              <li key={item.id}>
                {item.label}. {item.difference ?? ''}
              </li>
            ))}
          </ul>
        </LabCard>
        <LabCard title="Cambio en evaluación">
          {finding.experiments.length === 0 ? (
            <p className="lab-muted">Todavía no hay cambios probados.</p>
          ) : (
            <table className="lab-table">
              <thead>
                <tr>
                  <th>Candidata</th>
                  <th>Mejoran</th>
                  <th>Empeoran</th>
                  <th>Sin cambio</th>
                </tr>
              </thead>
              <tbody>
                {finding.experiments.map((item) => (
                  <tr key={item.id}>
                    <td>
                      {item.replay_id ? (
                        <Link href={`/admin/lab/replays/${item.replay_id}`}>{item.candidate_ref ?? item.id}</Link>
                      ) : (
                        item.candidate_ref ?? item.id
                      )}
                    </td>
                    <td>{item.replay_summary?.improves ?? 0}</td>
                    <td>{item.replay_summary?.worsens ?? 0}</td>
                    <td>{item.replay_summary?.unchanged ?? 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </LabCard>
        <LabCard title="Hipótesis">
          <p className="lab-muted">{finding.hypothesis || 'Sin hipótesis.'}</p>
        </LabCard>
        {finding.cases.filter((item) => item.supports_finding === 'YES').length >= 1 &&
        finding.cases.filter((item) => item.supports_finding === 'NO').length >= 1 ? (
        <LabCard title="Posible diferencia de criterio entre casos">
          <p className="lab-muted">
            En un caso aceptaste este mecanismo y en otro no. ¿Crees que estos casos requieren reglas distintas?
          </p>
          <div className="lab-grid-2">
            <input
              className="lab-input"
              placeholder="Clave del caso donde se aceptó"
              value={acceptedKey}
              onChange={(event) => setAcceptedKey(event.target.value)}
            />
            <input
              className="lab-input"
              placeholder="Clave del caso donde no"
              value={rejectedKey}
              onChange={(event) => setRejectedKey(event.target.value)}
            />
          </div>
          <RadioCards
            name="consistency"
            value={consistencyAnswer}
            options={CONSISTENCY_OPTIONS}
            onChange={setConsistencyAnswer}
          />
          <textarea
            className="lab-textarea"
            value={consistencyNotes}
            placeholder="Notas"
            onChange={(event) => setConsistencyNotes(event.target.value)}
          />
          <button
            type="button"
            className="lab-btn lab-btn--ghost"
            disabled={!acceptedKey || !rejectedKey}
            onClick={() => {
              labApi
                .findingConsistency(finding.id, {
                  accepted_case_key: acceptedKey,
                  rejected_case_key: rejectedKey,
                  answer: consistencyAnswer || null,
                  notes: consistencyNotes || null,
                })
                .then(setFinding)
                .catch(() => undefined);
            }}
          >
            Registrar nota
          </button>
          {finding.consistencies.map((item) => (
            <p key={item.id} className="lab-muted">
              {item.acceptedCaseKey} aceptado, {item.rejectedCaseKey} no.{' '}
              {item.answer ? labUiLabels.disposition(item.answer) : ''} {item.notes ?? ''}
            </p>
          ))}
        </LabCard>
        ) : null}
        <LabCard title="Decisión">
          <RadioCards
            name="finding-status"
            value={finding.status}
            options={FINDING_STATUS_OPTIONS}
            onChange={(value) => {
              labApi.patchFinding(finding.id, { status: value }).then(setFinding).catch(() => undefined);
            }}
          />
          <label className="lab-field">
            <span className="lab-label">Nota de decisión</span>
            <textarea
              className="lab-textarea"
              value={decisionReason}
              onChange={(event) => setDecisionReason(event.target.value)}
            />
          </label>
          <input
            className="lab-input"
            value={decision}
            placeholder="Decisión"
            onChange={(event) => setDecision(event.target.value)}
          />
          <button
            type="button"
            className="lab-btn lab-btn--ghost"
            onClick={() => {
              labApi
                .patchFinding(finding.id, { decision: decision || null, decision_reason: decisionReason || null })
                .then(setFinding)
                .catch(() => undefined);
            }}
          >
            Guardar decisión
          </button>
        </LabCard>
        <LabCard title="Cambios relacionados">
          {finding.experiments.length === 0 ? (
            <p className="lab-muted">Todavía no hay cambios en prueba.</p>
          ) : (
            <ul className="lab-muted" style={{ paddingLeft: '1.1rem' }}>
              {finding.experiments.map((item) => (
                <li key={item.id}>
                  {item.reason} · {labUiLabels.changesetStatus(item.status)} · {item.candidate_ref ?? 'sin candidato'}
                </li>
              ))}
            </ul>
          )}
        </LabCard>
        {runId ? (
          <LabCard title="Probar un cambio">
          <StepChange
            runId={runId}
            options={options}
            reasonSeed={finding.hypothesis ?? finding.title}
            pending={pending}
            result={changeResult}
            onSubmit={(body) => {
              setPending(true);
              labApi
                .findingChange(finding.id, { ...body, run_id: runId })
                .then((next) => {
                  setChangeResult(next);
                  return refresh();
                })
                .catch(() => setError('No pudimos completar esta acción.'))
                .finally(() => setPending(false));
            }}
            onVerdict={() => undefined}
            onDiscard={() => setChangeResult(null)}
          />
          </LabCard>
        ) : (
          <p className="lab-muted">Vincula un caso con run para probar una alternativa desde aquí.</p>
        )}
      </div>
    </div>
  );
}
