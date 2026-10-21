import { describe, expect, it } from 'vitest';
import { isPersonalized, withoutRejected } from '../src/journey/accompaniment/personalization';

describe('personalization', () => {
  it('does not personalize when only inserting member text without refs', () => {
    expect(
      isPersonalized({
        reasons: [{ text: 'Ayudo a mi hermana.', refs: [], effect: 'GOAL' }],
      }),
    ).toBe(false);
  });

  it('personalizes when R26 is recognized', () => {
    expect(
      isPersonalized({
        reasons: [{
          text: 'Preparación por aclarar.',
          refs: ['formulario-v1:E-AUD-001!R26'],
          effect: 'STRATEGY',
        }],
      }),
    ).toBe(true);
  });

  it('drops a rejected reason and re-enables after response revision changes', () => {
    const proposal = {
      reasons: [
        { text: 'A', refs: ['formulario-v1:E-AUD-001!R26'], effect: 'STRATEGY' as const },
        { text: 'B', refs: ['direction'], effect: 'PURPOSE' as const },
      ],
    };
    const rejected = [{ sourceRef: 'formulario-v1:E-AUD-001!R26', responseRevision: 2 }];
    const trimmed = withoutRejected(proposal, rejected, () => 2);
    expect(trimmed.reasons).toHaveLength(1);
    const again = withoutRejected(proposal, rejected, () => 3);
    expect(again.reasons).toHaveLength(2);
  });

  it('counts PURPOSE only with a confirmed source ref', () => {
    expect(
      isPersonalized({
        reasons: [{ text: 'Citamos tu dirección.', refs: ['direction'], effect: 'PURPOSE' }],
      }),
    ).toBe(true);
    expect(
      isPersonalized({
        reasons: [{ text: 'Inventado.', refs: [], effect: 'PURPOSE' }],
      }),
    ).toBe(false);
  });
});
