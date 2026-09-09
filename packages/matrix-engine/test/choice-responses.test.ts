import { describe, expect, it } from 'vitest';
import { classifyResponses } from '../src/engine/responses';
import { namedPolicy } from '../src/policy/build-policy-plan';
import { loadFrozen } from './helpers/assessment';

describe('choice and numeric responses', () => {
  const definition = loadFrozen();
  const policy = namedPolicy('CUSTOM', ['P-CUE-01', 'D-CUE-06', 'D-CUE-07']);

  it('accepts a packed CHOICE option, basal JSON, and sleep hours', () => {
    const { classified, invalidIds } = classifyResponses(
      definition,
      [
        { questionId: 'P-CUE-01', status: 'ANSWERED', rawValue: 'Atlético' },
        {
          questionId: 'D-CUE-06',
          status: 'ANSWERED',
          rawValue: JSON.stringify({ edad: 42, estatura_cm: 178, peso_kg: 80 }),
        },
        { questionId: 'D-CUE-07', status: 'ANSWERED', rawValue: 7.5 },
      ],
      policy,
    );
    expect(invalidIds).toEqual([]);
    expect(
      classified
        .filter((item) => item.status === 'ANSWERED')
        .map((item) => item.questionId)
        .sort(),
    ).toEqual(['D-CUE-06', 'D-CUE-07', 'P-CUE-01']);
  });

  it('rejects garbage sleep hours', () => {
    const { invalidIds } = classifyResponses(
      definition,
      [{ questionId: 'D-CUE-07', status: 'ANSWERED', rawValue: 'adadada' }],
      namedPolicy('CUSTOM', ['D-CUE-07']),
    );
    expect(invalidIds).toEqual(['D-CUE-07']);
  });

  it('rejects sleep hours outside 0 to 24', () => {
    const { invalidIds } = classifyResponses(
      definition,
      [{ questionId: 'D-CUE-07', status: 'ANSWERED', rawValue: 30 }],
      namedPolicy('CUSTOM', ['D-CUE-07']),
    );
    expect(invalidIds).toEqual(['D-CUE-07']);
  });
});
