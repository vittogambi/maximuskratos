import { describe, expect, it } from 'vitest';
import { FULL_POLICY, diagnosticContractsEqual, runAssessment, toDiagnosticContract } from '../src';
import { ENGINE_SEMVER } from '../src/types';
import { loadFrozen, makeResponses } from './helpers/assessment';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

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

function loadCase(file: string) {
  return JSON.parse(readFileSync(resolve(DIR, file), 'utf8')) as {
    now: string;
    responses: Record<string, unknown>;
  };
}

describe('diagnostic contract', () => {
  const definition = loadFrozen();

  it('omits purpose dimension scores and keeps four plan domains', () => {
    const snapshot = runAssessment({
      definition,
      responses: makeResponses(definition, { scoreableValue: 3, riskValue: 0 }),
      policy: FULL_POLICY,
      engineSemver: ENGINE_SEMVER,
    });
    const contract = toDiagnosticContract(snapshot);
    expect(contract.domains.map((item) => item.key)).toEqual([
      'MENTALIDAD',
      'RELACIONES',
      'FINANZAS',
      'CUERPO',
    ]);
    expect(JSON.stringify(contract)).not.toContain('dimension_scores');
    expect(contract.priority.domain).not.toBe('PROPÓSITO');
  });

  it('stays equal when only purpose narratives change', () => {
    const base = loadCase('R15B.json');
    const rich = loadCase('R15.json');
    const a = toDiagnosticContract(
      runAssessment({
        definition,
        responses: Object.entries(base.responses).map(([id, value]) => asInput(id, value)),
        policy: FULL_POLICY,
        engineSemver: ENGINE_SEMVER,
        now: base.now,
      }),
    );
    const b = toDiagnosticContract(
      runAssessment({
        definition,
        responses: Object.entries(rich.responses).map(([id, value]) => asInput(id, value)),
        policy: FULL_POLICY,
        engineSemver: ENGINE_SEMVER,
        now: rich.now,
      }),
    );
    expect(diagnosticContractsEqual(a, b)).toBe(true);
  });
});
