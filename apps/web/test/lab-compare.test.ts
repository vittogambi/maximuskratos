import { describe, expect, it } from 'vitest';
import {
  PRIORITY_NOT_COMPARABLE_COPY,
  anticipatedMatrix,
  compareOptionalPrediction,
  comparePriority,
  hasComparableDifference,
} from '@/lib/lab-ui/compare';
import { matrixTrackLabel, purposeTrackLabel } from '@/lib/lab-ui/status';

describe('criterion comparison', () => {
  it('does not treat No estoy seguro as a difference', () => {
    expect(comparePriority('UNSURE', 'MENTALIDAD')).toBe('NOT_COMPARABLE');
    expect(hasComparableDifference([comparePriority('UNSURE', 'MENTALIDAD')])).toBe(false);
    expect(PRIORITY_NOT_COMPARABLE_COPY).toBe(
      'No registraste una decisión firme. Puedes revisar el resultado sin forzar una comparación.',
    );
  });

  it('compares Todavía no elegiría as a decision', () => {
    expect(comparePriority('NONE', 'MENTALIDAD')).toBe('DIFFERENT');
    expect(comparePriority('NONE', 'NONE')).toBe('MATCH');
  });

  it('omits unused Matrix prediction', () => {
    expect(compareOptionalPrediction('UNSURE', 'MENTALIDAD')).toBeNull();
    expect(
      anticipatedMatrix({
        expected_states: { MENTALIDAD: 'UNSURE' },
        expected_priority_domain: 'UNSURE',
        expected_plan_id: null,
      }),
    ).toBe(false);
  });
});

describe('header status', () => {
  it('uses the four Matrix review labels', () => {
    expect(matrixTrackLabel({ status: 'COLLECTING' })).toBe('Pendiente');
    expect(matrixTrackLabel({ status: 'AWAITING_EXPECTATION', has_expectation: true })).toBe('En revisión');
    expect(matrixTrackLabel({ status: 'REVEALED', has_expectation: true })).toBe('Resultado listo');
    expect(
      matrixTrackLabel({
        status: 'REVEALED',
        has_expectation: true,
        has_review: true,
        has_case_verdict: true,
      }),
    ).toBe('Cerrado');
  });

  it('does not mark empty Purpose as pending', () => {
    expect(purposeTrackLabel({ status: 'REVEALED', has_purpose: false }, 0)).toBe(
      'Sin información en este caso',
    );
    expect(purposeTrackLabel({ status: 'REVEALED', has_purpose: false })).toBe('Pendiente');
    expect(purposeTrackLabel({ status: 'REVEALED', has_purpose: false, purpose_answered: false })).toBe(
      'Sin información en este caso',
    );
  });
});
