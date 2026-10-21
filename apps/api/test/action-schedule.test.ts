import { describe, expect, it } from 'vitest';
import {
  applyScheduleChange,
  fixedDaysInWeek,
  occasionsBetween,
  resolveSchedule,
  type ActionScheduleRow,
} from '../src/journey/action-schedule';
import { civilDaysBetween } from '../src/journey/week-count';

const baseAction = { id: 'a1', weekday: 5, intervalDays: 7, occasionsPerWeek: null, active: true };

describe('action-schedule', () => {
  it('removes friday through sunday occasions after pause from thursday', () => {
    const schedules: ActionScheduleRow[] = [
      {
        actionId: 'a1',
        effectiveFrom: '2026-10-01',
        effectiveTo: '2026-10-15',
        kind: 'FIXED',
        weekday: 5,
        intervalDays: 7,
        anchorDay: null,
        occasionsPerWeek: null,
        source: 'CREATE',
      },
      {
        actionId: 'a1',
        effectiveFrom: '2026-10-16',
        effectiveTo: null,
        kind: 'PAUSED',
        weekday: null,
        intervalDays: null,
        anchorDay: null,
        occasionsPerWeek: null,
        source: 'PAUSE',
      },
    ];
    const weekStart = '2026-10-12';
    const weekEnd = '2026-10-18';
    const occasions = occasionsBetween(baseAction, schedules, weekStart, weekEnd);
    expect(occasions.some((item) => item.kind === 'fixed' && item.day === '2026-10-17')).toBe(false);
  });

  it('supports flexible three per week with two records', () => {
    const flex = { id: 'f1', weekday: null, intervalDays: null, occasionsPerWeek: 3, active: true };
    const occasions = occasionsBetween(flex, [], '2026-10-12', '2026-10-18');
    expect(occasions.filter((item) => item.kind === 'flex')).toHaveLength(3);
  });

  it('keeps civil days stable across Chile DST sample dates', () => {
    const april = civilDaysBetween('2026-04-04', '2026-04-06');
    const september = civilDaysBetween('2026-09-05', '2026-09-07');
    expect(april).toEqual(['2026-04-04', '2026-04-05', '2026-04-06']);
    expect(september).toEqual(['2026-09-05', '2026-09-06', '2026-09-07']);
  });

  it('resolveSchedule uses legacy fields when no rows exist', () => {
    const resolved = resolveSchedule(baseAction, [], '2026-10-12');
    expect(resolved.kind).toBe('FIXED');
    expect(resolved.weekday).toBe(5);
  });

  it('fixedDaysInWeek respects schedule change mid-week', () => {
    const schedules = applyScheduleChange([], {
      actionId: 'a1',
      effectiveFrom: '2026-10-01',
      kind: 'FIXED',
      weekday: 1,
      intervalDays: 7,
      anchorDay: null,
      occasionsPerWeek: null,
      source: 'CREATE',
    });
    const changed = applyScheduleChange(schedules, {
      actionId: 'a1',
      effectiveFrom: '2026-10-15',
      kind: 'FIXED',
      weekday: 3,
      intervalDays: 7,
      anchorDay: null,
      occasionsPerWeek: null,
      source: 'REVIEW',
    });
    const before = fixedDaysInWeek(baseAction, changed, '2026-10-12', '2026-10-14');
    expect(before).toContain('2026-10-12');
    expect(before).not.toContain('2026-10-14');
  });
});
