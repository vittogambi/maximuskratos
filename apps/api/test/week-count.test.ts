import { describe, expect, it } from 'vitest';
import { applyScheduleChange, type ActionScheduleRow } from '../src/journey/action-schedule';
import { weekCounts } from '../src/journey/week-count';

const action = { id: 'a1', weekday: 1, intervalDays: 7, occasionsPerWeek: null, active: true };

describe('weekCounts conteo-semanal@1', () => {
  it('counts an open week without percent when monday is done and tuesday is still open', () => {
    const counts = weekCounts({
      today: '2026-10-14',
      weekStart: '2026-10-12',
      weekReviewed: false,
      actions: [action],
      schedules: [],
      records: [{ actionId: 'a1', day: '2026-10-12', status: 'DONE' }],
      cancellations: [],
    });
    expect(counts.done).toBe(1);
    expect(counts.dueUnmarked).toBe(0);
    expect(counts.upcoming).toBe(0);
    expect(counts.percent).toBeNull();
    expect(counts.percentReason).toBe('OPEN_WEEK');
  });

  it('returns 75% for a closed week with 3 done and 1 not done', () => {
    const counts = weekCounts({
      today: '2026-10-19',
      weekStart: '2026-10-12',
      weekReviewed: true,
      actions: [
        { id: 'a1', weekday: 1, intervalDays: 7, occasionsPerWeek: null, active: true },
        { id: 'a2', weekday: 2, intervalDays: 7, occasionsPerWeek: null, active: true },
        { id: 'a3', weekday: 3, intervalDays: 7, occasionsPerWeek: null, active: true },
        { id: 'a4', weekday: 4, intervalDays: 7, occasionsPerWeek: null, active: true },
      ],
      schedules: [],
      records: [
        { actionId: 'a1', day: '2026-10-12', status: 'DONE' },
        { actionId: 'a2', day: '2026-10-13', status: 'DONE' },
        { actionId: 'a3', day: '2026-10-14', status: 'DONE' },
        { actionId: 'a4', day: '2026-10-15', status: 'SKIPPED' },
      ],
      cancellations: [],
    });
    expect(counts.percent).toBe(75);
  });

  it('returns null with NO_INFORMATION when one occasion lacks data', () => {
    const counts = weekCounts({
      today: '2026-10-19',
      weekStart: '2026-10-12',
      weekReviewed: true,
      actions: [
        { id: 'a1', weekday: 1, intervalDays: 7, occasionsPerWeek: null, active: true },
        { id: 'a2', weekday: 2, intervalDays: 7, occasionsPerWeek: null, active: true },
      ],
      schedules: [],
      records: [{ actionId: 'a1', day: '2026-10-12', status: 'DONE' }],
      cancellations: [],
    });
    expect(counts.percent).toBeNull();
    expect(counts.percentReason).toBe('NO_INFORMATION');
  });

  it('returns null with EXCEPTIONS when exceptions exist', () => {
    const counts = weekCounts({
      today: '2026-10-19',
      weekStart: '2026-10-12',
      weekReviewed: true,
      actions: [
        { id: 'a1', weekday: 1, intervalDays: 7, occasionsPerWeek: null, active: true },
        { id: 'a2', weekday: 2, intervalDays: 7, occasionsPerWeek: null, active: true },
        { id: 'a3', weekday: 3, intervalDays: 7, occasionsPerWeek: null, active: true },
        { id: 'a4', weekday: 4, intervalDays: 7, occasionsPerWeek: null, active: true },
      ],
      schedules: [],
      records: [{ actionId: 'a1', day: '2026-10-12', status: 'DONE' }],
      cancellations: [
        { actionId: 'a2', day: '2026-10-13' },
        { actionId: 'a3', day: '2026-10-14' },
        { actionId: 'a4', day: '2026-10-15' },
      ],
    });
    expect(counts.percent).toBeNull();
    expect(counts.percentReason).toBe('EXCEPTIONS');
  });

  it('marks LEGACY_WEEK without percent', () => {
    const counts = weekCounts({
      today: '2026-10-19',
      weekStart: '2026-10-12',
      weekReviewed: true,
      legacyWeek: true,
      actions: [action],
      schedules: [],
      records: [],
      cancellations: [],
    });
    expect(counts.percentReason).toBe('LEGACY_WEEK');
  });
});

describe('applyScheduleChange', () => {
  it('keeps monday and tuesday on the old weekday when changing wednesday', () => {
    const rows: ActionScheduleRow[] = [
      {
        actionId: 'a1',
        effectiveFrom: '2026-10-01',
        effectiveTo: null,
        kind: 'FIXED',
        weekday: 1,
        intervalDays: 7,
        anchorDay: null,
        occasionsPerWeek: null,
        source: 'CREATE',
      },
    ];
    const next = applyScheduleChange(rows, {
      actionId: 'a1',
      effectiveFrom: '2026-10-15',
      kind: 'FIXED',
      weekday: 3,
      intervalDays: 7,
      anchorDay: null,
      occasionsPerWeek: null,
      source: 'REVIEW',
    });
    expect(next[0].effectiveTo).toBe('2026-10-14');
    expect(next[1].weekday).toBe(3);
  });
});
