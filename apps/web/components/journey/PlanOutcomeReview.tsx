'use client';

import { useRef, useState } from 'react';
import { civilDayLabel } from '@/lib/dashboard-next';
import { getAccessToken } from '@/lib/auth-storage';
import {
  newCommandKey,
  recordOutcomeAssessment,
  type InterventionPlanView,
  type OutcomeAssessmentStatus,
} from '@/lib/intervention-api';

const STATUS: { value: OutcomeAssessmentStatus; label: string }[] = [
  { value: 'ACHIEVED', label: 'Sí' },
  { value: 'NOT_YET', label: 'Todavía no' },
  { value: 'INSUFFICIENT', label: 'No tengo información suficiente' },
];

const EXPLORATION_STATUS: { value: OutcomeAssessmentStatus; label: string }[] = [
  { value: 'LEARNED', label: 'Aprendí algo que me sirve' },
  { value: 'NOT_YET', label: 'Todavía no lo tengo claro' },
  { value: 'INSUFFICIENT', label: 'No probé lo suficiente' },
];

type Props = {
  territory: string;
  planId: string;
  view: InterventionPlanView;
  weekStart?: string;
  onSaved: () => void;
};

export function PlanOutcomeReview({ territory, planId, view, weekStart, onSaved }: Props) {
  const contract = view.outcomeContract;
  const [status, setStatus] = useState<OutcomeAssessmentStatus | ''>(view.outcomeAssessment?.status ?? '');
  const [text, setText] = useState(view.outcomeAssessment?.text ?? '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);
  const keyRef = useRef<string | null>(null);

  if (!contract && !view.observableOutcome) return null;

  if (view.outcomeContractMeta?.recoveredFromLegacy && !view.outcomeContractMeta.complete) {
    return (
      <div className="mk-week-review-block" aria-label="Resultado propio del plan">
        <p className="mk-week-review-block__label">Resultado que buscabas</p>
        <p className="mk-week-review-block__body">{contract?.soughtOutcome ?? view.observableOutcome}</p>
        <p className="mk-mx-next__body">
          Información recuperada del plan. Completa criterio y evidencia en la ficha antes de evaluar.
        </p>
      </div>
    );
  }

  const exploring = contract?.mode === 'EXPLORATION';
  const options = exploring ? EXPLORATION_STATUS : STATUS;
  const criterion = contract?.criterion ?? view.observableOutcome ?? '';
  const sought = contract?.soughtOutcome ?? view.observableOutcome ?? '';
  const checkDue = view.outcomeCheckDue;
  const linked = view.toolIndicatorLinked;
  const savedStatus = view.outcomeAssessment?.status;
  const checkLabel = contract?.checkAt ? civilDayLabel(contract.checkAt) : null;
  const notYet = checkDue === 'NOT_YET';
  const canAssess = !linked && (!notYet || expanded);
  const showSummaryOnly = notYet && !expanded && !savedStatus;

  return (
    <div className="mk-week-review-block" aria-label="Resultado propio del plan">
      <p className="mk-week-review-block__label">{exploring ? 'Lo que estás explorando' : 'Resultado'}</p>
      <p className="mk-week-review-block__body">{sought}</p>
      {criterion ? (
        <p className="mk-mx-next__meta">
          {exploring ? `Quieres saber: ${criterion}` : `Criterio: ${criterion}${contract?.criterionStatus === 'PROVISIONAL' ? ' (provisional)' : ''}`}
        </p>
      ) : null}
      {exploring ? <p className="mk-mx-next__meta">Lo que aprendas se registra como aprendizaje, no como resultado conseguido.</p> : null}
      {savedStatus ? (
        <p className="mk-week-task__state">
          {options.find((row) => row.value === savedStatus)?.label ?? savedStatus}
          {view.outcomeAssessment?.text ? `. ${view.outcomeAssessment.text}` : ''}
        </p>
      ) : showSummaryOnly ? (
        <>
          <p className="mk-week-task__state">Aún sin comprobar.</p>
          {checkLabel ? (
            <p className="mk-mx-next__meta">Comprobación prevista: {checkLabel}. Todavía no toca revisarlo con rigor.</p>
          ) : null}
          <button type="button" className="mk-mx__textlink" onClick={() => setExpanded(true)}>
            Registrar evidencia anticipada
          </button>
        </>
      ) : null}
      {linked ? (
        <p className="mk-mx-next__body">La herramienta ya recoge esta comprobación. No hace falta duplicarla.</p>
      ) : null}
      {!linked && canAssess ? (
        <>
          <p className="mk-week-review-block__question">{exploring ? '¿Qué aprendiste hasta ahora?' : '¿Se consiguió el resultado que buscabas?'}</p>
          <div className="mk-indicator__choices" role="group" aria-label={exploring ? 'Lo que aprendiste' : 'Comprobación del resultado'}>
            {options.map((row) => (
              <button
                key={row.value}
                type="button"
                className="mk-mx__action"
                aria-pressed={status === row.value}
                onClick={() => setStatus(row.value)}
              >
                {row.label}
              </button>
            ))}
          </div>
          {status === 'ACHIEVED' || status === 'NOT_YET' || status === 'LEARNED' ? (
            <label className="mk-week-field">
              {exploring ? 'Qué aprendiste, en tus palabras' : 'Evidencia en tus palabras'}
              <textarea rows={2} value={text} onChange={(e) => setText(e.target.value)} />
            </label>
          ) : null}
          {error ? <p role="alert">{error}</p> : null}
          <button
            type="button"
            className="mk-mx__action mk-mx__action--primary"
            disabled={busy || !status}
            onClick={async () => {
              const token = getAccessToken();
              if (!token || !status) return;
              keyRef.current = keyRef.current ?? newCommandKey(`outcome-${planId}`);
              setBusy(true);
              setError(null);
              try {
                await recordOutcomeAssessment(token, territory, planId, {
                  status,
                  text: text.trim() || null,
                  weekStart,
                  commandKey: keyRef.current,
                });
                onSaved();
              } catch (err) {
                setError(err instanceof Error ? err.message : 'No se pudo guardar.');
              } finally {
                setBusy(false);
              }
            }}
          >
            {busy ? 'Guardando' : exploring ? 'Guardar lo aprendido' : 'Guardar comprobación'}
          </button>
        </>
      ) : null}
    </div>
  );
}
