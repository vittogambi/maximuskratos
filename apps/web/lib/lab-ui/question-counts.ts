import { labUiLabels } from './labels';

const PURPOSE = new Set(['PROPÓSITO', 'PURPOSE', 'PROPOSITO']);
const PLANNED = ['MENTALIDAD', 'RELACIONES', 'FINANZAS', 'CUERPO'] as const;

export type QuestionCountInput = {
  domain: string | null;
  scoreable: boolean | null;
  is_risk: boolean;
  status: string;
};

export type DomainQuestionCounts = {
  domain: string;
  visible: number;
  visibleAnswered: number;
  evaluable: number;
  evaluableAnswered: number;
  safety: number;
  safetyAnswered: number;
  narrative: number;
  narrativeAnswered: number;
};

export type CaseQuestionCounts = {
  domains: DomainQuestionCounts[];
  purpose: { total: number; answered: number };
  totals: DomainQuestionCounts;
};

export function isPurposeDomain(domain: string | null | undefined): boolean {
  return Boolean(domain && PURPOSE.has(domain));
}

export function questionRole(
  question: QuestionCountInput,
): 'purpose' | 'safety' | 'evaluable' | 'narrative' {
  if (isPurposeDomain(question.domain)) return 'purpose';
  if (question.is_risk) return 'safety';
  if (question.scoreable) return 'evaluable';
  return 'narrative';
}

function emptyDomain(domain: string): DomainQuestionCounts {
  return {
    domain,
    visible: 0,
    visibleAnswered: 0,
    evaluable: 0,
    evaluableAnswered: 0,
    safety: 0,
    safetyAnswered: 0,
    narrative: 0,
    narrativeAnswered: 0,
  };
}

function bump(row: DomainQuestionCounts, question: QuestionCountInput) {
  const answered = question.status === 'ANSWERED';
  const role = questionRole(question);
  if (role === 'purpose') return;
  row.visible += 1;
  if (answered) row.visibleAnswered += 1;
  if (role === 'evaluable') {
    row.evaluable += 1;
    if (answered) row.evaluableAnswered += 1;
  } else if (role === 'safety') {
    row.safety += 1;
    if (answered) row.safetyAnswered += 1;
  } else {
    row.narrative += 1;
    if (answered) row.narrativeAnswered += 1;
  }
}

function sumRows(rows: DomainQuestionCounts[]): DomainQuestionCounts {
  return rows.reduce((acc, row) => {
    acc.visible += row.visible;
    acc.visibleAnswered += row.visibleAnswered;
    acc.evaluable += row.evaluable;
    acc.evaluableAnswered += row.evaluableAnswered;
    acc.safety += row.safety;
    acc.safetyAnswered += row.safetyAnswered;
    acc.narrative += row.narrative;
    acc.narrativeAnswered += row.narrativeAnswered;
    return acc;
  }, emptyDomain('ALL'));
}

/** Single source for evaluable / safety / narrative counters. */
export function countCaseQuestions(questions: QuestionCountInput[]): CaseQuestionCounts {
  const byDomain = new Map<string, DomainQuestionCounts>();
  let purposeTotal = 0;
  let purposeAnswered = 0;

  for (const question of questions) {
    if (isPurposeDomain(question.domain)) {
      purposeTotal += 1;
      if (question.status === 'ANSWERED') purposeAnswered += 1;
      continue;
    }
    const key = question.domain ?? 'SIN ÁMBITO';
    const row = byDomain.get(key) ?? emptyDomain(key);
    bump(row, question);
    byDomain.set(key, row);
  }

  const ordered: DomainQuestionCounts[] = [];
  for (const key of PLANNED) {
    const row = byDomain.get(key);
    if (row) ordered.push(row);
    byDomain.delete(key);
  }
  for (const row of byDomain.values()) ordered.push(row);

  return {
    domains: ordered,
    purpose: { total: purposeTotal, answered: purposeAnswered },
    totals: sumRows(ordered),
  };
}

export function countsFromEvidence(domains: Array<{ key: string; answered: number; scoreable: number }>): CaseQuestionCounts {
  const rows = domains.map((item) => ({
    domain: item.key,
    visible: item.answered,
    visibleAnswered: item.answered,
    evaluable: item.scoreable,
    evaluableAnswered: Math.min(item.answered, item.scoreable),
    safety: 0,
    safetyAnswered: 0,
    narrative: 0,
    narrativeAnswered: 0,
  }));
  return {
    domains: rows,
    purpose: { total: 0, answered: 0 },
    totals: sumRows(rows),
  };
}

export function resolveCaseCounts(
  questions: QuestionCountInput[] | undefined,
  evidenceDomains?: Array<{ key: string; answered: number; scoreable: number }>,
): CaseQuestionCounts {
  const fromQuestions = questions?.length ? countCaseQuestions(questions) : null;
  const fromEvidence = evidenceDomains?.length ? countsFromEvidence(evidenceDomains) : null;
  if (fromQuestions && fromEvidence) {
    const domains = fromEvidence.domains.map((evidenceRow) => {
      const questionRow = fromQuestions.domains.find((row) => row.domain === evidenceRow.domain);
      if (!questionRow) return evidenceRow;
      if (questionRow.evaluable >= evidenceRow.evaluable) return questionRow;
      return {
        ...evidenceRow,
        safety: questionRow.safety,
        safetyAnswered: questionRow.safetyAnswered,
        narrative: questionRow.narrative,
        narrativeAnswered: questionRow.narrativeAnswered,
        visible: evidenceRow.evaluable + questionRow.safety + questionRow.narrative,
        visibleAnswered:
          evidenceRow.evaluableAnswered + questionRow.safetyAnswered + questionRow.narrativeAnswered,
      };
    });
    const extras = fromQuestions.domains.filter(
      (row) => !domains.some((item) => item.domain === row.domain),
    );
    const merged = [...domains, ...extras];
    return {
      domains: merged,
      purpose: fromQuestions.purpose,
      totals: sumRows(merged),
    };
  }
  return (
    fromQuestions ??
    fromEvidence ?? { domains: [], purpose: { total: 0, answered: 0 }, totals: emptyDomain('ALL') }
  );
}

export function formatDomainExtras(row: DomainQuestionCounts): string[] {
  const extras: string[] = [];
  if (row.safety) {
    extras.push(`${row.safety} ${row.safety === 1 ? 'pregunta de seguridad' : 'preguntas de seguridad'}`);
  }
  if (row.narrative) extras.push(`${row.narrative} ${row.narrative === 1 ? 'narrativa' : 'narrativas'}`);
  return extras;
}

export function formatDomainCountLine(row: DomainQuestionCounts, firedAlerts = 0): string {
  const extras = formatDomainExtras(row);
  if (firedAlerts > 0) {
    extras.push(firedAlerts === 1 ? '1 alerta activa' : `${firedAlerts} alertas activas`);
  }
  const base =
    row.evaluable > 0 && row.evaluableAnswered < row.evaluable
      ? `${row.evaluableAnswered} / ${row.evaluable} evaluables`
      : `${row.evaluable} evaluables`;
  return extras.length ? `${base} · ${extras.join(' · ')}` : base;
}

export function formatVisibleDetail(row: DomainQuestionCounts): string {
  const bits = [`${row.evaluable} evaluables`];
  if (row.safety) {
    bits.push(`${row.safety} ${row.safety === 1 ? 'pregunta de seguridad' : 'preguntas de seguridad'}`);
  }
  if (row.narrative) bits.push(`${row.narrative} ${row.narrative === 1 ? 'narrativa' : 'narrativas'}`);
  return `${row.visible} respuestas visibles · ${bits.join(' · ')}`;
}

export function formatDomainAccordionLine(row: DomainQuestionCounts): string {
  const extras = formatDomainExtras(row);
  const ratio = `${row.evaluableAnswered}/${row.evaluable}`;
  return extras.length ? `${ratio} · ${extras.join(' · ')}` : ratio;
}

/** Factual copy for before reveal. Never mentions expected Matrix behavior. */
export function factualCoverageCopy(counts: CaseQuestionCounts, firedAlerts = 0, revealed = false): string {
  const named = counts.domains.filter((row) => PLANNED.includes(row.domain as (typeof PLANNED)[number]));
  const present = named.filter((row) => row.visibleAnswered > 0 || row.evaluableAnswered > 0);
  const complete = named.filter((row) => row.evaluable > 0 && row.evaluableAnswered >= row.evaluable);
  const partial = named.filter((row) => row.evaluableAnswered > 0 && row.evaluableAnswered < row.evaluable);
  const sentences: string[] = [];

  if (named.length === 4 && complete.length === 4) {
    sentences.push('Este caso tiene respuestas en los cuatro ámbitos.');
  } else if (partial.length === 1 && complete.length + partial.length === present.length) {
    sentences.push(`${labUiLabels.domain(partial[0].domain)} quedó parcialmente respondido.`);
  } else if (present.length === 0) {
    sentences.push('Todavía no hay respuestas en los ámbitos.');
  } else if (partial.length) {
    sentences.push(
      `${partial.map((row) => labUiLabels.domain(row.domain)).join(', ')} ${
        partial.length === 1 ? 'quedó parcialmente respondido' : 'quedaron parcialmente respondidos'
      }.`,
    );
  } else {
    sentences.push(
      `Hay respuestas en ${present.map((row) => labUiLabels.domain(row.domain)).join(', ')}.`,
    );
  }

  if (counts.totals.safetyAnswered > 0) {
    const safety =
      counts.totals.safetyAnswered === 1
        ? '1 pregunta de seguridad respondida'
        : `${counts.totals.safetyAnswered} preguntas de seguridad respondidas`;
    if (revealed) {
      const alerts =
        firedAlerts === 1 ? '1 alerta activa' : `${firedAlerts} alertas activas`;
      sentences.push(`${safety} · ${alerts}.`);
    } else {
      sentences.push(`${safety}.`);
    }
  } else if (revealed && firedAlerts > 0) {
    sentences.push(firedAlerts === 1 ? '1 alerta activa.' : `${firedAlerts} alertas activas.`);
  }

  return sentences.join(' ');
}
