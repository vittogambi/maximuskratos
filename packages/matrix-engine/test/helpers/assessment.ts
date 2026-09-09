import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { ENGINE_SEMVER, type MatrixDefinition, type ResponseInput, type ResponseStatus } from '../../src/types';
import { runAssessment } from '../../src/engine/run-assessment';
import { FULL_POLICY } from '../../src/policy/resolve-served';

export const FROZEN_NOW = '2026-08-24T18:00:00.000Z';

export function loadFrozen(): MatrixDefinition {
  return JSON.parse(
    readFileSync(
      resolve(__dirname, '../../definitions/matrix-v2.0.json'),
      'utf8',
    ),
  ) as MatrixDefinition;
}

export function makeResponses(
  definition: MatrixDefinition,
  options: {
    scoreableValue?: number;
    riskValue?: number;
    qualitativeConfirmed?: boolean | null;
    firstScoreable?: Partial<Record<string, { count: number; value: number }>>;
    answers?: Record<
      string,
      | number
      | {
          raw: number | string | null;
          qualitativeConfirmed?: boolean | null;
          status?: ResponseStatus;
        }
    >;
  } = {},
): ResponseInput[] {
  const byId = new Map<string, ResponseInput>();
  for (const question of definition.questions) {
    byId.set(question.id, {
      questionId: question.id,
      status: 'SKIPPED_BY_USER',
      rawValue: null,
      qualitativeConfirmed: null,
    });
  }

  if (options.scoreableValue != null) {
    for (const question of definition.questions) {
      if (!question.scoreable || !question.active) continue;
      byId.set(question.id, {
        questionId: question.id,
        status: 'ANSWERED',
        rawValue: options.scoreableValue,
        qualitativeConfirmed: null,
      });
    }
  }

  if (options.firstScoreable) {
    for (const [domain, spec] of Object.entries(options.firstScoreable)) {
      if (!spec) continue;
      const items = definition.questions.filter(
        (question) => question.domain === domain && question.scoreable && question.active,
      );
      items.forEach((question, index) => {
        if (index >= spec.count) return;
        byId.set(question.id, {
          questionId: question.id,
          status: 'ANSWERED',
          rawValue: spec.value,
          qualitativeConfirmed: null,
        });
      });
    }
  }

  if (options.riskValue != null) {
    for (const risk of definition.risks) {
      const likert = Boolean(risk.qualitative_clause);
      const rawValue =
        likert && options.riskValue === 0 ? 3 : options.riskValue;
      byId.set(risk.question_id, {
        questionId: risk.question_id,
        status: 'ANSWERED',
        rawValue,
        qualitativeConfirmed: likert
          ? (options.qualitativeConfirmed ?? null)
          : null,
      });
    }
  }

  for (const [id, value] of Object.entries(options.answers ?? {})) {
    if (typeof value === 'number') {
      byId.set(id, {
        questionId: id,
        status: 'ANSWERED',
        rawValue: value,
        qualitativeConfirmed: options.qualitativeConfirmed ?? null,
      });
      continue;
    }
    byId.set(id, {
      questionId: id,
      status: value.status ?? 'ANSWERED',
      rawValue: value.raw,
      qualitativeConfirmed: value.qualitativeConfirmed ?? null,
    });
  }

  return [...byId.values()];
}

export function runFrozen(
  definition: MatrixDefinition,
  responses: ResponseInput[],
  now = FROZEN_NOW,
) {
  return runAssessment({
    definition,
    responses,
    policy: FULL_POLICY,
    engineSemver: ENGINE_SEMVER,
    now,
  });
}
