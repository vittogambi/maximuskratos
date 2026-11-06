import { describe, expect, it } from 'vitest';
import { buildDashboard, pickRepresentativePlan } from '../src/journey/dashboard';

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
    expect(board.matrix).toHaveLength(4);
    expect(board.matrix.map((row) => row.territory)).toEqual(['MENTALIDAD', 'FINANZAS', 'RELACIONES', 'SALUD_FISICA']);
    expect(board.matrix[0]?.plan?.id).toBe('p1');
    expect(board.matrix[0]?.plan?.week).toBeNull();
  });

  it('picks the representative plan without changing focus data', () => {
    const plans = [
      { id: 'closed', title: 'Cerrado', stage: 'CLOSED', status: 'ARCHIVED', isFocus: false, territory: 'FINANZAS', updatedAt: '2026-10-20' },
      { id: 'draft', title: 'Borrador', stage: 'PREPARING', status: 'DRAFT', isFocus: false, territory: 'FINANZAS', updatedAt: '2026-10-21' },
      { id: 'old', title: 'Viejo', stage: 'ACTIVE', status: 'ACTIVE', isFocus: false, territory: 'FINANZAS', updatedAt: '2026-10-01' },
      { id: 'new', title: 'Nuevo', stage: 'ACTIVE', status: 'ACTIVE', isFocus: false, territory: 'FINANZAS', updatedAt: '2026-10-22' },
    ];
    expect(pickRepresentativePlan(plans, 'FINANZAS')?.id).toBe('new');
    const withFocus = plans.map((plan) => (plan.id === 'draft' ? { ...plan, isFocus: true } : plan));
    expect(pickRepresentativePlan(withFocus, 'FINANZAS')?.id).toBe('draft');
  });
});
