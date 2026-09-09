import { describe, expect, it } from 'vitest';
import { applyFamilyClose, buildFamilyProgress } from '../src/lab/lab-family-progress';

describe('buildFamilyProgress', () => {
  it('counts only canonical families and keys', () => {
    const overview = buildFamilyProgress([
      { casebook_key: 'R01', matrix_review_complete: true, test_intent: 'Empate', latest_run: { id: '1' } },
      { casebook_key: 'R02', matrix_review_complete: false, latest_run: { id: '2' } },
      { casebook_key: null, matrix_review_complete: true, latest_run: { id: 'qa' } },
    ]);
    expect(overview.families_total).toBe(13);
    expect(overview.canonical_total).toBe(26);
    expect(overview.canonical_reviewed).toBe(1);
    expect(overview.families.find((item) => item.id === 'baseline')?.status).toBe('Pendiente');
    expect(overview.families.find((item) => item.id === 'one_low')?.status).toBe('Pendiente');
    expect(overview.families.find((item) => item.id === 'edge_39_40')?.compare).toBe(true);
    expect(overview.families.find((item) => item.id === 'safety_vs_priority')).toBeUndefined();
  });

  it('does not close one_low until all four clean-priority cases are reviewed', () => {
    const overview = buildFamilyProgress([
      {
        casebook_key: 'R02',
        matrix_review_complete: true,
        family_reviews: { one_low: { case_done: true, verdict: 'REPRESENTS', criterion_id: 'one_low' } },
        latest_run: { id: '2' },
      },
      {
        casebook_key: 'R03',
        matrix_review_complete: true,
        family_reviews: { one_low: { case_done: true, verdict: 'REPRESENTS', criterion_id: 'one_low' } },
        latest_run: { id: '3' },
      },
    ]);
    const family = overview.families.find((item) => item.id === 'one_low');
    expect(family?.total).toBe(4);
    expect(family?.reviewed).toBe(2);
    expect(family?.status).toBe('En revisión');
    expect(family?.keys).toEqual(['R02', 'R16', 'R17', 'R03']);
  });

  it('keeps variant-specific criteria distinct inside the same family', () => {
    const overview = buildFamilyProgress([
      {
        casebook_key: 'R11',
        matrix_review_complete: true,
        family_reviews: { safety_critical: { case_done: true, verdict: 'REPRESENTS', criterion_id: 'safety_critical' } },
        latest_run: { id: '11' },
      },
      {
        casebook_key: 'R11B',
        matrix_review_complete: true,
        family_reviews: {
          safety_critical: { case_done: true, verdict: 'REPRESENTS', criterion_id: 'safety_critical:R11B' },
        },
        latest_run: { id: '11b' },
      },
    ]);
    const family = overview.families.find((item) => item.id === 'safety_critical');
    expect(family?.status).toBe('Validada');
    expect(family?.keys).toEqual(['R11', 'R11B']);
  });

  it('does not close a second test when a reused case is judged in one family', () => {
    const overview = buildFamilyProgress([
      {
        casebook_key: 'R01',
        matrix_review_complete: true,
        family_reviews: { baseline: { case_done: true, verdict: 'REPRESENTS' } },
        latest_run: { id: '1' },
      },
    ]);
    expect(overview.families.find((item) => item.id === 'baseline')?.status).toBe('Validada');
    expect(overview.families.find((item) => item.id === 'tie')?.status).toBe('Pendiente');
    expect(overview.families.find((item) => item.id === 'tie')?.reviewed).toBe(0);
  });

  it('stores the variant criterion when closing a family review', () => {
    const next = applyFamilyClose({
      current: {},
      familyId: 'safety_high_unclassified',
      verdictAt: 'case',
      verdict: 'REPRESENTS',
      criterion_id: 'safety_high_unclassified:R12B',
    });
    expect(next.safety_high_unclassified).toEqual({
      case_done: true,
      verdict: 'REPRESENTS',
      criterion_id: 'safety_high_unclassified:R12B',
    });
  });
});
