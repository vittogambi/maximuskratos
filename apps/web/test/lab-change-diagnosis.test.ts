import { describe, expect, it } from 'vitest';
import { changePath, seedDiagnosis } from '@/lib/lab-ui/change-diagnosis';
import { presetFromFirstProblem, tryChangeLabel } from '@/lib/lab-ui/change-preset';

describe('change diagnosis', () => {
  it('opens the weight editor only when the question is well placed and poorly weighted', () => {
    expect(changePath('QUESTION', 'WEIGHT')).toEqual({
      mode: 'experiment',
      kind: 'QUESTION_WEIGHT',
    });
    expect(seedDiagnosis('QUESTION_WEIGHT')).toEqual({ diagnosis: 'QUESTION', fault: 'WEIGHT' });
  });

  it('does not invent a candidate for wording, scale, safety or route', () => {
    for (const path of [
      changePath('QUESTION', 'WORDING'),
      changePath('SCALE'),
      changePath('SAFETY'),
      changePath('ROUTE'),
    ]) {
      expect(path?.mode).toBe('finding');
    }
  });

  it('routes structural engine knobs to the matching experiment', () => {
    expect(changePath('CALCULATION')).toMatchObject({
      mode: 'experiment',
      kind: 'DOMAIN_AGGREGATION',
    });
    expect(changePath('COVERAGE')).toMatchObject({ mode: 'experiment', optionFilter: 'coverage' });
    expect(changePath('STATE')).toMatchObject({ mode: 'experiment', optionFilter: 'state' });
    expect(changePath('PRIORITY')).toMatchObject({ mode: 'experiment', optionFilter: 'priority' });
  });

  it('does not treat a domain score problem as a weight tweak', () => {
    expect(tryChangeLabel('DOMAIN_SCORE')).toBe('Probar otra forma de calcular el ámbito');
    expect(presetFromFirstProblem('DOMAIN_SCORE').kind).toBe('DOMAIN_AGGREGATION');
    expect(presetFromFirstProblem('DOMAIN_SCORE', { rootCause: 'WEIGHT' }).kind).toBe('QUESTION_WEIGHT');
    expect(tryChangeLabel('RESPONSE_VALIDATION')).toBe('Esto se anota en el cierre');
    expect(presetFromFirstProblem('RESPONSE_VALIDATION').questionFault).toBe('WORDING');
  });
});
