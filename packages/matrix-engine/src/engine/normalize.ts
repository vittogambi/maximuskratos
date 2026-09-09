import type {
  QuestionDefinition,
  ResponseInput,
  ScaleDefinition,
} from '../types';

export interface NormalizeResult {
  score: number | null;
  reason?: string;
}

export function formulaScore01(raw: number): number {
  return ((raw - 1) / 4) * 100;
}

export function normalizeItem(
  question: QuestionDefinition,
  scale: ScaleDefinition | undefined,
  response: ResponseInput,
): NormalizeResult {
  if (response.status !== 'ANSWERED') {
    return { score: null, reason: response.status };
  }
  if (question.variable_kind !== 'ESTADO' || question.weight <= 0) {
    return { score: null, reason: 'NOT_SCOREABLE' };
  }
  if (!question.scoreable || !scale?.scoreable) {
    return {
      score: null,
      reason: question.unscoreable_reason ?? 'SCALE_HAS_NO_SCORE_MAP',
    };
  }

  const raw = response.rawValue;
  const numeric = typeof raw === 'number' ? raw : Number(raw);
  const anchor = scale.anchors.find((item) => item.value === numeric);
  if (!anchor || anchor.score == null) {
    return { score: null, reason: 'INVALID' };
  }

  const direct = anchor.score;
  const score = question.inverse ? 100 - direct : direct;
  return { score };
}
