import {
  indexTrace,
  type MatrixDefinition,
  type ResponseInput,
  type ResultSnapshot,
} from '@mk/matrix-engine';

const PLANNED = ['MENTALIDAD', 'RELACIONES', 'FINANZAS', 'CUERPO'] as const;

export type LabItemTrace = {
  question_id: string;
  text: string;
  domain: string;
  dimension: string;
  dimension_label: string;
  raw_value: unknown;
  answer_label: string | null;
  answer_ordinal: string | null;
  scoreable: boolean;
  normalized_score: number | null;
  normalize_rule_id: string | null;
  excluded_reason: 'SKIPPED_BY_USER' | 'NOT_SCOREABLE' | 'INVALID' | 'NO_SCALE_MAP' | null;
  weight: number;
  dimension_items_scored: number;
  dimension_items_scoreable: number;
  share_in_dimension: number | null;
  contribution_to_dimension: number | null;
  dimension_score: number | null;
  dimension_weight_in_domain: number;
  contribution_to_domain: number | null;
  domain_score: number | null;
  domain_score_display: number | null;
  domain_state_from_band: string | null;
  domain_state_final: string | null;
  domain_state_source: string | null;
  is_risk: boolean;
  alert_fired: boolean;
};

export type LabDomainFormula = {
  dimension_scores: Array<number | null>;
  method: 'DIMENSION_EQUAL';
  result: number | null;
  display: number | null;
};

export type LabCompositionRow = {
  key: string;
  label: string;
  score: number | null;
  items_scoreable: number;
  items_scored: number;
  weight: number;
  contribution: number | null;
};

function excludedReason(
  questionId: string,
  scoreable: boolean,
  status: string | undefined,
  normalizeReason: string | null | undefined,
): LabItemTrace['excluded_reason'] {
  if (questionId === 'D-CUE-07' || normalizeReason === 'SCALE_HAS_NO_SCORE_MAP') return 'NO_SCALE_MAP';
  if (normalizeReason === 'INVALID') return 'INVALID';
  if (normalizeReason === 'NOT_SCOREABLE' || !scoreable) return 'NOT_SCOREABLE';
  if (status && status !== 'ANSWERED') return 'SKIPPED_BY_USER';
  if (normalizeReason === 'SKIPPED_BY_USER' || normalizeReason === 'UNANSWERED') return 'SKIPPED_BY_USER';
  if (normalizeReason) return normalizeReason === 'NOT_SCOREABLE' ? 'NOT_SCOREABLE' : 'SKIPPED_BY_USER';
  return 'SKIPPED_BY_USER';
}

function answerOf(
  definition: MatrixDefinition,
  scaleId: string | undefined,
  raw: unknown,
): { answer_label: string | null; answer_ordinal: string | null } {
  if (raw == null || raw === '' || !scaleId) return { answer_label: null, answer_ordinal: null };
  const scale = definition.scales.find((item) => item.id === scaleId);
  if (!scale) return { answer_label: String(raw), answer_ordinal: null };
  const anchor = scale.anchors.find((item) => item.value != null && String(item.value) === String(raw));
  const ordinal =
    (scale.kind === 'SCALE_5' || String(scale.kind) === 'LIKERT') && typeof raw === 'number'
      ? `${raw} de ${scale.anchors.length}`
      : null;
  return { answer_label: anchor?.label ?? String(raw), answer_ordinal: ordinal };
}

export function buildItemTrace(
  definition: MatrixDefinition,
  snapshot: ResultSnapshot,
  composition: Record<string, LabCompositionRow[]>,
  servedIds: string[],
  responses: ResponseInput[],
): LabItemTrace[] {
  const index = indexTrace(snapshot.trace);
  const byId = new Map(responses.map((row) => [row.questionId, row]));
  const dimensions = new Map(snapshot.dimensions.map((item) => [item.key, item]));
  const domains = new Map(snapshot.domains.map((item) => [item.key, item]));
  const labels = new Map(definition.dimensions.map((item) => [item.key, item.labels[0] ?? item.key]));
  const weightByDimension = new Map<string, number>();
  for (const rows of Object.values(composition)) {
    for (const row of rows) weightByDimension.set(row.key, row.weight);
  }
  const questions = servedIds
    .map((id) => definition.questions.find((item) => item.id === id))
    .filter((item): item is NonNullable<typeof item> =>
      Boolean(
        item &&
          (PLANNED as readonly string[]).includes(item.domain) &&
          (item.scoreable || item.risk || item.id === 'D-CUE-07'),
      ),
    );

  const scoredWeight = new Map<string, number>();
  for (const question of questions) {
    const node = index.get(`normalize:${question.id}`);
    const output = node?.output as { score?: number | null } | undefined;
    if (output?.score == null) continue;
    scoredWeight.set(question.dimension, (scoredWeight.get(question.dimension) ?? 0) + question.weight);
  }

  const fired = new Set(snapshot.safety.alerts.filter((item) => item.fired).map((item) => item.question_id));

  return questions.map((question) => {
    const response = byId.get(question.id);
    const node = index.get(`normalize:${question.id}`);
    const output = (node?.output ?? {}) as { rawValue?: unknown; score?: number | null; reason?: string | null };
    const raw = output.rawValue ?? response?.rawValue ?? null;
    const normalized = output.score ?? null;
    const dimension = dimensions.get(question.dimension);
    const domain = domains.get(question.domain);
    const dimWeightSum = scoredWeight.get(question.dimension) ?? 0;
    const share = normalized == null || dimWeightSum === 0 ? null : question.weight / dimWeightSum;
    const contributionToDimension = normalized == null || share == null ? null : normalized * share;
    const dimensionWeight = weightByDimension.get(question.dimension) ?? 0;
    const contributionToDomain =
      contributionToDimension == null ? null : contributionToDimension * dimensionWeight;
    const excluded =
      normalized == null
        ? excludedReason(question.id, question.scoreable, response?.status, output.reason ?? node?.reason ?? null)
        : null;
    const answer = answerOf(definition, question.scale_id, raw);
    return {
      question_id: question.id,
      text: question.text,
      domain: question.domain,
      dimension: question.dimension,
      dimension_label: labels.get(question.dimension) ?? question.dimension,
      raw_value: raw,
      answer_label: answer.answer_label,
      answer_ordinal: answer.answer_ordinal,
      scoreable: question.scoreable,
      normalized_score: normalized,
      normalize_rule_id: node?.rule_id ?? null,
      excluded_reason: excluded,
      weight: question.weight,
      dimension_items_scored: dimension?.items_scored ?? 0,
      dimension_items_scoreable: dimension?.items_scoreable ?? 0,
      share_in_dimension: share,
      contribution_to_dimension: contributionToDimension,
      dimension_score: dimension?.score ?? null,
      dimension_weight_in_domain: dimensionWeight,
      contribution_to_domain: contributionToDomain,
      domain_score: domain?.score ?? null,
      domain_score_display: domain?.score_display ?? null,
      domain_state_from_band: domain?.state_from_band ?? null,
      domain_state_final: domain?.state_final ?? null,
      domain_state_source: domain?.state_source ?? null,
      is_risk: Boolean(question.risk),
      alert_fired: fired.has(question.id),
    };
  });
}

export function buildStateBands(definition: MatrixDefinition) {
  return definition.state_bands.map((band) => ({
    rule_id: band.rule_id,
    min: band.min,
    max: band.max,
    state: band.state,
  }));
}

export function buildDomainFormula(
  snapshot: ResultSnapshot,
  composition: Record<string, LabCompositionRow[]>,
): Record<string, LabDomainFormula> {
  return Object.fromEntries(
    PLANNED.map((key) => {
      const domain = snapshot.domains.find((item) => item.key === key);
      const rows = composition[key] ?? [];
      return [
        key,
        {
          dimension_scores: rows.map((row) => row.score),
          method: 'DIMENSION_EQUAL' as const,
          result: domain?.score ?? null,
          display: domain?.score_display ?? null,
        },
      ];
    }),
  );
}
