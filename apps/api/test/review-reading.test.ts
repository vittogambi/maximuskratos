import { describe, expect, it } from 'vitest';
import { reviewReading } from '../src/journey/review-reading';

const base = {
  today: '2026-10-20',
  reviewAt: '2026-11-09',
  executionRatio: 1,
  evidenceStatus: 'NOT_OBSERVED' as const,
  hasNewRestriction: false,
  goalStillMatters: true,
  purposeServed: null,
  whyStatus: null,
  missingRegistrations: false,
};

describe('review-reading@1', () => {
  it('returns TOO_EARLY before reviewAt even with full execution', () => {
    expect(reviewReading({ ...base, today: '2026-10-15', executionRatio: 1 }).situation).toBe('TOO_EARLY');
  });

  it('returns EXECUTED_NO_EFFECT on horizon with sufficient execution and no effect', () => {
    expect(reviewReading({ ...base, today: '2026-11-10', executionRatio: 0.7 }).situation).toBe('EXECUTED_NO_EFFECT');
  });

  it('returns PARTIAL_WITH_RESULT with partial execution and observed evidence', () => {
    expect(
      reviewReading({
        ...base,
        today: '2026-11-10',
        executionRatio: 0.5,
        evidenceStatus: 'OBSERVED',
      }).situation,
    ).toBe('PARTIAL_WITH_RESULT');
  });

  it('returns INCOMPATIBILITY when a new restriction appears before the horizon', () => {
    expect(
      reviewReading({ ...base, today: '2026-10-15', hasNewRestriction: true }).situation,
    ).toBe('INCOMPATIBILITY');
  });

  it('returns MISSING_INFORMATION without registrations at horizon', () => {
    expect(
      reviewReading({ ...base, today: '2026-11-10', missingRegistrations: true }).situation,
    ).toBe('MISSING_INFORMATION');
  });

  it('returns GOAL_NO_LONGER_MATTERS when declared', () => {
    expect(reviewReading({ ...base, goalStillMatters: false }).situation).toBe('GOAL_NO_LONGER_MATTERS');
  });

  it('returns PURPOSE_DRIFT when confirmed why no longer serves but goal still matters', () => {
    expect(
      reviewReading({
        ...base,
        today: '2026-11-10',
        whyStatus: 'CONFIRMED',
        purposeServed: 'NO',
        goalStillMatters: true,
      }).situation,
    ).toBe('PURPOSE_DRIFT');
  });

  it('never returns PURPOSE_DRIFT for provisional why', () => {
    expect(
      reviewReading({
        ...base,
        today: '2026-11-10',
        whyStatus: 'PROVISIONAL',
        purposeServed: 'NO',
        goalStillMatters: true,
      }).situation,
    ).not.toBe('PURPOSE_DRIFT');
  });
});
