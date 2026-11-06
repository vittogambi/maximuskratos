'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState, useRef } from 'react';
import { getAccessToken } from '@/lib/auth-storage';
import {
  fetchInterventionPlan,
  fetchMenA1WeekPrep,
  newCommandKey,
  saveMenA1WeekPrepReview,
  type InterventionPlanView,
  type MenA1WeekPrepView,
} from '@/lib/intervention-api';
import { InterventionReviewDecision } from './InterventionReviewDecision';
import { PlanOutcomeReview } from './PlanOutcomeReview';

const PREP_LABEL: Record<string, string> = {
  EMPTY: 'Sin preparar',
  DRAFT: 'Borrador guardado',
  CONFIRMED: 'Preparación confirmada',
  FROZEN: 'Semana cerrada',
};

export function MenA1PlanPanel({
  territory,
  planId,
  weekStart,
  planTitle,
  onActivity,
}: {
  territory: string;
  planId: string;
  weekStart: string;
  planTitle?: string;
  onActivity?: () => void;
}) {
  const [plan, setPlan] = useState<InterventionPlanView | null>(null);
  const [prep, setPrep] = useState<MenA1WeekPrepView | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const latest = useRef(0);
  const load = useCallback(async () => {
    const token = getAccessToken();
    if (!token) return;
    const request = latest.current + 1;
    latest.current = request;
    const [planView, prepView] = await Promise.all([
      fetchInterventionPlan(token, territory, planId, weekStart),
      fetchMenA1WeekPrep(token, territory, planId, weekStart),
    ]);
    if (request !== latest.current) return;
    setPlan(planView);
    setPrep(prepView);
  }, [territory, planId, weekStart]);

  useEffect(() => { void load().catch((err: Error) => setError(err.message)); }, [load]);

  async function savePriorityOutcome(priorityId: string, outcome: 'ACHIEVED' | 'NOT_ACHIEVED' | 'UNKNOWN') {
    if (!prep?.editable || prep.status === 'FROZEN') return;
    const token = getAccessToken();
    if (!token) return;
    setBusy(true);
    setError(null);
    try {
      const active = prep.prep.priorities.filter((row) => row.advance.trim());
      const next = {
        priorities: active.map((row) => ({
          id: row.id,
          outcome: row.id === priorityId
            ? outcome
            : (prep.reviewOutcomes?.priorities.find((item) => item.id === row.id)?.outcome ?? 'UNKNOWN'),
        })),
      };
      await saveMenA1WeekPrepReview(token, territory, planId, {
        weekStart: prep.weekStart,
        outcomes: next,
        commandKey: newCommandKey(`prep-review-${planId}`),
      });
      await load();
      onActivity?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar.');
    } finally {
      setBusy(false);
    }
  }

  if (!plan || !prep) return null;

  const prepHref = `/planes/${planId}/preparar?territorio=${territory}&weekStart=${encodeURIComponent(weekStart)}`;
  const prepAction = prep.status === 'EMPTY' || prep.status === 'DRAFT'
    ? (prep.status === 'DRAFT' ? 'Continuar borrador' : 'Preparar mis prioridades')
    : 'Ver preparación';

  const priorities = prep.prep.priorities.filter((row) => row.advance.trim());

  return (
    <section className="mk-mx-surface mk-week-review-plan" aria-label={planTitle ?? plan.template.title}>
      <header className="mk-week-review-plan__head">
        <h2 className="mk-mx-section-title">{planTitle ?? plan.template.title}</h2>
        <p className="mk-mx-next__meta">
          Preparación: {PREP_LABEL[prep.status] ?? prep.status}.
          {' '}
          {prep.weekClosed ? 'Esta semana ya se cerró.' : (
            <Link className="mk-mx__textlink" href={prepHref}>{prepAction}</Link>
          )}
        </p>
      </header>
      {error ? <p role="alert">{error}</p> : null}

      <div className="mk-week-review-section">
        <h3 className="mk-week-review-section__title">Qué ocurrió</h3>
        {(prep.status === 'CONFIRMED' || prep.status === 'FROZEN') && priorities.length > 0 ? (
          <ul className="mk-week-prep-list">
            {priorities.map((row) => (
              <li key={row.id} className="mk-week-prep-list__item">
                <p className="mk-week-review-block__body">
                  {row.advance}
                  {prep.prep.primaryId === row.id ? ' (principal)' : ''}
                </p>
                {prep.status === 'FROZEN' ? (
                  <p className="mk-mx-next__meta">
                    {prep.reviewOutcomes?.priorities.find((item) => item.id === row.id)?.outcome === 'ACHIEVED'
                      ? 'Avanzó según el criterio.'
                      : prep.reviewOutcomes?.priorities.find((item) => item.id === row.id)?.outcome === 'NOT_ACHIEVED'
                        ? 'No avanzó según el criterio.'
                        : 'Todavía no lo sé o sin registrar.'}
                  </p>
                ) : (
                  <div className="mk-indicator__choices" role="group" aria-label={`Avance de ${row.advance}`}>
                    {(['ACHIEVED', 'NOT_ACHIEVED', 'UNKNOWN'] as const).map((outcome) => (
                      <button
                        key={outcome}
                        type="button"
                        className="mk-mx__action"
                        disabled={busy}
                        aria-pressed={prep.reviewOutcomes?.priorities.find((item) => item.id === row.id)?.outcome === outcome}
                        onClick={() => void savePriorityOutcome(row.id, outcome)}
                      >
                        {outcome === 'ACHIEVED' ? 'Avanzó' : outcome === 'NOT_ACHIEVED' ? 'No avanzó' : 'Todavía no lo sé'}
                      </button>
                    ))}
                  </div>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mk-mx-next__body">Confirma tus prioridades para revisar el avance.</p>
        )}
        <PlanOutcomeReview
          territory={territory}
          planId={planId}
          view={plan}
          weekStart={weekStart}
          onSaved={() => { void load(); onActivity?.(); }}
        />
        {prep.indicatorPreview?.complete && prep.indicatorPreview.value != null ? (
          <p className="mk-mx-next__body">
            Resultado de la semana: {prep.indicatorPreview.value}
            {prep.minimum ? ' (prioridad principal lograda)' : ` de ${priorities.length} prioridades`}.
          </p>
        ) : null}
      </div>

      <div className="mk-week-review-section">
        <h3 className="mk-week-review-section__title">Qué conviene hacer</h3>
        <InterventionReviewDecision
          territory={territory}
          planId={planId}
          view={plan}
          weekStart={weekStart}
          hideWeekApply
          onSaved={() => { void load(); onActivity?.(); }}
        />
      </div>
    </section>
  );
}
