import { describe, expect, it } from 'vitest';
import {
  classifyObservation,
  validateAspects,
  validateFidelity,
  aspectCounts,
} from '../src/lab/lab-observation';

describe('LAB-030 observation aspects', () => {
  it('rejects unknown codes', () => {
    expect(validateAspects({ wording: 'BAD_COPY' })).toBe('Código no válido: BAD_COPY');
    expect(validateAspects({ weight: 'WEIGHT_MORE' })).toBeNull();
  });

  it('classifies weight as ENGINE with a suggested operation', () => {
    const more = classifyObservation({ weight: 'WEIGHT_MORE' }, { question_id: 'AUD-CUE-01' });
    expect(more.kind).toBe('ENGINE');
    expect(more.engine_testable).toBe(true);
    expect(more.suggested_operation).toEqual({
      op: 'SET_QUESTION_WEIGHT',
      question_id: 'AUD-CUE-01',
      to: 2,
    });
    const less = classifyObservation({ weight: 'WEIGHT_LESS' }, { question_id: 'AUD-CUE-01' });
    expect(less.suggested_operation).toMatchObject({ to: 0.5 });
    const exclude = classifyObservation({ weight: 'WEIGHT_EXCLUDE' }, { question_id: 'AUD-CUE-01' });
    expect(exclude.suggested_operation).toEqual({
      op: 'SET_QUESTION_ACTIVE',
      question_id: 'AUD-CUE-01',
      to: false,
    });
  });

  it('classifies wording as CONTENT without a trial operation', () => {
    const result = classifyObservation({ wording: 'WORDING_AMBIGUOUS' }, { question_id: 'AUD-CUE-01' });
    expect(result.kind).toBe('CONTENT');
    expect(result.content).toBe(true);
    expect(result.engine_testable).toBe(false);
    expect(result.suggested_operation).toBeNull();
  });

  it('aggregates three weight marks on the same question', () => {
    const counts = aspectCounts([
      { weight: 'WEIGHT_MORE' },
      { weight: 'WEIGHT_MORE' },
      { weight: 'WEIGHT_MORE' },
    ]);
    expect(counts.weight).toBe(3);
  });
});

describe('LAB-063 fidelity', () => {
  it('rejects FIDELITY_NO without an intended measure', () => {
    expect(validateFidelity({ verdict: 'FIDELITY_NO' })).toBe(
      'Explica qué debería medir esta pregunta.',
    );
    expect(
      validateFidelity({ verdict: 'FIDELITY_NO', intended_measure: 'Debería medir sueño real.' }),
    ).toBeNull();
  });

  it('keeps quality codes independent from fidelity', () => {
    expect(validateAspects({ wording: 'WORDING_OK' })).toBeNull();
    expect(validateFidelity({ verdict: 'FIDELITY_NO', intended_measure: 'Otra cosa.' })).toBeNull();
  });
});
