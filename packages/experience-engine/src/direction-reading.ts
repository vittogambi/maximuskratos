import type { MatrixDefinition, ResponseInput } from '@mk/matrix-engine';

export const DIRECTION_METHODOLOGY_VERSION = '0.1';

export const PURPOSE_MODULE_KEYS = [
  'ORIGEN',
  'VISIÓN',
  'VALORES',
  'ESTÁNDARES',
  'IDENTIDAD',
  'INTERFERENCIA',
  'INTEGRACIÓN',
  'TENDENCIAS',
  'HIPÓTESIS',
  'CONTRASTE',
  'HUELLA',
] as const;

export type PurposeModuleKey = (typeof PURPOSE_MODULE_KEYS)[number];

export type DirectionSignalCoverage = 'NO_SIGNAL' | 'PARTIAL_SIGNAL' | 'SIGNAL_AVAILABLE';

export type DirectionBasis = 'explicit' | 'reviewed_synthesis' | 'undetermined';

export type DirectionEvidence = {
  question_id: string;
  module: PurposeModuleKey | null;
  original_text: string;
  definition_ref: string;
};

export type DirectionReviewedSynthesis = {
  stage: string | null;
  notes: string | null;
  evidence_ids: string[];
  confidence: string | null;
};

export type DirectionReading = {
  methodology_version: typeof DIRECTION_METHODOLOGY_VERSION;
  signal_coverage: DirectionSignalCoverage;
  evidence: DirectionEvidence[];
  by_module: Array<{
    key: PurposeModuleKey;
    name: string;
    evidence: DirectionEvidence[];
  }>;
  declared: { text: string | null; evidence_ids: string[]; basis: DirectionBasis };
  reviewed_synthesis: DirectionReviewedSynthesis | null;
  basis: DirectionBasis;
  provenance: {
    definition_ref: string;
    methodology_version: typeof DIRECTION_METHODOLOGY_VERSION;
  };
  used_now: string;
  used_later: string;
  does_not_modify: string;
};

const CORE_MODULES: PurposeModuleKey[] = ['VISIÓN', 'VALORES', 'ESTÁNDARES', 'IDENTIDAD'];

const PURPOSE_DOMAINS = new Set(['PROPÓSITO', 'PURPOSE', 'PROPOSITO']);

export function isPurposeDomain(domain: string | null | undefined): boolean {
  return Boolean(domain && PURPOSE_DOMAINS.has(domain));
}

export function purposeModuleKey(question: { id: string; dimension: string }): PurposeModuleKey | null {
  const dim = question.dimension.toLowerCase();
  if (dim.includes('historia') || dim.includes('linaje')) return 'ORIGEN';
  if (dim.includes('vision')) return 'VISIÓN';
  if (dim.includes('valor') && !dim.includes('economico')) return 'VALORES';
  if (dim.includes('estandar')) return 'ESTÁNDARES';
  if (dim.includes('identidad')) return 'IDENTIDAD';
  if (dim.includes('interferencia')) return 'INTERFERENCIA';
  if (dim.includes('integracion')) return 'INTEGRACIÓN';
  if (dim.includes('tendencia')) return 'TENDENCIAS';
  if (dim.includes('ikigai')) return 'HIPÓTESIS';
  if (dim.includes('hipotesis')) return 'CONTRASTE';
  if (dim.includes('huella')) return 'HUELLA';
  return null;
}

function answerLabel(definition: MatrixDefinition, questionId: string, raw: unknown): string {
  if (raw == null || raw === '') return '';
  if (typeof raw === 'string') return raw;
  const question = definition.questions.find((item) => item.id === questionId);
  const scale = question ? definition.scales.find((item) => item.id === question.scale_id) : null;
  const anchor = scale?.anchors.find((item) => item.value != null && String(item.value) === String(raw));
  return anchor?.label ?? String(raw);
}

export function buildDirectionReading(input: {
  definition: MatrixDefinition;
  responses: ResponseInput[];
  reviewed?: DirectionReviewedSynthesis | null;
}): DirectionReading {
  const definitionRef = input.definition.definition_ref;
  const byId = new Map(input.responses.map((row) => [row.questionId, row]));
  const evidence: DirectionEvidence[] = [];

  for (const question of input.definition.questions) {
    if (!isPurposeDomain(question.domain) || !question.active) continue;
    const response = byId.get(question.id);
    if (!response || response.status !== 'ANSWERED') continue;
    const original = answerLabel(input.definition, question.id, response.rawValue);
    if (!original.trim()) continue;
    evidence.push({
      question_id: question.id,
      module: purposeModuleKey(question),
      original_text: original,
      definition_ref: definitionRef,
    });
  }

  const by_module = PURPOSE_MODULE_KEYS.map((key) => {
    const meta = input.definition.purpose_modules.find((item) => item.key === key);
    return {
      key,
      name: meta?.name ?? key,
      evidence: evidence.filter((item) => item.module === key),
    };
  }).filter((item) => item.evidence.length > 0);

  const coreHit = CORE_MODULES.some((key) => by_module.some((item) => item.key === key && item.evidence.length > 0));
  const signal_coverage: DirectionSignalCoverage =
    evidence.length === 0 ? 'NO_SIGNAL' : coreHit ? 'SIGNAL_AVAILABLE' : 'PARTIAL_SIGNAL';

  const declaredBits = evidence.filter(
    (item) => item.module === 'VISIÓN' || item.module === 'HUELLA' || item.module === 'VALORES',
  );
  const declaredText = declaredBits.map((item) => item.original_text).join('\n') || null;

  const reviewed = input.reviewed?.stage || input.reviewed?.notes ? input.reviewed : null;
  const basis: DirectionBasis = reviewed
    ? 'reviewed_synthesis'
    : declaredText
      ? 'explicit'
      : evidence.length
        ? 'explicit'
        : 'undetermined';

  return {
    methodology_version: DIRECTION_METHODOLOGY_VERSION,
    signal_coverage,
    evidence,
    by_module,
    declared: {
      text: declaredText,
      evidence_ids: declaredBits.map((item) => item.question_id),
      basis: declaredText ? 'explicit' : 'undetermined',
    },
    reviewed_synthesis: reviewed,
    basis,
    provenance: {
      definition_ref: definitionRef,
      methodology_version: DIRECTION_METHODOLOGY_VERSION,
    },
    used_now: 'Revisión metodológica en Lab.',
    used_later: 'Motor de Intervención.',
    does_not_modify: 'puntaje, estado, cobertura diagnóstica, alertas ni ámbito prioritario',
  };
}

export function directionEvidenceFingerprint(reading: DirectionReading): string {
  return reading.evidence
    .map((item) => `${item.question_id}:${item.original_text}`)
    .sort()
    .join('|');
}
