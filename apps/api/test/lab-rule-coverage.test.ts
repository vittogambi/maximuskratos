import { describe, expect, it } from 'vitest';
import { buildRuleCoverage } from '../src/lab/lab-rule-coverage';

describe('rule coverage honesty', () => {
  it('does not mark QA as covered without an anchored test file', () => {
    const coverage = buildRuleCoverage();
    const route = coverage.rows.find((item) => item.id === 'ROUTE_COMPLETE');
    expect(route?.status).toBe('covered');
    expect(route?.test_ids).toEqual(['ROUTE_COMPLETE']);
    const neverScores = coverage.rows.find((item) => item.id === 'CONTEXT_NEVER_SCORES');
    expect(neverScores?.status).toBe('covered');
    expect(neverScores?.layer).toBe('Dirección');
    const safetyPriority = coverage.rows.find((item) => item.id === 'PRIORITY_SAFETY_CONFLICT');
    expect(safetyPriority?.kind).toBe('qa');
    expect(safetyPriority?.status).toBe('covered');
    const multi = coverage.rows.find((item) => item.id === 'SAFETY_MULTIPLE_PRECEDENCE');
    expect(multi?.kind).toBe('qa');
    expect(multi?.status).toBe('covered');
  });

  it('maps LAB interpretations and the four clean-priority domains', () => {
    const coverage = buildRuleCoverage();
    expect(coverage.gaps).toEqual([]);
    expect(coverage.rows.find((item) => item.id === 'CLEAN_PRIORITY_FOUR_DOMAINS')?.status).toBe('covered');
    expect(coverage.rows.find((item) => item.id === 'TIE_BREAK')?.status).toBe('covered');
    expect(coverage.rows.find((item) => item.id === 'LAB-OVR-01')?.mode).toBe('HUMAN');
    expect(coverage.rows.find((item) => item.id === 'LAB-OVR-02')?.status).toBe('covered');
    expect(coverage.rows.find((item) => item.id === 'LAB-SCORE-01')?.mode).toBe('QA');
    expect(coverage.rows.find((item) => item.id === 'LAB-SAFETY-01')?.mode).toBe('QA');
    expect(coverage.rows.find((item) => item.id === 'LAB-COV-03')?.mode).toBe('QA');
    expect(coverage.rows.find((item) => item.id === 'LAB-POLICY-02')?.mode).toBe('FUTURE');
    expect(coverage.rows.find((item) => item.id === 'LAB-COV-02')?.mode).toBe('NOT_APPLICABLE');
    expect(coverage.rows.find((item) => item.id === 'LAB-PURPOSE-01')?.mode).toBe('DIRECTION');
  });
});
