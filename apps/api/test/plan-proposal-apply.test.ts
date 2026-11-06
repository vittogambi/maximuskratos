import { describe, expect, it } from 'vitest';
import { actionPatchesFromProposals, planPatchFromProposals } from '../src/journey/plan-proposal-apply';

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

  it('actionPatchesFromProposals maps edited ACTION onto the sole active action', () => {
    const patches = actionPatchesFromProposals(
      [
        {
          kind: 'ACTION',
          decision: 'EDITED',
          payload: { title: 'Original' },
          editedPayload: { title: 'Revisado', doneWhen: 'Quedó listo.' },
        },
      ],
      [{ id: 'act-1' }],
    );
    expect(patches.get('act-1')).toEqual({ title: 'Revisado', doneWhen: 'Quedó listo.' });
  });
});
