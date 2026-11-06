'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuthSession } from '@/components/auth-session-provider';
import { civilDayLabel } from '@/lib/dashboard-next';
import { getAccessToken } from '@/lib/auth-storage';
import { fetchPlansList, invalidatePlansListCache } from '@/lib/plans-cache';
import type { PlanRow } from '@/lib/journey-api';
import { planStageLabel, territoryDisplayLabel } from '@/lib/territory-ui-copy';

const STAGE_FILTERS = ['ALL', 'PREPARING', 'ACTIVE', 'PAUSED', 'MAINTENANCE', 'CLOSED'] as const;

function stageOf(plan: PlanRow): string {
  return plan.stage ?? (plan.status === 'DRAFT' ? 'PREPARING' : plan.status === 'ACTIVE' ? 'ACTIVE' : plan.status === 'ARCHIVED' ? 'CLOSED' : 'PREPARING');
}

function outcomePreview(text: string | null | undefined, max = 72): string | null {
  if (!text?.trim()) return null;
  const t = text.trim();
  return t.length <= max ? t : `${t.slice(0, max - 1).trim()}…`;
}

export function PlansIndex() {
  const searchParams = useSearchParams();
  const territoryFilter = searchParams.get('territorio');
  const { user } = useAuthSession();
  const [plans, setPlans] = useState<PlanRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [stageFilter, setStageFilter] = useState<(typeof STAGE_FILTERS)[number]>('ALL');

  const load = useCallback((force?: boolean) => {
    const token = getAccessToken();
    if (!token) {
      setError('Inicia sesión para ver tus planes.');
      setPlans(null);
      return;
    }
    setError(null);
    fetchPlansList(token, { force, userId: user?.id })
      .then(setPlans)
      .catch(() => {
        setPlans(null);
        setError('No pudimos cargar tus planes. Inténtalo nuevamente.');
      });
  }, []);

  useEffect(() => {
    invalidatePlansListCache();
    load();
  }, [load, user?.id]);

  const visible = useMemo(() => {
    if (!plans) return [];
    let rows = territoryFilter
      ? plans.filter((plan) => (plan.territory ?? '').toUpperCase() === territoryFilter.toUpperCase())
      : plans;
    if (stageFilter !== 'ALL') {
      rows = rows.filter((plan) => stageOf(plan) === stageFilter);
    }
    return rows;
  }, [plans, territoryFilter, stageFilter]);

  const showFilters = (plans?.length ?? 0) >= 4;

  if (error) {
    return (
      <div className="mk-plans-wrap">
        <section className="mk-mx-next" role="alert">
          <h1 className="mk-plans-head__title">Tus planes</h1>
          <p className="mk-mx-next__body">{error}</p>
          <button type="button" className="mk-mx__action" onClick={() => load(true)}>
            Reintentar
          </button>
        </section>
      </div>
    );
  }

  if (!plans) {
    return (
      <div className="mk-plans-wrap" aria-busy="true">
        <div className="mk-mx-skeleton"><span /><span /><span /></div>
      </div>
    );
  }

  return (
    <div className="mk-plans-wrap">
      <header className="mk-plans-head">
        <h1 className="mk-plans-head__title">Tus planes</h1>
        <Link href="/disenar" className="mk-mx__action mk-mx__action--primary">
          Crear plan
        </Link>
      </header>

      {showFilters ? (
        <div className="mk-plans-filters" role="tablist" aria-label="Filtrar por estado">
          {STAGE_FILTERS.map((key) => (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={stageFilter === key}
              className={stageFilter === key ? 'mk-plans-filters__btn is-active' : 'mk-plans-filters__btn'}
              onClick={() => setStageFilter(key)}
            >
              {key === 'ALL' ? 'Todos' : planStageLabel(key)}
            </button>
          ))}
        </div>
      ) : null}

      {visible.length === 0 && (plans?.length ?? 0) > 0 ? (
        <p className="mk-mx-next__body">No encontramos planes con este estado.</p>
      ) : null}
      {visible.length === 0 && (plans?.length ?? 0) === 0 ? (
        <section className="mk-mx-next">
          <h2 className="mk-mx-next__title">¿Qué te gustaría cambiar?</h2>
          <p className="mk-mx-next__body">Prepara un primer plan para el ámbito que elijas.</p>
          <Link href="/disenar" className="mk-mx__action mk-mx__action--primary">
            Crear mi primer plan
          </Link>
        </section>
      ) : null}
      {visible.length > 0 ? (
        <ul className="mk-plans-list">
          {visible.map((plan) => {
            const stage = stageOf(plan);
            const outcome = outcomePreview(plan.outcome);
            return (
              <li key={plan.id}>
                <Link href={`/planes/${plan.id}`} className="mk-plans-card">
                  <span className="mk-plans-card__eyebrow">
                    {territoryDisplayLabel(plan.territory ?? null)}
                    {' · '}
                    {planStageLabel(stage)}
                  </span>
                  <span className="mk-plans-card__title">{plan.title}</span>
                  {outcome ? <span className="mk-plans-card__outcome">{outcome}</span> : null}
                  <span className="mk-plans-card__cta">Ver plan</span>
                </Link>
              </li>
            );
          })}
        </ul>
      ) : null}

      {plans.length === 1 ? (
        <p className="mk-plans-foot">
          <Link href="/disenar" className="mk-mx__textlink">
            Crear otro plan
          </Link>
        </p>
      ) : null}
    </div>
  );
}
