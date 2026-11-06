'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { journeyCalendar, journeyWeeks, saveRecord, type CalendarPayload } from '@/lib/journey-api';
import { getAccessToken } from '@/lib/auth-storage';
import { addDays, buildWeekQuery, formatWeekRange, weekOffsetFromStart } from '@/lib/week-screen';
import { MenA1PrepBar } from './MenA1PrepBar';
import { TaskRow } from './TaskRow';
import { WeekScreenShell } from './WeekScreenShell';

const WEEKDAYS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

function frozenActions(snapshot: unknown): { id: string; title: string; doneWhen: string; weekday: number | null; intervalDays: number; records: { day: string; status: string; resultNote: string | null }[] }[] {
  if (!snapshot || typeof snapshot !== 'object') return [];
  const plans = (snapshot as { plans?: unknown }).plans;
  if (!Array.isArray(plans)) return [];
  return plans.flatMap((plan) => {
    const actions = (plan as { actions?: unknown }).actions;
    if (!Array.isArray(actions)) return [];
    return actions.flatMap((action) => {
      const row = action as { id?: unknown; title?: unknown; doneWhen?: unknown; weekday?: unknown; intervalDays?: unknown; records?: unknown };
      if (typeof row.id !== 'string' || typeof row.title !== 'string' || typeof row.doneWhen !== 'string') return [];
      const records = Array.isArray(row.records) ? row.records.flatMap((item) => {
        const record = item as { day?: unknown; status?: unknown; resultNote?: unknown };
        if (typeof record.day !== 'string' || typeof record.status !== 'string') return [];
        return [{ day: record.day, status: record.status, resultNote: typeof record.resultNote === 'string' ? record.resultNote : null }];
      }) : [];
      return [{
        id: row.id,
        title: row.title,
        doneWhen: row.doneWhen,
        weekday: typeof row.weekday === 'number' ? row.weekday : null,
        intervalDays: typeof row.intervalDays === 'number' ? row.intervalDays : 7,
        records,
      }];
    });
  });
}

function civil(iso: string): Date {
  const [year, month, day] = iso.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

function formatDay(iso: string): string {
  return String(civil(iso).getUTCDate());
}

function weekdayLabel(iso: string): string {
  return WEEKDAYS[civil(iso).getUTCDay()];
}

function isClockToday(iso: string, today: string | undefined): boolean {
  return Boolean(today) && iso === today;
}

const TERRITORY_SLUG: Record<string, string> = {
  MENTALIDAD: 'mentalidad',
  FINANZAS: 'finanzas',
  RELACIONES: 'relaciones',
  SALUD_FISICA: 'salud_fisica',
};

function dayOf(value: string | null | undefined): string {
  return (value ?? '').slice(0, 10);
}

/** Mirrors the server window: an action counts from its start until it ends or a successor replaces it. */
function actionVisibleInWeek(
  action: { id: string; active?: boolean; pausedAt?: string | null; effectiveFrom?: string | null; effectiveTo?: string | null; replacesActionId?: string | null },
  siblings: { id: string; effectiveFrom?: string | null; replacesActionId?: string | null }[],
  viewedWeek: string,
  weekEnd: string,
): boolean {
  if (!viewedWeek) return action.active !== false && !action.pausedAt;
  const from = dayOf(action.effectiveFrom);
  if (from && from > weekEnd) return false;
  const successorFrom = dayOf(siblings.find((item) => item.replacesActionId === action.id && item.effectiveFrom)?.effectiveFrom);
  const end = action.effectiveTo ? dayOf(action.effectiveTo) : successorFrom ? addDays(successorFrom, -1) : action.active === false ? undefined : null;
  if (end === undefined) return false;
  if (end && end < viewedWeek) return false;
  return !action.pausedAt;
}

/** A one-time action only has occasions inside its schedule window. Outside it there is nothing to mark. */
function scheduledInWeek(
  action: { id: string; weekday: number | null; occasionsPerWeek?: number | null },
  schedules: NonNullable<CalendarPayload['schedules']>,
  viewedWeek: string,
  weekEnd: string,
): boolean {
  if (action.weekday != null || action.occasionsPerWeek != null) return true;
  const rows = schedules.filter((row) => row.actionId === action.id);
  if (!rows.length) return true;
  return rows.some((row) => row.kind !== 'PAUSED' && row.kind !== 'NONE' && row.effectiveFrom <= weekEnd && (row.effectiveTo == null || row.effectiveTo >= viewedWeek));
}

function snapshotOutcomes(snapshot: unknown): { id: string; outcome: string }[] {
  if (!snapshot || typeof snapshot !== 'object') return [];
  const plans = (snapshot as { plans?: unknown }).plans;
  if (!Array.isArray(plans)) return [];
  return plans.flatMap((plan) => {
    const row = plan as { id?: unknown; outcome?: unknown };
    if (typeof row.id !== 'string' || typeof row.outcome !== 'string' || !row.outcome.trim()) return [];
    return [{ id: row.id, outcome: row.outcome }];
  });
}

export function CalendarScreen() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const planId = searchParams.get('planId');
  const semanaParam = searchParams.get('semana');

  const [data, setData] = useState<CalendarPayload | null>(null);
  const [weeks, setWeeks] = useState<{ id: string; weekStart: string; note: string | null; snapshot: unknown }[]>([]);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [offset, setOffset] = useState(0);
  const [day, setDay] = useState<string | null>(null);

  async function load() {
    const token = getAccessToken();
    if (!token) return;
    const [calendar, history] = await Promise.all([
      journeyCalendar(token),
      journeyWeeks(token),
    ]);
    setData(calendar);
    setWeeks(history);
  }

  useEffect(() => { void load().catch((err: Error) => setError(err.message)); }, []);

  useEffect(() => {
    if (!data?.weekStart || !semanaParam) return;
    setOffset(weekOffsetFromStart(data.weekStart, semanaParam));
  }, [data?.weekStart, semanaParam]);

  const currentWeek = data?.weekStart ?? '';
  const viewedWeek = currentWeek ? addDays(currentWeek, offset * 7) : '';
  const weekEnd = viewedWeek ? addDays(viewedWeek, 6) : '';
  const days = viewedWeek ? Array.from({ length: 7 }, (_, index) => addDays(viewedWeek, index)) : [];
  const selected = day && days.includes(day) ? day : (data?.today && days.includes(data.today) ? data.today : viewedWeek);
  const closedWeek = weeks.find((week) => week.weekStart === viewedWeek);
  const weekClosed = Boolean(closedWeek);
  const scopedPlans = planId ? (data?.plans.filter((p) => p.id === planId) ?? []) : (data?.plans ?? []);
  const unknownPlan = Boolean(planId && data && scopedPlans.length === 0);
  const activePlans = scopedPlans.filter((plan) => plan.status === 'ACTIVE' && plan.stage !== 'PAUSED');
  const pausedPlan = scopedPlans.find((plan) => String(plan.status) === 'PAUSED' || plan.stage === 'PAUSED') ?? null;
  const draftPlan = scopedPlans.find((plan) => plan.status === 'DRAFT') ?? null;
  const emptyWeek = Boolean(data && !unknownPlan && activePlans.length === 0 && weeks.length === 0);
  const liveActions = activePlans.flatMap((plan) =>
    plan.actions
      .filter((action) => actionVisibleInWeek(action, plan.actions, viewedWeek, weekEnd))
      .filter((action) => scheduledInWeek(action, data?.schedules ?? [], viewedWeek, weekEnd))
      .map((action) => ({ ...action, planTitle: plan.title, planTerritory: plan.territory })),
  );
  const unfinishedOnce = activePlans.flatMap((plan) => plan.actions
    .filter((action) => action.active !== false && action.occasionsPerWeek == null && action.weekday == null)
    .flatMap((action) => {
      const window = (data?.schedules ?? []).find((row) => row.actionId === action.id && row.kind === 'FLEXIBLE' && row.effectiveTo);
      if (!window?.effectiveTo || !data?.today || window.effectiveTo >= data.today) return [];
      const inWindow = (data?.records ?? []).filter(
        (row) => row.actionId === action.id && row.day >= window.effectiveFrom && row.day <= window.effectiveTo!,
      );
      const done = inWindow.some((row) => row.status === 'DONE');
      if (done) return [];
      const markedNotDone = inWindow.some((row) => row.status === 'SKIPPED');
      return [{ planId: plan.id, title: action.title, markedNotDone }];
    }));
  const frozen = weekClosed ? frozenActions(closedWeek?.snapshot) : [];
  const actions = frozen.length
    ? frozen.map((action) => ({ ...action, domain: null as string | null, pausedAt: null, planTitle: null, planTerritory: null, cue: null, minimumVersion: null }))
    : liveActions;

  const query = useMemo(
    () => buildWeekQuery({ planId, semana: viewedWeek || null }),
    [planId, viewedWeek],
  );

  const syncWeek = useCallback(
    (nextOffset: number) => {
      if (!data?.weekStart) return;
      const nextStart = addDays(data.weekStart, nextOffset * 7);
      setOffset(nextOffset);
      setDay(null);
      router.replace(`/semana${buildWeekQuery({ planId, semana: nextStart })}`, { scroll: false });
    },
    [data?.weekStart, planId, router],
  );

  async function mark(actionId: string, status: 'DONE' | 'SKIPPED' | 'NOT_APPLICABLE' | 'PENDING') {
    const token = getAccessToken();
    if (!token || !selected || saving || weekClosed) return;
    setError('');
    setSaving(true);
    try {
      await saveRecord(token, { actionId, day: selected, status });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No pudimos guardar el registro. Inténtalo nuevamente.');
    } finally {
      setSaving(false);
    }
  }

  if (!data && !error) {
    return (
      <div className="mk-week-wrap" aria-busy="true">
        <div className="mk-mx-skeleton"><span /><span /></div>
      </div>
    );
  }

  return (
    <WeekScreenShell
      view="actions"
      viewedWeek={viewedWeek}
      weekEnd={weekEnd}
      query={query}
      onPrevWeek={() => syncWeek(offset - 1)}
      onNextWeek={() => syncWeek(offset + 1)}
      onToday={() => syncWeek(0)}
    >
      {error ? <p className="mk-week-alert" role="alert">{error}</p> : null}
      {unknownPlan ? <p role="status">No encontramos ese plan en tu cuenta.</p> : null}
      {pausedPlan ? (
        <section className="mk-mx-next">
          <p className="mk-mx-next__body">El plan «{pausedPlan.title}» está en pausa. No tiene acciones previstas esta semana.</p>
          <Link className="mk-mx__action mk-mx__action--primary" href={`/planes/${pausedPlan.id}`}>Ver el plan en pausa</Link>
        </section>
      ) : null}
      {unfinishedOnce.length ? (
        <section className="mk-mx-next" aria-label="Tareas pendientes de decidir">
          <p className="mk-mx-next__body">
            {unfinishedOnce.length === 1
              ? unfinishedOnce[0]!.markedNotDone
                ? `La tarea «${unfinishedOnce[0]!.title}» quedó marcada como no realizada.`
                : `La tarea «${unfinishedOnce[0]!.title}» quedó sin registro en su semana.`
              : `Tienes ${unfinishedOnce.length} tareas pendientes de revisar.`}
          </p>
          <Link className="mk-mx__action" href={`/semana/revision?planId=${unfinishedOnce[0]!.planId}`}>Decidir en la revisión</Link>
        </section>
      ) : null}
      {emptyWeek && !pausedPlan ? (
        <section className="mk-mx-next">
          <p className="mk-mx-next__body">Todavía no hay un plan con ocasiones ni una semana revisada.</p>
          {draftPlan ? (
            <Link className="mk-mx__action mk-mx__action--primary" href={`/disenar/${draftPlan.id}`}>
              Continuar mi plan
            </Link>
          ) : (
            <Link className="mk-mx__action mk-mx__action--primary" href="/disenar">
              Elegir un cambio
            </Link>
          )}
        </section>
      ) : null}

      {!emptyWeek ? (
        <>
          <div className="mk-week" role="group" aria-label="Días de la semana">
            {days.map((date) => {
              const selectedDay = date === selected;
              const today = isClockToday(date, data?.today);
              return (
                <button
                  key={date}
                  type="button"
                  className={[
                    'mk-week__day',
                    selectedDay ? 'is-selected' : '',
                    today && !selectedDay ? 'is-today' : '',
                  ].filter(Boolean).join(' ')}
                  aria-pressed={selectedDay}
                  aria-label={`${weekdayLabel(date)} ${formatDay(date)}${today ? ', hoy' : ''}`}
                  onClick={() => setDay(date)}
                >
                  <span>{weekdayLabel(date)}</span>
                  <strong>{formatDay(date)}</strong>
                </button>
              );
            })}
          </div>

          <div className="mk-week-actions">
            {weekClosed ? (
              <>
                <p className="mk-mx-next__body">Esta semana conserva el criterio con el que se cerró.</p>
                {snapshotOutcomes(closedWeek?.snapshot).map((item) => (
                  <p key={item.id} className="mk-mx-next__meta">Resultado de esa semana: {item.outcome}</p>
                ))}
              </>
            ) : null}
            {!weekClosed && activePlans.length === 1 ? (
              <p className="mk-mx-next__meta">Resultado vigente: {activePlans[0].outcome}</p>
            ) : null}
            {actions.length === 0 && !emptyWeek ? (
              <p className="mk-mx-next__body">No hay acciones previstas para este día.</p>
            ) : null}
            {actions.map((action) => {
              const live = data?.records.find((item) => item.actionId === action.id && item.day === selected);
              const frozenRecord = 'records' in action ? action.records.find((item) => item.day === selected) : undefined;
              const record = weekClosed ? frozenRecord : live;
              const resultNote = record && 'resultNote' in record ? record.resultNote : null;
              return (
                <TaskRow
                  key={action.id}
                  title={action.title}
                  detail={action.doneWhen}
                  cue={action.cue ?? undefined}
                  minimum={action.minimumVersion ?? undefined}
                  context={action.planTitle ?? undefined}
                  status={record?.status ?? null}
                  disabled={weekClosed || saving}
                  disabledReason={weekClosed ? 'Esta semana ya está cerrada.' : 'Guardando.'}
                  onStatus={(status) => mark(action.id, status)}
                />
              );
            })}
            {weekClosed && actions.map((action) => {
              const frozenRecord = 'records' in action ? action.records.find((item) => item.day === selected) : undefined;
              const note = frozenRecord && 'resultNote' in frozenRecord ? frozenRecord.resultNote : null;
              return note ? <p key={`${action.id}-note`} className="mk-mx-next__meta">Resultado: {note}</p> : null;
            })}
            {!weekClosed && offset === 0 && viewedWeek
              ? activePlans.flatMap((plan) =>
                plan.territory === 'MENTALIDAD' ? (
                  [
                    <MenA1PrepBar
                      key={`prep-${plan.id}`}
                      territory={TERRITORY_SLUG[plan.territory!]}
                      planId={plan.id}
                      weekStart={viewedWeek}
                      planTitle={activePlans.length > 1 ? plan.title : undefined}
                    />,
                  ]
                ) : [],
              )
              : null}
          </div>
        </>
      ) : null}

      {weeks.length > 0 ? (
        <section className="mk-week-history">
          <h2 className="mk-mx-section-title">Semanas cerradas</h2>
          <ul className="mk-week-history__list">
            {weeks.map((week) => (
              <li key={week.id}>
                {formatWeekRange(week.weekStart, addDays(week.weekStart, 6))}. {week.note || 'Sin nota.'}
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </WeekScreenShell>
  );
}
