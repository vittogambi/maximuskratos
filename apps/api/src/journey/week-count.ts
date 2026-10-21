import { addIsoDays } from './civil-date';
import { weekEndSunday } from './civil-week';
import {
  type ActionScheduleRow,
  type LegacyActionFields,
  occasionsBetween,
  resolveSchedule,
} from './action-schedule';

export const COUNTING_VERSION = 'conteo-semanal@1';

export type OccasionState =
  | 'UPCOMING'
  | 'DUE_UNMARKED'
  | 'DONE'
  | 'NOT_DONE'
  | 'NO_INFORMATION'
  | 'EXCEPTED'
  | 'LEGACY_NOT_APPLICABLE';

export type OccasionRecord = {
  actionId: string;
  day: string;
  status: string;
};

export type OccasionCancellation = { actionId: string; day: string };

export type WeekCountInput = {
  today: string;
  weekStart: string;
  weekReviewed: boolean;
  legacyWeek?: boolean;
  actions: LegacyActionFields[];
  schedules: ActionScheduleRow[];
  records: OccasionRecord[];
  cancellations: OccasionCancellation[];
};

export type WeekCounts = {
  countingVersion: typeof COUNTING_VERSION;
  done: number;
  notDone: number;
  noInformation: number;
  excepted: number;
  dueUnmarked: number;
  upcoming: number;
  percent: number | null;
  percentReason: 'OPEN_WEEK' | 'NO_INFORMATION' | 'EXCEPTIONS' | 'NONE_RESOLVED' | 'LEGACY_WEEK' | null;
};

function identityKey(occasion: ReturnType<typeof occasionsBetween>[number]): string {
  if (occasion.kind === 'fixed') return `f:${occasion.actionId}:${occasion.day}`;
  return `x:${occasion.actionId}:${occasion.weekStart}:${occasion.index}`;
}

export function occasionState(
  input: WeekCountInput,
  occasion: ReturnType<typeof occasionsBetween>[number],
): OccasionState {
  const weekEnd = weekEndSunday(input.weekStart);
  const day = occasion.kind === 'fixed' ? occasion.day : null;
  if (day && day > input.today) return 'UPCOMING';
  if (occasion.kind === 'flex') {
    const flexRecords = input.records.filter(
      (row) => row.actionId === occasion.actionId && row.day >= input.weekStart && row.day <= weekEnd,
    );
    const cancelCount = input.cancellations.filter(
      (row) => row.actionId === occasion.actionId && row.day >= input.weekStart && row.day <= weekEnd,
    ).length;
    const used = flexRecords.length + cancelCount;
    if (used > occasion.index) {
      const row = flexRecords[occasion.index];
      if (row) {
        if (row.status === 'DONE') return 'DONE';
        if (row.status === 'SKIPPED') return 'NOT_DONE';
        if (row.status === 'NOT_APPLICABLE') return 'LEGACY_NOT_APPLICABLE';
      }
      const cancel = input.cancellations[occasion.index];
      if (cancel) return 'EXCEPTED';
    }
    if (input.weekReviewed || weekEnd < input.today) return 'NO_INFORMATION';
    return 'DUE_UNMARKED';
  }
  const cancel = input.cancellations.find((row) => row.actionId === occasion.actionId && row.day === day);
  if (cancel) return 'EXCEPTED';
  const record = input.records.find((row) => row.actionId === occasion.actionId && row.day === day);
  if (!record) {
    if (input.weekReviewed || (day != null && day < input.today)) return 'NO_INFORMATION';
    return 'DUE_UNMARKED';
  }
  if (record.status === 'DONE') return 'DONE';
  if (record.status === 'SKIPPED') return 'NOT_DONE';
  if (record.status === 'NOT_APPLICABLE') return 'LEGACY_NOT_APPLICABLE';
  if (record.status === 'PENDING') {
    if (input.weekReviewed || (day != null && day < input.today)) return 'NO_INFORMATION';
    return 'DUE_UNMARKED';
  }
  return 'DUE_UNMARKED';
}

export function weekCounts(input: WeekCountInput): WeekCounts {
  const weekEnd = weekEndSunday(input.weekStart);
  const empty: WeekCounts = {
    countingVersion: COUNTING_VERSION,
    done: 0,
    notDone: 0,
    noInformation: 0,
    excepted: 0,
    dueUnmarked: 0,
    upcoming: 0,
    percent: null,
    percentReason: input.legacyWeek ? 'LEGACY_WEEK' : 'OPEN_WEEK',
  };
  if (input.legacyWeek) return empty;

  const seen = new Set<string>();
  const occasions: ReturnType<typeof occasionsBetween> = [];
  for (const action of input.actions) {
    if (!action.active && resolveSchedule(action, input.schedules, weekEnd).kind === 'PAUSED') continue;
    for (const occasion of occasionsBetween(action, input.schedules, input.weekStart, weekEnd)) {
      const key = identityKey(occasion);
      if (seen.has(key)) continue;
      seen.add(key);
      occasions.push(occasion);
    }
  }

  const counts = { ...empty, percentReason: null as WeekCounts['percentReason'] };
  for (const occasion of occasions) {
    const state = occasionState(input, occasion);
    if (state === 'DONE') counts.done += 1;
    else if (state === 'NOT_DONE') counts.notDone += 1;
    else if (state === 'NO_INFORMATION') counts.noInformation += 1;
    else if (state === 'EXCEPTED' || state === 'LEGACY_NOT_APPLICABLE') counts.excepted += 1;
    else if (state === 'UPCOMING') counts.upcoming += 1;
    else if (state === 'DUE_UNMARKED') counts.dueUnmarked += 1;
  }

  const weekClosed = input.weekReviewed || weekEnd < input.today;
  if (!weekClosed) {
    counts.percent = null;
    counts.percentReason = 'OPEN_WEEK';
    return counts;
  }
  if (counts.excepted > 0) {
    counts.percent = null;
    counts.percentReason = 'EXCEPTIONS';
    return counts;
  }
  if (counts.noInformation > 0 || counts.dueUnmarked > 0) {
    counts.percent = null;
    counts.percentReason = 'NO_INFORMATION';
    return counts;
  }
  const resolved = counts.done + counts.notDone;
  if (resolved === 0) {
    counts.percent = null;
    counts.percentReason = 'NONE_RESOLVED';
    return counts;
  }
  counts.percent = Math.round((100 * counts.done) / resolved);
  return counts;
}

/** Civil day iteration helper for tests (Chile DST does not shift YYYY-MM-DD). */
export function civilDaysBetween(start: string, end: string): string[] {
  const out: string[] = [];
  let day = start;
  while (day <= end) {
    out.push(day);
    day = addIsoDays(day, 1);
  }
  return out;
}
