import { addIsoDays } from './civil-date';

export type WindowedAction = {
  id: string;
  active: boolean;
  effectiveFrom?: string | null;
  effectiveTo?: string | null;
  replacesActionId?: string | null;
};

function dayOf(value: string | null | undefined): string {
  return (value ?? '').slice(0, 10);
}

/**
 * Last civil day an action counts. Null while it is open.
 * Undefined for an older action that ended without leaving a date: it is not counted, as before this contract.
 */
export function actionEnd(action: WindowedAction, siblings: WindowedAction[]): string | null | undefined {
  if (action.effectiveTo) return dayOf(action.effectiveTo);
  const successor = siblings.find((row) => row.replacesActionId === action.id && dayOf(row.effectiveFrom));
  if (successor) return addIsoDays(dayOf(successor.effectiveFrom), -1);
  if (!action.active) return undefined;
  return null;
}

/** Whether the action belonged to the plan during that civil week. An ended action keeps its past weeks. */
export function actionCountsInWeek(action: WindowedAction, siblings: WindowedAction[], weekStart: string, weekEnd: string): boolean {
  const from = dayOf(action.effectiveFrom);
  if (from && from > weekEnd) return false;
  const end = actionEnd(action, siblings);
  if (end === undefined) return false;
  return end == null || end >= weekStart;
}
