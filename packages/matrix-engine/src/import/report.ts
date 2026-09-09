import type {
  ImportReport,
  MatrixDefinition,
  ValidationIssue,
} from '../types';

export function buildImportReport(
  definition: MatrixDefinition,
  issues: ValidationIssue[],
  engineSemver: string,
): ImportReport {
  const errors = issues.filter((issue) => issue.severity === 'ERROR');
  const warnings = issues.filter((issue) => issue.severity === 'WARNING');
  const domains: Record<string, number> = {};
  for (const question of definition.questions) {
    domains[question.domain] = (domains[question.domain] ?? 0) + 1;
  }

  return {
    definition_ref: definition.definition_ref,
    definition_sha256: definition.definition_sha256,
    source: definition.source.file,
    source_sha256: definition.source.sha256,
    engine: `@mk/matrix-engine ${engineSemver}`,
    counts: {
      questions: definition.questions.length,
      questions_active: definition.questions.filter((q) => q.active).length,
      estado_weighted: definition.questions.filter(
        (q) => q.variable_kind === 'ESTADO' && q.weight > 0,
      ).length,
      scoreable: definition.questions.filter((q) => q.scoreable).length,
      risks: definition.risks.length,
      inverse: definition.questions.filter((q) => q.inverse).length,
      domains,
      dimensions_raw: rawDimensionCount(definition),
      dimensions_canonical: definition.dimensions.length,
      scales: definition.scales.length,
      rules: definition.rules.length,
      plans: definition.plans.length,
      objectives: definition.objectives.length,
      activities: definition.activities.length,
      metrics: definition.metrics.length,
    },
    errors,
    warnings,
    publishable: errors.length === 0,
  };
}

function rawDimensionCount(definition: MatrixDefinition): number {
  const labels = new Set<string>();
  for (const dimension of definition.dimensions) {
    for (const label of dimension.labels) labels.add(label);
  }
  return labels.size;
}

export function formatReport(report: ImportReport): string {
  const domainSummary = Object.entries(report.counts.domains)
    .map(([key, count]) => `${key} ${count}`)
    .join('  ');
  const warningLines = report.warnings
    .map((warning) => {
      const ids = warning.ids?.length ? `: ${warning.ids.join(', ')}` : '';
      return `  ${warning.code}  ${warning.message}${ids}`;
    })
    .join('\n');
  const errorLines = report.errors
    .map((error) => {
      const ids = error.ids?.length ? `: ${error.ids.join(', ')}` : '';
      return `  ${error.code}  ${error.message}${ids}`;
    })
    .join('\n');

  return [
    'MATRIX IMPORT REPORT',
    `definition_ref     ${report.definition_ref}`,
    `definition_sha256  ${report.definition_sha256}`,
    `source             ${report.source}`,
    `source_sha256      ${report.source_sha256}`,
    `engine             ${report.engine}`,
    '',
    'COUNTS',
    `questions          ${report.counts.questions}   (ids unicos, ${report.counts.questions_active} activas)`,
    `scoreable          ${report.counts.estado_weighted}   ESTADO con ponderacion > 0`,
    `normalizable       ${report.counts.scoreable}   (${report.counts.estado_weighted - report.counts.scoreable} sin regla de escala)`,
    `risks              ${report.counts.risks}`,
    `inverse            ${report.counts.inverse}`,
    `domains            ${Object.keys(report.counts.domains).length}   ${domainSummary}`,
    `dimensions         ${report.counts.dimensions_raw}   (${report.counts.dimensions_canonical} canonicas despues de alias)`,
    `scales             ${report.counts.scales}`,
    `rules              ${report.counts.rules}`,
    `plans              ${report.counts.plans}`,
    `objectives         ${report.counts.objectives}`,
    `activities         ${report.counts.activities}`,
    `metrics            ${report.counts.metrics}`,
    '',
    `ERRORS   ${report.errors.length}`,
    errorLines,
    '',
    `WARNINGS ${report.warnings.length}`,
    warningLines,
    '',
    `INTERPRETATIONS ACTIVE  ${20}`,
    `PUBLISHABLE  ${report.publishable ? 'yes' : 'no'}`,
  ]
    .filter((line) => line !== undefined)
    .join('\n');
}
