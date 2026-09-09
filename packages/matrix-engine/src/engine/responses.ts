import type {
  MatrixDefinition,
  PolicyDefinition,
  QuestionDefinition,
  ResponseInput,
  ResponseStatus,
  ScaleDefinition,
} from '../types';
import { expandChoiceAnchors } from './choice-anchors';
import { resolveServedQuestionIds } from '../policy/resolve-served';

function rawNumber(raw: number | string | null): number | null {
  if (typeof raw === 'number' && Number.isFinite(raw)) return raw;
  if (typeof raw === 'string' && raw.trim() !== '') {
    const parsed = Number(raw.trim().replace(',', '.'));
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function isValidValue(
  question: QuestionDefinition,
  scale: ScaleDefinition | undefined,
  raw: number | string | null,
): boolean {
  if (raw == null) return false;
  if (!scale) return raw !== '';
  if (scale.kind === 'TEXT') return String(raw).length > 0;
  if (scale.kind === 'NUMBER') {
    const numeric = rawNumber(raw);
    if (scale.id === 'SLEEP_HOURS') return numeric != null && numeric >= 0 && numeric <= 24;
    if (numeric != null) return true;
    return question.response_kind === 'NUMBER_MULTI' && String(raw).trim() !== '';
  }
  const anchors = expandChoiceAnchors(scale);
  if (anchors.length === 0) return raw !== '';
  const numeric = rawNumber(raw);
  return anchors.some(
    (anchor) =>
      anchor.value === raw || (numeric != null && anchor.value === numeric),
  );
}

export function classifyResponses(
  definition: MatrixDefinition,
  responses: ResponseInput[],
  policy: PolicyDefinition,
): { classified: ResponseInput[]; invalidIds: string[] } {
  const served = resolveServedQuestionIds(definition, policy, responses);
  const incoming = new Map(responses.map((response) => [response.questionId, response]));
  const scaleById = new Map(definition.scales.map((scale) => [scale.id, scale]));
  const classified: ResponseInput[] = [];
  const invalidIds: string[] = [];

  for (const question of definition.questions) {
    const provided = incoming.get(question.id);
    if (!served.has(question.id)) {
      classified.push({
        questionId: question.id,
        status: 'NOT_SERVED_BY_POLICY',
        rawValue: provided?.rawValue ?? null,
        qualitativeConfirmed: provided?.qualitativeConfirmed ?? null,
      });
      continue;
    }

    const status: ResponseStatus = provided?.status ?? 'SKIPPED_BY_USER';
    const rawValue = provided?.rawValue ?? null;
    const qualitativeConfirmed = provided?.qualitativeConfirmed ?? null;
    if (status === 'ANSWERED') {
      const valid = isValidValue(question, scaleById.get(question.scale_id), rawValue);
      if (!valid) {
        invalidIds.push(question.id);
        classified.push({
          questionId: question.id,
          status: 'INVALID',
          rawValue,
          qualitativeConfirmed,
        });
        continue;
      }
    }
    classified.push({
      questionId: question.id,
      status,
      rawValue,
      qualitativeConfirmed,
    });
  }

  return { classified, invalidIds };
}

export function responseById(
  responses: ResponseInput[],
): Map<string, ResponseInput> {
  return new Map(responses.map((response) => [response.questionId, response]));
}
