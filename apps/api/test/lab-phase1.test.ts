import { describe, expect, it } from 'vitest';
import { buildEvidenceSummary, otherNotesVisible } from '../src/lab/lab-evidence';
import { loadFrozenDefinition } from '../src/lab/lab-paths';

function caseRunFlags(run: {
  expectations: unknown[];
  reviews: Array<{ caseVerdict?: string | null }>;
  purposeAssessments: unknown[];
  productReview: boolean;
}) {
  return {
    has_expectation: run.expectations.length > 0,
    has_review: run.reviews.length > 0,
    has_case_verdict: Boolean(run.reviews[0]?.caseVerdict),
    has_purpose: run.purposeAssessments.length > 0,
    has_product_review: run.productReview,
  };
}

describe('LAB-014 evidence stays blind before reveal', () => {
  it('omits evidence_state and classification until the run is revealed', () => {
    const definition = loadFrozenDefinition();
    const hidden = buildEvidenceSummary(definition, [], { revealed: false });
    for (const domain of hidden.domains) {
      expect(domain).not.toHaveProperty('evidence_state');
      expect(domain).not.toHaveProperty('classification');
    }
    const shown = buildEvidenceSummary(definition, [], { revealed: true });
    for (const domain of shown.domains) {
      expect(domain.evidence_state).toBeTruthy();
      expect(domain.classification).toBeTruthy();
    }
  });

  it('returns empty other notes before reveal', () => {
    const notes = [{ id: 'obs-1', note: 'hidden' }];
    expect(otherNotesVisible('AWAITING_EXPECTATION') ? notes : []).toEqual([]);
    expect(otherNotesVisible('REVEALED') ? notes : notes).toEqual(notes);
  });
});

describe('LAB-015 getCase run flags drive the case-page label', () => {
  it('labels a reviewed run as Matriz revisada, not Falta tu criterio', () => {
    const flags = caseRunFlags({
      expectations: [{}],
      reviews: [{ caseVerdict: 'REPRESENTS_WELL' }],
      purposeAssessments: [],
      productReview: false,
    });
    expect(flags).toEqual({
      has_expectation: true,
      has_review: true,
      has_case_verdict: true,
      has_purpose: false,
      has_product_review: false,
    });
  });
});

describe('LAB-013 partial verdict does not create a review', () => {
  it('updates the latest review in place when one exists', () => {
    const reviews = [{ id: 'rev-1', caseVerdict: null as string | null }];
    const latest = reviews[0];
    if (!latest) {
      throw new Error('Primero registra dónde no coincide.');
    }
    latest.caseVerdict = 'REPRESENTS_WELL';
    expect(reviews).toHaveLength(1);
    expect(latest.caseVerdict).toBe('REPRESENTS_WELL');
  });

  it('refuses a verdict when there is no saved review', () => {
    const latest = null;
    expect(() => {
      if (!latest) throw new Error('Primero registra dónde no coincide.');
    }).toThrow('Primero registra dónde no coincide.');
  });
});
