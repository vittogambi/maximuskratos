import {
  classifyCoverage,
  computeCoverage,
  type MatrixDefinition,
  type ResponseInput,
} from '@mk/matrix-engine';

const PLANNED = ['MENTALIDAD', 'RELACIONES', 'FINANZAS', 'CUERPO'] as const;

export function evidenceLabel(classification: string): string {
  if (classification === 'INTERPRETABLE') return 'Suficiente';
  if (classification === 'PROVISIONAL') return 'Provisional';
  return 'Insuficiente';
}

export function otherNotesVisible(status: string): boolean {
  return status === 'REVEALED';
}

export function buildEvidenceSummary(
  definition: MatrixDefinition,
  responses: ResponseInput[],
  options: { revealed?: boolean } = {},
) {
  const revealed = options.revealed ?? true;
  const bands = definition.coverage_bands;
  const domains = PLANNED.map((key) => {
    const coverage = computeCoverage(definition, responses, key);
    return {
      key,
      answered: coverage.answered,
      scoreable: coverage.scoreable_active,
      coverage: coverage.coverage_definition,
      ...(revealed
        ? {
            classification: coverage.classification,
            evidence_state: evidenceLabel(coverage.classification),
          }
        : {}),
    };
  });
  const purposeItems = definition.questions.filter(
    (question) =>
      (question.domain === 'PROPÓSITO' || question.domain === 'PURPOSE' || question.domain === 'PROPOSITO') &&
      question.active,
  );
  const byId = new Map(responses.map((row) => [row.questionId, row]));
  const purposeAnswered = purposeItems.filter((question) => byId.get(question.id)?.status === 'ANSWERED').length;
  const answered = responses.filter((row) => row.status === 'ANSWERED').length;
  const served = responses.filter((row) => row.status !== 'NOT_SERVED_BY_POLICY').length;
  return {
    domains,
    purpose: {
      answered: purposeAnswered,
      total: purposeItems.length,
    },
    total: { answered, served },
    bands: {
      insufficient_below: bands.insufficient_below,
      provisional_below: bands.provisional_below,
      rule_ids: bands.rule_ids,
    },
  };
}

export function classifyRatio(ratio: number, insufficientBelow: number, provisionalBelow: number) {
  return classifyCoverage(ratio, insufficientBelow, provisionalBelow);
}
