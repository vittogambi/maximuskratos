import { indexTrace, toDiagnosticContract, diagnosticContractsEqual, type MatrixDefinition, type ResponseInput, type ResultSnapshot } from '@mk/matrix-engine';
import { buildDirectionReading, directionEvidenceFingerprint } from '@mk/experience-engine';

export interface PairAnswer {
  questionId: string;
  text?: string;
  raw: unknown;
  status: string;
}

export type PairChangedQuestion = {
  questionId: string;
  text?: string;
  a: unknown;
  b: unknown;
  a_label: string | null;
  b_label: string | null;
  a_score: number | null;
  b_score: number | null;
  aStatus: string;
  bStatus: string;
};

export type PairCompareView = {
  changed_questions: PairChangedQuestion[];
  dimensions: Record<string, { a: number | null; b: number | null; label: string }>;
  domains: Record<
    string,
    {
      a_score: number | null;
      b_score: number | null;
      a_state: string | null;
      b_state: string | null;
    }
  >;
  priority: { a: string | null; b: string | null };
  plans: { a: string | null; b: string | null; a_name: string | null; b_name: string | null };
  alerts: { a: string; b: string };
  diagnostic_equal: boolean;
  direction: {
    signal_a: string;
    signal_b: string;
    fingerprint_equal: boolean;
    methodology_version: string;
  };
};

export function pairResponseDiff(
  left: PairAnswer[],
  right: PairAnswer[],
): Array<{ questionId: string; text?: string; a: unknown; b: unknown; aStatus: string; bStatus: string }> {
  const rightById = new Map(right.map((row) => [row.questionId, row]));
  const diffs: Array<{
    questionId: string;
    text?: string;
    a: unknown;
    b: unknown;
    aStatus: string;
    bStatus: string;
  }> = [];
  for (const row of left) {
    const other = rightById.get(row.questionId);
    if (!other) continue;
    if (row.status !== other.status || String(row.raw) !== String(other.raw)) {
      diffs.push({
        questionId: row.questionId,
        text: row.text,
        a: row.raw,
        b: other.raw,
        aStatus: row.status,
        bStatus: other.status,
      });
    }
  }
  return diffs;
}

export function pairCompareAvailable(leftRevealed: boolean, rightRevealed: boolean): boolean {
  return leftRevealed && rightRevealed;
}

/** Pairing comes from casebook keys that share a stem and A/B sides, not from fixture IDs. */
export function pairKeyFromCasebook(casebookKey: string | null | undefined): {
  pair: string | null;
  side: string | null;
} {
  if (!casebookKey) return { pair: null, side: null };
  const match = /^(.+)([AB])$/.exec(casebookKey);
  if (!match) return { pair: null, side: null };
  return { pair: match[1], side: match[2] };
}

export function pairResultQuestion(): string {
  return '¿Esta diferencia en las respuestas debería producir esta diferencia en el resultado?';
}

function answerLabel(definition: MatrixDefinition, questionId: string, raw: unknown): string | null {
  if (raw == null || raw === '') return null;
  const question = definition.questions.find((item) => item.id === questionId);
  if (!question) return String(raw);
  const scale = definition.scales.find((item) => item.id === question.scale_id);
  if (!scale) return String(raw);
  const anchor = scale.anchors.find((item) => item.value != null && String(item.value) === String(raw));
  return anchor?.label ?? String(raw);
}

function normalizeScore(snapshot: ResultSnapshot, questionId: string): number | null {
  const node = indexTrace(snapshot.trace).get(`normalize:${questionId}`);
  const output = node?.output as { score?: number | null } | undefined;
  return output?.score ?? null;
}

export function buildPairCompareView(
  definition: MatrixDefinition,
  aSnap: ResultSnapshot,
  bSnap: ResultSnapshot,
  aAnswers: PairAnswer[],
  bAnswers: PairAnswer[],
): PairCompareView {
  const changed_questions = pairResponseDiff(aAnswers, bAnswers).map((row) => ({
    ...row,
    a_label: answerLabel(definition, row.questionId, row.a),
    b_label: answerLabel(definition, row.questionId, row.b),
    a_score: normalizeScore(aSnap, row.questionId),
    b_score: normalizeScore(bSnap, row.questionId),
  }));

  const dimensions: PairCompareView['dimensions'] = {};
  for (const dim of aSnap.dimensions) {
    const other = bSnap.dimensions.find((item) => item.key === dim.key);
    if (!other) continue;
    if (dim.score === other.score) continue;
    const label = definition.dimensions.find((item) => item.key === dim.key)?.labels[0] ?? dim.key;
    dimensions[dim.key] = { a: dim.score, b: other.score, label };
  }

  const domains: PairCompareView['domains'] = {};
  for (const domain of aSnap.domains) {
    const other = bSnap.domains.find((item) => item.key === domain.key);
    if (!other) continue;
    if (domain.score_display === other.score_display && domain.state_final === other.state_final) {
      continue;
    }
    domains[domain.key] = {
      a_score: domain.score_display,
      b_score: other.score_display,
      a_state: domain.state_final,
      b_state: other.state_final,
    };
  }

  const aPlan = aSnap.recommendations.primary?.plan_id ?? null;
  const bPlan = bSnap.recommendations.primary?.plan_id ?? null;
  const diagnosticA = toDiagnosticContract(aSnap);
  const diagnosticB = toDiagnosticContract(bSnap);
  const asInputs = (rows: PairAnswer[]): ResponseInput[] =>
    rows.map((row) => ({
      questionId: row.questionId,
      status: (row.status === 'UNANSWERED' ? 'SKIPPED_BY_USER' : row.status) as ResponseInput['status'],
      rawValue: (row.raw as number | string | null) ?? null,
    }));
  const directionA = buildDirectionReading({ definition, responses: asInputs(aAnswers) });
  const directionB = buildDirectionReading({ definition, responses: asInputs(bAnswers) });

  return {
    changed_questions,
    dimensions,
    domains,
    priority: { a: aSnap.priority.domain, b: bSnap.priority.domain },
    plans: {
      a: aPlan,
      b: bPlan,
      a_name: definition.plans.find((item) => item.id === aPlan)?.name ?? aPlan,
      b_name: definition.plans.find((item) => item.id === bPlan)?.name ?? bPlan,
    },
    alerts: { a: firedAlerts(aSnap), b: firedAlerts(bSnap) },
    diagnostic_equal: diagnosticContractsEqual(diagnosticA, diagnosticB),
    direction: {
      signal_a: directionA.signal_coverage,
      signal_b: directionB.signal_coverage,
      fingerprint_equal: directionEvidenceFingerprint(directionA) === directionEvidenceFingerprint(directionB),
      methodology_version: directionA.methodology_version,
    },
  };
}

function firedAlerts(snapshot: ResultSnapshot): string {
  const fired = snapshot.safety.alerts.filter((alert) => alert.fired);
  if (!fired.length) return 'ninguna';
  return fired.map((alert) => `${alert.domain} ${alert.severity}`).join(', ');
}
