import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { ENGINE_SEMVER, FULL_POLICY, runAssessment, type MatrixDefinition } from '@mk/matrix-engine';
import { describe, expect, it } from 'vitest';
import { buildPairCompareView, pairResultQuestion } from '../src/lab/lab-pair';
import { pairQuestionFor } from '../src/lab/lab-casebook';

const DIR = resolve(__dirname, '../../../packages/matrix-engine/test/cases/rafa-casebook');
const definition = JSON.parse(
  readFileSync(resolve(__dirname, '../../../packages/matrix-engine/definitions/matrix-v2.0.json'), 'utf8'),
) as MatrixDefinition;

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
  const json = JSON.parse(readFileSync(resolve(DIR, file), 'utf8')) as {
    now: string;
    responses: Record<string, unknown>;
  };
  const snapshot = runAssessment({
    definition,
    responses: Object.entries(json.responses).map(([id, value]) => asInput(id, value)),
    policy: FULL_POLICY,
    engineSemver: ENGINE_SEMVER,
    now: json.now,
  });
  const answers = Object.entries(json.responses).map(([questionId, raw]) => ({
    questionId,
    text: definition.questions.find((item) => item.id === questionId)?.text,
    raw: typeof raw === 'object' && raw != null && !Array.isArray(raw) ? (raw as { value?: unknown }).value : raw,
    status: 'ANSWERED',
  }));
  return { snapshot, answers, responses: json.responses };
}

function comparePair(aFile: string, bFile: string) {
  const a = loadCase(aFile);
  const b = loadCase(bFile);
  return buildPairCompareView(definition, a.snapshot, b.snapshot, a.answers, b.answers);
}

describe('LAB-024 pairCompare', () => {
  it('R07A/B: one question, Mentalidad 39 Contención to 40 Estabilización, same priority, route changes', () => {
    const view = comparePair('R07A.json', 'R07B.json');
    expect(view.changed_questions).toHaveLength(1);
    expect(view.changed_questions[0]?.questionId).toBe('D-MEN-13');
    expect(view.changed_questions[0]?.a_label).toBeTruthy();
    expect(view.changed_questions[0]?.b_label).toBeTruthy();
    const menDims = Object.entries(view.dimensions).filter(([key]) => key.startsWith('MEN.'));
    expect(menDims.length).toBe(1);
    expect(view.domains.MENTALIDAD).toMatchObject({
      a_score: 39,
      b_score: 40,
      a_state: 'CONTENCIÓN',
      b_state: 'ESTABILIZACIÓN',
    });
    expect(view.priority.a).toBe(view.priority.b);
    expect(view.plans.a).toBe('MEN-CON');
    expect(view.plans.b).toBe('MEN-EST');
    expect(pairResultQuestion()).toMatch(/diferencia en las respuestas/);
  });

  it('R13A/B: 24 questions, four Mentalidad dimensions change, domain priority and route do not', () => {
    const view = comparePair('R13A.json', 'R13B.json');
    expect(view.changed_questions).toHaveLength(24);
    const menDims = Object.entries(view.dimensions).filter(([key]) => key.startsWith('MEN.'));
    expect(menDims).toHaveLength(4);
    expect(view.domains).toEqual({});
    expect(view.priority.a).toBe(view.priority.b);
    expect(view.plans.a).toBe(view.plans.b);
    expect(pairResultQuestion()).toMatch(/diferencia en el resultado/);
  });

  it('covers the four pairs', () => {
    const pairs = [
      ['R07A.json', 'R07B.json'],
      ['R08A.json', 'R08B.json'],
      ['R09A.json', 'R09B.json'],
      ['R13A.json', 'R13B.json'],
    ] as const;
    for (const [a, b] of pairs) {
      const view = comparePair(a, b);
      expect(view.changed_questions.length).toBeGreaterThan(0);
      for (const row of view.changed_questions) {
        expect(row.a_label).toBeTruthy();
        expect(row.b_label).toBeTruthy();
      }
    }
  });
});

describe('LAB-025 compareParent contract', () => {
  it('shows one changed question and the Cuerpo chain when AUD-CUE-01 becomes Siempre', () => {
    const original = loadCase('R04.json');
    const simResponses = { ...original.responses, 'AUD-CUE-01': 5 };
    const simSnap = runAssessment({
      definition,
      responses: Object.entries(simResponses).map(([id, value]) => asInput(id, value)),
      policy: FULL_POLICY,
      engineSemver: ENGINE_SEMVER,
      now: '2026-08-24T21:00:00.000Z',
    });
    const simAnswers = original.answers.map((row) =>
      row.questionId === 'AUD-CUE-01' ? { ...row, raw: 5 } : row,
    );
    const view = buildPairCompareView(definition, original.snapshot, simSnap, original.answers, simAnswers);
    expect(view.changed_questions).toHaveLength(1);
    expect(view.changed_questions[0]?.questionId).toBe('AUD-CUE-01');
    expect(view.changed_questions[0]?.b_label).toMatch(/Siempre/i);
    const seguridad = Object.entries(view.dimensions).find(([, row]) =>
      row.label.toLowerCase().includes('seguridad'),
    );
    expect(seguridad).toBeTruthy();
    expect(view.domains.CUERPO).toBeTruthy();
    expect(view.plans.a).not.toBe(view.plans.b);
  });

  it('R15A/B: diagnosis stays equal and direction evidence differs', () => {
    const view = comparePair('R15.json', 'R15B.json');
    expect(view.diagnostic_equal).toBe(true);
    expect(view.direction.fingerprint_equal).toBe(false);
    expect(view.domains).toEqual({});
    expect(view.priority.a).toBe(view.priority.b);
    expect(pairQuestionFor('R15')).toMatch(/hacia dónde quiere ir Benjamín/);
  });
});
