'use client';

import { useEffect, useRef, useState } from 'react';
import { getAccessToken } from '@/lib/auth-storage';
import {
  fetchInterventionPlan,
  newCommandKey,
  recordIndicator,
  type Indicator,
  type InterventionPlanView,
  type MeasurePoint,
} from '@/lib/intervention-api';
import { weekLine } from '@/lib/action-review';
import { InterventionReviewDecision } from './InterventionReviewDecision';
import { MenA1PlanPanel } from './MenA1PlanPanel';
import { PlanOutcomeReview } from './PlanOutcomeReview';

function display(indicator: Indicator, point: MeasurePoint | null): string {
  if (!point) return 'sin respuesta';
  if (point.notApplicable) return indicator.notApplicable ?? 'No aplica';
  if (indicator.kind === 'YES_NO') return point.value === 1 ? 'Sí' : 'No';
  if (indicator.kind === 'CHOICE') return indicator.options?.find((row) => row.value === point.text)?.label ?? point.text ?? '';
  if (indicator.kind === 'TEXT') return point.text ?? '';
  if (indicator.kind === 'SCALE_1_5') return `${point.value} de 5`;
  return String(point.value);
}

function executionSummary(view: InterventionPlanView): string {
  const { execution } = view;
  if (execution.resolved === 0 && execution.noInformation > 0) {
    return 'Todavía no hay registros suficientes.';
  }
  if (execution.coverage === 'COMPLETE' && execution.ratioOfResolved != null) {
    return `${execution.done} hechas sobre lo que registraste (${execution.ratioOfResolved} % de ejecución).`;
  }
  if (execution.resolved > 0) {
    return `${execution.done} hechas, ${execution.notDone} no hechas, ${execution.noInformation} sin registro.`;
  }
  return 'Todavía no hay acciones registradas como hechas o no hechas.';
}

function IndicatorQuestion({ territory, planId, row, onSaved }: { territory: string; planId: string; row: InterventionPlanView['indicators'][number]; onSaved: () => void }) {
  const { indicator } = row;
  const [value, setValue] = useState<string>('');
  const [textOutcome, setTextOutcome] = useState<'ACHIEVED' | 'NOT_ACHIEVED' | 'UNKNOWN' | ''>('');
  const [notApplicable, setNotApplicable] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const keyRef = useRef<{ content: string; key: string } | null>(null);

  async function save() {
    const token = getAccessToken();
    if (!token) return;
    const numeric = ['COUNT', 'SCALE_1_5', 'YES_NO'].includes(indicator.kind);
    if (indicator.kind === 'TEXT') {
      if (!textOutcome) {
        setError('Indica si fue conseguido, no conseguido o no se sabe.');
        return;
      }
      if ((textOutcome === 'ACHIEVED' || textOutcome === 'NOT_ACHIEVED') && !value.trim()) {
        setError('Escribe una nota breve sobre el resultado.');
        return;
      }
    } else if (!notApplicable && !value.trim()) {
      setError('Elige o escribe una respuesta.');
      return;
    }
    if (numeric && !notApplicable && !/^\d+$/.test(value.trim())) {
      setError('Usa un número entero.');
      return;
    }
    const content = JSON.stringify([indicator.ref, value, notApplicable, textOutcome]);
    if (!keyRef.current || keyRef.current.content !== content) keyRef.current = { content, key: newCommandKey(`ind-${planId}`) };
    setBusy(true);
    setError(null);
    try {
      await recordIndicator(token, territory, planId, {
        indicatorRef: indicator.ref,
        commandKey: keyRef.current.key,
        ...(notApplicable
          ? { notApplicable: true }
          : indicator.kind === 'TEXT'
            ? { text: value.trim() || null, textOutcome: textOutcome as 'ACHIEVED' | 'NOT_ACHIEVED' | 'UNKNOWN' }
            : numeric
              ? { value: Number(value) }
              : { text: value.trim() }),
      });
      setValue('');
      setTextOutcome('');
      setNotApplicable(false);
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar. Tu respuesta sigue aquí.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mk-week-review-block">
      <p className="mk-week-review-block__label">{indicator.role === 'RESULT' ? 'Seguimiento del resultado' : 'Percepción opcional'}</p>
      <p className="mk-week-review-block__body">{indicator.question}</p>
      {row.baseline ? <p className="mk-mx-next__meta">Punto de partida: {display(indicator, row.baseline)}</p> : null}
      {indicator.kind === 'YES_NO' ? (
        <div className="mk-indicator__choices" role="group" aria-label={indicator.question}>
          {[['1', 'Sí'], ['0', 'No']].map(([v, label]) => (
            <button key={v} type="button" className="mk-mx__action" aria-pressed={value === v} onClick={() => setValue(v)}>{label}</button>
          ))}
        </div>
      ) : indicator.kind === 'SCALE_1_5' ? (
        <div className="mk-indicator__choices" role="group" aria-label={indicator.question}>
          {['1', '2', '3', '4', '5'].map((v) => (
            <button key={v} type="button" className="mk-mx__action" aria-pressed={value === v} onClick={() => setValue(v)}>{v}</button>
          ))}
        </div>
      ) : indicator.kind === 'CHOICE' ? (
        <div className="mk-indicator__choices" role="group" aria-label={indicator.question}>
          {(indicator.options ?? []).map((option) => (
            <button key={option.value} type="button" className="mk-mx__action" aria-pressed={value === option.value} onClick={() => setValue(option.value)}>{option.label}</button>
          ))}
        </div>
      ) : indicator.kind === 'TEXT' ? (
        <>
          <div className="mk-indicator__choices" role="group" aria-label="Resultado de la semana">
            {[['ACHIEVED', 'Conseguido'], ['NOT_ACHIEVED', 'No conseguido'], ['UNKNOWN', 'No se sabe']].map(([v, label]) => (
              <button key={v} type="button" className="mk-mx__action" aria-pressed={textOutcome === v} onClick={() => setTextOutcome(v as typeof textOutcome)}>{label}</button>
            ))}
          </div>
          <textarea aria-label={indicator.question} rows={2} value={value} onChange={(event) => setValue(event.target.value)} placeholder="Nota breve" />
        </>
      ) : (
        <input aria-label={indicator.question} inputMode="numeric" value={value} disabled={notApplicable} onChange={(event) => setValue(event.target.value)} />
      )}
      {indicator.notApplicable ? (
        <label className="mk-week-field">
          <input type="checkbox" checked={notApplicable} onChange={(event) => setNotApplicable(event.target.checked)} />
          {indicator.notApplicable}
        </label>
      ) : null}
      {error ? <p role="alert">{error}</p> : null}
      <button type="button" className="mk-mx__action mk-mx__action--primary" disabled={busy} onClick={() => void save()}>
        {busy ? 'Guardando' : 'Guardar respuesta'}
      </button>
    </div>
  );
}

export function IndicatorCheckin({
  territory,
  planId,
  weekStart,
  planTitle,
  surface = 'review',
  onActivity,
}: {
  territory: string;
  planId: string;
  weekStart?: string;
  planTitle?: string;
  surface?: 'review';
  onActivity?: () => void;
}) {
  const [view, setView] = useState<InterventionPlanView | null>(null);
  const [missing, setMissing] = useState(false);
  const latest = useRef(0);

  async function load() {
    const token = getAccessToken();
    if (!token) return;
    const request = latest.current + 1;
    latest.current = request;
    try {
      const next = await fetchInterventionPlan(token, territory, planId, weekStart);
      if (request !== latest.current) return;
      setView(next);
      onActivity?.();
    } catch {
      if (request === latest.current) setMissing(true);
    }
  }

  useEffect(() => { void load(); }, [planId, territory, weekStart]);

  if (missing || !view || surface !== 'review') return null;
  if (view.template.id === 'MEN-A1' && weekStart) {
    return (
      <MenA1PlanPanel
        territory={territory}
        planId={planId}
        weekStart={weekStart}
        planTitle={planTitle}
        onActivity={onActivity}
      />
    );
  }

  return (
    <section className="mk-mx-surface mk-week-review-plan" aria-label={planTitle ?? view.template.title}>
      <header className="mk-week-review-plan__head">
        <h2 className="mk-mx-section-title">{planTitle ?? view.template.title}</h2>
      </header>

      <div className="mk-week-review-section">
        <h3 className="mk-week-review-section__title">Qué ocurrió</h3>
        <p className="mk-mx-next__body">{executionSummary(view)}</p>
        {view.actions?.length ? (
          <ul className="mk-ar-happened" aria-label="Lo previsto esta semana">
            {view.actions.map((row) => (
              <li key={row.id} className={row.needsDecision ? 'is-pending' : undefined}>
                <strong>{row.title}</strong>
                <span>{weekLine(row)}</span>
              </li>
            ))}
            {(view.endedActions ?? []).filter((row) => row.effectiveTo && weekStart && row.effectiveTo >= weekStart).map((row) => (
              <li key={row.id}>
                <strong>{row.title}</strong>
                <span>{row.replacedBy ? `Reemplazada por «${row.replacedBy.title}».` : row.endedReason ? `Retirada: ${row.endedReason}.` : 'Terminó esta semana.'} {weekLine(row)}</span>
              </li>
            ))}
          </ul>
        ) : null}
        {view.indicators
          .filter((row) => !(view.toolIndicatorLinked && row.indicator.role === 'RESULT'))
          .map((row) => (
            <IndicatorQuestion key={row.indicator.ref} territory={territory} planId={planId} row={row} onSaved={() => void load()} />
          ))}
        <PlanOutcomeReview territory={territory} planId={planId} view={view} weekStart={weekStart} onSaved={() => { void load(); onActivity?.(); }} />
      </div>

      <div className="mk-week-review-section">
        <h3 className="mk-week-review-section__title">Qué conviene hacer</h3>
        <InterventionReviewDecision key={view.reviewWeek?.weekStart ?? weekStart} territory={territory} planId={planId} view={view} weekStart={weekStart} onSaved={() => void load()} />
      </div>
    </section>
  );
}
