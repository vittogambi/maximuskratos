export const DELIVERY_SECTIONS = [
  'Versión candidata',
  'Casos revisados',
  'Casos propios',
  'Preguntas que están bien',
  'Preguntas a modificar',
  'Preguntas a eliminar',
  'Preguntas a agregar',
  'Puntajes y mapeo',
  'Pesos',
  'Dimensiones',
  'Cobertura',
  'Estados',
  'Alertas',
  'Ámbito prioritario',
  'Planes',
  'Limitaciones',
  'Hallazgos abiertos',
  'Regresiones',
  'Decisión de cierre',
] as const;

type AspectRow = {
  question_id: string;
  text?: string;
  aspects?: Record<string, string | null> | null;
  issue_types?: string[];
  proposed_wording?: string | null;
  proposal?: string | null;
  note?: string | null;
  status?: string;
  case_label?: string | null;
  fidelity?: { verdict?: string } | null;
};

function problemOf(aspects: Record<string, string | null> | null | undefined): string[] {
  return Object.values(aspects ?? {}).filter(
    (value): value is string => Boolean(value) && !String(value).endsWith('_OK'),
  );
}

function hasOnlyOk(aspects: Record<string, string | null> | null | undefined) {
  const codes = Object.entries(aspects ?? {}).filter(([key, value]) => value && key !== 'domain_other' && key !== 'dimension_other');
  return codes.length > 0 && codes.every(([, value]) => String(value).endsWith('_OK'));
}

export function buildDeliverySections(input: {
  candidate_ref: string | null;
  reviewed: Array<{ label: string; verdict: string | null }>;
  own: Array<{ label: string; kind: string }>;
  observations: AspectRow[];
  findings: Array<{ title: string; layer: string; status: string; related_rules?: string[] }>;
  plans?: Array<{ label: string; recommended?: string | null }>;
  regressions: Array<{ case_label: string; impact?: string }>;
  decision: { decision?: string | null } | null;
}) {
  const observations = input.observations;
  const byAspect = (code: string) =>
    observations.filter((row) => Object.values(row.aspects ?? {}).includes(code));
  const section = (title: string, items: unknown[]) => ({
    title,
    items,
    empty: items.length === 0,
  });
  const questionLine = (row: AspectRow) => ({
    question_id: row.question_id,
    text: row.text ?? row.question_id,
    problem: problemOf(row.aspects),
    proposed: row.proposed_wording ?? row.proposal ?? 'Sin propuesta escrita',
    why: row.proposal || row.note || 'Sin propuesta escrita',
    cases: row.case_label,
  });

  return [
    section('Versión candidata', input.candidate_ref ? [{ ref: input.candidate_ref }] : []),
    section('Casos revisados', input.reviewed),
    section('Casos propios', input.own),
    section(
      'Preguntas que están bien',
      observations.filter((row) => row.status === 'RESOLVED' || hasOnlyOk(row.aspects)).map(questionLine),
    ),
    section(
      'Preguntas a modificar',
      observations.filter((row) => problemOf(row.aspects).some((code) => !['WEIGHT_EXCLUDE', 'SCORE_NONE', 'MISSING_QUESTION'].includes(code))).map(questionLine),
    ),
    section(
      'Preguntas a eliminar',
      observations.filter((row) => problemOf(row.aspects).includes('WEIGHT_EXCLUDE') || problemOf(row.aspects).includes('SCORE_NONE')).map(questionLine),
    ),
    section('Preguntas a agregar', [
      ...observations
        .filter(
          (row) =>
            row.issue_types?.includes('MISSING_QUESTION') ||
            problemOf(row.aspects).includes('MISSING_QUESTION') ||
            (row.aspects as { missing?: string } | null)?.missing === 'MISSING_QUESTION',
        )
        .map(questionLine),
      ...input.findings
        .filter((row) => row.layer.includes('QUESTION_MISSING') || row.layer.includes('MISSING'))
        .map((row) => ({ title: row.title })),
    ]),
    section('Puntajes y mapeo', [...byAspect('SCORE_HIGHER'), ...byAspect('SCORE_LOWER'), ...byAspect('SCORE_INVERSE')].map(questionLine)),
    section('Pesos', [...byAspect('WEIGHT_MORE'), ...byAspect('WEIGHT_LESS')].map(questionLine)),
    section('Dimensiones', [...byAspect('DIMENSION_OTHER'), ...byAspect('DOMAIN_OTHER')].map(questionLine)),
    section('Cobertura', input.findings.filter((row) => row.related_rules?.some((id) => id.includes('MISS')) || row.layer.includes('COVERAGE'))),
    section('Estados', input.findings.filter((row) => row.related_rules?.some((id) => id.includes('STATE')) || row.layer.includes('STATE'))),
    section('Alertas', [...byAspect('SAFETY_FALSE_POSITIVE'), ...byAspect('SAFETY_FALSE_NEGATIVE'), ...byAspect('SAFETY_SEVERITY'), ...input.findings.filter((row) => row.layer.includes('SAFETY'))].map((row) => ('question_id' in row ? questionLine(row as AspectRow) : row))),
    section('Ámbito prioritario', input.findings.filter((row) => row.related_rules?.some((id) => id.includes('PRIORITY')) || row.layer.includes('PRIORITY') || row.layer.includes('Ámbito prioritario'))),
    section('Planes', [
      ...(input.plans ?? []),
      ...input.findings.filter((row) => row.layer.includes('PLAN') || row.layer.includes('ROUTE')),
    ]),
    section('Limitaciones', input.findings.filter((row) => row.status === 'KNOWN_LIMITATION')),
    section('Hallazgos abiertos', input.findings.filter((row) => ['OPEN', 'NEEDS_MORE_CASES', 'WORTH_TESTING', 'CHANGE_IN_TEST'].includes(row.status))),
    section('Regresiones', input.regressions.filter((row) => row.impact === 'WORSENS')),
    section('Decisión de cierre', input.decision?.decision ? [input.decision] : []),
    section(
      'Migraciones que no conservan la intención',
      observations
        .filter(
          (row) =>
            row.fidelity?.verdict === 'FIDELITY_NO' || row.fidelity?.verdict === 'FIDELITY_PREFER_ORIGINAL',
        )
        .map(questionLine),
    ),
  ];
}

export function formatDeliveryMarkdown(sections: Array<{ title: string; items: unknown[]; empty: boolean }>) {
  return sections
    .map((section) => {
      const body = section.empty
        ? 'Nada registrado.'
        : section.items.map((item) => `- ${formatDeliveryItem(item)}`).join('\n');
      return `## ${section.title}\n\n${body}`;
    })
    .join('\n\n');
}

function formatDeliveryItem(item: unknown): string {
  if (typeof item === 'string') return item;
  const row = item as Record<string, unknown>;
  if (row.question_id) {
    const problem = Array.isArray(row.problem) ? (row.problem as string[]).join(', ') : 'Sin propuesta escrita';
    return `${row.question_id}. ${row.text ?? row.question_id}. Problema: ${problem}. Nuevo texto: ${row.proposed ?? 'Sin propuesta escrita'}. Por qué: ${row.why ?? 'Sin propuesta escrita'}. Casos: ${row.cases ?? 'Sin casos'}.`;
  }
  if (row.ref) return String(row.ref);
  if (row.label) return `${row.label}${row.verdict ? `. ${row.verdict}` : ''}${row.recommended ? `. Recomendación: ${row.recommended}` : ''}`;
  if (row.title) return String(row.title);
  if (row.decision) return String(row.decision);
  if (row.case_label) return String(row.case_label);
  return JSON.stringify(item);
}
