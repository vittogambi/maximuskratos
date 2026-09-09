import { describe, expect, it } from 'vitest';
import { buildReviewExit } from '@/lib/lab-ui/review-exit';
import type { LabCaseRow, LabFamilyRow, LabReviewAgenda, LabRunProgressFields } from '@/lib/lab-api';

const agenda = {
  next: { href: '/admin/lab/families/one_low', title: 'Siguiente', lead: '', cta: '', track: 'matrix', done_prompt: null },
} as LabReviewAgenda;

function run(id: string): LabRunProgressFields {
  return {
    id,
    status: 'REVEALED',
    policy_id: 'FULL',
    served: 90,
    answered: 90,
    skipped: 0,
    has_expectation: true,
    has_review: true,
    has_case_verdict: true,
    has_purpose: false,
    has_product_review: false,
    disagreement: false,
  };
}

function family(partial: Partial<LabFamilyRow> & Pick<LabFamilyRow, 'id'>): LabFamilyRow {
  return {
    label: partial.label ?? partial.id,
    keys: partial.keys ?? ['R01'],
    core: true,
    status: 'En revisión',
    reviewed: 0,
    total: 1,
    compare: false,
    intent: null,
    next_run_id: null,
    ...partial,
  };
}

function row(partial: Partial<LabCaseRow> & Pick<LabCaseRow, 'id'>): LabCaseRow {
  return {
    label: 'Caso',
    kind: 'FIXTURE',
    blind: true,
    casebook_key: 'R01',
    fixture_key: null,
    story: null,
    test_intent: null,
    pair: null,
    pair_side: null,
    matrix_review_complete: false,
    product_review_complete: false,
    purpose_complete: false,
    latest_run: run('run-b'),
    ...partial,
  };
}

describe('buildReviewExit', () => {
  it('continues with the next case in the same test', () => {
    const exit = buildReviewExit({
      familyId: 'one_low',
      runId: 'run-a',
      families: [family({ id: 'one_low', keys: ['R02', 'R03'], reviewed: 1, total: 3 })],
      cases: [
        row({ id: 'c2', casebook_key: 'R02', family_reviews: { one_low: { case_done: true } }, latest_run: run('run-a') }),
        row({ id: 'c3', casebook_key: 'R03', family_reviews: {}, latest_run: run('run-b') }),
      ],
      agenda,
    });
    expect(exit.primary.label).toBe('Continuar con el siguiente caso');
    expect(exit.primary.href).toContain('run-b');
    expect(exit.secondary.label).toBe('Volver a Revisión');
  });

  it('asks to compare when both pair cases are done', () => {
    const exit = buildReviewExit({
      familyId: 'purpose_silent',
      runId: 'run-b',
      families: [
        family({
          id: 'purpose_silent',
          keys: ['R15A', 'R15B'],
          compare: true,
          reviewed: 2,
          total: 2,
          status: 'En revisión',
        }),
      ],
      cases: [
        row({ id: 'a', casebook_key: 'R15A', family_reviews: { purpose_silent: { case_done: true } } }),
        row({ id: 'b', casebook_key: 'R15B', family_reviews: { purpose_silent: { case_done: true } } }),
      ],
      agenda,
    });
    expect(exit.primary.label).toBe('Comparar las dos versiones');
    expect(exit.primary.href).toBe('/admin/lab/families/purpose_silent');
  });

  it('keeps the pair CTA for Matrix A/B tests', () => {
    const exit = buildReviewExit({
      familyId: 'edge_39_40',
      runId: 'run-b',
      families: [
        family({
          id: 'edge_39_40',
          keys: ['R07A', 'R07B'],
          compare: true,
          reviewed: 2,
          total: 2,
          status: 'En revisión',
        }),
      ],
      cases: [
        row({ id: 'a', casebook_key: 'R07A', family_reviews: { edge_39_40: { case_done: true } } }),
        row({ id: 'b', casebook_key: 'R07B', family_reviews: { edge_39_40: { case_done: true } } }),
      ],
      agenda,
    });
    expect(exit.primary.label).toBe('Comparar los dos casos');
  });

  it('moves to the next review when the test is finished', () => {
    const exit = buildReviewExit({
      familyId: 'baseline',
      runId: 'run-a',
      families: [family({ id: 'baseline', status: 'Validada', reviewed: 1, total: 1 })],
      cases: [row({ id: 'c1', family_reviews: { baseline: { case_done: true, verdict: 'REPRESENTS' } } })],
      agenda,
    });
    expect(exit.primary.label).toBe('Continuar con la siguiente revisión');
    expect(exit.secondary.label).toBe('Volver al Lab');
  });
});
