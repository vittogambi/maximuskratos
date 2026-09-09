export const ORIGIN_TYPES = [
  'EXCEL_SOURCE',
  'MATRIX_V2',
  'V2_TRANSFORMATION',
  'V2_UNDOCUMENTED_RESULT',
  'POST_V2_REFINEMENT',
  'TECHNICAL_CORRECTION',
  'FUTURE_PROPOSAL',
] as const;
export type OriginType = (typeof ORIGIN_TYPES)[number];

export const CHANGE_KINDS = [
  'UNCHANGED_FROM_EXCEL',
  'V2_TRANSFORMATION',
  'INTENTION_LOSS_RISK',
  'TECHNICAL_CORRECTION',
  'INCONSISTENCY_CORRECTION',
  'METHODOLOGICAL_REFINEMENT',
  'PRODUCT_PROPOSAL',
] as const;
export type ChangeKind = (typeof CHANGE_KINDS)[number];

export const DECISION_STATUSES = [
  'DOCUMENTED_IN_V2',
  'PENDING_RAFA',
  'APPROVED_RAFA',
  'REJECTED_RAFA',
  'NEED_MORE_EVIDENCE',
] as const;
export type DecisionStatus = (typeof DECISION_STATUSES)[number];

export type ProvenanceCardKind =
  | 'removed_content'
  | 'method_transform'
  | 'refinement'
  | 'later'
  | 'documented'
  | 'correction';

export type ProvenanceSourceRef = {
  file: string | null;
  sheet: string | null;
  id: string | null;
  version: string | null;
};

export type IkigaiComposition = {
  from_v2: string[];
  from_legacy: string[];
  from_product: string[];
  note: string;
};

export type MethodologyProvenance = {
  id: string;
  subject_kind: 'question' | 'rule' | 'transformation' | 'test' | 'decision';
  origin_type: OriginType;
  change_kind: ChangeKind;
  title: string;
  source_refs: ProvenanceSourceRef[];
  previous_state: string | null;
  current_state: string | null;
  change_summary: string;
  rationale: string;
  why_pending: string | null;
  documented_facts: string[];
  undocumented: string[];
  decision_question: string | null;
  composition: IkigaiComposition | null;
  card_kind: ProvenanceCardKind;
  decision_by: 'V2_DOCUMENTED' | 'TEAM_PROPOSAL' | 'RAFA' | 'UNDOCUMENTED';
  decision_status: DecisionStatus;
  in_rafa_queue: boolean;
  blocks_matrix: boolean;
  affects_now: string;
  affects_later: string | null;
  verdict_set: 'fidelity' | 'refinement' | 'none';
  rafa_verdict: string | null;
  rafa_note: string | null;
};

export function originTypeFromMapping(mapping: {
  transformation_type: string;
  source_form?: string | null;
}): OriginType {
  if (mapping.transformation_type === 'UNCHANGED') return 'EXCEL_SOURCE';
  return 'MATRIX_V2';
}

export function decisionStatusFromVerdict(
  verdict: string | null | undefined,
  documented: boolean,
): DecisionStatus {
  if (verdict === 'NOT_APPLICABLE' || verdict === 'UNSURE' || verdict === 'REVISIT') {
    return 'NEED_MORE_EVIDENCE';
  }
  if (verdict === 'REJECT') return 'REJECTED_RAFA';
  if (verdict) return 'APPROVED_RAFA';
  return documented ? 'DOCUMENTED_IN_V2' : 'PENDING_RAFA';
}

function decisionByFor(
  base: { origin_type: OriginType; in_rafa_queue: boolean },
  verdict: string | null,
): MethodologyProvenance['decision_by'] {
  if (verdict) return 'RAFA';
  if (base.origin_type === 'V2_UNDOCUMENTED_RESULT') return 'UNDOCUMENTED';
  if (base.origin_type === 'POST_V2_REFINEMENT' || base.origin_type === 'FUTURE_PROPOSAL') {
    return 'TEAM_PROPOSAL';
  }
  if (base.in_rafa_queue) return 'UNDOCUMENTED';
  return 'V2_DOCUMENTED';
}

export function hydrateProvenance(
  base: Omit<MethodologyProvenance, 'rafa_verdict' | 'rafa_note' | 'decision_status' | 'decision_by'>,
  stored: { rafaVerdict: string | null; rafaNote: string | null } | undefined,
): MethodologyProvenance {
  const rafa_verdict = stored?.rafaVerdict ?? null;
  const documented = !base.in_rafa_queue && base.origin_type !== 'V2_UNDOCUMENTED_RESULT';
  return {
    ...base,
    rafa_verdict,
    rafa_note: stored?.rafaNote ?? null,
    decision_status: decisionStatusFromVerdict(rafa_verdict, documented),
    decision_by: decisionByFor(base, rafa_verdict),
  };
}
