import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { MatrixDefinition } from '@mk/matrix-engine';
import { describe, expect, it } from 'vitest';
import {
  ChangeRequestError,
  buildChangeOperation,
  buildChangeOptions,
  inertInterpretationParams,
} from '../src/lab/lab-change-options';

const definition = JSON.parse(
  readFileSync(
    resolve(__dirname, '../../../packages/matrix-engine/definitions/matrix-v2.0.json'),
    'utf8',
  ),
) as MatrixDefinition;

const coverageTarget = 'R-MISS-01.insufficient_below';

describe('guided change options', () => {
  it('UX-12: every guided kind maps to one of the five allowed operations', () => {
    const weight = buildChangeOperation(definition, {
      kind: 'QUESTION_WEIGHT',
      target_id: 'AUD-CUE-01',
      to: 0.5,
    });
    expect(weight.operation.op).toBe('SET_QUESTION_WEIGHT');

    const active = buildChangeOperation(definition, {
      kind: 'QUESTION_ACTIVE',
      target_id: 'AUD-CUE-01',
      to: false,
    });
    expect(active.operation.op).toBe('SET_QUESTION_ACTIVE');

    const rule = buildChangeOperation(definition, {
      kind: 'RULE_THRESHOLD',
      target_id: coverageTarget,
      to: 70,
    });
    expect(rule.operation.op).toBe('SET_RULE_PARAM');

    const alias = definition.alias_map[0];
    const aliasTarget = definition.dimensions.find((item) => item.key !== alias.to);
    const aliasOp = buildChangeOperation(definition, {
      kind: 'DIMENSION_ALIAS',
      target_id: alias.from,
      to: aliasTarget?.key,
    });
    expect(aliasOp.operation.op).toBe('SET_DIMENSION_ALIAS');

    const interpretation = buildChangeOperation(definition, {
      kind: 'INTERPRETATION',
      target_id: 'LAB-PRIORITY-01.domain_tie_break',
      to: 'CUERPO',
    });
    expect(interpretation.operation.op).toBe('SET_INTERPRETATION_PARAM');

    const aggregation = buildChangeOperation(definition, {
      kind: 'INTERPRETATION',
      target_id: 'LAB-SCORE-01.domain_aggregation',
      to: 'ITEM_WEIGHTED',
    });
    expect(aggregation.operation).toMatchObject({
      op: 'SET_INTERPRETATION_PARAM',
      interpretation_id: 'LAB-SCORE-01',
      param: 'domain_aggregation',
      from: 'DIMENSION_EQUAL',
      to: 'ITEM_WEIGHTED',
    });
  });

  it('resolves the previous value from the definition instead of trusting the client', () => {
    const question = definition.questions.find((item) => item.id === 'AUD-CUE-01');
    const built = buildChangeOperation(definition, {
      kind: 'QUESTION_WEIGHT',
      target_id: 'AUD-CUE-01',
      to: 0.5,
    });
    expect(built.operation).toMatchObject({ from: question?.weight, to: 0.5 });

    const coverage = buildChangeOperation(definition, {
      kind: 'RULE_THRESHOLD',
      target_id: coverageTarget,
      to: 70,
    });
    expect(coverage.operation).toMatchObject({
      from: definition.coverage_bands.insufficient_below,
      to: 0.7,
    });
  });

  it('UX-13: rejects a target that is not a selectable entity of the definition', () => {
    expect(() =>
      buildChangeOperation(definition, {
        kind: 'QUESTION_WEIGHT',
        target_id: 'NO-EXISTE-01',
        to: 0.5,
      }),
    ).toThrow(ChangeRequestError);
    expect(() =>
      buildChangeOperation(definition, {
        kind: 'RULE_THRESHOLD',
        target_id: 'R-INVENTADA.min',
        to: 10,
      }),
    ).toThrow(ChangeRequestError);
  });

  it('UX-14: rejects values outside the real range or inconsistent with the other band', () => {
    expect(() =>
      buildChangeOperation(definition, { kind: 'RULE_THRESHOLD', target_id: coverageTarget, to: 140 }),
    ).toThrow(/0% a 100%/);
    expect(() =>
      buildChangeOperation(definition, { kind: 'RULE_THRESHOLD', target_id: coverageTarget, to: 95 }),
    ).toThrow(/lectura firme/);
    expect(() =>
      buildChangeOperation(definition, {
        kind: 'QUESTION_WEIGHT',
        target_id: 'AUD-CUE-01',
        to: -1,
      }),
    ).toThrow(/negativa/);
    expect(() =>
      buildChangeOperation(definition, {
        kind: 'DIMENSION_ALIAS',
        target_id: definition.alias_map[0].from,
        to: 'DIMENSION_QUE_NO_EXISTE',
      }),
    ).toThrow(/no existe/);
  });

  it('describes every option in Spanish, with its current value and no operation code', () => {
    const options = buildChangeOptions(definition);
    expect(options.length).toBeGreaterThan(5);
    for (const option of options) {
      expect(option.label).not.toMatch(/^SET_/);
      expect(option.description.length).toBeGreaterThan(10);
      expect(option.current).not.toBeUndefined();
    }
    expect(JSON.stringify(options)).not.toContain('SET_RULE_PARAM');
  });

  it('flags interpretation params the engine does not read as not experimentable', () => {
    const inert = inertInterpretationParams(definition);
    const keys = inert.map((row) => `${row.interpretation_id}.${row.param}`);
    expect(keys).not.toContain('LAB-PRIORITY-01.domain_tie_break');
    const options = buildChangeOptions(definition).map((option) => option.target_id);
    for (const key of keys) {
      expect(options).not.toContain(key);
    }
  });
});
