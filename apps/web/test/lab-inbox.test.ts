import { describe, expect, it } from 'vitest';
import { filterLabCases } from '@/lib/lab-ui/inbox';
import type { LabCaseRow } from '@/lib/lab-api';
import { matrixTrackLabel } from '@/lib/lab-ui/status';

function row(partial: Partial<LabCaseRow> & { id: string; label: string }): LabCaseRow {
  return {
    kind: 'SYNTHETIC',
    blind: true,
    casebook_key: partial.casebook_key ?? partial.label,
    fixture_key: null,
    story: 'Historia',
    test_intent: null,
    pair: null,
    pair_side: null,
    matrix_review_complete: false,
    product_review_complete: false,
    purpose_complete: false,
    latest_run: {
      id: `run-${partial.id}`,
      status: 'REVEALED',
      policy_id: 'FULL-v1',
      served: 187,
      answered: 102,
      skipped: 0,
      has_expectation: true,
      has_review: false,
      has_case_verdict: false,
      has_purpose: false,
      has_product_review: false,
      disagreement: false,
    },
    ...partial,
  };
}

describe('LAB-051 single inbox list', () => {
  it('shows R04 once across 19 cases', () => {
    const rows = Array.from({ length: 19 }, (_, index) =>
      row({
        id: `c${index + 1}`,
        label: `R${String(index + 1).padStart(2, '0')}`,
        casebook_key: index === 3 ? 'R04' : `R${String(index + 1).padStart(2, '0')}`,
      }),
    );
    rows[3] = { ...rows[3], label: 'R04', casebook_key: 'R04' };
    const visible = filterLabCases(rows, 'todos');
    expect(visible.filter((item) => item.casebook_key === 'R04')).toHaveLength(1);
    expect(visible).toHaveLength(19);
  });
});

describe('LAB-050 index status', () => {
  it('says Resultado listo without a warning mark', () => {
    const label = matrixTrackLabel({
      status: 'REVEALED',
      has_expectation: true,
      has_review: false,
    });
    expect(label).toBe('Resultado listo');
    expect(label).not.toContain('⚠');
  });
});
