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

export function activationBlock(input: ActivationInput): ActivationMissing[] {
  const missing: ActivationMissing[] = [];
  if (!input.hasGoalOrExperimentQuestion) missing.push('GOAL');
  if (!input.timeDeclared) missing.push('TIME');
  if (!input.restrictionsAnswered) missing.push('RESTRICTIONS');
  if (!input.hasActionOrExplicitNoSchedule) missing.push('ACTION');
  if (!input.confirmed) missing.push('CONFIRMATION');
  return missing;
}
