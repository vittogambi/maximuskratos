import { describe, expect, it } from 'vitest';
import { buildDashboard } from '../src/journey/dashboard';

describe('member dashboard', () => {
  it('offers choose start when there are no plans', () => {
    const board = buildDashboard({
      ledger: [],
      catalogQuestions: [],
      plans: [],
      focusWeekCounts: null,
      focusPlanId: null,
    });
    expect(board.chooseStart).toBe(true);
    expect(board.focusPlan).toBeNull();
    expect(board.territories).toHaveLength(4);
  });

  it('surfaces focus plan week counts when provided', () => {
    const board = buildDashboard({
      ledger: [],
      catalogQuestions: [],
      plans: [{ id: 'p1', title: 'Plan', stage: 'ACTIVE', status: 'ACTIVE', isFocus: true, territory: 'MENTALIDAD' }],
      focusWeekCounts: { countingVersion: 'conteo-semanal@1', done: 1, notDone: 0, noInformation: 0, excepted: 0, dueUnmarked: 0, upcoming: 2, percent: null, percentReason: 'OPEN_WEEK' },
      focusPlanId: 'p1',
    });
    expect(board.focusPlan?.week?.done).toBe(1);
  });
});
