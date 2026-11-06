'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { getAccessToken } from '@/lib/auth-storage';
import { journeyCalendar, journeyWeeks, type CalendarPayload } from '@/lib/journey-api';
import { addDays, buildWeekQuery, weekOffsetFromStart } from '@/lib/week-screen';
import { IndicatorCheckin } from './IndicatorCheckin';
import { InterventionWeekApplyPanel } from './InterventionWeekApplyPanel';
import { LegacyCalendarWeekReview } from './LegacyCalendarWeekReview';
import { WeekScreenShell } from './WeekScreenShell';

const INTERVENTION_TERRITORIES = new Set(['MENTALIDAD', 'FINANZAS', 'RELACIONES', 'SALUD_FISICA']);

const TERRITORY_LABEL: Record<string, string> = {
  MENTALIDAD: 'mentalidad',
  FINANZAS: 'finanzas',
  RELACIONES: 'relaciones',
  SALUD_FISICA: 'salud_fisica',
};

export function WeekReviewScreen() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const planIdParam = searchParams.get('planId');
  const semanaParam = searchParams.get('semana');
  const territoryParam = searchParams.get('territorio');
  const [data, setData] = useState<CalendarPayload | null>(null);
  const [weeks, setWeeks] = useState<{ id: string; weekStart: string; note: string | null; snapshot: unknown }[]>([]);
  const [error, setError] = useState('');
  const [offset, setOffset] = useState(0);
  const [refreshToken, setRefreshToken] = useState(0);

  const load = useCallback(async () => {
    const token = getAccessToken();
    if (!token) return;
    const [calendar, history] = await Promise.all([journeyCalendar(token), journeyWeeks(token)]);
    setData(calendar);
    setWeeks(history);
  }, []);

  useEffect(() => { void load().catch((err: Error) => setError(err.message)); }, [load]);

  useEffect(() => {
    if (!data?.weekStart || !semanaParam) return;
    setOffset(weekOffsetFromStart(data.weekStart, semanaParam));
  }, [data?.weekStart, semanaParam]);

  const currentWeek = data?.weekStart ?? '';
  const viewedWeek = currentWeek ? addDays(currentWeek, offset * 7) : '';
  const weekEnd = viewedWeek ? addDays(viewedWeek, 6) : '';

  const syncWeek = useCallback(
    (nextOffset: number) => {
      if (!data?.weekStart) return;
      const nextStart = addDays(data.weekStart, nextOffset * 7);
      setOffset(nextOffset);
      const q = buildWeekQuery({
        planId: planIdParam,
        semana: nextStart,
        territorio: territoryParam,
      });
      router.replace(`/semana/revision${q}`, { scroll: false });
    },
    [data?.weekStart, planIdParam, territoryParam, router],
  );

  const query = useMemo(
    () =>
      buildWeekQuery({
        planId: planIdParam,
        semana: viewedWeek || null,
        territorio: territoryParam,
      }),
    [planIdParam, viewedWeek, territoryParam],
  );

  const scopedPlans = planIdParam ? (data?.plans.filter((p) => p.id === planIdParam) ?? []) : (data?.plans.filter((p) => p.status === 'ACTIVE') ?? []);
  const interventionPlans = scopedPlans.filter((p) => p.status === 'ACTIVE' && p.territory && INTERVENTION_TERRITORIES.has(p.territory));
  const legacyPlans = scopedPlans.filter((p) => p.status === 'ACTIVE' && (!p.territory || !INTERVENTION_TERRITORIES.has(p.territory)));
  const weekClosed = weeks.some((week) => week.weekStart === viewedWeek);
  const liveActions = legacyPlans.flatMap((plan) => plan.actions.filter((a) => a.active !== false && !a.pausedAt));
  const pausedActions = legacyPlans.flatMap((plan) => plan.actions.filter((a) => a.active !== false && a.pausedAt));
  const hasReview = interventionPlans.length > 0 || legacyPlans.length > 0;

  if (!data && !error) {
    return (
      <div className="mk-week-wrap" aria-busy="true">
        <div className="mk-mx-skeleton"><span /><span /></div>
      </div>
    );
  }

  return (
    <WeekScreenShell
      view="review"
      viewedWeek={viewedWeek}
      weekEnd={weekEnd}
      query={query}
      onPrevWeek={() => syncWeek(offset - 1)}
      onNextWeek={() => syncWeek(offset + 1)}
      onToday={() => syncWeek(0)}
    >
      {error ? <p className="mk-week-alert" role="alert">{error}</p> : null}
      {!hasReview ? (
        <section className="mk-mx-next">
          <h2 className="mk-mx-next__title">Sin plan activo en esta vista</h2>
          <p className="mk-mx-next__body">Activa un plan o elige otro desde Inicio.</p>
        </section>
      ) : null}
      {interventionPlans.map((plan) => {
          const territory = TERRITORY_LABEL[plan.territory ?? 'MENTALIDAD'] ?? territoryParam ?? 'mentalidad';
          return (
            <IndicatorCheckin
              key={plan.id}
              territory={territory}
              planId={plan.id}
              weekStart={viewedWeek}
              surface="review"
              planTitle={plan.title}
              onActivity={() => {
                setRefreshToken((v) => v + 1);
                void load();
              }}
            />
          );
        })}
      {legacyPlans.length > 0 && viewedWeek ? (
        <LegacyCalendarWeekReview
          plans={legacyPlans}
          viewedWeek={viewedWeek}
          weekClosed={weekClosed}
          liveActions={liveActions}
          pausedActions={pausedActions}
          onClosed={() => void load()}
        />
      ) : null}
      {viewedWeek ? (
        <InterventionWeekApplyPanel weekStart={viewedWeek} refreshToken={refreshToken} onApplied={() => void load()} />
      ) : null}
    </WeekScreenShell>
  );
}
