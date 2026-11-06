import { describe, expect, it } from 'vitest';
import { storedPayload } from '../src/journey/plan-proposal-domain';

describe('storedPayload', () => {
  it('uses editedPayload for legacy rows marked ACCEPTED with edits saved', () => {
    const payload = storedPayload({
      kind: 'ACTION',
      decision: 'ACCEPTED',
      payload: { title: 'Original' },
      editedPayload: { title: 'Revisado' },
    });
    expect(payload.title).toBe('Revisado');
  });
});
