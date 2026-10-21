import { describe, expect, it } from 'vitest';
import { planPatchFromProposals } from '../src/journey/plan-proposal-apply';

describe('planPatchFromProposals', () => {
  it('applies ACTION proposal criterion without overwriting rejected rows', () => {
    const patch = planPatchFromProposals(
      [
        {
          kind: 'ACTION',
          decision: 'ACCEPTED',
          payload: { familyId: 'X-IKIGAI', title: 'Probar', doneWhen: 'Quedó hecho.' },
        },
        {
          kind: 'WHY',
          decision: 'REJECTED',
          payload: { text: 'No usar' },
        },
      ],
      { outcome: '', criterionRevision: 1 },
    );
    expect(patch.criterionText).toBeTruthy();
    expect(patch.criterionRevision).toBe(2);
    expect(patch.whyItMatters).toBeUndefined();
  });
});
