import { FULL_POLICY_ID } from '../constants';
import type { MatrixDefinition, PolicyDefinition, ResponseInput } from '../types';
import { buildPolicyPlan, FULL_NAMED_POLICY } from './build-policy-plan';

export const FULL_POLICY: PolicyDefinition = FULL_NAMED_POLICY;

export function resolveServedQuestionIds(
  definition: MatrixDefinition,
  policy: PolicyDefinition,
  responses?: Array<Pick<ResponseInput, 'questionId' | 'rawValue'>>,
): Set<string> {
  const plan = buildPolicyPlan({ definition, policy, responses });
  return new Set(plan.served_ids);
}

export function isFullPolicy(policy: PolicyDefinition): boolean {
  return policy.id === FULL_POLICY_ID && policy.kind === 'STATIC' && !policy.include;
}
