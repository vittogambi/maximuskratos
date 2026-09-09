import { ENGINE_SEMVER, type MatrixDefinition, type PolicyDefinition, type ResponseInput, type ResultSnapshot } from '../types';
import { runAssessment } from './run-assessment';

export interface ReplayFlags {
  score_changed: boolean;
  coverage_changed: boolean;
  state_changed: boolean;
  safety_changed: boolean;
  priority_changed: boolean;
  plan_changed: boolean;
}

export type ReplayAttribution = 'SINGLE' | 'AMBIGUOUS' | 'NONE';

export function compareSnapshots(
  base: ResultSnapshot,
  candidate: ResultSnapshot,
): ReplayFlags {
  const scoreChanged = base.domains.some((domain, index) => {
    const other = candidate.domains[index];
    return domain.score !== other?.score || domain.score_display !== other?.score_display;
  });
  const coverageChanged = base.domains.some((domain, index) => {
    const other = candidate.domains[index];
    return domain.classification !== other?.classification;
  });
  const stateChanged = base.domains.some((domain, index) => {
    const other = candidate.domains[index];
    return domain.state_final !== other?.state_final;
  });
  const safetyChanged =
    JSON.stringify(base.safety.alerts) !== JSON.stringify(candidate.safety.alerts);
  return {
    score_changed: scoreChanged,
    coverage_changed: coverageChanged,
    state_changed: stateChanged,
    safety_changed: safetyChanged,
    priority_changed: base.priority.domain !== candidate.priority.domain,
    plan_changed: base.recommendations.primary?.plan_id !== candidate.recommendations.primary?.plan_id,
  };
}

export function replayMethodology(input: {
  responses: ResponseInput[];
  policy: PolicyDefinition;
  baseDefinition: MatrixDefinition;
  candidateDefinition: MatrixDefinition;
  now: string;
  operationCount: number;
}): {
  base: ResultSnapshot;
  candidate: ResultSnapshot;
  flags: ReplayFlags;
  attribution: ReplayAttribution;
} {
  const base = runAssessment({
    definition: input.baseDefinition,
    responses: input.responses,
    policy: input.policy,
    engineSemver: ENGINE_SEMVER,
    now: input.now,
  });
  const candidate = runAssessment({
    definition: input.candidateDefinition,
    responses: input.responses,
    policy: input.policy,
    engineSemver: ENGINE_SEMVER,
    now: input.now,
  });
  const flags = compareSnapshots(base, candidate);
  const changed = Object.values(flags).some(Boolean);
  let attribution: ReplayAttribution = 'NONE';
  if (changed && input.operationCount === 1) attribution = 'SINGLE';
  if (changed && input.operationCount > 1) attribution = 'AMBIGUOUS';
  return { base, candidate, flags, attribution };
}
