import { describe, expect, it } from 'vitest';
import { scoreIad, type IadAnswer, type IadId, IAD_IDS } from '../src/instrumentos/iad';
import { AUDIT_IDS, auditId, scoreAudit } from '../src/instrumentos/score';

function answers(values: Array<number | null>): Record<IadId, IadAnswer> {
  const row = {} as Record<IadId, IadAnswer>;
  IAD_IDS.forEach((id, index) => {
    const value = values[index];
    row[id] = value == null ? { value: null, unknown: true } : { value: value as 1 | 2 | 3 | 4 | 5, unknown: false };
  });
  return row;
}

describe('IAD invariants', () => {
  it('scores the extremes and withholds a total until every pillar is complete', () => {
    expect(scoreIad(answers([1, 1, 1, 1, 1, 1, 1, 1, 1]))).toEqual({ E: 0, M: 0, C: 0, total: 0 });
    expect(scoreIad(answers([5, 5, 5, 5, 5, 5, 5, 5, 5]))).toEqual({ E: 100, M: 100, C: 100, total: 100 });
    const partial = scoreIad(answers([5, 5, 5, null, null, null, null, null, null]));
    expect(partial.E).toBe(100);
    expect(partial.M).toBeNull();
    expect(partial.total).toBeNull();
  });

  it('does not turn an unknown audit answer into zero or a renormalized total', () => {
    const rows = AUDIT_IDS.map((id) => (
      id === auditId(6) ? { id, value: null, exception: 'UNKNOWN' as const } : { id, value: 5 }
    ));
    const audit = scoreAudit(rows);
    expect(audit.value).toBeNull();
    expect(audit.calculable).toBe(false);
    expect(audit.coverage).toEqual({ answered: 22, required: 23 });
    expect(audit.partial).toBe(110);
    expect(scoreAudit(AUDIT_IDS.map((id) => ({ id, value: 5 }))).value).toBe(115);
  });
});
