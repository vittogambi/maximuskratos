import type { MatrixDefinition, ResponseInput } from '../types';

export type CoverageClass = 'NO_CLASIFICADO' | 'PROVISIONAL' | 'INTERPRETABLE';

export interface CoverageResult {
  domain: string;
  answered: number;
  served: number;
  scoreable_active: number;
  coverage_definition: number;
  coverage_served: number | null;
  classification: CoverageClass;
}

export function classifyCoverage(
  ratio: number,
  insufficientBelow: number,
  provisionalBelow: number,
): CoverageClass {
  if (ratio < insufficientBelow) return 'NO_CLASIFICADO';
  if (ratio < provisionalBelow) return 'PROVISIONAL';
  return 'INTERPRETABLE';
}

export function gateDomainScore(
  score: number | null,
  classification: CoverageClass,
): number | null {
  return classification === 'NO_CLASIFICADO' ? null : score;
}

export function computeDimensionCoverage(
  definition: MatrixDefinition,
  responses: ResponseInput[],
  dimensionKey: string,
): { answered: number; scoreable_active: number; coverage: number } {
  const byId = new Map(responses.map((response) => [response.questionId, response]));
  const items = definition.questions.filter(
    (question) =>
      question.dimension === dimensionKey && question.active && question.scoreable,
  );
  const answered = items.filter(
    (question) => byId.get(question.id)?.status === 'ANSWERED',
  ).length;
  return {
    answered,
    scoreable_active: items.length,
    coverage: items.length === 0 ? 0 : answered / items.length,
  };
}

export function computeCoverage(
  definition: MatrixDefinition,
  responses: ResponseInput[],
  domainKey: string,
): CoverageResult {
  const byId = new Map(responses.map((response) => [response.questionId, response]));
  const items = definition.questions.filter(
    (question) =>
      question.domain === domainKey && question.active && question.scoreable,
  );
  let answered = 0;
  let served = 0;
  for (const question of items) {
    const response = byId.get(question.id);
    const status = response?.status ?? 'SKIPPED_BY_USER';
    if (status !== 'NOT_SERVED_BY_POLICY') served += 1;
    if (status === 'ANSWERED') answered += 1;
  }
  const coverageDefinition = items.length === 0 ? 0 : answered / items.length;
  const coverageServed = served === 0 ? null : answered / served;
  return {
    domain: domainKey,
    answered,
    served,
    scoreable_active: items.length,
    coverage_definition: coverageDefinition,
    coverage_served: coverageServed,
    classification: classifyCoverage(
      coverageDefinition,
      definition.coverage_bands.insufficient_below,
      definition.coverage_bands.provisional_below,
    ),
  };
}
