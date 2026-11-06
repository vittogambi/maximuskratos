import type { PlanStage } from '../plan-lifecycle';

export type ActivatePlanDto = {
  confirmed?: boolean;
  capacityMinutes?: number;
  protectNote?: string | null;
  explicitNoSchedule?: boolean;
  expectedVersion?: number;
  commandKey?: string;
};

export type TransitionPlanDto = {
  toStage: PlanStage;
  reason?: string | null;
  learningNote?: string | null;
  expectedVersion?: number;
};

export type FocusPlanDto = {
  enable: boolean;
  expectedVersion?: number;
};
