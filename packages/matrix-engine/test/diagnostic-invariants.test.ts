import { describe, expect, it } from 'vitest';
import {
  FULL_POLICY,
  PLAN_DOMAINS,
  diagnosticContractsEqual,
  runAssessment,
  toDiagnosticContract,
} from '../src';
import { ENGINE_SEMVER } from '../src/types';
import { loadFrozen, makeResponses } from './helpers/assessment';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const DIR = resolve(__dirname, 'cases/rafa-casebook');
const PLANED = PLAN_DOMAINS as readonly string[];

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

describe('diagnostic invariants', () => {
  const definition = loadFrozen();

  it('keeps classified domain scores inside 0 to 100', () => {
    const snapshot = runAssessment({
      definition,
      responses: makeResponses(definition, { scoreableValue: 5, riskValue: 0 }),
      policy: FULL_POLICY,
      engineSemver: ENGINE_SEMVER,
    });
    for (const domain of snapshot.domains.filter((item) => PLANED.includes(item.key))) {
      if (domain.score == null) continue;
      expect(domain.score).toBeGreaterThanOrEqual(0);
      expect(domain.score).toBeLessThanOrEqual(100);
    }
  });

  it('does not let purpose narratives move R03 body containment', () => {
    const base = loadCase('R03.json');
    const purpose = loadCase('R15.json');
    const overlay: Record<string, unknown> = { ...base.responses };
    for (const [id, value] of Object.entries(purpose.responses)) {
      if (id.startsWith('P-PRO-')) overlay[id] = value;
    }
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
        responses: Object.entries(overlay).map(([id, value]) => asInput(id, value)),
        policy: FULL_POLICY,
        engineSemver: ENGINE_SEMVER,
        now: base.now,
      }),
    );
    expect(diagnosticContractsEqual(a, b)).toBe(true);
    expect(a.domains.find((item) => item.key === 'CUERPO')?.state_final).toBe('CONTENCIÓN');
  });

  it('does not put purpose questions in the diagnostic domain set', () => {
    const purpose = definition.questions.filter(
      (item) => item.domain === 'PROPÓSITO' || item.domain === 'PURPOSE',
    );
    expect(purpose.every((item) => !PLANED.includes(item.domain))).toBe(true);
  });
});
