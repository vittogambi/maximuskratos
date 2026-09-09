import { apiRefresh, getApiBaseUrl } from './api';
import { getAccessToken, setAccessToken } from './auth-storage';

export class LabApiError extends Error {
  status: number;
  reason?: string;
  constructor(message: string, status: number, reason?: string) {
    super(message);
    this.status = status;
    this.reason = reason;
  }
}

async function authorizedLabFetch(path: string, init: RequestInit, token: string): Promise<Response> {
  return fetch(`${getApiBaseUrl()}/api/v1/admin/lab${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(init.body ? { 'Content-Type': 'application/json' } : {}),
      ...(init.headers ?? {}),
    },
    credentials: 'include',
  });
}

export async function labRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  let token = getAccessToken();
  if (!token) {
    try {
      const refreshed = await apiRefresh();
      token = refreshed.accessToken;
      setAccessToken(token);
    } catch {
      throw new LabApiError('Sesión no encontrada', 401);
    }
  }
  let res = await authorizedLabFetch(path, init, token);
  if (res.status === 401) {
    try {
      const refreshed = await apiRefresh();
      token = refreshed.accessToken;
      setAccessToken(token);
      res = await authorizedLabFetch(path, init, token);
    } catch {
      throw new LabApiError('Sesión no encontrada', 401);
    }
  }
  if (!res.ok) {
    let reason: string | undefined;
    let message = res.statusText;
    try {
      const body = (await res.json()) as { reason?: string; message?: string };
      reason = body.reason;
      if (body.message) message = body.message;
    } catch {
      /* ignore */
    }
    throw new LabApiError(message || 'Error del Lab', res.status, reason);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export const labApi = {
  cases: () => labRequest<LabCaseRow[]>('/cases'),
  sessionProgress: () => labRequest<LabSessionProgress>('/session-progress'),
  case: (id: string) => labRequest<LabCaseDetail>(`/cases/${id}`),
  run: (id: string) => labRequest<LabRunSummary>(`/runs/${id}`),
  responses: (id: string) => labRequest<LabQuestion[]>('/runs/' + id + '/responses'),
  saveResponse: (id: string, body: unknown) =>
    labRequest<LabQuestion[]>(`/runs/${id}/responses`, { method: 'POST', body: JSON.stringify(body) }),
  saveResponses: (
    id: string,
    responses: Array<{
      question_id: string;
      raw_value?: unknown;
      qualitative_confirmed?: boolean | null;
      status?: string;
    }>,
  ) =>
    labRequest<LabQuestion[]>(`/runs/${id}/responses/batch`, {
      method: 'POST',
      body: JSON.stringify({ responses }),
    }),
  freeze: (id: string) => labRequest<{ id: string; status: string }>(`/runs/${id}/freeze`, { method: 'POST' }),
  expectation: (id: string, body: unknown) =>
    labRequest(`/runs/${id}/expectation`, { method: 'POST', body: JSON.stringify(body) }),
  getExpectation: (id: string) => labRequest<{ latest: LabExpectation | null }>(`/runs/${id}/expectation`),
  reveal: (id: string) => labRequest(`/runs/${id}/reveal`, { method: 'POST' }),
  result: (id: string) => labRequest<LabResult>(`/runs/${id}/result`),
  trace: (id: string) => labRequest<{ why: string; trace: unknown }>(`/runs/${id}/trace`),
  comparison: (id: string) => labRequest<LabComparison>(`/runs/${id}/comparison`),
  review: (id: string, body: unknown) =>
    labRequest(`/runs/${id}/review`, { method: 'POST', body: JSON.stringify(body) }),
  getReview: (id: string) => labRequest<{ latest: LabReviewRecord | null }>(`/runs/${id}/review`),
  patchReviewVerdict: (id: string, body: unknown) =>
    labRequest<LabReviewRecord>(`/runs/${id}/review/verdict`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    }),
  purpose: (id: string, body: unknown) =>
    labRequest(`/runs/${id}/purpose-assessment`, { method: 'POST', body: JSON.stringify(body) }),
  assessments: (id: string) => labRequest<LabAssessments>(`/runs/${id}/assessments`),
  direction: (id: string, body: unknown) =>
    labRequest(`/runs/${id}/direction`, { method: 'POST', body: JSON.stringify(body) }),
  project: (id: string, body: unknown) =>
    labRequest<LabExperience>(`/runs/${id}/experience/project`, { method: 'POST', body: JSON.stringify(body) }),
  experience: (id: string) => labRequest<LabExperience | null>(`/runs/${id}/experience`),
  productReview: (id: string, body: unknown) =>
    labRequest(`/runs/${id}/product-review`, { method: 'POST', body: JSON.stringify(body) }),
  getProductReview: (id: string) => labRequest<{ latest: unknown }>(`/runs/${id}/product-review`),
  catalog: (id: string) => labRequest<LabCatalog>(`/runs/${id}/catalog`),
  questionBank: () =>
    labRequest<{
      questions: LabQuestionBankRow[];
      without_function: number;
      without_role: number;
      without_current_consumer: number;
      broken_config: number;
      total: number;
    }>('/question-bank'),
  ruleCoverage: () => labRequest<LabRuleCoverage>('/rule-coverage'),
  changeOptions: (id: string) => labRequest<LabChangeOptions>(`/runs/${id}/change-options`),
  guidedChange: (id: string, body: LabGuidedChangeRequest) =>
    labRequest<LabGuidedChangeResult>(`/runs/${id}/change`, { method: 'POST', body: JSON.stringify(body) }),
  replayComparison: (id: string) => labRequest<LabReplayComparison>(`/replays/${id}/comparison`),
  workspaces: () => labRequest<LabWorkspace[]>('/workspaces'),
  workspace: (id: string) => labRequest<LabWorkspace>(`/workspaces/${id}`),
  replay: (body: unknown) => labRequest<LabReplay>('/replays', { method: 'POST', body: JSON.stringify(body) }),
  getReplay: (id: string) => labRequest<LabReplay>(`/replays/${id}`),
  verdict: (replayId: string, runId: string, verdict: string) =>
    labRequest(`/replays/${replayId}/results/${runId}/verdict`, {
      method: 'POST',
      body: JSON.stringify({ verdict }),
    }),
  accept: (id: string, body: unknown) =>
    labRequest(`/changesets/${id}/accept`, { method: 'POST', body: JSON.stringify(body) }),
  reject: (id: string) => labRequest(`/changesets/${id}/reject`, { method: 'POST', body: '{}' }),
  definitions: () => labRequest<LabDefinitionRow[]>('/definitions'),
  pairCompare: (id: string) => labRequest<LabPairCompare>(`/runs/${id}/pair-compare`),
  findings: () => labRequest<LabFindingList>('/findings'),
  finding: (id: string) => labRequest<LabFinding>(`/findings/${id}`),
  createFinding: (body: unknown) => labRequest<LabFinding>('/findings', { method: 'POST', body: JSON.stringify(body) }),
  patchFinding: (id: string, body: unknown) =>
    labRequest<LabFinding>(`/findings/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  linkFindingCases: (id: string, caseIds: string[]) =>
    labRequest<LabFinding>(`/findings/${id}/cases`, { method: 'POST', body: JSON.stringify({ case_ids: caseIds }) }),
  findingConsistency: (id: string, body: unknown) =>
    labRequest<LabFinding>(`/findings/${id}/consistency`, { method: 'POST', body: JSON.stringify(body) }),
  findingChange: (id: string, body: unknown) =>
    labRequest<LabGuidedChangeResult>(`/findings/${id}/change`, { method: 'POST', body: JSON.stringify(body) }),
  candidates: () => labRequest<LabCandidateList>('/candidates'),
  composeCandidate: (body: unknown) =>
    labRequest<{ candidate_ref: string; changeset_id: string; provenance: unknown[] }>('/candidates/compose', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  replayReviewed: (body: unknown) => labRequest<LabReplay>('/candidates/replay-reviewed', { method: 'POST', body: JSON.stringify(body) }),
  contracts: (ref?: string) =>
    labRequest<LabContracts>(ref ? `/contracts/${encodeURIComponent(ref)}` : '/contracts'),
  readiness: () => labRequest<LabReadiness>('/readiness'),
  decideReadiness: (body: unknown) =>
    labRequest('/readiness/decision', { method: 'POST', body: JSON.stringify(body) }),
  decisionReport: () => labRequest<LabDecisionReport>('/decision-report'),
  currentSession: () => labRequest<LabWorkSession | null>('/work-sessions/current'),
  createSession: (body: unknown) =>
    labRequest<LabWorkSession>('/work-sessions', { method: 'POST', body: JSON.stringify(body) }),
  closeSession: (id: string) => labRequest<LabWorkSession>(`/work-sessions/${id}/close`, { method: 'POST' }),
  createMethodologyCase: (body: unknown) =>
    labRequest<{ case: { id: string; label: string; kind: string }; run: { id: string } }>('/cases/methodology', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  duplicateCase: (id: string, body?: unknown) =>
    labRequest<{ case: { id: string }; run: { id: string }; derived_from_case_id: string }>(`/cases/${id}/duplicate`, {
      method: 'POST',
      body: JSON.stringify(body ?? {}),
    }),
  archiveDraft: (id: string) => labRequest(`/cases/${id}/archive`, { method: 'POST' }),
  compareParent: (id: string) => labRequest<LabParentCompare>(`/runs/${id}/compare-parent`),
  sourceMappings: () => labRequest<{ mappings: LabSourceMapping[] }>('/source-mappings'),
  migrations: () => labRequest<{ migrations: LabMigrationDecision[] }>('/migrations'),
  reviewAgenda: () => labRequest<LabReviewAgenda>('/review-agenda'),
  patchMigration: (id: string, body: unknown) =>
    labRequest<LabProvenanceItem | LabMigrationDecision>(`/migrations/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  observations: () => labRequest<LabObservationList>('/observations'),
  createObservation: (runId: string, body: unknown) =>
    labRequest<LabObservation>(`/runs/${runId}/observations`, { method: 'POST', body: JSON.stringify(body) }),
  patchObservation: (id: string, body: unknown) =>
    labRequest<LabObservation>(`/observations/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  observationFinding: (id: string, body: unknown) =>
    labRequest<LabObservation>(`/observations/${id}/finding`, { method: 'POST', body: JSON.stringify(body) }),
  findingLedger: (id: string, body: unknown) =>
    labRequest<LabFinding>(`/findings/${id}/ledger`, { method: 'POST', body: JSON.stringify(body) }),
  deliveryReport: () => labRequest<LabDeliveryReport>('/delivery-report'),
  deliveryMarkdown: () => labRequest<{ markdown: string }>('/delivery-report?format=markdown'),
  changeSets: () => labRequest<{ changesets: LabChangeSetRow[] }>('/changesets'),
};

export type LabRunProgressFields = {
  id: string;
  status: string;
  policy_id: string;
  served: number | null;
  answered: number;
  skipped: number;
  has_expectation: boolean;
  has_review: boolean;
  has_case_verdict: boolean;
  has_purpose: boolean;
  has_product_review: boolean;
  disagreement: boolean;
};

export type LabCaseRow = {
  id: string;
  label: string;
  kind: string;
  blind: boolean;
  casebook_key: string | null;
  fixture_key: string | null;
  story: string | null;
  test_intent: string | null;
  pair: string | null;
  pair_side: string | null;
  matrix_review_complete: boolean;
  product_review_complete: boolean;
  purpose_complete: boolean;
  has_findings?: boolean;
  derived_from_case_id?: string | null;
  purpose_answered?: boolean;
  family_reviews?: Record<string, { verdict?: string | null; case_done?: boolean; criterion_id?: string | null }>;
  latest_run: LabRunProgressFields | null;
};

export type LabFamilyRow = {
  id: string;
  label: string;
  keys: string[];
  core: boolean;
  status: string;
  reviewed: number;
  total: number;
  compare: boolean;
  intent: string | null;
  question?: string | null;
  intro?: string | null;
  verdict_at?: 'case' | 'pair';
  needs_fixture?: boolean;
  review_surface?: 'matrix' | 'frontier' | 'qa';
  review_prompt?: string | null;
  next_run_id: string | null;
};

export type LabQuestionBankRow = {
  id: string;
  text: string;
  domain: string;
  dimension: string;
  roles: string[];
  used_in: string;
  functional_consumer: string;
  surface: string;
  future_consumer: string | null;
  does_not_modify: string | null;
  warning: string | null;
  integrity: 'ok' | 'without_role' | 'without_current_consumer' | 'broken_config';
  participates_in_score: boolean;
  source_form: string | null;
  source_section: string | null;
  transformation_type: string | null;
  confidence: string | null;
  review_needed_by_rafa: string | null;
  why_changed: string | null;
  origin_type?: string | null;
};

export type LabRuleCoverage = {
  rows: Array<{
    id: string;
    layer: string;
    label: string;
    kind: 'human' | 'qa';
    mode?: string;
    test_ids: string[];
    status: 'covered' | 'gap_human' | 'gap_qa';
  }>;
  summary: Array<{ layer: string; covered: number; total: number }>;
  by_mode?: Array<{ mode: string; covered: number; total: number }>;
  gaps: Array<{
    id: string;
    layer: string;
    label: string;
    kind: 'human' | 'qa';
    mode?: string;
    status: string;
    test_ids: string[];
  }>;
};

export type LabSessionProgress = {
  cases_total: number;
  pending: number;
  reviewed: number;
  with_disagreement: number;
  experiments: number;
  open_findings: number;
  changes_in_test: number;
  current_candidate: string | null;
  flagged_questions?: number;
  pending_decisions?: number;
  next_incomplete_run_id: string | null;
  next_incomplete_label: string | null;
  families?: LabFamilyRow[];
  families_total?: number;
  families_reviewed?: number;
  families_validated?: number;
  families_with_finding?: number;
  families_need_evidence?: number;
  canonical_total?: number;
  canonical_reviewed?: number;
  next_family_id?: string | null;
};

export type LabCaseDetail = {
  id: string;
  label: string;
  kind: string;
  expert_context: string | null;
  test_intent: string | null;
  facilitator_note: string | null;
  casebook_key: string | null;
  runs: Array<{
    id: string;
    status: string;
    policy_id: string;
    definition_ref: string;
    has_expectation?: boolean;
    has_review?: boolean;
    has_case_verdict?: boolean;
    has_purpose?: boolean;
    has_product_review?: boolean;
  }>;
};

export type LabRunSummary = {
  id: string;
  case_id: string;
  case_label: string;
  case_kind: string;
  casebook_key: string | null;
  expert_context: string | null;
  test_intent: string | null;
  method_families?: Array<{
    id: string;
    label: string;
    question: string;
    review_prompt: string;
    review_surface: 'matrix' | 'frontier';
    criterion_id?: string;
  }>;
  facilitator_note: string | null;
  pair: string | null;
  pair_side: string | null;
  blind: boolean;
  status: string;
  policy_id: string;
  definition_ref: string;
  definition_sha256: string;
  engine_semver: string;
  skipped_expectation: boolean;
  served: number;
  answered: number;
  skipped: number;
  unanswered: number;
  has_expectation: boolean;
  has_review: boolean;
  has_case_verdict: boolean;
  family_reviews?: Record<string, { verdict?: string | null; case_done?: boolean; criterion_id?: string | null }>;
  has_purpose: boolean;
  has_projection: boolean;
  has_product_review: boolean;
  matrix_review_complete: boolean;
  evidence?: LabEvidenceSummary;
  frozen_at: string | null;
  revealed_at: string | null;
  derived_from_case_id?: string | null;
  derived_from_label?: string | null;
  responses_editable?: boolean;
  purpose_answered?: boolean;
};

export type LabEvidenceSummary = {
  domains: Array<{
    key: string;
    answered: number;
    scoreable: number;
    coverage: number;
    classification: string;
    evidence_state: string;
  }>;
  purpose: { answered: number; total: number };
  total: { answered: number; served: number };
  bands: { insufficient_below: number; provisional_below: number; rule_ids: string[] };
};

export type LabQuestion = {
  id: string;
  text: string;
  domain: string | null;
  dimension: string | null;
  dimension_label: string | null;
  scale_id: string | null;
  scale_kind: string | null;
  weight: number | null;
  active: boolean | null;
  scoreable: boolean | null;
  is_risk: boolean;
  status: string;
  raw_value: number | string | null;
  answer_label: string | null;
  answer_ordinal: string | null;
  answer_scale_hint: string | null;
  qualitative_confirmed: boolean | null;
  skipped: boolean;
  scale?: { id: string; kind: string; anchors: Array<{ value: unknown; label: string; score: number | null }> } | null;
  flagged_here?: boolean;
  observation_id?: string | null;
  other_observations?: number;
  other_notes?: Array<{
    id: string;
    note: string;
    issue_types: string[];
    case_label?: string | null;
    casebook_key?: string | null;
  }>;
  source_mapping?: LabSourceMapping | null;
};

export type LabSourceMapping = {
  v2_question_id: string;
  v2_question: string;
  v2_domain: string;
  v2_dimension: string;
  v2_variable_type: string;
  v2_phase: string;
  v2_instrumento: string;
  source_form: string | null;
  source_section: string | null;
  source_question_number: string | null;
  source_question: string | null;
  source_response_type: string | null;
  source_alert_logic: string | null;
  transformation_type: string;
  why_changed: string;
  confidence: string;
  review_needed_by_rafa: string;
};

export type LabProvenanceItem = {
  id: string;
  subject_kind: string;
  origin_type: string;
  change_kind: string;
  title: string;
  source_refs: Array<{ file: string | null; sheet: string | null; id: string | null; version: string | null }>;
  previous_state: string | null;
  current_state: string | null;
  change_summary: string;
  rationale: string;
  why_pending: string | null;
  documented_facts?: string[];
  undocumented?: string[];
  decision_question?: string | null;
  composition?: {
    from_v2: string[];
    from_legacy: string[];
    from_product: string[];
    note: string;
  } | null;
  card_kind?: 'removed_content' | 'method_transform' | 'refinement' | 'later' | 'documented' | 'correction';
  decision_by: string;
  decision_status: string;
  in_rafa_queue: boolean;
  blocks_matrix: boolean;
  affects_now: string;
  affects_later: string | null;
  verdict_set: 'fidelity' | 'refinement' | 'none';
  rafa_verdict: string | null;
  rafa_note: string | null;
};

export type LabReviewNext = {
  track: string;
  title: string;
  lead: string;
  href: string;
  cta: string;
  done_prompt: string | null;
};

export type LabReviewAgenda = {
  rule: string;
  tracks: Array<{
    id: string;
    title: string;
    question: string;
    done: number;
    total: number;
    href: string;
    cta: string;
    note?: string | null;
  }>;
  next: LabReviewNext;
  fidelity_queue: LabProvenanceItem[];
  refinements_queue: LabProvenanceItem[];
  documented: LabProvenanceItem[];
  corrections: LabProvenanceItem[];
  later: LabProvenanceItem[];
  legacy_catalogs?: Array<{
    element: string;
    usage: string;
    equivalent: string;
    status: string;
    catalog: string;
    human_group?: string | null;
  }>;
  summary: {
    matrix_resolved: number;
    matrix_total: number;
    fidelity_resolved: number;
    fidelity_total: number;
    fidelity_recovered_direction: number;
    fidelity_later: number;
    fidelity_pending_matrix: number;
    fidelity_recovered_matrix: number;
    direction_resolved: number;
    direction_total: number;
    refinements_approved: number;
    refinements_later: number;
    refinements_pending: number;
    refinements_that_modify_matrix: number;
  };
};

export type LabMigrationDecision = {
  id: string;
  source_sheets: string;
  problem: string;
  cause: string;
  impact: string;
  v2_resolution: string;
  design_status: string;
  affected_v2_ids: string[];
  rafa_verdict: string | null;
  rafa_note: string | null;
  fidelity_theme?: string;
  fidelity_bucket?: 'Conservado' | 'Transformado' | 'Pendiente';
};

export type LabExpectation = {
  expectedStates: Record<string, string>;
  expectedPriorityDomain: string;
  expectedPlanId: string | null;
  expectedPurposeStage: string;
  confidence: string;
  notes: string | null;
  openWhatIsHappening: string | null;
  openMainConcern: string | null;
  openFirstFocus: string | null;
  openFirstAction: string | null;
  personalFirstDomain?: string | null;
};

export type LabReviewRecord = {
  verdicts: Record<string, unknown>;
  firstWrongLayer: string | null;
  rootCauseCodes: string[];
  evidenceRefs: string[];
  wouldRecommendPlanId: string | null;
  postRevealPriorityDomain: string | null;
  notes: string | null;
  revision: number;
  noMethodologicalProblem?: boolean;
  caseVerdict?: string | null;
  hypothesis?: string | null;
  disposition?: string | null;
  linkedFindingId?: string | null;
  postRevealStates?: Record<string, string> | null;
  doubtedRules?: string[];
};

export type LabSnapshot = {
  definition_ref: string;
  definition_sha256: string;
  engine_semver: string;
  policy_id: string;
  responses_hash: string;
  generated_at: string;
  safety: {
    alerts: Array<{
      question_id: string;
      domain: string;
      severity: string;
      fired: boolean;
      condition_confirmed: string | null;
      condition_text: string;
      immediate_action: string;
      referral: string;
      override_applied: string | null;
    }>;
    not_evaluated: string[];
    risk_coverage: number;
    safety_incomplete: boolean;
  };
  dimensions: Array<{
    key: string;
    domain: string;
    score: number | null;
    score_display: number | null;
    items_scored: number;
    items_scoreable: number;
    coverage: number;
    inverse: boolean;
  }>;
  domains: Array<{
    key: string;
    coverage_definition: number;
    coverage_served: number | null;
    classification: string;
    score: number | null;
    score_display: number | null;
    state_from_band: string | null;
    state_final: string | null;
    state_source: string | null;
    state_rule_id: string | null;
    distance_to_band_edge: number | null;
    dimensions_used: number;
  }>;
  priority: {
    domain: string | null;
    tier: string | null;
    rule_id: string;
    reason: string | null;
    candidates: Array<{
      domain: string;
      tier: string;
      state: string | null;
      score_display: number | null;
      classified: boolean;
    }>;
    criteria_not_evaluated: Array<{ criterion: string; reason: string }>;
    purpose_note: string;
  };
  maintenance: { domain: string | null; rule_id: string };
  recommendations: {
    primary: {
      domain: string;
      plan_id: string | null;
      label: string;
      objectives: string[];
      activities: string[];
      executable_recommendation: string;
      blocked_reason: string | null;
    } | null;
  };
  purpose: { stage: null; stage_reason: string; dimension_scores: unknown[] };
  interpretations_used: string[];
  rules_not_executed: string[];
};

export type LabResult = {
  snapshot: LabSnapshot;
  diagnostic_contract?: unknown;
  direction_reading?: {
    methodology_version: string;
    signal_coverage: string;
    basis: string;
    evidence: Array<{ question_id: string; module: string | null; original_text: string }>;
    used_now: string;
    used_later: string;
    does_not_modify: string;
  } | null;
  catalog: {
    plans: Array<{
      id: string;
      name: string;
      domain: string;
      state: string;
      duration_text: string | null;
      objective_ids: string[];
    }>;
    objectives: Array<{
      id: string;
      plan_id: string;
      text: string;
      sequence: number | null;
      horizon_weeks: number | null;
    }>;
    dimension_labels: Record<string, string>;
  };
  lab_reading: {
    counterfactual_item_weighted: Record<string, number | null>;
    tie_break_order: string[];
    coverage_bands: { insufficient_below: number; provisional_below: number; rule_ids: string[] };
    composition?: Record<
      string,
      Array<{
        key: string;
        label: string;
        score: number | null;
        items_scoreable: number;
        items_scored: number;
        weight: number;
        contribution: number | null;
      }>
    >;
    thresholds?: Record<string, { score: number; state: string; distance: number } | null>;
    decisive_rules?: Array<{ label: string; id: string }>;
    equal_dimension_weight?: boolean;
    item_trace?: LabItemTrace[];
    state_bands?: Array<{ rule_id: string; min: number; max: number; state: string }>;
    domain_formula?: Record<
      string,
      { dimension_scores: Array<number | null>; method: 'DIMENSION_EQUAL'; result: number | null; display: number | null }
    >;
  };
};

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

export type LabComparison = {
  expectation: LabExpectation | null;
  comparison: {
    first_divergence: string | null;
    rows: Array<{ key: string; result: string; possible_consequence: boolean }>;
    agreements?: Array<{ concept: string; text: string }>;
    differences?: Array<{ concept: string; expected: string; actual: string; text: string }>;
  } | null;
};

export type LabAssessments = {
  purpose: Array<{
    stage: string;
    notes: string | null;
    evidenceRefs: string[];
    confidence?: string;
    revision: number;
  }>;
  safety: unknown[];
  matrix_purpose: string;
};

export type LabExperience = {
  projection: {
    direction: { statement: string | null; display: string; missing: boolean; source: string | null };
    profile: {
      domains: Array<{ key: string; score_display: number | null; state: string | null; classification: string }>;
    };
    purpose: { matrix_note: string; rafa_stage: string | null; dimension_scores_lab_only: unknown[] };
    focus: {
      matrix_candidate: string | null;
      matrix_candidate_reason: string | null;
      selected_focus: string | null;
      selection_source: string | null;
      selection_reason: string | null;
      awaiting_selection: boolean;
      tie_break_provisional: boolean;
    };
    route: {
      kind: string | null;
      matrix_plan_id: string | null;
      product_route_id: string | null;
      title: string | null;
      duration_text: string | null;
      source: string | null;
      needs_curation: boolean;
    };
    objective: {
      available: Array<{ id: string; source: string }>;
      selected_id: string | null;
      source: string | null;
      needs_human_curation: boolean;
    };
    action: { text: string | null; source: string | null; executable: boolean };
    cycle: { start: string; end: string; billing_cadence: string };
    restrictions: string[];
    safety: { blocked: boolean; reasons: string[] };
  };
  user_view: {
    direction: string;
    cycle: { label: string };
    focus: string;
    why_now: string;
    objective: string;
    this_week: string;
    map: Array<{ key: string; state: string | null }>;
  };
};

export type LabCatalogPlan = {
  id: string;
  name: string;
  domain: string;
  state: string;
  duration_text: string | null;
  objective_ids: string[];
};

export type LabCatalogObjective = {
  id: string;
  plan_id: string;
  text: string;
  sequence: number | null;
  horizon_weeks: number | null;
};

export type LabCatalog = {
  definition_ref: string;
  plans: LabCatalogPlan[];
  objectives: LabCatalogObjective[];
  dimension_labels: Record<string, string>;
  questionnaire?: {
    domains: Array<{
      key: string;
      total: number;
      sections: Array<{ key: string; label: string; question_ids: string[] }>;
    }>;
    purpose_modules: Array<{ key: string; name: string; order: number }>;
    phases?: Array<{
      key: string;
      chip: string;
      title: string;
      help: string | null;
      question_ids: string[];
      modules?: Array<{ key: string; name: string; question_ids: string[] }>;
    }>;
    total_served: number;
  };
};

export type LabChangeOption = {
  kind: string;
  target_id: string;
  label: string;
  description: string;
  value_kind: string;
  current: unknown;
  min?: number;
  max?: number;
  step?: number;
  options?: Array<{ value: string | number | boolean; label: string; help?: string }>;
  range_note?: string;
  rule_id?: string;
  needs_copy_definition?: boolean;
};

export type LabChangeOptions = {
  definition_ref: string;
  options: LabChangeOption[];
  questions: Array<{
    id: string;
    text: string;
    domain: string;
    dimension: string;
    dimension_label: string;
    weight: number;
    active: boolean;
    scoreable: boolean;
    served: boolean;
  }>;
  inert_interpretation_params: Array<{ interpretation_id: string; param: string; value: unknown }>;
};

export type LabGuidedChangeRequest = {
  kind: string;
  target_id: string;
  to: unknown;
  reason: string;
};

export type LabChangeSetRow = {
  id: string;
  number: number;
  reason: string;
  status: string;
  finding: { number: number; title: string } | null;
  candidate_ref: string | null;
  replay_id: string | null;
  operations: string[];
};

export type LabReplayComparison = {
  id: string;
  changeset_id: string;
  changeset_status: string | null;
  changeset_reason: string | null;
  base_definition_ref: string;
  candidate_definition_ref: string;
  summary?: {
    improves: number;
    worsens: number;
    unchanged: number;
    needs_review: number;
    worsens_without_verdict: number;
  };
  keep_blocked?: boolean;
  results: Array<{
    run_id: string;
    case_label: string;
    attribution: string;
    verdict: string | null;
    rafa_priority?: string | null;
    impact?: string;
    critical_regression?: boolean;
    flags: Record<string, unknown>;
    domains: Array<{
      key: string;
      from_score: number | null;
      to_score: number | null;
      from_state: string | null;
      to_state: string | null;
      from_classification: string;
      to_classification: string | null;
    }>;
    priority: { from: string | null; to: string | null };
    plan: { from: string | null; to: string | null; from_name: string | null; to_name: string | null };
    safety: { from: number; to: number };
  }>;
};

export type LabGuidedChangeResult = {
  changeset_id: string;
  candidate_ref: string;
  summary: string;
  comparison: LabReplayComparison;
};

export type LabWorkspace = {
  id: string;
  baseDefinitionRef: string;
  pendingOperations: unknown[];
  changeSets?: Array<{ id: string; number: number; status: string; targetDefinitionRef?: string | null }>;
};

export type LabReplay = {
  id: string;
  changesetId: string;
  results: Array<{
    id: string;
    sourceRunId: string;
    attribution: string;
    verdict: string | null;
    flags: Record<string, unknown>;
  }>;
  changeset?: { id: string; status: string };
};

export type LabDefinitionRow = {
  definition_ref: string;
  status: string;
  definition_sha256: string;
};

export type LabPairCompare = {
  available: boolean;
  pair?: string | null;
  this_side?: string | null;
  other_key?: string | null;
  other_run_id?: string;
  other_label?: string;
  other_revealed?: boolean;
  changed_questions?: Array<{
    questionId: string;
    text?: string;
    a: unknown;
    b: unknown;
    a_label?: string | null;
    b_label?: string | null;
    a_score?: number | null;
    b_score?: number | null;
    aStatus: string;
    bStatus: string;
  }>;
  dimensions?: Record<string, { a: number | null; b: number | null; label: string }>;
  domains?: Record<
    string,
    { a_score: number | null; b_score: number | null; a_state: string | null; b_state: string | null }
  >;
  priority?: { a: string | null; b: string | null };
  plans?: { a: string | null; b: string | null; a_name?: string | null; b_name?: string | null };
  alerts?: { a: string; b: string };
  implied_rule?: string | null;
  diagnostic_equal?: boolean;
  direction?: {
    signal_a: string;
    signal_b: string;
    fingerprint_equal: boolean;
    methodology_version: string;
  };
  portraits?: { a: string | null; b: string | null };
  columns?: { a: string; b: string };
};

export type LabFinding = {
  id: string;
  number: number;
  code: string;
  title: string;
  summary: string;
  layer: string;
  scope?: 'MATRIX' | 'DIRECCION' | 'INTERFAZ';
  blocks_matrix?: boolean;
  severity: string;
  status: string;
  stored_status?: string;
  ready_to_open?: boolean;
  open_missing?: string[];
  hypothesis: string | null;
  current_behavior: string;
  rafa_expected_behavior: string;
  related_rules: string[];
  evidence_ids: string[];
  decision: string | null;
  decision_reason: string | null;
  cases: Array<{
    id: string;
    label: string;
    casebook_key: string | null;
    supports_finding?: string | null;
    rafa_criterion?: string | null;
    matrix_result?: string | null;
    difference?: string | null;
  }>;
  experiments: Array<{
    id: string;
    reason: string;
    status: string;
    candidate_ref: string | null;
    replay_id?: string | null;
    replay_summary?: { improves: number; worsens: number; unchanged: number; needs_review: number };
  }>;
  observations?: Array<{
    id: string;
    question_id: string;
    issue_types: string[];
    note: string;
    proposal: string | null;
    status: string;
    case_id: string | null;
  }>;
  content_change_required?: boolean;
  consistencies: Array<{
    id: string;
    acceptedCaseKey: string;
    rejectedCaseKey: string;
    answer: string | null;
    notes: string | null;
  }>;
};

export type LabFindingList = {
  summary: { open: number; needs_more_cases: number; in_test: number; decided: number };
  findings: LabFinding[];
};

export type LabCandidateList = {
  base: { definition_ref: string; status: string };
  candidates: Array<{
    definition_ref: string;
    status: string;
    base_definition_ref: string | null;
    changeset_id: string | null;
    reason: string | null;
    finding: { id: string; number: number; title: string } | null;
    cases_tested: number;
    impacts: { unchanged: number; improves: number; worsens: number; needs_review: number };
    last_replay_id: string | null;
  }>;
};

export type LabContracts = {
  definition_ref: string;
  goldens: string;
  safety_invariants: string;
  engine_tests: string;
  determinism: string;
  baseline_immutable: boolean;
  overall: string;
};

export type LabObservation = {
  id: string;
  question_id: string;
  case_id: string | null;
  run_id: string | null;
  case_label: string | null;
  casebook_key: string | null;
  issue_types: string[];
  note: string;
  proposal: string | null;
  status: string;
  finding_id: string | null;
  created_at: string;
  kind?: string;
  suggested_operation?: { op?: string; to?: unknown; label?: string } | null;
};

export type LabObservationList = {
  questions: Array<{
    question_id: string;
    text: string;
    domain: string | null;
    dimension: string | null;
    dimension_label?: string | null;
    cases: Array<{
      case_id: string | null;
      label: string;
      aspects?: Record<string, string | null>;
      proposal?: string | null;
      proposed_wording?: string | null;
      kind?: string;
    }>;
    aspect_counts?: Record<string, number>;
    engine_testable?: boolean;
    issue_types: string[];
    status: string;
    count: number;
    observations: LabObservation[];
  }>;
};

export type LabParentCompare = LabPairCompare & {
  kind: string;
  parent: { id: string; label: string; casebook_key: string | null; run_id: string } | null;
};

export type LabDeliveryReport = {
  recommended_version: LabReadiness['candidate'];
  keep: Array<{ code: string; title: string; current: string }>;
  change: Array<{ code: string; title: string; current: string; proposed: string; evidence: string[] }>;
  questions_to_correct: Array<{ question_id: string; problem: string[]; proposed: string | null; note: string; cases: string | null }>;
  questions_to_remove: Array<{ question_id: string; note: string }>;
  questions_to_add: Array<{ note: string; proposal: string | null }>;
  rules_to_change: Array<{ rules: string[]; current: string; proposed: string; cases: string[] }>;
  open_findings: LabFinding[];
  known_limitations: LabFinding[];
  cases_reviewed: Array<{ id: string; label: string; casebook_key: string | null; verdict: string | null }>;
  cases_created: Array<{ id: string; label: string; kind: string }>;
  regression: { replay_id: string; cases: number } | null;
  decision: LabReadiness['decision'];
  readiness: LabReadiness;
  sections?: Array<{ title: string; items: unknown[]; empty: boolean }>;
};

export type LabReadiness = {
  contracts: LabContracts;
  families: Array<{ id: string; label: string; keys?: string[]; case_keys?: string[]; core: boolean; status: string }>;
  questionnaire?: {
    reviewed: number;
    pending: number;
    needs_more_cases: number;
    converted: number;
    critical_content: number;
    important_content: number;
    missing_questions: number;
    blocking: number;
  };
  findings: {
    critical_open: number;
    important_open: number;
    needs_more_cases: number;
    accepted_for_candidate: number;
    known_limitations: number;
  };
  candidate: {
    definition_ref: string;
    changeset_id: string | null;
    cases_replayed: number;
    open_regressions: number;
    technical_status: string;
  } | null;
  decision: { decision: string; note: string | null; decidedBy: string; decidedAt: string } | null;
  missing: string[];
  ready_copy: string | null;
  integrity?: {
    without_role: number;
    broken_config: number;
    without_current_consumer: number;
  };
  next_layers?: {
    direction: string;
    intervention: string;
  };
  review?: LabReviewAgenda;
};

export type LabDecisionReport = {
  works: LabFinding[];
  needs_change: LabFinding[];
  unknown: LabFinding[];
  known_limitations: LabFinding[];
  candidate: LabReadiness['candidate'];
  advance: LabReadiness;
};

export type LabWorkSession = {
  id: string;
  title: string;
  casebookKeys: string[];
  closeObservationBeforeChanges: boolean;
  createdBy: string;
  createdAt: string;
  closedAt: string | null;
  summary: {
    cases_reviewed: number;
    matches: number;
    partial: number;
    important: number;
    findings_new: number;
    findings_reinforced: number;
    open_questions: number;
    worth_testing: number;
  } | null;
};
