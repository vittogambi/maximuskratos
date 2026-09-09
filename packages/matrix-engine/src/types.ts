export const ENGINE_SEMVER = '0.1.0';
export const IMPORTER_VERSION = '0.1.0';

export const EXPECTED_SOURCE_SHA256 =
  '006ec491afbf95f8a9cfbb821a3703bd791e216063f63bb495b10f794a249180';

export const LAB_INTERPRETATION_IDS = [
  'LAB-ALIAS-01',
  'LAB-NORM-01',
  'LAB-SCORE-01',
  'LAB-COV-01',
  'LAB-COV-02',
  'LAB-COV-03',
  'LAB-STATE-01',
  'LAB-OVR-01',
  'LAB-OVR-02',
  'LAB-OVR-03',
  'LAB-SAFETY-01',
  'LAB-SAFETY-02',
  'LAB-SAFETY-03',
  'LAB-PRIORITY-01',
  'LAB-PRIORITY-02',
  'LAB-PURPOSE-01',
  'LAB-GLOBAL-01',
  'LAB-RECO-01',
  'LAB-POLICY-01',
  'LAB-POLICY-02',
] as const;

export type LabInterpretationId = (typeof LAB_INTERPRETATION_IDS)[number];

export const HASH_INCLUDED_KEYS = [
  'activities',
  'alias_map',
  'coverage_bands',
  'dimensions',
  'domains',
  'interpretations',
  'metrics',
  'not_executed',
  'objectives',
  'plans',
  'purpose_modules',
  'questions',
  'risks',
  'rules',
  'scales',
  'state_bands',
] as const;

export type DefinitionStatus =
  | 'CANDIDATE'
  | 'ACCEPTED_CANDIDATE'
  | 'REJECTED'
  | 'PUBLISHED';

export type JsonValue =
  | null
  | boolean
  | number
  | string
  | JsonValue[]
  | { [key: string]: JsonValue };

export interface ScaleAnchor {
  value: number | string | null;
  label: string;
  score: number | null;
}

export interface ScaleDefinition {
  id: string;
  kind: 'SCALE_5' | 'YES_NO' | 'NUMBER' | 'TEXT' | 'CHOICE';
  anchors: ScaleAnchor[];
  scoreable: boolean;
}

export interface DomainDefinition {
  key: string;
  role: 'NUCLEO' | 'SOPORTE';
  has_plans: boolean;
}

export interface DimensionDefinition {
  key: string;
  domain: string;
  labels: string[];
  inverse: boolean;
  critical: boolean;
}

export interface AliasMapping {
  from: string;
  to: string;
  interpretation: 'LAB-ALIAS-01';
}

export interface QuestionRisk {
  question_id: string;
  domain: string;
  severity: 'MEDIA' | 'ALTA' | 'CRITICA';
  condition_text: string;
  numeric_clause: { op: 'in'; values: number[] };
  qualitative_clause: string | null;
  qualitative_structured: boolean;
  immediate_action: string;
  referral: string;
  interpretation: 'LAB-SAFETY-01' | null;
}

export interface QuestionDefinition {
  id: string;
  row_version: string;
  active: boolean;
  instrument: string;
  phase: string;
  domain: string;
  dimension: string;
  variable_kind: string;
  response_kind: string;
  scale_id: string;
  weight: number;
  inverse: boolean;
  scoreable: boolean;
  unscoreable_reason: string | null;
  risk: QuestionRisk | null;
  plan_selector: string | null;
  objective_rule: string | null;
  metric_key: string | null;
  metric_key_resolved: boolean;
  text: string;
  mk_role: string | null;
  intervention_level: string | null;
}

export interface RuleDefinition {
  id: string;
  category: string;
  condition: string;
  result: string;
  justification: string;
  executable: boolean;
  not_executable_reason: string | null;
  params: Record<string, JsonValue>;
}

export interface StateBand {
  state: string;
  min: number;
  max: number;
  rule_id: string;
}

export interface CoverageBands {
  insufficient_below: number;
  provisional_below: number;
  rule_ids: string[];
}

export interface PlanDefinition {
  id: string;
  domain: string;
  state: string;
  name: string;
  max_objectives: number;
  duration_text: string;
  mk_role: string | null;
  entry_criteria_text: string;
  exit_criteria_text: string;
  objective_ids: string[];
}

export interface ObjectiveDefinition {
  id: string;
  plan_id: string;
  sequence: number;
  type: string;
  text: string;
  metric_id: string | null;
  target: string | null;
  horizon_weeks: number | null;
  activity_ids: string[];
}

export interface ActivityDefinition {
  id: string;
  objective_id: string;
  text: string;
  cadence: string | null;
  minutes: number | null;
  evidence: string | null;
  minimum_version: string | null;
  comb_barrier: string | null;
}

export interface MetricDefinition {
  id: string;
  domain: string;
  name: string;
  direction: 'up' | 'down' | 'unknown';
}

export interface PurposeModule {
  order: number;
  key: string;
  name: string;
  quality_rule: string;
}

export interface InterpretationDefinition {
  id: string;
  status: 'PROVISIONAL';
  params: Record<string, JsonValue>;
}

export interface MatrixSource {
  file: string;
  sha256: string;
  importer_version: string;
}

export interface MatrixDefinition {
  definition_id: string;
  revision: number;
  definition_ref: string;
  definition_sha256: string;
  status: DefinitionStatus;
  base_definition_ref: string | null;
  changeset_id: string | null;
  source: MatrixSource;
  domains: DomainDefinition[];
  dimensions: DimensionDefinition[];
  alias_map: AliasMapping[];
  scales: ScaleDefinition[];
  questions: QuestionDefinition[];
  risks: QuestionRisk[];
  rules: RuleDefinition[];
  state_bands: StateBand[];
  coverage_bands: CoverageBands;
  plans: PlanDefinition[];
  objectives: ObjectiveDefinition[];
  activities: ActivityDefinition[];
  metrics: MetricDefinition[];
  purpose_modules: PurposeModule[];
  interpretations: InterpretationDefinition[];
  not_executed: string[];
}

export type ResponseStatus =
  | 'ANSWERED'
  | 'SKIPPED_BY_USER'
  | 'NOT_SERVED_BY_POLICY'
  | 'INVALID';

export interface ResponseInput {
  questionId: string;
  status: ResponseStatus;
  rawValue: number | string | null;
  qualitativeConfirmed?: boolean | null;
}

export type ValidationSeverity = 'ERROR' | 'WARNING';

export interface ValidationIssue {
  severity: ValidationSeverity;
  code: string;
  message: string;
  ids?: string[];
}

export interface ImportCounts {
  questions: number;
  questions_active: number;
  estado_weighted: number;
  scoreable: number;
  risks: number;
  inverse: number;
  domains: Record<string, number>;
  dimensions_raw: number;
  dimensions_canonical: number;
  scales: number;
  rules: number;
  plans: number;
  objectives: number;
  activities: number;
  metrics: number;
}

export interface ImportReport {
  definition_ref: string;
  definition_sha256: string;
  source: string;
  source_sha256: string;
  engine: string;
  counts: ImportCounts;
  errors: ValidationIssue[];
  warnings: ValidationIssue[];
  publishable: boolean;
}

export interface ImportResult {
  definition: MatrixDefinition;
  report: ImportReport;
  canonicalJson: string;
}

export class MatrixImportError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'MatrixImportError';
  }
}

export interface BranchRule {
  trigger_question_id: string;
  trigger_values: number[];
  serve_instrument: string;
  source: 'MATRIX' | 'LAB_INTERPRETATION_v0';
}

export interface PolicyDefinition {
  id: string;
  kind: 'STATIC' | 'BRANCHING';
  include?: {
    phases?: string[];
    instruments?: string[];
    question_ids?: string[];
  };
  branches?: BranchRule[];
}

export type TraceSource =
  | 'MATRIX'
  | 'LAB_INTERPRETATION_v0'
  | 'NOT_APPLICABLE'
  | 'DATA_GAP';

export type TraceStep =
  | 'ROOT'
  | 'RESPONSE_VALIDATION'
  | 'SAFETY_EVAL'
  | 'NORMALIZE_ITEM'
  | 'DIMENSION_SCORE'
  | 'DIMENSION_COVERAGE'
  | 'DOMAIN_COVERAGE'
  | 'DOMAIN_SCORE'
  | 'STATE_BAND'
  | 'OVERRIDE'
  | 'PRIORITY'
  | 'RECOMMENDATION'
  | 'GLOBAL';

export interface TraceRef {
  kind: 'question' | 'dimension' | 'domain' | 'node';
  id: string;
}

export interface TraceNode {
  step: TraceStep;
  node_id: string;
  inputs: TraceRef[];
  output: unknown;
  rule_id: string | null;
  source: TraceSource;
  reason: string;
  children?: TraceNode[];
}

export type ConditionConfirmed =
  | 'FULL'
  | 'PARTIAL'
  | 'SUPPRESSED_BY_INPUT';

export type StateSource = 'BAND' | 'FORCED_BY_R-OVR-01' | 'CAPPED_BY_R-OVR-02';

export interface SafetyAlert {
  question_id: string;
  domain: string;
  severity: 'MEDIA' | 'ALTA' | 'CRITICA';
  fired: boolean;
  condition_confirmed: ConditionConfirmed | null;
  condition_text: string;
  immediate_action: string;
  referral: string;
  override_applied: 'R-OVR-01' | 'R-OVR-02' | null;
}

export interface SafetySnapshot {
  alerts: SafetyAlert[];
  not_evaluated: string[];
  risk_coverage: number;
  safety_incomplete: boolean;
}

export interface DimensionResult {
  key: string;
  domain: string;
  score: number | null;
  score_display: number | null;
  items_scored: number;
  items_scoreable: number;
  coverage: number;
  inverse: boolean;
}

export interface DomainResult {
  key: string;
  coverage_definition: number;
  coverage_served: number | null;
  classification: 'NO_CLASIFICADO' | 'PROVISIONAL' | 'INTERPRETABLE';
  score: number | null;
  score_display: number | null;
  state_from_band: string | null;
  state_final: string | null;
  state_source: StateSource | null;
  state_rule_id: string | null;
  distance_to_band_edge: number | null;
  dimensions_used: number;
}

export interface PriorityCandidate {
  domain: string;
  tier: 'CRITICA' | 'ALTA' | 'STATE';
  state: string | null;
  score_display: number | null;
  classified: boolean;
}

export interface PriorityResult {
  domain: string | null;
  tier: 'CRITICA' | 'ALTA' | 'STATE' | null;
  rule_id: 'LAB-PRIORITY-01';
  reason: string | null;
  candidates: PriorityCandidate[];
  criteria_not_evaluated: Array<{ criterion: string; reason: string }>;
  purpose_excluded: true;
  purpose_note: string;
}

export interface MaintenanceResult {
  domain: string | null;
  rule_id: 'LAB-PRIORITY-02';
}

export interface RecommendationItem {
  domain: string;
  plan_id: string | null;
  label: 'MATRIX RECOMMENDATION';
  objectives: string[];
  activities: string[];
  catalog_lookup: boolean;
  executable_recommendation: 'ALLOWED' | 'BLOCKED';
  blocked_reason: string | null;
  derivation_required: boolean;
  activities_unfiltered_warning: boolean;
  reason?: string;
}

export interface RecommendationsSnapshot {
  primary: RecommendationItem | null;
  maintenance: RecommendationItem | null;
  catalog_lookup: RecommendationItem[];
}

export interface PurposeSnapshot {
  domain_score: null;
  not_applicable_reason: 'LAB-PURPOSE-01';
  stage: null;
  stage_reason: string;
  dimension_scores: Array<{
    key: string;
    score: number | null;
    score_display: number | null;
    coverage: number;
  }>;
}

export interface GlobalSnapshot {
  average: number | null;
  narrative_only: true;
  label: null;
  label_reason: string;
}

export interface ResultSnapshot {
  definition_ref: string;
  definition_sha256: string;
  source_sha256: string;
  engine_semver: string;
  policy_id: string;
  responses_hash: string;
  generated_at: string;
  safety: SafetySnapshot;
  dimensions: DimensionResult[];
  domains: DomainResult[];
  priority: PriorityResult;
  maintenance: MaintenanceResult;
  recommendations: RecommendationsSnapshot;
  purpose: PurposeSnapshot;
  global: GlobalSnapshot;
  data_gaps: {
    unscoreable_items: Array<{ question_id: string; reason: string }>;
    invalid_responses: string[];
    unresolved_metric_keys: number;
  };
  narrative_completion: Array<{
    module: string;
    answered: number;
    total: number;
  }>;
  interpretations_used: string[];
  rules_not_executed: string[];
  trace: TraceNode;
  engine_warnings: string[];
}
