export type ReplayImpact = 'IMPROVES' | 'WORSENS' | 'UNCHANGED' | 'NEEDS_REVIEW';

export interface ReplayImpactInput {
  importantChanged: boolean;
  safetyChanged: boolean;
  priorCaseVerdict?: string | null;
  rafaAcceptedMatrix?: boolean;
  closerToRafa?: boolean | null;
  fartherFromRafa?: boolean | null;
}

/**
 * Only auto-assigns when the prior judgment makes the direction literal.
 * Otherwise: NEEDS_REVIEW.
 */
export function deriveReplayImpact(input: ReplayImpactInput): ReplayImpact {
  if (input.safetyChanged && input.rafaAcceptedMatrix) return 'WORSENS';
  if (!input.importantChanged) return 'UNCHANGED';
  if (input.closerToRafa === true) return 'IMPROVES';
  if (input.fartherFromRafa === true) return 'WORSENS';
  if (input.rafaAcceptedMatrix && input.importantChanged) return 'WORSENS';
  return 'NEEDS_REVIEW';
}

export function isCriticalRegression(input: {
  impact: ReplayImpact;
  priorCaseVerdict?: string | null;
  safetyChanged?: boolean;
  rafaAcceptedMatrix?: boolean;
}): boolean {
  if (input.safetyChanged && input.rafaAcceptedMatrix) return true;
  if (input.impact !== 'WORSENS') return false;
  return input.priorCaseVerdict === 'REPRESENTS' || Boolean(input.rafaAcceptedMatrix);
}

export function importantResultChanged(base: ResultLite, next: ResultLite): boolean {
  if ((base.priority ?? null) !== (next.priority ?? null)) return true;
  if ((base.planId ?? null) !== (next.planId ?? null)) return true;
  if (base.firedCritical !== next.firedCritical) return true;
  if (base.firedHigh !== next.firedHigh) return true;
  for (const key of ['MENTALIDAD', 'RELACIONES', 'FINANZAS', 'CUERPO']) {
    if (base.states[key] !== next.states[key]) return true;
    if (base.classifications[key] !== next.classifications[key]) return true;
  }
  return false;
}

export interface ResultLite {
  priority: string | null;
  planId: string | null;
  states: Record<string, string | null>;
  classifications: Record<string, string>;
  firedCritical: boolean;
  firedHigh: boolean;
}

export function closerToExpected(
  base: ResultLite,
  next: ResultLite,
  expected: { priority?: string | null; states?: Record<string, string>; planId?: string | null },
): boolean | null {
  const baseHits = matchCount(base, expected);
  const nextHits = matchCount(next, expected);
  if (baseHits === nextHits) return null;
  return nextHits > baseHits;
}

function matchCount(
  result: ResultLite,
  expected: { priority?: string | null; states?: Record<string, string>; planId?: string | null },
): number {
  let hits = 0;
  if (expected.priority && expected.priority !== 'UNSURE' && expected.priority !== 'NONE') {
    if (result.priority === expected.priority) hits += 1;
  }
  if (expected.planId) {
    if (result.planId === expected.planId) hits += 1;
  }
  if (expected.states) {
    for (const [key, value] of Object.entries(expected.states)) {
      if (!value || value === 'UNSURE') continue;
      if (result.states[key] === value) hits += 1;
    }
  }
  return hits;
}
