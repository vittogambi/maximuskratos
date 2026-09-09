import type { JsonValue, MatrixDefinition } from '../types';
import { definitionSha256 } from '../engine/hash';

export type ChangeOperation =
  | { op: 'SET_RULE_PARAM'; rule_id: string; param: string; from: unknown; to: unknown }
  | { op: 'SET_QUESTION_WEIGHT'; question_id: string; from: number; to: number }
  | { op: 'SET_QUESTION_ACTIVE'; question_id: string; from: boolean; to: boolean }
  | { op: 'SET_DIMENSION_ALIAS'; label: string; from: string | null; to: string | null }
  | { op: 'SET_INTERPRETATION_PARAM'; interpretation_id: string; param: string; from: unknown; to: unknown };

function cloneDefinition(definition: MatrixDefinition): MatrixDefinition {
  return JSON.parse(JSON.stringify(definition)) as MatrixDefinition;
}

function assertFrom<T>(actual: T, expected: unknown, label: string): void {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(`${label}: from mismatch (expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)})`);
  }
}

export function applyChangeOperations(
  base: MatrixDefinition,
  operations: ChangeOperation[],
): MatrixDefinition {
  const next = cloneDefinition(base);
  for (const operation of operations) {
    if (operation.op === 'SET_QUESTION_WEIGHT') {
      const question = next.questions.find((item) => item.id === operation.question_id);
      if (!question) throw new Error(`unknown question ${operation.question_id}`);
      assertFrom(question.weight, operation.from, operation.question_id);
      question.weight = operation.to;
      continue;
    }
    if (operation.op === 'SET_QUESTION_ACTIVE') {
      const question = next.questions.find((item) => item.id === operation.question_id);
      if (!question) throw new Error(`unknown question ${operation.question_id}`);
      assertFrom(question.active, operation.from, operation.question_id);
      question.active = operation.to;
      continue;
    }
    if (operation.op === 'SET_INTERPRETATION_PARAM') {
      const interpretation = next.interpretations.find(
        (item) => item.id === operation.interpretation_id,
      );
      if (!interpretation) throw new Error(`unknown interpretation ${operation.interpretation_id}`);
      const actual =
        interpretation.params[operation.param] ??
        (operation.param === 'domain_aggregation' ? 'DIMENSION_EQUAL' : undefined);
      assertFrom(actual, operation.from, operation.interpretation_id);
      interpretation.params[operation.param] = operation.to as JsonValue;
      continue;
    }
    if (operation.op === 'SET_DIMENSION_ALIAS') {
      const current = next.alias_map.find((item) => item.from === operation.label);
      const actual = current?.to ?? null;
      assertFrom(actual, operation.from, operation.label);
      if (operation.to == null) {
        next.alias_map = next.alias_map.filter((item) => item.from !== operation.label);
      } else if (current) {
        current.to = operation.to;
      } else {
        next.alias_map.push({
          from: operation.label,
          to: operation.to,
          interpretation: 'LAB-ALIAS-01',
        });
      }
      continue;
    }
    if (operation.op === 'SET_RULE_PARAM') {
      const band = next.state_bands.find((item) => item.rule_id === operation.rule_id);
      if (band && (operation.param === 'min' || operation.param === 'max')) {
        assertFrom(band[operation.param], operation.from, operation.rule_id);
        band[operation.param] = operation.to as number;
        continue;
      }
      if (operation.rule_id.startsWith('R-MISS') && operation.param === 'insufficient_below') {
        assertFrom(next.coverage_bands.insufficient_below, operation.from, operation.rule_id);
        next.coverage_bands.insufficient_below = operation.to as number;
        continue;
      }
      if (operation.rule_id.startsWith('R-MISS') && operation.param === 'provisional_below') {
        assertFrom(next.coverage_bands.provisional_below, operation.from, operation.rule_id);
        next.coverage_bands.provisional_below = operation.to as number;
        continue;
      }
      const rule = next.rules.find((item) => item.id === operation.rule_id);
      if (!rule) throw new Error(`unknown rule ${operation.rule_id}`);
      assertFrom(rule.params[operation.param], operation.from, operation.rule_id);
      rule.params[operation.param] = operation.to as JsonValue;
    }
  }

  next.definition_sha256 = definitionSha256(next);
  return next;
}

export function isNoopChange(base: MatrixDefinition, candidate: MatrixDefinition): boolean {
  return base.definition_sha256 === candidate.definition_sha256;
}
