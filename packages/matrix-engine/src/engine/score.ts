import type { MatrixDefinition, ResponseInput } from '../types';
import { normalizeItem } from './normalize';

export interface DimensionScore {
  key: string;
  domain: string;
  score: number | null;
  items_scored: number;
  items_scoreable: number;
  inverse: boolean;
}

export interface DomainScore {
  key: string;
  score: number | null;
  dimensions_used: number;
}

export function scoreDimensions(
  definition: MatrixDefinition,
  responses: ResponseInput[],
): DimensionScore[] {
  const byId = new Map(responses.map((response) => [response.questionId, response]));
  const scaleById = new Map(definition.scales.map((scale) => [scale.id, scale]));

  return definition.dimensions.map((dimension) => {
    const items = definition.questions.filter(
      (question) => question.dimension === dimension.key && question.active,
    );
    const scoreable = items.filter((question) => question.scoreable);
    let weighted = 0;
    let weights = 0;
    let itemsScored = 0;
    for (const question of scoreable) {
      const response = byId.get(question.id);
      if (!response) continue;
      const normalized = normalizeItem(
        question,
        scaleById.get(question.scale_id),
        response,
      );
      if (normalized.score == null) continue;
      weighted += normalized.score * question.weight;
      weights += question.weight;
      itemsScored += 1;
    }
    return {
      key: dimension.key,
      domain: dimension.domain,
      score: weights > 0 ? weighted / weights : null,
      items_scored: itemsScored,
      items_scoreable: scoreable.length,
      inverse: dimension.inverse,
    };
  });
}

export function itemWeightedDomainScore(
  definition: MatrixDefinition,
  responses: ResponseInput[],
  domainKey: string,
): number | null {
  const byId = new Map(responses.map((response) => [response.questionId, response]));
  const scaleById = new Map(definition.scales.map((scale) => [scale.id, scale]));
  let weighted = 0;
  let weights = 0;
  for (const question of definition.questions) {
    if (question.domain !== domainKey || !question.active || !question.scoreable) {
      continue;
    }
    const response = byId.get(question.id);
    if (!response) continue;
    const normalized = normalizeItem(
      question,
      scaleById.get(question.scale_id),
      response,
    );
    if (normalized.score == null) continue;
    weighted += normalized.score * question.weight;
    weights += question.weight;
  }
  return weights > 0 ? weighted / weights : null;
}

export function scoreDomains(
  definition: MatrixDefinition,
  dimensions: DimensionScore[],
): DomainScore[] {
  return definition.domains
    .filter((domain) => domain.key !== 'PROPÓSITO' && domain.key !== 'PROPOSITO')
    .map((domain) => {
      const used = dimensions.filter(
        (dimension) => dimension.domain === domain.key && dimension.score != null,
      );
      const score =
        used.length === 0
          ? null
          : used.reduce((sum, dimension) => sum + (dimension.score as number), 0) /
            used.length;
      return {
        key: domain.key,
        score,
        dimensions_used: used.length,
      };
    });
}
