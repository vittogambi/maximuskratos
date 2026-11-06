import { addIsoDays } from './civil-date';
import { datesForWeekday } from './civil-week';
import { futureOccasions } from './apply-week';

export type ScheduleKind = 'FIXED' | 'FLEXIBLE' | 'PAUSED' | 'NONE';
export type ScheduleSource = 'CREATE' | 'REVIEW' | 'PAUSE' | 'RESUME' | 'MAINTENANCE' | 'LEGACY_CURRENT';

export type ActionScheduleRow = {
  actionId: string;
  effectiveFrom: string;
  effectiveTo: string | null;
  kind: ScheduleKind;
  weekday: number | null;
  intervalDays: number | null;
  anchorDay: string | null;
  occasionsPerWeek: number | null;
  source: ScheduleSource;
};

export type LegacyActionFields = {
  id: string;
  weekday: number | null;
  intervalDays: number | null;
  occasionsPerWeek: number | null;
  active: boolean;
};

export type ResolvedSchedule = {
  kind: ScheduleKind;
  weekday: number | null;
  intervalDays: number | null;
  occasionsPerWeek: number | null;
  source: ScheduleSource;
};

export function resolveSchedule(
  action: LegacyActionFields,
  schedules: ActionScheduleRow[],
  onDay: string,
): ResolvedSchedule {
  const scoped = schedules
    .filter((row) => row.actionId === action.id)
    .filter((row) => row.effectiveFrom <= onDay && (row.effectiveTo == null || row.effectiveTo >= onDay))
    .sort((a, b) => (a.effectiveFrom < b.effectiveFrom ? -1 : 1));
  const row = scoped[scoped.length - 1];
  if (row) {
    return {
      kind: row.kind,
      weekday: row.weekday,
      intervalDays: row.intervalDays,
      occasionsPerWeek: row.occasionsPerWeek,
      source: row.source,
    };
  }
  if (!action.active) {
    return { kind: 'PAUSED', weekday: null, intervalDays: null, occasionsPerWeek: null, source: 'LEGACY_CURRENT' };
  }
  if (action.weekday == null && (action.occasionsPerWeek ?? 0) === 0) {
    return { kind: 'NONE', weekday: null, intervalDays: null, occasionsPerWeek: null, source: 'LEGACY_CURRENT' };
  }
  if (action.weekday == null) {
    return {
      kind: 'FLEXIBLE',
      weekday: null,
      intervalDays: action.intervalDays,
      occasionsPerWeek: action.occasionsPerWeek,
      source: 'LEGACY_CURRENT',
    };
  }
  return {
    kind: 'FIXED',
    weekday: action.weekday,
    intervalDays: action.intervalDays,
    occasionsPerWeek: null,
    source: 'LEGACY_CURRENT',
  };
}

export type OccasionIdentity =
  | { kind: 'fixed'; actionId: string; day: string }
  | { kind: 'flex'; actionId: string; weekStart: string; index: number; day?: string };

export function occasionsBetween(
  action: LegacyActionFields,
  schedules: ActionScheduleRow[],
  weekStart: string,
  weekEnd: string,
): OccasionIdentity[] {
  const out: OccasionIdentity[] = [];
  for (let offset = 0; offset < 7; offset += 1) {
    const day = addIsoDays(weekStart, offset);
    if (day > weekEnd) break;
    const schedule = resolveSchedule(action, schedules, day);
    if (schedule.kind === 'PAUSED' || schedule.kind === 'NONE') continue;
    if (schedule.kind === 'FIXED' && schedule.weekday != null) {
      const [y, m, d] = day.split('-').map(Number);
      const w = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
      const iso = w === 0 ? 7 : w;
      if (iso === schedule.weekday) {
        out.push({ kind: 'fixed', actionId: action.id, day });
      }
    }
  }
  const lastDay = weekEnd;
  const flexSchedule = resolveSchedule(action, schedules, lastDay);
  if (flexSchedule.kind === 'FLEXIBLE') {
    const n = Math.max(0, flexSchedule.occasionsPerWeek ?? 0);
    for (let index = 0; index < n; index += 1) {
      out.push({ kind: 'flex', actionId: action.id, weekStart, index });
    }
  }
  return out;
}

export function applyScheduleChange(
  schedules: ActionScheduleRow[],
  change: Omit<ActionScheduleRow, 'effectiveTo'>,
): ActionScheduleRow[] {
  const effectiveToPrevious = addIsoDays(change.effectiveFrom, -1);
  const next = schedules.map((row) => {
    if (row.actionId !== change.actionId) return row;
    if (row.effectiveFrom >= change.effectiveFrom) return row;
    if (row.effectiveTo != null && row.effectiveTo < change.effectiveFrom) return row;
    return { ...row, effectiveTo: effectiveToPrevious };
  });
  next.push({ ...change, effectiveTo: null });
  return next;
}

/** Whether a member may register execution on this civil day for the action's resolved schedule. */
export function isOccasionRegistrationDay(
  action: LegacyActionFields,
  schedules: ActionScheduleRow[],
  weekStart: string,
  weekEnd: string,
  day: string,
): boolean {
  if (day < weekStart || day > weekEnd) return false;
  const resolved = resolveSchedule(action, schedules, day);
  if (resolved.kind === 'PAUSED' || resolved.kind === 'NONE') return false;
  if (resolved.kind === 'FLEXIBLE') return day >= weekStart && day <= weekEnd;
  if (resolved.kind === 'FIXED' && resolved.weekday != null) {
    const interval = resolved.intervalDays ?? action.intervalDays ?? 7;
    const allowed = futureOccasions(weekStart, resolved.weekday, interval, 21).filter(
      (candidate) => candidate >= weekStart && candidate <= weekEnd,
    );
    return allowed.includes(day);
  }
  return fixedDaysInWeek(action, schedules, weekStart, weekEnd).includes(day);
}

export function flexOccasionCapReached(
  action: LegacyActionFields,
  schedules: ActionScheduleRow[],
  weekStart: string,
  weekEnd: string,
  day: string,
  registrationsInWeek: number,
  updatingExistingDay: boolean,
): boolean {
  const resolved = resolveSchedule(action, schedules, day);
  if (resolved.kind !== 'FLEXIBLE') return false;
  const cap = Math.max(0, resolved.occasionsPerWeek ?? action.occasionsPerWeek ?? 0);
  if (cap === 0) return false;
  if (updatingExistingDay) return false;
  return registrationsInWeek >= cap;
}

export function fixedDaysInWeek(
  action: LegacyActionFields,
  schedules: ActionScheduleRow[],
  weekStart: string,
  weekEnd: string,
): string[] {
  const weekday = resolveSchedule(action, schedules, weekEnd).weekday;
  if (weekday == null) return [];
  return datesForWeekday(weekStart, weekday).filter((day) => day >= weekStart && day <= weekEnd);
}
