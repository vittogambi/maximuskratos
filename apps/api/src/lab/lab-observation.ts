export const WORDING_CODES = [
  'WORDING_OK',
  'WORDING_UNCLEAR',
  'WORDING_AMBIGUOUS',
  'WORDING_DOUBLE',
  'WORDING_UNNATURAL',
  'WORDING_OTHER',
] as const;

export const SCALE_CODES = [
  'SCALE_OK',
  'SCALE_MISMATCH',
  'SCALE_MISSING_OPTIONS',
  'SCALE_BAD_ANCHORS',
  'SCALE_NOT_REALITY',
  'SCALE_OTHER',
] as const;

export const SCORE_CODES = [
  'SCORE_OK',
  'SCORE_HIGHER',
  'SCORE_LOWER',
  'SCORE_INVERSE',
  'SCORE_NONE',
  'SCORE_UNSURE',
] as const;

export const DOMAIN_CODES = ['DOMAIN_OK', 'DOMAIN_OTHER'] as const;
export const DIMENSION_CODES = ['DIMENSION_OK', 'DIMENSION_OTHER'] as const;
export const WEIGHT_CODES = ['WEIGHT_OK', 'WEIGHT_MORE', 'WEIGHT_LESS', 'WEIGHT_EXCLUDE'] as const;
export const SAFETY_CODES = [
  'SAFETY_OK',
  'SAFETY_FALSE_POSITIVE',
  'SAFETY_FALSE_NEGATIVE',
  'SAFETY_SEVERITY',
  'SAFETY_UNSURE',
] as const;

export const OBSERVATION_CODES = [
  ...WORDING_CODES,
  ...SCALE_CODES,
  ...SCORE_CODES,
  ...DOMAIN_CODES,
  ...DIMENSION_CODES,
  ...WEIGHT_CODES,
  ...SAFETY_CODES,
] as const;

export type ObservationCode = (typeof OBSERVATION_CODES)[number];

export type ObservationAspects = {
  wording?: string | null;
  scale?: string | null;
  score?: string | null;
  domain?: string | null;
  domain_other?: string | null;
  dimension?: string | null;
  dimension_other?: string | null;
  weight?: string | null;
  safety?: string | null;
};

export type SuggestedOperation =
  | { op: 'SET_QUESTION_WEIGHT'; question_id: string; to: number }
  | { op: 'SET_QUESTION_ACTIVE'; question_id: string; to: false }
  | { op: 'SET_DIMENSION_ALIAS'; label: string; to: string }
  | null;

const OK = new Set([
  'WORDING_OK',
  'SCALE_OK',
  'SCORE_OK',
  'DOMAIN_OK',
  'DIMENSION_OK',
  'WEIGHT_OK',
  'SAFETY_OK',
]);

const ALLOWED: Record<keyof Omit<ObservationAspects, 'domain_other' | 'dimension_other'>, readonly string[]> = {
  wording: WORDING_CODES,
  scale: SCALE_CODES,
  score: SCORE_CODES,
  domain: DOMAIN_CODES,
  dimension: DIMENSION_CODES,
  weight: WEIGHT_CODES,
  safety: SAFETY_CODES,
};

export function validateAspects(aspects: ObservationAspects): string | null {
  for (const [key, allowed] of Object.entries(ALLOWED)) {
    const value = aspects[key as keyof typeof ALLOWED];
    if (value == null || value === '') continue;
    if (!allowed.includes(value)) return `Código no válido: ${value}`;
  }
  return null;
}

export function aspectCodes(aspects: ObservationAspects): string[] {
  return Object.entries(aspects)
    .filter(([key, value]) => value && key !== 'domain_other' && key !== 'dimension_other')
    .map(([, value]) => String(value));
}

export function hasNonOkAspect(aspects: ObservationAspects): boolean {
  return aspectCodes(aspects).some((code) => !OK.has(code));
}

export function classifyObservation(
  aspects: ObservationAspects,
  context: { question_id: string; alias_from?: string[] } = { question_id: '' },
): {
  kind: 'CONTENT' | 'ENGINE';
  content: boolean;
  engine_testable: boolean;
  suggested_operation: SuggestedOperation;
  issue_types: string[];
} {
  const issue_types = aspectCodes(aspects);
  const content =
    isNonOk(aspects.wording) ||
    isNonOk(aspects.scale) ||
    isNonOk(aspects.score) ||
    aspects.domain === 'DOMAIN_OTHER' ||
    isNonOk(aspects.safety);
  const aliasFrom = context.alias_from?.[0] ?? null;
  const aliasOk = aspects.dimension === 'DIMENSION_OTHER' && Boolean(aspects.dimension_other) && Boolean(aliasFrom);
  const suggested_operation = suggestedOperation(aspects, context.question_id, aliasFrom);
  const engine_testable = suggested_operation != null;
  return {
    kind: engine_testable ? 'ENGINE' : 'CONTENT',
    content,
    engine_testable,
    suggested_operation,
    issue_types,
  };
}

function isNonOk(value: string | null | undefined): boolean {
  return Boolean(value) && !OK.has(value as string);
}

function suggestedOperation(
  aspects: ObservationAspects,
  questionId: string,
  aliasFrom: string | null,
): SuggestedOperation {
  if (aspects.weight === 'WEIGHT_MORE') {
    return { op: 'SET_QUESTION_WEIGHT', question_id: questionId, to: 2 };
  }
  if (aspects.weight === 'WEIGHT_LESS') {
    return { op: 'SET_QUESTION_WEIGHT', question_id: questionId, to: 0.5 };
  }
  if (aspects.weight === 'WEIGHT_EXCLUDE') {
    return { op: 'SET_QUESTION_ACTIVE', question_id: questionId, to: false };
  }
  if (aliasFrom && aspects.dimension === 'DIMENSION_OTHER' && aspects.dimension_other) {
    return { op: 'SET_DIMENSION_ALIAS', label: aliasFrom, to: aspects.dimension_other };
  }
  return null;
}

export const ASPECT_LABEL: Record<string, string> = {
  wording: 'Redacción',
  scale: 'Respuestas y escala',
  score: 'Interpretación numérica',
  domain: 'Ámbito',
  dimension: 'Dimensión',
  weight: 'Peso',
  safety: 'Alertas',
};

export const FIDELITY_VERDICTS = [
  'FIDELITY_YES',
  'FIDELITY_YES_BUT',
  'FIDELITY_NO',
  'FIDELITY_PREFER_ORIGINAL',
  'FIDELITY_UNSURE',
] as const;

export const FIDELITY_TARGETS = [
  'Redacción',
  'Escala',
  'Ámbito',
  'Dimensión',
  'Tipo de variable',
  'Alertas',
  'Peso',
  'Otra cosa',
] as const;

export type ObservationFidelity = {
  verdict: string;
  change_targets?: string[];
  intended_measure?: string | null;
};

export function validateFidelity(fidelity: ObservationFidelity | null | undefined): string | null {
  if (!fidelity) return null;
  if (!FIDELITY_VERDICTS.includes(fidelity.verdict as (typeof FIDELITY_VERDICTS)[number])) {
    return `Código no válido: ${fidelity.verdict}`;
  }
  if (fidelity.verdict !== 'FIDELITY_YES' && !(fidelity.intended_measure ?? '').trim()) {
    return 'Explica qué debería medir esta pregunta.';
  }
  return null;
}

export function aspectCounts(rows: ObservationAspects[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const row of rows) {
    for (const key of Object.keys(ASPECT_LABEL)) {
      const value = row[key as keyof ObservationAspects];
      if (value && !OK.has(String(value))) {
        counts[key] = (counts[key] ?? 0) + 1;
      }
    }
  }
  return counts;
}
