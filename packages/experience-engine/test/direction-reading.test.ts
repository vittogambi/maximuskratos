import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  ENGINE_SEMVER,
  FULL_POLICY,
  diagnosticContractsEqual,
  runAssessment,
  toDiagnosticContract,
  type MatrixDefinition,
  type ResponseInput,
} from '@mk/matrix-engine';
import {
  buildDirectionReading,
  directionEvidenceFingerprint,
} from '../src/direction-reading';

function loadFrozen(): MatrixDefinition {
  return JSON.parse(
    readFileSync(resolve(__dirname, '../../matrix-engine/definitions/matrix-v2.0.json'), 'utf8'),
  ) as MatrixDefinition;
}

function parseCase(file: string): { now: string; responses: Record<string, unknown> } {
  return JSON.parse(
    readFileSync(resolve(__dirname, `../../matrix-engine/test/cases/rafa-casebook/${file}`), 'utf8'),
  ) as { now: string; responses: Record<string, unknown> };
}

function asInput(questionId: string, value: unknown): ResponseInput {
  if (value != null && typeof value === 'object' && !Array.isArray(value)) {
    const record = value as Record<string, unknown>;
    return {
      questionId,
      status: 'ANSWERED',
      rawValue: (record.value ?? record.rawValue ?? null) as number | string | null,
      qualitativeConfirmed: (record.qualitativeConfirmed as boolean | null | undefined) ?? null,
    };
  }
  return { questionId, status: 'ANSWERED', rawValue: value as number | string | null };
}

describe('DirectionReading v0.1', () => {
  const definition = loadFrozen();

  it('marks empty purpose as NO_SIGNAL without a negative state', () => {
    const json = parseCase('R03.json');
    const reading = buildDirectionReading({
      definition,
      responses: Object.entries(json.responses).map(([id, value]) => asInput(id, value)),
    });
    expect(reading.signal_coverage).toBe('NO_SIGNAL');
    expect(reading.declared.basis).toBe('undetermined');
    expect(reading.evidence).toEqual([]);
    expect(JSON.stringify(reading).toLowerCase()).not.toContain('74/100');
  });

  it('keeps explicit R15A quotes and does not invent a label', () => {
    const json = parseCase('R15.json');
    const reading = buildDirectionReading({
      definition,
      responses: Object.entries(json.responses).map(([id, value]) => asInput(id, value)),
    });
    expect(reading.signal_coverage).toBe('SIGNAL_AVAILABLE');
    expect(reading.evidence.some((item) => item.original_text.includes('algo mío'))).toBe(true);
    expect(JSON.stringify(reading)).not.toMatch(/emprendedor/i);
    expect(reading.basis).toBe('explicit');
  });

  it('does not treat Rafa stage as a calculated purpose', () => {
    const json = parseCase('R15.json');
    const reading = buildDirectionReading({
      definition,
      responses: Object.entries(json.responses).map(([id, value]) => asInput(id, value)),
      reviewed: { stage: 'HIPOTETICO', notes: 'Clara hacia un oficio propio.', evidence_ids: ['P-PRO-006'], confidence: 'MEDIA' },
    });
    expect(reading.reviewed_synthesis?.stage).toBe('HIPOTETICO');
    expect(reading.basis).toBe('reviewed_synthesis');
  });

  it('changes evidence when purpose text changes and leaves diagnosis untouched', () => {
    const family = parseCase('R15B.json');
    const rich = parseCase('R15.json');
    const familyResponses = Object.entries(family.responses).map(([id, value]) => asInput(id, value));
    const richResponses = Object.entries(rich.responses).map(([id, value]) => asInput(id, value));
    const a = toDiagnosticContract(
      runAssessment({
        definition,
        responses: familyResponses,
        policy: FULL_POLICY,
        engineSemver: ENGINE_SEMVER,
        now: family.now,
      }),
    );
    const b = toDiagnosticContract(
      runAssessment({
        definition,
        responses: richResponses,
        policy: FULL_POLICY,
        engineSemver: ENGINE_SEMVER,
        now: rich.now,
      }),
    );
    expect(diagnosticContractsEqual(a, b)).toBe(true);
    const readA = buildDirectionReading({ definition, responses: familyResponses });
    const readB = buildDirectionReading({ definition, responses: richResponses });
    expect(directionEvidenceFingerprint(readA)).not.toBe(directionEvidenceFingerprint(readB));
    expect(readA.signal_coverage).toBe('SIGNAL_AVAILABLE');
    expect(readB.signal_coverage).toBe('SIGNAL_AVAILABLE');
  });
});
