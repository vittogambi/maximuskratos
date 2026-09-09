import { resolve } from 'node:path';
import { beforeAll, describe, expect, it } from 'vitest';
import {
  computeCoverage,
  gateDomainScore,
} from '../src/engine/coverage';
import { assignState } from '../src/engine/state';
import { importMatrix } from '../src/import/xlsx-importer';
import type { MatrixDefinition, ResponseInput } from '../src/types';

const XLSX = resolve(__dirname, '../../../MATRIZ_MAESTRA_MK_v2_FOCO.xlsx');
let definition: MatrixDefinition;

beforeAll(async () => {
  definition = (
    await importMatrix({ xlsxPath: XLSX, definitionId: 'matrix-v2.0' })
  ).definition;
});

function answerFirst(domain: string, count: number): ResponseInput[] {
  const items = definition.questions.filter(
    (question) => question.domain === domain && question.scoreable && question.active,
  );
  return items.map((question, index) => ({
    questionId: question.id,
    status: index < count ? 'ANSWERED' : 'SKIPPED_BY_USER',
    rawValue: index < count ? 4 : null,
  })) as ResponseInput[];
}

describe('P0-03 coverage and state', () => {
  it('assigns state on half-up integer borders', () => {
    const bands = definition.state_bands;
    expect(assignState(39.4, bands)).toMatchObject({ state: 'CONTENCIÓN', scoreDisplay: 39 });
    expect(assignState(39.5, bands)).toMatchObject({ state: 'ESTABILIZACIÓN', scoreDisplay: 40 });
    expect(assignState(39.49, bands)).toMatchObject({ state: 'CONTENCIÓN', scoreDisplay: 39 });
    expect(assignState(59.5, bands)).toMatchObject({ state: 'CONSOLIDACIÓN', scoreDisplay: 60 });
    expect(assignState(79.5, bands)).toMatchObject({ state: 'EXPANSIÓN', scoreDisplay: 80 });
    expect(assignState(0, bands)).toMatchObject({ state: 'CONTENCIÓN' });
    expect(assignState(100, bands)).toMatchObject({ state: 'EXPANSIÓN' });
  });

  it('INV-08: ratio below 0.60 does not classify', () => {
    const items = definition.questions.filter(
      (question) => question.domain === 'MENTALIDAD' && question.scoreable,
    );
    expect(items.length).toBe(24);
    const coverage = computeCoverage(definition, answerFirst('MENTALIDAD', 14), 'MENTALIDAD');
    expect(coverage.coverage_definition).toBeCloseTo(14 / 24, 6);
    expect(coverage.classification).toBe('NO_CLASIFICADO');
    expect(gateDomainScore(50, coverage.classification)).toBeNull();

    const atSixty = computeCoverage(definition, answerFirst('MENTALIDAD', 15), 'MENTALIDAD');
    expect(atSixty.coverage_definition).toBeCloseTo(15 / 24, 6);
    expect(atSixty.classification).toBe('PROVISIONAL');
    expect(gateDomainScore(50, atSixty.classification)).toBe(50);
  });

  it('compares the exact ratio, not a rounded percent', () => {
    const almost = computeCoverage(definition, answerFirst('MENTALIDAD', 14), 'MENTALIDAD');
    expect(almost.coverage_definition).toBeLessThan(0.6);
    expect(almost.classification).toBe('NO_CLASIFICADO');
  });

  it('INV-15: policy does not change coverage_definition', () => {
    const items = definition.questions.filter(
      (question) => question.domain === 'MENTALIDAD' && question.scoreable,
    );
    const full: ResponseInput[] = items.map((question, index) => ({
      questionId: question.id,
      status: index < 4 ? 'ANSWERED' : 'SKIPPED_BY_USER',
      rawValue: index < 4 ? 3 : null,
    }));
    const custom: ResponseInput[] = items.map((question, index) => ({
      questionId: question.id,
      status: index < 4 ? 'ANSWERED' : 'NOT_SERVED_BY_POLICY',
      rawValue: index < 4 ? 3 : null,
    }));
    const a = computeCoverage(definition, full, 'MENTALIDAD');
    const b = computeCoverage(definition, custom, 'MENTALIDAD');
    expect(a.coverage_definition).toBe(b.coverage_definition);
    expect(a.coverage_served).not.toBe(b.coverage_served);
    expect(b.coverage_served).toBe(1);
  });

  it('INV-07: inactive items leave numerator and denominator', () => {
    const dimension = definition.dimensions.find((item) => item.key === 'MEN.foco_y_ejecucion');
    const items = definition.questions.filter(
      (question) => question.dimension === dimension?.key && question.scoreable,
    );
    expect(items.length).toBe(6);
    const clone: MatrixDefinition = {
      ...definition,
      questions: definition.questions.map((question) =>
        items.some((item) => item.id === question.id)
          ? { ...question, active: false }
          : question,
      ),
    };
    const responses: ResponseInput[] = items.map((question) => ({
      questionId: question.id,
      status: 'ANSWERED',
      rawValue: 5,
    }));
    const coverage = computeCoverage(clone, responses, 'MENTALIDAD');
    const original = computeCoverage(definition, responses, 'MENTALIDAD');
    expect(coverage.scoreable_active).toBe(original.scoreable_active - 6);
    expect(coverage.answered).toBe(0);
  });
});
