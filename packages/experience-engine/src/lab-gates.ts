export type LabRunStatus = 'COLLECTING' | 'AWAITING_EXPECTATION' | 'REVEALED' | 'FAILED';
export type LabCaseKind = 'REAL' | 'SYNTHETIC' | 'SELF' | 'IMPORTED' | 'SIMULATION';

export const EXPECTATION_PENDING = 'EXPECTATION_PENDING';
export const REAL_CASES_GATED = 'REAL_CASES_GATED';
export const ALREADY_FROZEN = 'ALREADY_FROZEN';

const DERIVED_ENDPOINTS = ['result', 'trace', 'preview', 'comparison', 'review', 'experience'] as const;

export function defaultBlind(kind: LabCaseKind): boolean {
  return kind !== 'REAL';
}

export function realCasesAllowed(kind: LabCaseKind, enabled: boolean): boolean {
  if (kind === 'REAL' || kind === 'IMPORTED') return enabled;
  return true;
}

export function canMutateResponses(status: LabRunStatus): boolean {
  return status === 'COLLECTING';
}

export function canWriteSnapshot(status: LabRunStatus, snapshotPresent: boolean): boolean {
  return status === 'COLLECTING' && !snapshotPresent;
}

export function canMutateCaseBlind(runStatuses: LabRunStatus[]): boolean {
  return runStatuses.every((status) => status === 'COLLECTING' || runStatuses.length === 0);
}

export function derivedPayloadBlocked(status: LabRunStatus, endpoint: string): boolean {
  if (status !== 'AWAITING_EXPECTATION') return false;
  return (DERIVED_ENDPOINTS as readonly string[]).includes(endpoint);
}

export function freezeDestination(blind: boolean): LabRunStatus {
  return blind ? 'AWAITING_EXPECTATION' : 'REVEALED';
}

/**
 * Facilitator notes carry the expected Matrix outcome, so they are POST-REVEAL only.
 * Any pre-reveal exposure contaminates the expectation.
 */
export function facilitatorNoteVisible(status: LabRunStatus): boolean {
  return status === 'REVEALED';
}

export type DivergenceRow =
  | 'alerts'
  | 'classification'
  | 'states'
  | 'priority'
  | 'plan'
  | 'purpose';

export type DivergenceResult = 'MATCH' | 'DIVERGENCE' | 'MATRIX_SILENT';

export interface ComparisonInput {
  firedAlerts: string[];
  classifications: Record<string, string>;
  states: Record<string, string | null>;
  priority: string | null;
  planId: string | null;
  expectedAlerts: string[];
  expectedStates: Record<string, string>;
  expectedPriority: string;
  expectedPlanId: string | null;
}

export function compareExpectation(input: ComparisonInput): {
  rows: Array<{ key: DivergenceRow; result: DivergenceResult; possible_consequence: boolean }>;
  first_divergence: DivergenceRow | null;
} {
  const alertMatch =
    [...input.firedAlerts].sort().join('|') === [...input.expectedAlerts].sort().join('|');
  const classMatch = ['MENTALIDAD', 'RELACIONES', 'FINANZAS', 'CUERPO'].every((key) => {
    const actual = input.classifications[key] === 'NO_CLASIFICADO' ? 'NO_CLASIFICADO' : 'CLASIFICADO';
    const expected =
      input.expectedStates[key] === 'NO_CLASIFICADO' ? 'NO_CLASIFICADO' : 'CLASIFICADO';
    if (input.expectedStates[key] === 'UNSURE') return true;
    return actual === expected;
  });
  const stateMatch = ['MENTALIDAD', 'RELACIONES', 'FINANZAS', 'CUERPO'].every((key) => {
    const expected = input.expectedStates[key];
    if (expected === 'UNSURE') return true;
    if (expected === 'NO_CLASIFICADO') return input.states[key] == null;
    return input.states[key] === expected;
  });
  const priorityMatch =
    input.expectedPriority === 'UNSURE' ||
    (input.expectedPriority === 'NONE' && input.priority == null) ||
    input.expectedPriority === input.priority;
  const planMatch =
    input.expectedPlanId == null || input.expectedPlanId === input.planId;

  const raw: Array<{ key: DivergenceRow; match: boolean; silent?: boolean }> = [
    { key: 'alerts', match: alertMatch },
    { key: 'classification', match: classMatch },
    { key: 'states', match: stateMatch },
    { key: 'priority', match: priorityMatch },
    { key: 'plan', match: planMatch },
    { key: 'purpose', match: true, silent: true },
  ];

  let first: DivergenceRow | null = null;
  const rows = raw.map((row) => {
    const result: DivergenceResult = row.silent
      ? 'MATRIX_SILENT'
      : row.match
        ? 'MATCH'
        : 'DIVERGENCE';
    if (result === 'DIVERGENCE' && first == null) first = row.key;
    return {
      key: row.key,
      result,
      possible_consequence: result === 'DIVERGENCE' && first != null && first !== row.key,
    };
  });

  return { rows, first_divergence: first };
}
