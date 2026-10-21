import { describe, expect, it } from 'vitest';
import { assertPlanVersion, focusTargets, nextPlanVersion } from '../src/journey/plan-writes';

describe('plan writes', () => {
  it('nextPlanVersion increments', () => {
    expect(nextPlanVersion(1)).toBe(2);
  });

  it('assertPlanVersion passes when expected is omitted', () => {
    expect(() => assertPlanVersion({ currentVersion: 3 })).not.toThrow();
  });

  it('assertPlanVersion throws STALE_PLAN when versions differ', () => {
    expect(() => assertPlanVersion({ expectedVersion: 2, currentVersion: 3 })).toThrow('STALE_PLAN');
  });

  it('focusTargets clears the previous focus when enabling a new plan', () => {
    expect(focusTargets({ planId: 'b', currentlyFocusedPlanId: 'a', enable: true })).toEqual({
      clearPlanIds: ['a'],
      setPlanId: 'b',
    });
  });

  it('focusTargets clears only the same plan when disabling focus', () => {
    expect(focusTargets({ planId: 'a', currentlyFocusedPlanId: 'a', enable: false })).toEqual({
      clearPlanIds: ['a'],
      setPlanId: null,
    });
  });
});
