export type ReturnReading = {
  headline: string | null;
  lastAdjustment: string | null;
  protectedNote: string | null;
  daysAway: number | null;
  hasPendingOccasions: boolean;
};

export function returnPanel(input: {
  planTitle: string | null;
  planOutcome: string | null;
  protectNote: string | null;
  lastReviewNote: string | null;
  daysSinceLastActivity: number | null;
  pendingOccasionDays: number;
}): ReturnReading {
  const headline = input.planOutcome?.trim() || input.planTitle?.trim() || null;
  return {
    headline,
    lastAdjustment: input.lastReviewNote?.trim() || null,
    protectedNote: input.protectNote?.trim() || null,
    daysAway: input.daysSinceLastActivity,
    hasPendingOccasions: input.pendingOccasionDays > 0,
  };
}
