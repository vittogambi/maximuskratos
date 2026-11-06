import { weekStartForDay } from './civil-week';

export type PlanStage = 'PREPARING' | 'ACTIVE' | 'PAUSED' | 'MAINTENANCE' | 'CLOSED';
export type LegacyPlanStatus = 'DRAFT' | 'ACTIVE' | 'PAUSED' | 'ARCHIVED';
export type CloseReason = 'ACHIEVED' | 'LEARNED' | 'NO_LONGER_MATTERS' | 'REPLACED' | 'OTHER' | 'DISCARDED';

export type ActivationInput = {
  hasGoalOrExperimentQuestion: boolean;
  timeDeclared: boolean;
  restrictionsAnswered: boolean;
  hasActionOrExplicitNoSchedule: boolean;
  confirmed: boolean;
  whyItMatters?: string | null;
};

export type ActivationMissing = 'GOAL' | 'TIME' | 'RESTRICTIONS' | 'ACTION' | 'CONFIRMATION';

const TRANSITIONS: Record<PlanStage, Partial<Record<PlanStage, CloseReason | 'RETURN' | 'FOCUS' | null>>> = {
  PREPARING: { ACTIVE: null, CLOSED: 'DISCARDED' },
  ACTIVE: { PAUSED: null, MAINTENANCE: null, CLOSED: 'OTHER' },
  PAUSED: { ACTIVE: 'RETURN', CLOSED: 'OTHER' },
  MAINTENANCE: { ACTIVE: null, PAUSED: null, CLOSED: 'OTHER' },
  CLOSED: {},
};

export function canTransition(from: PlanStage, to: PlanStage): boolean {
  return TRANSITIONS[from][to] !== undefined;
}

/** Weeks that start after the pause week, and before a later resume, are not owed. */
export function weekFallsInPause(
  weekStart: string,
  transitions: { toStage: string; effectiveFrom: Date | null }[],
): boolean {
  const ordered = [...transitions].sort((a, b) => (a.effectiveFrom?.toISOString() ?? '').localeCompare(b.effectiveFrom?.toISOString() ?? ''));
  const ranges: { fromWeek: string; untilWeek: string | null }[] = [];
  let open: string | null = null;
  for (const row of ordered) {
    if (!row.effectiveFrom) continue;
    const week = weekStartForDay(row.effectiveFrom.toISOString().slice(0, 10));
    if (row.toStage === 'PAUSED') open = week;
    else if (open && (row.toStage === 'ACTIVE' || row.toStage === 'MAINTENANCE' || row.toStage === 'CLOSED')) {
      ranges.push({ fromWeek: open, untilWeek: week });
      open = null;
    }
  }
  if (open) ranges.push({ fromWeek: open, untilWeek: null });
  return ranges.some((range) => weekStart > range.fromWeek && (range.untilWeek == null || weekStart < range.untilWeek));
}

export function compatStatus(stage: PlanStage): LegacyPlanStatus {
  switch (stage) {
    case 'PREPARING':
      return 'DRAFT';
    case 'ACTIVE':
    case 'MAINTENANCE':
      return 'ACTIVE';
    case 'PAUSED':
      return 'PAUSED';
    case 'CLOSED':
      return 'ARCHIVED';
    default:
      return 'DRAFT';
  }
}

export function fromLegacy(status: LegacyPlanStatus): PlanStage {
  switch (status) {
    case 'DRAFT':
      return 'PREPARING';
    case 'ACTIVE':
      return 'ACTIVE';
    case 'PAUSED':
      return 'PAUSED';
    case 'ARCHIVED':
      return 'CLOSED';
    default:
      return 'PREPARING';
  }
}

export type PlanAchievementGate = {
  criterionText: string | null;
  criterionStatus: string | null;
  stage?: PlanStage;
};

/** Product S-08 / B: logro solo con criterio confirmado y texto observable. */
export function canDeclareAchievement(plan: PlanAchievementGate): boolean {
  if (plan.stage && plan.stage !== 'ACTIVE' && plan.stage !== 'MAINTENANCE') return false;
  return plan.criterionStatus === 'CONFIRMED' && Boolean(plan.criterionText?.trim());
}

export type AchievementEvidenceRow = { status: string; text: string | null };

export function achievementEvidenceReady(evidence: AchievementEvidenceRow | null | undefined): boolean {
  return evidence?.status === 'OBSERVED' && Boolean(evidence?.text?.trim());
}

export function activationBlock(input: ActivationInput): ActivationMissing[] {
  const missing: ActivationMissing[] = [];
  if (!input.hasGoalOrExperimentQuestion) missing.push('GOAL');
  if (!input.timeDeclared) missing.push('TIME');
  if (!input.restrictionsAnswered) missing.push('RESTRICTIONS');
  if (!input.hasActionOrExplicitNoSchedule) missing.push('ACTION');
  if (!input.confirmed) missing.push('CONFIRMATION');
  return missing;
}

export function planActivationInput(params: {
  plan: {
    outcome: string;
    goalClass?: string | null;
    capacityMinutes?: number | null;
    protectNote?: string | null;
    explicitNoSchedule?: boolean | null;
  };
  activeActionCount: number;
  restrictionsAnswered: boolean;
  patch: {
    confirmed?: boolean;
    capacityMinutes?: number;
    protectNote?: string | null;
    explicitNoSchedule?: boolean;
  };
}): ActivationInput {
  const capacityMinutes = params.patch.capacityMinutes ?? params.plan.capacityMinutes ?? null;
  const protectNote = params.patch.protectNote !== undefined ? params.patch.protectNote : params.plan.protectNote ?? null;
  const explicitNoSchedule = params.patch.explicitNoSchedule ?? Boolean(params.plan.explicitNoSchedule);
  const restrictionsAnswered =
    params.restrictionsAnswered || protectNote != null || params.patch.protectNote !== undefined;
  return {
    hasGoalOrExperimentQuestion: Boolean(params.plan.outcome?.trim()),
    timeDeclared: capacityMinutes != null && capacityMinutes >= 0,
    restrictionsAnswered,
    hasActionOrExplicitNoSchedule: params.activeActionCount > 0 || explicitNoSchedule,
    confirmed: params.patch.confirmed === true,
  };
}
