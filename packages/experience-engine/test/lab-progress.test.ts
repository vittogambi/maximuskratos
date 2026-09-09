import { describe, expect, it } from 'vitest';
import {
  isMatrixReviewComplete,
  isProductReviewComplete,
  matrixTrackStatus,
  productTrackStatus,
} from '../src/lab-progress';

describe('Matrix vs Product progress', () => {
  it('completes Matrix review without Purpose or Product', () => {
    const run = {
      status: 'REVEALED',
      has_expectation: true,
      has_review: true,
      has_case_verdict: true,
      has_purpose: false,
      has_product_review: false,
    };
    expect(isMatrixReviewComplete(run)).toBe(true);
    expect(isProductReviewComplete(run)).toBe(false);
    expect(matrixTrackStatus(run).label).toBe('Revisada');
    expect(productTrackStatus(run).label).toBe('Pendiente');
  });

  it('does not complete Matrix review without a case verdict', () => {
    expect(
      isMatrixReviewComplete({
        status: 'REVEALED',
        has_expectation: true,
        has_review: true,
        has_case_verdict: false,
      }),
    ).toBe(false);
  });

  it('closes a case with a verdict even if the criterion was not recorded separately', () => {
    expect(
      isMatrixReviewComplete({
        status: 'REVEALED',
        skipped_expectation: true,
        has_expectation: false,
        has_review: true,
        has_case_verdict: true,
      }),
    ).toBe(true);
  });
});
