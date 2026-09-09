export type CompareStatus = 'COMPARABLE' | 'NOT_COMPARABLE' | 'MATCH' | 'PARTIAL' | 'DIFFERENT';

const UNSURE = new Set(['', 'UNSURE', 'NO_ESTOY_SEGURO', 'UNCERTAIN']);

export function isUnsureValue(value: string | null | undefined): boolean {
  if (value == null) return true;
  return UNSURE.has(value.trim());
}

/** "Todavía no elegiría" is a decision. "No estoy seguro" is not. */
export function comparePriority(
  mine: string | null | undefined,
  matrix: string | null | undefined,
): CompareStatus {
  if (isUnsureValue(mine)) return 'NOT_COMPARABLE';
  if (!matrix) return 'NOT_COMPARABLE';
  if (mine === matrix) return 'MATCH';
  return 'DIFFERENT';
}

export function compareState(
  mine: string | null | undefined,
  matrix: string | null | undefined,
): CompareStatus {
  if (isUnsureValue(mine)) return 'NOT_COMPARABLE';
  if (mine === matrix) return 'MATCH';
  return 'DIFFERENT';
}

/** Null means the optional Matrix prediction was not used. Omit that block. */
export function compareOptionalPrediction(
  predicted: string | null | undefined,
  matrix: string | null | undefined,
): CompareStatus | null {
  if (isUnsureValue(predicted)) return null;
  return comparePriority(predicted, matrix);
}

export function anticipatedMatrix(input: {
  expected_states?: Record<string, string> | null;
  expected_priority_domain?: string | null;
  expected_plan_id?: string | null;
}): boolean {
  const states = Object.values(input.expected_states ?? {});
  if (states.some((value) => !isUnsureValue(value))) return true;
  if (!isUnsureValue(input.expected_priority_domain)) return true;
  return Boolean(input.expected_plan_id);
}

export function hasComparableDifference(statuses: CompareStatus[]): boolean {
  return statuses.some((status) => status === 'DIFFERENT');
}

export const PRIORITY_NOT_COMPARABLE_COPY =
  'No registraste una decisión firme. Puedes revisar el resultado sin forzar una comparación.';
