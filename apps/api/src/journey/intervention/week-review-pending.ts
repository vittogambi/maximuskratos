import type { WeekDecision, WeekRevision } from '../apply-week';
import type { MemberReviewChoice } from './review-decision';
import type { PendingActionChange, PendingAddition } from './action-review';

export type ReviewMeaning = 'STILL' | 'LESS' | 'NO_LONGER';

export type PendingPlanReview = {
  planId: string;
  territory: string;
  actionId: string;
  actionDigest: string;
  choice: MemberReviewChoice;
  decision: WeekDecision;
  revision: WeekRevision;
  note: string | null;
  commandKey: string;
  reviewCode: string;
  savedAt: string;
  previewSummary: string | null;
  evidenceDigest?: string | null;
  meaning?: ReviewMeaning | null;
  /** Per-action decisions. Absent on decisions saved before plans had several actions: then actionId is the only one. */
  actions?: (PendingActionChange & { actionDigest: string })[];
  additions?: (PendingAddition & { conversationOutcome?: string | null })[];
  /** Whether the choice derived from the actions is one the review proposed. The member decides either way. */
  followsProposal?: boolean;
  /** Set when a template action changes enough that the weekly question might no longer fit. The question itself is not changed. */
  indicatorChoice?: 'KEEP' | 'REVIEW';
};

export type ReviewHistoryEntry = {
  choice: MemberReviewChoice;
  meaning?: ReviewMeaning | null;
  note: string | null;
  appliedAt: string;
  reviewCode: string;
  actions?: { actionId: string; op: string; summary: string; reason: string | null }[];
  additions?: string[];
  indicatorChoice?: 'KEEP' | 'REVIEW';
};

export type ReviewHistoryPayload = {
  reviewHistory?: Record<string, ReviewHistoryEntry>;
};

export function digestAction(input: {
  id: string;
  title: string;
  doneWhen: string;
  occasionsPerWeek: number | null;
  minutesPerOccasion: number | null;
  active: boolean;
}): string {
  return JSON.stringify({
    id: input.id,
    title: input.title,
    doneWhen: input.doneWhen,
    occasionsPerWeek: input.occasionsPerWeek,
    minutesPerOccasion: input.minutesPerOccasion,
    active: input.active,
  });
}

export type PendingWeekReviewPayload = {
  pendingReviews?: Record<string, PendingPlanReview>;
};

export function pendingForWeek(payload: PendingWeekReviewPayload, weekStart: string): PendingPlanReview | null {
  return payload.pendingReviews?.[weekStart] ?? null;
}

export function withPendingReview<T extends PendingWeekReviewPayload>(
  payload: T,
  weekStart: string,
  row: PendingPlanReview,
): T {
  return {
    ...payload,
    pendingReviews: { ...(payload.pendingReviews ?? {}), [weekStart]: row },
  };
}

export function withoutPendingWeek(payload: PendingWeekReviewPayload, weekStart: string): PendingWeekReviewPayload {
  if (!payload.pendingReviews?.[weekStart]) return payload;
  const next = { ...payload.pendingReviews };
  delete next[weekStart];
  return { ...payload, pendingReviews: Object.keys(next).length ? next : undefined };
}

export function withReviewHistory<T extends ReviewHistoryPayload>(
  payload: T,
  weekStart: string,
  entry: ReviewHistoryEntry,
): T {
  return {
    ...payload,
    reviewHistory: { ...(payload.reviewHistory ?? {}), [weekStart]: entry },
  };
}
