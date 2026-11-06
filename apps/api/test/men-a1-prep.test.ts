import { describe, expect, it } from 'vitest';
import { deriveIndicatorFromReview, normalizePrepPayload, validateConfirmPrep } from '../src/journey/intervention/men-a1-prep';

describe('MEN-A1 preparación', () => {
  it('limita prioridades en versión mínima', () => {
    const prep = normalizePrepPayload({
      priorities: [
        { id: 'a', advance: 'Uno', recognize: 'R1', nextStep: 'S1' },
        { id: 'b', advance: 'Dos', recognize: 'R2', nextStep: 'S2' },
      ],
      primaryId: 'a',
    }, true);
    expect(prep.priorities).toHaveLength(1);
  });

  it('no publica indicador con estados desconocidos', () => {
    const prep = normalizePrepPayload({
      priorities: [{ id: 'a', advance: 'X', recognize: 'R', nextStep: 'S' }],
      primaryId: 'a',
    }, false);
    const derived = deriveIndicatorFromReview(false, prep, {
      priorities: [{ id: 'a', outcome: 'UNKNOWN' }],
    });
    expect(derived.complete).toBe(false);
    expect(derived.value).toBeNull();
  });

  it('cuenta prioridades logradas en versión estándar', () => {
    const prep = normalizePrepPayload({
      priorities: [
        { id: 'a', advance: 'A', recognize: 'Ra', nextStep: 'Sa' },
        { id: 'b', advance: 'B', recognize: 'Rb', nextStep: 'Sb' },
      ],
      primaryId: 'a',
    }, false);
    const derived = deriveIndicatorFromReview(false, prep, {
      priorities: [
        { id: 'a', outcome: 'ACHIEVED' },
        { id: 'b', outcome: 'NOT_ACHIEVED' },
      ],
    });
    expect(derived.complete).toBe(true);
    expect(derived.value).toBe(1);
  });

  it('exige prioridad completa para confirmar', () => {
    const prep = normalizePrepPayload({ priorities: [{ id: 'a', advance: '', recognize: '', nextStep: '' }] }, false);
    expect(validateConfirmPrep(prep, false)).toMatch(/al menos una/);
  });
});
