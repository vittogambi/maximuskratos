export type PilotPlanRow = {
  userId: string;
  planId: string;
  createdAt: Date;
  activatedAt: Date | null;
};

export type PilotActionRow = {
  userId: string;
  planId: string;
  status: string;
  at: Date;
};

export type PilotIndicatorRow = {
  userId: string;
  planId: string;
  at: Date;
};

export type PilotReviewRow = {
  userId: string;
  weekStart: string;
  at: Date;
  applied: boolean;
};

export type PilotInput = {
  accounts: { id: string; email: string }[];
  plans: PilotPlanRow[];
  actions: PilotActionRow[];
  indicators: PilotIndicatorRow[];
  reviews: PilotReviewRow[];
};

export type PilotEvent = {
  email: string;
  kind: 'plan_created' | 'plan_activated' | 'action_recorded' | 'indicator_recorded' | 'review_applied' | 'review_saved';
  at: string;
  ref: string;
};

export type PilotReport = {
  accounts: number;
  counts: {
    createdPlan: number;
    activatedPlan: number;
    recordedAction: number;
    recordedIndicator: number;
    appliedReview: number;
    savedReview: number;
  };
  events: PilotEvent[];
};

function iso(value: Date): string {
  return value.toISOString();
}

/** Distinct accounts that have at least one event of that kind. Not a progress score. */
export function buildPilotFacts(input: PilotInput): PilotReport {
  const emailById = new Map(input.accounts.map((row) => [row.id, row.email]));
  const events: PilotEvent[] = [];
  const push = (userId: string, event: Omit<PilotEvent, 'email'>) => {
    const email = emailById.get(userId);
    if (!email) return;
    events.push({ email, ...event });
  };
  for (const plan of input.plans) {
    push(plan.userId, { kind: 'plan_created', at: iso(plan.createdAt), ref: plan.planId });
    if (plan.activatedAt) {
      push(plan.userId, { kind: 'plan_activated', at: iso(plan.activatedAt), ref: plan.planId });
    }
  }
  for (const action of input.actions) {
    push(action.userId, {
      kind: 'action_recorded',
      at: iso(action.at),
      ref: `${action.planId}:${action.status}`,
    });
  }
  for (const indicator of input.indicators) {
    push(indicator.userId, { kind: 'indicator_recorded', at: iso(indicator.at), ref: indicator.planId });
  }
  for (const review of input.reviews) {
    push(review.userId, {
      kind: review.applied ? 'review_applied' : 'review_saved',
      at: iso(review.at),
      ref: review.weekStart,
    });
  }
  events.sort((a, b) => a.at.localeCompare(b.at) || a.email.localeCompare(b.email) || a.kind.localeCompare(b.kind));
  const users = (kind: PilotEvent['kind']) => new Set(events.filter((row) => row.kind === kind).map((row) => row.email)).size;
  return {
    accounts: input.accounts.length,
    counts: {
      createdPlan: users('plan_created'),
      activatedPlan: users('plan_activated'),
      recordedAction: users('action_recorded'),
      recordedIndicator: users('indicator_recorded'),
      appliedReview: users('review_applied'),
      savedReview: users('review_saved'),
    },
    events,
  };
}
