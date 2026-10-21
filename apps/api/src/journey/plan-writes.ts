import type { PlanStage } from './plan-lifecycle';

export type VersionGuard = {
  expectedVersion?: number;
  currentVersion: number;
};

export function assertPlanVersion(guard: VersionGuard): void {
  if (guard.expectedVersion == null) return;
  if (guard.expectedVersion !== guard.currentVersion) {
    const err = new Error('STALE_PLAN');
    (err as Error & { currentVersion: number }).currentVersion = guard.currentVersion;
    throw err;
  }
}

export function nextPlanVersion(current: number): number {
  return current + 1;
}

export type FocusCommand = {
  planId: string;
  currentlyFocusedPlanId: string | null;
  enable: boolean;
};

/** Returns plan ids that must lose focus before assigning focus to `planId`. */
export function focusTargets(command: FocusCommand): { clearPlanIds: string[]; setPlanId: string | null } {
  if (!command.enable) {
    return { clearPlanIds: command.currentlyFocusedPlanId === command.planId ? [command.planId] : [], setPlanId: null };
  }
  const clearPlanIds = command.currentlyFocusedPlanId && command.currentlyFocusedPlanId !== command.planId
    ? [command.currentlyFocusedPlanId]
    : [];
  return { clearPlanIds, setPlanId: command.planId };
}

export type TransitionCommand = {
  from: PlanStage;
  to: PlanStage;
};
