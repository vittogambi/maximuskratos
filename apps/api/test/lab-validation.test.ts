import { describe, expect, it } from 'vitest';
import { pairCompareAvailable, pairResponseDiff } from '../src/lab/lab-pair';
import { evidenceLabel } from '../src/lab/lab-evidence';
import { nextThreshold } from '../src/lab/lab-composition';
import { CASEBOOK_META } from '../src/lab/lab-casebook';

describe('cross-case and pair helpers', () => {
  it('pair compare is unavailable until both sides are revealed', () => {
    expect(pairCompareAvailable(true, false)).toBe(false);
    expect(pairCompareAvailable(true, true)).toBe(true);
  });

  it('shows only the questions that actually changed', () => {
    const diffs = pairResponseDiff(
      [
        { questionId: 'Q1', raw: 2, status: 'ANSWERED' },
        { questionId: 'Q2', raw: 3, status: 'ANSWERED' },
      ],
      [
        { questionId: 'Q1', raw: 4, status: 'ANSWERED' },
        { questionId: 'Q2', raw: 3, status: 'ANSWERED' },
      ],
    );
    expect(diffs).toEqual([
      { questionId: 'Q1', text: undefined, a: 2, b: 4, aStatus: 'ANSWERED', bStatus: 'ANSWERED' },
    ]);
  });
});

describe('evidence uses engine classifications', () => {
  it('maps real coverage classes', () => {
    expect(evidenceLabel('INTERPRETABLE')).toBe('Suficiente');
    expect(evidenceLabel('PROVISIONAL')).toBe('Provisional');
    expect(evidenceLabel('NO_CLASIFICADO')).toBe('Insuficiente');
  });
});

describe('threshold sensitivity is descriptive', () => {
  it('reports distance to the next band without judging it', () => {
    expect(nextThreshold(39)).toEqual({ score: 40, state: expect.any(String), distance: 1 });
  });
});

describe('baseline casebook keys stay present', () => {
  it('keeps R01 to R15', () => {
    const keys = CASEBOOK_META.map((item) => item.key);
    expect(keys).toContain('R01');
    expect(keys).toContain('R15A');
    expect(keys).toContain('R15B');
    expect(keys).toContain('R07A');
    expect(keys).toContain('R07B');
  });
});
