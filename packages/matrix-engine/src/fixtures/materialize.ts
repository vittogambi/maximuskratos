import { COMPOSITE_RISK_IDS } from '../constants';
import { namedPolicy } from '../policy/build-policy-plan';
import type { MatrixDefinition, ResponseInput } from '../types';
import type {
  FixtureCase,
  FixturePattern,
  MaterializedFixture,
  RiskAnswers,
} from './types';

const YN_RISK_IDS = ['D-CUE-01', 'D-CUE-02', 'D-CUE-03', 'D-CUE-04', 'D-CUE-05'];

function scoreableOf(definition: MatrixDefinition, domain?: string) {
  return definition.questions.filter(
    (question) =>
      question.active &&
      question.scoreable &&
      (domain == null || question.domain === domain),
  );
}

function applyPattern(
  definition: MatrixDefinition,
  bag: Map<string, ResponseInput>,
  pattern: FixturePattern,
): void {
  if (pattern.pattern === 'NONE') return;

  if (pattern.pattern === 'ALL') {
    for (const question of scoreableOf(definition)) {
      bag.set(question.id, {
        questionId: question.id,
        status: 'ANSWERED',
        rawValue: pattern.value,
        qualitativeConfirmed: null,
      });
    }
    return;
  }

  if (pattern.pattern === 'BY_DOMAIN') {
    for (const [domain, value] of Object.entries(pattern.values)) {
      for (const question of scoreableOf(definition, domain)) {
        bag.set(question.id, {
          questionId: question.id,
          status: 'ANSWERED',
          rawValue: value,
          qualitativeConfirmed: null,
        });
      }
    }
    return;
  }

  if (pattern.pattern === 'BY_DIMENSION') {
    for (const [dimension, value] of Object.entries(pattern.values)) {
      for (const question of definition.questions) {
        if (!question.active || !question.scoreable) continue;
        if (question.dimension !== dimension) continue;
        bag.set(question.id, {
          questionId: question.id,
          status: 'ANSWERED',
          rawValue: value,
          qualitativeConfirmed: null,
        });
      }
    }
    return;
  }

  for (const [id, value] of Object.entries(pattern.values)) {
    bag.set(id, {
      questionId: id,
      status: 'ANSWERED',
      rawValue: value,
      qualitativeConfirmed: null,
    });
  }
}

function applyRisks(
  definition: MatrixDefinition,
  bag: Map<string, ResponseInput>,
  riskAnswers: RiskAnswers,
): void {
  if (riskAnswers === 'SAFE') {
    for (const id of YN_RISK_IDS) {
      bag.set(id, {
        questionId: id,
        status: 'ANSWERED',
        rawValue: 0,
        qualitativeConfirmed: null,
      });
    }
    for (const id of COMPOSITE_RISK_IDS) {
      bag.set(id, {
        questionId: id,
        status: 'ANSWERED',
        rawValue: 5,
        qualitativeConfirmed: false,
      });
    }
    return;
  }

  if (riskAnswers === 'ALL_FIRED') {
    for (const id of YN_RISK_IDS) {
      bag.set(id, {
        questionId: id,
        status: 'ANSWERED',
        rawValue: 1,
        qualitativeConfirmed: null,
      });
    }
    for (const id of COMPOSITE_RISK_IDS) {
      bag.set(id, {
        questionId: id,
        status: 'ANSWERED',
        rawValue: 1,
        qualitativeConfirmed: true,
      });
    }
    return;
  }

  for (const [id, value] of Object.entries(riskAnswers)) {
    if (typeof value === 'number') {
      bag.set(id, {
        questionId: id,
        status: 'ANSWERED',
        rawValue: value,
        qualitativeConfirmed: COMPOSITE_RISK_IDS.includes(id) ? true : null,
      });
      continue;
    }
    bag.set(id, {
      questionId: id,
      status: 'ANSWERED',
      rawValue: value.value,
      qualitativeConfirmed: value.qualitativeConfirmed ?? null,
    });
  }
}

function applyNarrative(
  definition: MatrixDefinition,
  bag: Map<string, ResponseInput>,
  mode: 'EMPTY' | 'FILLED',
): void {
  if (mode === 'EMPTY') return;
  for (const question of definition.questions) {
    if (!question.active || question.variable_kind !== 'NARRATIVA') continue;
    bag.set(question.id, {
      questionId: question.id,
      status: 'ANSWERED',
      rawValue: 'fixture narrative',
      qualitativeConfirmed: null,
    });
  }
}

export function likertForK(count: number, k: number): number[] {
  const values = Array.from({ length: count }, () => 1);
  let remaining = k;
  for (let i = 0; i < count && remaining > 0; i += 1) {
    const add = Math.min(4, remaining);
    values[i] = 1 + add;
    remaining -= add;
  }
  if (remaining !== 0) {
    throw new Error(`cannot realize K=${k} with ${count} likert items`);
  }
  return values;
}

export function firstScoreableIds(
  definition: MatrixDefinition,
  domain: string,
  count: number,
): string[] {
  return scoreableOf(definition, domain)
    .slice(0, count)
    .map((question) => question.id);
}

export function materializeFixture(
  definition: MatrixDefinition,
  familyKey: string,
  spec: FixtureCase,
): MaterializedFixture {
  const bag = new Map<string, ResponseInput>();
  for (const question of definition.questions) {
    bag.set(question.id, {
      questionId: question.id,
      status: 'SKIPPED_BY_USER',
      rawValue: null,
      qualitativeConfirmed: null,
    });
  }

  applyPattern(definition, bag, spec.answers);
  applyRisks(definition, bag, spec.risk_answers);
  applyNarrative(definition, bag, spec.narrative);

  for (const [id, value] of Object.entries(spec.overrides ?? {})) {
    if (value == null) {
      bag.set(id, {
        questionId: id,
        status: 'SKIPPED_BY_USER',
        rawValue: null,
        qualitativeConfirmed: null,
      });
      continue;
    }
    bag.set(id, {
      questionId: id,
      status: 'ANSWERED',
      rawValue: value,
      qualitativeConfirmed: bag.get(id)?.qualitativeConfirmed ?? null,
    });
  }

  const policy = namedPolicy(spec.policy_id, spec.custom_ids);
  if (spec.policy_id === 'CUSTOM' && spec.custom_ids) {
    const served = new Set(spec.custom_ids);
    for (const question of definition.questions) {
      if (served.has(question.id)) continue;
      const current = bag.get(question.id);
      if (!current || current.status === 'ANSWERED') continue;
      bag.set(question.id, {
        ...current,
        status: 'NOT_SERVED_BY_POLICY',
      });
    }
  }

  return {
    family_key: familyKey,
    case_id: spec.id,
    purpose: spec.purpose,
    golden: spec.golden,
    expected_invariants: spec.expected_invariants,
    policy,
    responses: [...bag.values()],
  };
}
