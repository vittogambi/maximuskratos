import { resolve } from 'node:path';
import { beforeAll, describe, expect, it } from 'vitest';
import { importMatrix } from '../src/import/xlsx-importer';
import { formulaScore01, normalizeItem } from '../src/engine/normalize';
import { scoreDimensions, scoreDomains } from '../src/engine/score';
import type { MatrixDefinition, ResponseInput } from '../src/types';

const XLSX = resolve(__dirname, '../../../MATRIZ_MAESTRA_MK_v2_FOCO.xlsx');

let definition: MatrixDefinition;

beforeAll(async () => {
  definition = (
    await importMatrix({ xlsxPath: XLSX, definitionId: 'matrix-v2.0' })
  ).definition;
});

function answerAllLikert(value: number): ResponseInput[] {
  return definition.questions.map((question) => ({
    questionId: question.id,
    status: 'ANSWERED' as const,
    rawValue:
      question.response_kind === 'LIKERT_1_5' || question.scale_id.startsWith('L5_')
        ? value
        : question.scale_id === 'YN_DETAIL'
          ? 0
          : null,
  }));
}

describe('P0-02 normalization and scoring', () => {
  it('uses scale anchors and matches R-SCORE-01 on 1..5', () => {
    const question = definition.questions.find((item) => item.id === 'AUD-MEN-01');
    const scale = definition.scales.find((item) => item.id === question?.scale_id);
    expect(question && scale).toBeTruthy();
    for (const raw of [1, 2, 3, 4, 5]) {
      const normalized = normalizeItem(
        question!,
        scale,
        { questionId: question!.id, status: 'ANSWERED', rawValue: raw },
      );
      expect(normalized.score).toBe(formulaScore01(raw));
    }
  });

  it('INV-06: the five interference items invert and do not leak into integration', () => {
    const inverses = definition.questions.filter((item) => item.inverse);
    expect(inverses.map((item) => item.id)).toEqual([
      'P-PRO-026',
      'P-PRO-027',
      'P-PRO-028',
      'P-PRO-029',
      'P-PRO-030',
    ]);
    const scale = definition.scales.find((item) => item.id === 'L5_FREQ');
    const low = normalizeItem(inverses[0], scale, {
      questionId: inverses[0].id,
      status: 'ANSWERED',
      rawValue: 1,
    });
    const high = normalizeItem(inverses[0], scale, {
      questionId: inverses[0].id,
      status: 'ANSWERED',
      rawValue: 5,
    });
    expect(low.score).toBe(100);
    expect(high.score).toBe(0);

    const responses = answerAllLikert(1);
    const dimensions = scoreDimensions(definition, responses);
    const interference = dimensions.find((item) => item.key === 'PRO.interferencia');
    const integration = dimensions.find((item) => item.key === 'PRO.integracion');
    expect(interference?.score).toBe(100);
    expect(integration?.score).toBe(0);
  });

  it('LAB-NORM-01: D-CUE-07 is unscoreable', () => {
    const question = definition.questions.find((item) => item.id === 'D-CUE-07');
    const scale = definition.scales.find((item) => item.id === 'SLEEP_HOURS');
    const result = normalizeItem(question!, scale, {
      questionId: 'D-CUE-07',
      status: 'ANSWERED',
      rawValue: 8,
    });
    expect(question?.scoreable).toBe(false);
    expect(result.score).toBeNull();
    expect(result.reason).toBe('SCALE_HAS_NO_SCORE_MAP');
  });

  it('INV-02: risk items with weight 1 never enter a score', () => {
    const base = answerAllLikert(5);
    const withRisks = base.map((response) =>
      ['D-REL-15', 'D-FIN-09', 'D-CUE-25'].includes(response.questionId)
        ? { ...response, rawValue: 1 }
        : response,
    );
    const a = scoreDomains(definition, scoreDimensions(definition, base));
    const b = scoreDomains(definition, scoreDimensions(definition, withRisks));
    expect(a.map((item) => item.score)).toEqual(b.map((item) => item.score));
  });

  it('INV-04: unanswered items are omitted, not zero', () => {
    const dimension = definition.dimensions.find(
      (item) => item.domain === 'MENTALIDAD' && item.key.includes('foco'),
    );
    const items = definition.questions.filter(
      (question) => question.dimension === dimension?.key && question.scoreable,
    );
    expect(items.length).toBe(6);
    const responses: ResponseInput[] = items.map((question, index) => ({
      questionId: question.id,
      status: index < 3 ? 'ANSWERED' : 'SKIPPED_BY_USER',
      rawValue: index < 3 ? 5 : null,
    }));
    const scored = scoreDimensions(definition, responses).find(
      (item) => item.key === dimension?.key,
    );
    expect(scored?.items_scored).toBe(3);
    expect(scored?.score).toBe(100);
  });

  it('INV-05: non-ESTADO answers do not produce scores', () => {
    const responses: ResponseInput[] = definition.questions.map((question) => ({
      questionId: question.id,
      status: 'ANSWERED',
      rawValue: question.variable_kind === 'ESTADO' ? null : 'texto',
    }));
    const dimensions = scoreDimensions(definition, responses);
    expect(dimensions.every((item) => item.score == null)).toBe(true);
    const domains = scoreDomains(definition, dimensions);
    expect(domains.every((item) => item.score == null)).toBe(true);
    expect(domains.some((item) => item.key === 'PROPÓSITO')).toBe(false);
  });

  it('LAB-ALIAS-01 fuses the five audit/deep pairs', () => {
    const audit = definition.questions.find((item) => item.id === 'AUD-MEN-02');
    const deep = definition.questions.find(
      (item) =>
        item.domain === 'MENTALIDAD' &&
        item.instrument === 'D-MEN-001' &&
        item.dimension === audit?.dimension,
    );
    expect(audit?.dimension).toBe('MEN.autorregulacion_y_resiliencia');
    expect(deep).toBeTruthy();
    expect(definition.alias_map).toHaveLength(5);
  });

  it('LAB-SCORE-01 averages dimensions, not items', () => {
    const cueDimensions = definition.dimensions.filter((item) => item.domain === 'CUERPO');
    const responses: ResponseInput[] = definition.questions.map((question) => {
      if (question.domain !== 'CUERPO' || !question.scoreable) {
        return { questionId: question.id, status: 'SKIPPED_BY_USER', rawValue: null };
      }
      const value = question.id === 'AUD-CUE-01' ? 1 : 5;
      return { questionId: question.id, status: 'ANSWERED', rawValue: value };
    });
    const dimensions = scoreDimensions(definition, responses);
    const domains = scoreDomains(definition, dimensions);
    const cuerpo = domains.find((item) => item.key === 'CUERPO');
    const used = dimensions.filter(
      (item) => item.domain === 'CUERPO' && item.score != null,
    );
    const expected =
      used.reduce((sum, item) => sum + (item.score as number), 0) / used.length;
    expect(cuerpo?.score).toBeCloseTo(expected, 6);
    expect(used.length).toBe(cueDimensions.filter((item) =>
      definition.questions.some((q) => q.dimension === item.key && q.scoreable),
    ).length);
  });
});
