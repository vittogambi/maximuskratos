export const REVIEW_READING_VERSION = 'review-reading@1';

export type ReviewSituation =
  | 'TOO_EARLY'
  | 'MISSING_INFORMATION'
  | 'PROGRESS'
  | 'EXECUTED_NO_EFFECT'
  | 'PARTIAL_WITH_RESULT'
  | 'LOW_CAPACITY'
  | 'INCOMPATIBILITY'
  | 'GOAL_NO_LONGER_MATTERS'
  | 'PURPOSE_DRIFT';

export type PlanEvidenceStatus = 'OBSERVED' | 'NOT_YET_OBSERVED' | 'NOT_OBSERVED' | 'NO_INFORMATION';

export type ReviewReadingInput = {
  today: string;
  reviewAt: string;
  executionRatio: number;
  executionThreshold?: number;
  evidenceStatus: PlanEvidenceStatus | null;
  hasNewRestriction: boolean;
  goalStillMatters: boolean | null;
  purposeServed: 'YES' | 'PARTLY' | 'NO' | 'UNKNOWN' | null;
  whyStatus: 'PROPOSED' | 'CONFIRMED' | 'PROVISIONAL' | null;
  missingRegistrations: boolean;
};

export type ReviewReading = {
  version: typeof REVIEW_READING_VERSION;
  situation: ReviewSituation;
  supports: string[];
};

const DEFAULT_EXECUTION_THRESHOLD = 2 / 3;

export function reviewReading(input: ReviewReadingInput): ReviewReading {
  const threshold = input.executionThreshold ?? DEFAULT_EXECUTION_THRESHOLD;
  const supports: string[] = [];

  if (input.goalStillMatters === false) {
    supports.push('goal_no_longer_matters');
    return { version: REVIEW_READING_VERSION, situation: 'GOAL_NO_LONGER_MATTERS', supports };
  }

  if (input.hasNewRestriction) {
    supports.push('new_restriction');
    return { version: REVIEW_READING_VERSION, situation: 'INCOMPATIBILITY', supports };
  }

  const beforeHorizon = input.today < input.reviewAt;
  if (beforeHorizon) {
    supports.push('before_review_at');
    return { version: REVIEW_READING_VERSION, situation: 'TOO_EARLY', supports };
  }

  if (
    input.whyStatus === 'CONFIRMED'
    && (input.purposeServed === 'NO' || input.purposeServed === 'PARTLY')
    && (input.goalStillMatters ?? true)
  ) {
    supports.push('purpose_drift');
    return { version: REVIEW_READING_VERSION, situation: 'PURPOSE_DRIFT', supports };
  }

  if (input.missingRegistrations) {
    supports.push('missing_registrations');
    return { version: REVIEW_READING_VERSION, situation: 'MISSING_INFORMATION', supports };
  }

  if (input.evidenceStatus === 'OBSERVED') {
    if (input.executionRatio < threshold) {
      supports.push('partial_execution', 'observed_evidence');
      return { version: REVIEW_READING_VERSION, situation: 'PARTIAL_WITH_RESULT', supports };
    }
    supports.push('observed_evidence');
    return { version: REVIEW_READING_VERSION, situation: 'PROGRESS', supports };
  }

  if (input.executionRatio >= threshold && input.evidenceStatus === 'NOT_OBSERVED') {
    supports.push('sufficient_execution', 'not_observed');
    return { version: REVIEW_READING_VERSION, situation: 'EXECUTED_NO_EFFECT', supports };
  }

  if (input.executionRatio < threshold) {
    supports.push('low_execution');
    return { version: REVIEW_READING_VERSION, situation: 'LOW_CAPACITY', supports };
  }

  supports.push('missing_evidence');
  return { version: REVIEW_READING_VERSION, situation: 'MISSING_INFORMATION', supports };
}
