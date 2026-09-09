import { POLICY_CORE_PURPOSE_IDS } from '../constants';
import type {
  BranchRule,
  JsonValue,
  MatrixDefinition,
  PolicyDefinition,
  ResponseInput,
} from '../types';

export const AUD_ONLY_POLICY: PolicyDefinition = {
  id: 'AUD_ONLY-v1',
  kind: 'STATIC',
  include: { phases: ['AUDITORÍA'] },
};

export const AUD_PLUS_CORE_POLICY: PolicyDefinition = {
  id: 'AUD_PLUS_CORE-v1',
  kind: 'STATIC',
  include: {
    instruments: ['AUD-001', 'D-MEN-001'],
    question_ids: [...POLICY_CORE_PURPOSE_IDS],
  },
};

export const AUD_PLUS_BRANCHES_POLICY: PolicyDefinition = {
  id: 'AUD_PLUS_BRANCHES-v1',
  kind: 'BRANCHING',
  include: { phases: ['AUDITORÍA'] },
};

export const FULL_NAMED_POLICY: PolicyDefinition = {
  id: 'FULL-v1',
  kind: 'STATIC',
};

const DEEP_INSTRUMENT_BY_DOMAIN: Record<string, string> = {
  MENTALIDAD: 'D-MEN-001',
  RELACIONES: 'D-REL-001',
  FINANZAS: 'D-FIN-001',
  CUERPO: 'D-CUE-001',
};

export interface PolicyPlan {
  policy_id: string;
  served_ids: string[];
  questions_available: number;
  questions_served: number;
  questions_skipped_by_policy: number;
  branches_fired: Array<{
    trigger_question_id: string;
    serve_instrument: string;
  }>;
}

function asNumberArray(value: JsonValue | undefined, fallback: number[]): number[] {
  if (!Array.isArray(value)) return fallback;
  return value.filter((item): item is number => typeof item === 'number');
}

function rawNumber(raw: number | string | null | undefined): number | null {
  if (typeof raw === 'number' && Number.isFinite(raw)) return raw;
  if (typeof raw === 'string' && raw.trim() !== '') {
    const parsed = Number(raw.trim().replace(',', '.'));
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function matchesStaticInclude(
  question: { id: string; phase: string; instrument: string },
  include: NonNullable<PolicyDefinition['include']>,
): boolean {
  const ids = include.question_ids ?? [];
  const phases = include.phases ?? [];
  const instruments = include.instruments ?? [];
  if (ids.length === 0 && phases.length === 0 && instruments.length === 0) {
    return true;
  }
  if (ids.includes(question.id)) return true;
  if (phases.includes(question.phase)) return true;
  if (instruments.includes(question.instrument)) return true;
  return false;
}

export function defaultBranchRules(definition: MatrixDefinition): BranchRule[] {
  const params = definition.interpretations.find((item) => item.id === 'LAB-POLICY-01')
    ?.params;
  const triggerValues = asNumberArray(params?.trigger_values, [1, 2]);
  return definition.questions
    .filter((question) => question.active && question.phase === 'AUDITORÍA')
    .map((question) => ({
      trigger_question_id: question.id,
      trigger_values: triggerValues,
      serve_instrument:
        DEEP_INSTRUMENT_BY_DOMAIN[question.domain] ?? question.instrument,
      source: 'LAB_INTERPRETATION_v0' as const,
    }));
}

export function namedPolicy(
  policyId: string,
  customIds?: string[],
): PolicyDefinition {
  switch (policyId) {
    case 'FULL-v1':
      return FULL_NAMED_POLICY;
    case 'AUD_ONLY-v1':
      return AUD_ONLY_POLICY;
    case 'AUD_PLUS_CORE-v1':
      return AUD_PLUS_CORE_POLICY;
    case 'AUD_PLUS_BRANCHES-v1':
      return AUD_PLUS_BRANCHES_POLICY;
    case 'CUSTOM':
      return {
        id: 'CUSTOM',
        kind: 'STATIC',
        include: { question_ids: customIds ?? [] },
      };
    default:
      return { id: policyId, kind: 'STATIC' };
  }
}

export function buildPolicyPlan(input: {
  definition: MatrixDefinition;
  policy: PolicyDefinition;
  responses?: Array<Pick<ResponseInput, 'questionId' | 'rawValue'>>;
}): PolicyPlan {
  const { definition, policy } = input;
  const active = definition.questions.filter((question) => question.active);
  const served = new Set<string>();
  const include = policy.include;

  if (!include) {
    for (const question of active) served.add(question.id);
  } else {
    for (const question of active) {
      if (matchesStaticInclude(question, include)) served.add(question.id);
    }
  }

  const branchesFired: PolicyPlan['branches_fired'] = [];
  if (policy.kind === 'BRANCHING') {
    const rules = policy.branches?.length
      ? policy.branches
      : defaultBranchRules(definition);
    const byId = new Map(
      (input.responses ?? []).map((response) => [response.questionId, response]),
    );
    const opened = new Set<string>();
    for (const rule of rules) {
      const raw = rawNumber(byId.get(rule.trigger_question_id)?.rawValue ?? null);
      if (raw == null || !rule.trigger_values.includes(raw)) continue;
      if (opened.has(rule.serve_instrument)) {
        branchesFired.push({
          trigger_question_id: rule.trigger_question_id,
          serve_instrument: rule.serve_instrument,
        });
        continue;
      }
      opened.add(rule.serve_instrument);
      branchesFired.push({
        trigger_question_id: rule.trigger_question_id,
        serve_instrument: rule.serve_instrument,
      });
      for (const question of active) {
        if (question.instrument === rule.serve_instrument) served.add(question.id);
      }
    }
  }

  const servedIds = active.filter((question) => served.has(question.id)).map((q) => q.id);
  return {
    policy_id: policy.id,
    served_ids: servedIds,
    questions_available: active.length,
    questions_served: servedIds.length,
    questions_skipped_by_policy: active.length - servedIds.length,
    branches_fired: branchesFired,
  };
}
