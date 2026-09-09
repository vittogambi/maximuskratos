import { execFileSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { beforeAll, describe, expect, it } from 'vitest';
import { canonicalize, definitionSha256, hashResponses } from '../src/engine/hash';
import { indexTrace, walkTrace } from '../src/engine/trace';
import { runAssessment } from '../src/engine/run-assessment';
import { ENGINE_SEMVER, type MatrixDefinition, type ResultSnapshot } from '../src/types';
import { FULL_POLICY } from '../src/policy/resolve-served';
import { FROZEN_NOW, loadFrozen, makeResponses, runFrozen } from './helpers/assessment';

let definition: MatrixDefinition;

beforeAll(() => {
  definition = loadFrozen();
});

function stripGeneratedAt(snapshot: ResultSnapshot): unknown {
  const { generated_at: _generatedAt, ...rest } = snapshot;
  return rest;
}

function requiredNodeIds(snapshot: ResultSnapshot): string[] {
  const ids = ['root', 'responses', 'safety', 'priority', 'recommendation', 'global', 'purpose'];
  for (const risk of definition.risks) ids.push(`safety:${risk.question_id}`);
  for (const dimension of snapshot.dimensions) {
    if (dimension.score != null) ids.push(`dimension:${dimension.key}`);
  }
  for (const domain of snapshot.domains) {
    ids.push(`coverage:${domain.key}`, `state:${domain.key}`, `override:${domain.key}`);
    if (domain.score != null) ids.push(`domain_score:${domain.key}`);
  }
  if (snapshot.recommendations.primary) ids.push('recommendation:primary');
  if (snapshot.recommendations.maintenance) ids.push('recommendation:maintenance');
  return ids;
}

describe('P0-06 runAssessment, trace and snapshot', () => {
  it('INV-01: same inputs produce the same methodological snapshot', () => {
    const responses = makeResponses(definition, { scoreableValue: 3, riskValue: 0 });
    const a = runFrozen(definition, responses, FROZEN_NOW);
    const b = runFrozen(definition, responses, FROZEN_NOW);
    const later = runFrozen(definition, responses, '2026-08-24T19:00:00.000Z');
    expect(canonicalize(a)).toBe(canonicalize(b));
    expect(canonicalize(stripGeneratedAt(a))).toBe(canonicalize(stripGeneratedAt(later)));
    expect(later.generated_at).not.toBe(a.generated_at);
  });

  it('INV-16: response order does not change the hash', () => {
    const responses = makeResponses(definition, { scoreableValue: 3, riskValue: 0 });
    const reversed = [...responses].reverse();
    const a = runFrozen(definition, responses);
    const b = runFrozen(definition, reversed);
    expect(a.responses_hash).toBe(b.responses_hash);
    expect(canonicalize(stripGeneratedAt(a))).toBe(canonicalize(stripGeneratedAt(b)));
  });

  it('qualitativeConfirmed changes responses_hash and the snapshot', () => {
    const base = makeResponses(definition, {
      scoreableValue: 5,
      riskValue: 0,
      answers: { 'D-REL-15': { raw: 1, qualitativeConfirmed: null } },
    });
    const denied = makeResponses(definition, {
      scoreableValue: 5,
      riskValue: 0,
      answers: { 'D-REL-15': { raw: 1, qualitativeConfirmed: false } },
    });
    const a = runFrozen(definition, base);
    const b = runFrozen(definition, denied);
    expect(a.responses_hash).not.toBe(b.responses_hash);
    expect(hashResponses(base)).not.toBe(hashResponses(denied));
    expect(a.domains.find((item) => item.key === 'RELACIONES')?.state_final).toBe('CONTENCIÓN');
    expect(b.domains.find((item) => item.key === 'RELACIONES')?.state_final).toBe('EXPANSIÓN');
  });

  it('INV-21: a mutated definition hash is rejected', () => {
    const mutated = {
      ...definition,
      state_bands: definition.state_bands.map((band, index) =>
        index === 0 ? { ...band, max: 38 } : band,
      ),
    };
    expect(() =>
      runAssessment({
        definition: mutated,
        responses: makeResponses(definition, { scoreableValue: 3 }),
        policy: FULL_POLICY,
        engineSemver: ENGINE_SEMVER,
        now: FROZEN_NOW,
      }),
    ).toThrow(/definition_sha256 mismatch/);
    expect(definitionSha256(mutated)).not.toBe(definition.definition_sha256);
  });

  it('INV-11: every non-null derived field has a trace node', () => {
    const snapshot = runFrozen(
      definition,
      makeResponses(definition, {
        scoreableValue: 5,
        riskValue: 0,
        answers: { 'D-CUE-05': 1 },
      }),
    );
    const index = indexTrace(snapshot.trace);
    for (const nodeId of requiredNodeIds(snapshot)) {
      expect(index.has(nodeId), nodeId).toBe(true);
    }
  });

  it('INV-12: MATRIX and LAB nodes always carry a rule_id', () => {
    const snapshot = runFrozen(
      definition,
      makeResponses(definition, { scoreableValue: 3, riskValue: 0 }),
    );
    walkTrace(snapshot.trace, (item) => {
      if (item.source === 'MATRIX' || item.source === 'LAB_INTERPRETATION_v0') {
        expect(item.rule_id, item.node_id).toBeTruthy();
      }
      expect(item.source).toBeTruthy();
    });
  });

  it('INV-13: interpretations_used stay inside the definition block', () => {
    const snapshot = runFrozen(
      definition,
      makeResponses(definition, { scoreableValue: 3, riskValue: 0 }),
    );
    const allowed = new Set(definition.interpretations.map((item) => item.id));
    for (const id of snapshot.interpretations_used) {
      expect(allowed.has(id), id).toBe(true);
    }
  });

  it('pins definition_ref and never a bare definition_id', () => {
    const snapshot = runFrozen(
      definition,
      makeResponses(definition, { scoreableValue: 3, riskValue: 0 }),
    );
    expect(snapshot.definition_ref).toBe('matrix-v2.0@1');
    expect(snapshot.definition_sha256).toBe(definition.definition_sha256);
    expect(snapshot.source_sha256).toBe(definition.source.sha256);
    expect(snapshot.engine_semver).toBe(ENGINE_SEMVER);
    expect(snapshot.policy_id).toBe('FULL-v1');
    expect(JSON.stringify(snapshot.trace)).not.toContain('"definition_id":"matrix-v2.0"');
  });

  it('LAB-SCORE-01 counterfactual is explanation only', () => {
    const snapshot = runFrozen(
      definition,
      makeResponses(definition, { scoreableValue: 3, riskValue: 0 }),
    );
    const index = indexTrace(snapshot.trace);
    const cuerpo = index.get('domain_score:CUERPO');
    const output = cuerpo?.output as {
      score: number;
      aggregation: string;
      counterfactual_item_weighted: number | null;
    };
    expect(output.aggregation).toBe('DIMENSION_EQUAL');
    expect(output.counterfactual_item_weighted).not.toBeNull();
    expect(snapshot.domains.find((item) => item.key === 'CUERPO')?.score).toBe(output.score);
  });

  it('CLI summary runs the same runAssessment', () => {
    const responses = makeResponses(definition, { scoreableValue: 3, riskValue: 0 });
    const map: Record<string, number | { value: number; qualitativeConfirmed: null }> = {};
    for (const response of responses) {
      if (response.status !== 'ANSWERED' || response.rawValue == null) continue;
      if (typeof response.rawValue === 'number') map[response.questionId] = response.rawValue;
    }
    const casePath = resolve(__dirname, 'cases/smoke-technical.json');
    writeFileSync(
      casePath,
      `${JSON.stringify({ case_id: 'SMOKE-001', now: FROZEN_NOW, responses: map }, null, 2)}\n`,
    );
    const output = execFileSync(
      'npx',
      [
        'tsx',
        'src/cli/case.ts',
        '--definition',
        'matrix-v2.0@1',
        '--responses',
        casePath,
        '--format',
        'summary',
      ],
      { cwd: resolve(__dirname, '..'), encoding: 'utf8' },
    );
    expect(output).toContain('CASE: SMOKE-001');
    expect(output).toContain('MENTALIDAD');
    expect(output).toContain('PRIORITY');
    expect(output).toContain('MATRIX RECOMMENDATION');
    expect(output).toContain('POR QUE');
  });
});
