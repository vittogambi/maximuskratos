import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { applyChangeOperations } from '../src/changeset/apply-operations';
import { runAssessment } from '../src/engine/run-assessment';
import { ENGINE_SEMVER } from '../src/types';
import { FULL_POLICY } from '../src/policy/resolve-served';
import { loadFrozen } from './helpers/assessment';

const DIR = resolve(__dirname, 'cases/rafa-casebook');

function asInput(questionId: string, value: unknown) {
  if (value != null && typeof value === 'object' && !Array.isArray(value)) {
    const record = value as Record<string, unknown>;
    return {
      questionId,
      status: 'ANSWERED' as const,
      rawValue: (record.value ?? record.rawValue ?? null) as number | string | null,
      qualitativeConfirmed: (record.qualitativeConfirmed as boolean | null | undefined) ?? null,
    };
  }
  return { questionId, status: 'ANSWERED' as const, rawValue: value as number | string | null };
}

function runCase(file: string, definition = loadFrozen()) {
  const json = JSON.parse(readFileSync(resolve(DIR, file), 'utf8')) as {
    now: string;
    responses: Record<string, unknown>;
  };
  return runAssessment({
    definition,
    responses: Object.entries(json.responses).map(([id, value]) => asInput(id, value)),
    policy: FULL_POLICY,
    engineSemver: ENGINE_SEMVER,
    now: json.now,
  });
}

describe('LAB-023 domain_aggregation', () => {
  const definition = loadFrozen();
  const itemWeighted = applyChangeOperations(definition, [
    {
      op: 'SET_INTERPRETATION_PARAM',
      interpretation_id: 'LAB-SCORE-01',
      param: 'domain_aggregation',
      from: 'DIMENSION_EQUAL',
      to: 'ITEM_WEIGHTED',
    },
  ]);

  it('keeps R04 Cuerpo at 39 with the official average', () => {
    const cuerpo = runCase('R04.json').domains.find((item) => item.key === 'CUERPO');
    expect(cuerpo?.score_display).toBe(39);
  });

  it('returns Cuerpo 46.43 on R04 and 50 on R01 when ITEM_WEIGHTED', () => {
    const r04 = runCase('R04.json', itemWeighted).domains.find((item) => item.key === 'CUERPO');
    const r01 = runCase('R01.json', itemWeighted).domains.find((item) => item.key === 'CUERPO');
    expect(r04?.score).toBeCloseTo(46.43, 2);
    expect(r01?.score).toBe(50);
  });
});
