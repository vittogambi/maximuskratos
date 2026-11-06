import { describe, expect, it } from 'vitest';
import { buildPilotFacts } from '../src/journey/pilot-facts';

const at = (iso: string) => new Date(iso);

describe('pilot facts', () => {
  it('counts activated plans, records, indicators and applied reviews without mixing them', () => {
    const report = buildPilotFacts({
      accounts: [
        { id: 'a', email: 'ana@example.com' },
        { id: 'b', email: 'beto@example.com' },
      ],
      plans: [
        { userId: 'a', planId: 'p1', createdAt: at('2026-11-01T10:00:00.000Z'), activatedAt: at('2026-11-01T11:00:00.000Z') },
        { userId: 'b', planId: 'p2', createdAt: at('2026-11-02T10:00:00.000Z'), activatedAt: null },
      ],
      actions: [
        { userId: 'a', planId: 'p1', status: 'DONE', at: at('2026-11-03T10:00:00.000Z') },
        { userId: 'a', planId: 'p1', status: 'PENDING', at: at('2026-11-03T11:00:00.000Z') },
      ],
      indicators: [
        { userId: 'a', planId: 'p1', at: at('2026-11-04T10:00:00.000Z') },
      ],
      reviews: [
        { userId: 'a', weekStart: '2026-11-02', at: at('2026-11-05T10:00:00.000Z'), applied: true },
        { userId: 'b', weekStart: '2026-11-02', at: at('2026-11-05T12:00:00.000Z'), applied: false },
      ],
    });
    expect(report.counts).toEqual({
      createdPlan: 2,
      activatedPlan: 1,
      recordedAction: 1,
      recordedIndicator: 1,
      appliedReview: 1,
      savedReview: 1,
    });
    expect(report.events.map((row) => `${row.email}:${row.kind}`)).toEqual([
      'ana@example.com:plan_created',
      'ana@example.com:plan_activated',
      'beto@example.com:plan_created',
      'ana@example.com:action_recorded',
      'ana@example.com:action_recorded',
      'ana@example.com:indicator_recorded',
      'ana@example.com:review_applied',
      'beto@example.com:review_saved',
    ]);
    expect(report.events.some((row) => row.kind === 'review_saved' && row.email === 'beto@example.com')).toBe(true);
    expect(report.events.find((row) => row.kind === 'plan_activated')?.at).toBe('2026-11-01T11:00:00.000Z');
  });

  it('ignores rows whose account was not requested', () => {
    const report = buildPilotFacts({
      accounts: [],
      plans: [{ userId: 'x', planId: 'p', createdAt: at('2026-11-01T00:00:00.000Z'), activatedAt: at('2026-11-01T00:00:00.000Z') }],
      actions: [],
      indicators: [],
      reviews: [],
    });
    expect(report.accounts).toBe(0);
    expect(report.counts.activatedPlan).toBe(0);
    expect(report.events).toEqual([]);
  });
});
