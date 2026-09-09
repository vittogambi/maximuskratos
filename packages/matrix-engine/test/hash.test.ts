import { describe, expect, it } from 'vitest';
import { canonicalize, hashResponses } from '../src/engine/hash';

describe('canonical hash', () => {
  it('sorts object keys', () => {
    expect(canonicalize({ b: 1, a: 2 })).toBe(canonicalize({ a: 2, b: 1 }));
  });

  it('hashResponses includes qualitativeConfirmed and ignores input order', () => {
    const a = hashResponses([
      { questionId: 'D-REL-15', status: 'ANSWERED', rawValue: 1, qualitativeConfirmed: null },
      { questionId: 'AUD-MEN-01', status: 'ANSWERED', rawValue: 3 },
    ]);
    const b = hashResponses([
      { questionId: 'AUD-MEN-01', status: 'ANSWERED', rawValue: 3, qualitativeConfirmed: null },
      { questionId: 'D-REL-15', status: 'ANSWERED', rawValue: 1, qualitativeConfirmed: null },
    ]);
    expect(a).toBe(b);

    const suppressed = hashResponses([
      { questionId: 'AUD-MEN-01', status: 'ANSWERED', rawValue: 3 },
      { questionId: 'D-REL-15', status: 'ANSWERED', rawValue: 1, qualitativeConfirmed: false },
    ]);
    expect(suppressed).not.toBe(a);
  });
});
