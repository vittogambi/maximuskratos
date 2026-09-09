import type { ResultSnapshot } from '@mk/matrix-engine';

export const EXPERIENCE_REF_V0 = 'experience-v0.1@1';
export const EXPERIENCE_ID_V0 = 'experience-v0.1';
export const PRODUCT_HYPOTHESIS = 'PRODUCT_HYPOTHESIS_v0';

export type ProvenanceSource =
  | 'MATRIX'
  | 'LAB_INTERPRETATION'
  | 'PRODUCT_HYPOTHESIS'
  | 'RAFA_JUDGMENT'
  | 'USER_CHOICE'
  | 'USER_SELF_ASSESSMENT'
  | 'CASE'
  | 'SAFETY'
  | 'DATA_GAP'
  | 'CATALOG';

export type FocusKind = 'MENTALIDAD' | 'RELACIONES' | 'FINANZAS' | 'CUERPO' | 'PURPOSE' | 'NONE';

export type PurposeStage = 'DIFUSO' | 'HIPOTETICO' | 'EN_CONTRASTE' | 'INTEGRADO' | 'UNSURE';

export type RestrictionCode =
  | 'SAFETY_BLOCKED'
  | 'INSUFFICIENT_DATA'
  | 'MISSING_FOCUS_DECISION'
  | 'MISSING_OBJECTIVE'
  | 'MISSING_ACTION'
  | 'MISSING_DIRECTION'
  | 'ROUTE_NEEDS_CURATION'
  | 'NEEDS_HUMAN_CURATION';

export interface Sourced<T> {
  value: T;
  source: ProvenanceSource;
  reason?: string;
}

export interface ExperienceHypothesis {
  id: string;
  status: typeof PRODUCT_HYPOTHESIS;
  statement: string;
}

export interface ExperienceDefinition {
  experience_id: string;
  revision: number;
  experience_ref: string;
  sha256: string;
  status: 'CANDIDATE' | 'ACCEPTED_CANDIDATE' | 'REJECTED' | 'PUBLISHED';
  purpose_role: ExperienceHypothesis;
  direction_model: ExperienceHypothesis;
  focus_resolution: ExperienceHypothesis;
  route_model: ExperienceHypothesis;
  cycle_projection: ExperienceHypothesis;
  objective_selection: ExperienceHypothesis;
  action_model: ExperienceHypothesis;
  hypotheses: ExperienceHypothesis[];
}

export interface PurposeAssessmentInput {
  stage: PurposeStage | null;
  evidence_refs?: string[];
  confidence?: string;
  notes?: string;
}

export interface DirectionInput {
  statement: string | null;
  revision?: number;
  source?: ProvenanceSource;
  declined_for_now?: boolean;
}

export interface FocusSelectionInput {
  selected_focus: FocusKind | null;
  selection_source: ProvenanceSource | null;
  selection_reason: string | null;
}

export interface ObjectiveSelectionInput {
  objective_id: string | null;
  source: ProvenanceSource | null;
}

export interface ActionInput {
  text: string | null;
  source: ProvenanceSource | null;
}

export interface SubscriptionContext {
  period_start: string;
  period_end?: string;
  billing_cadence: 'MONTHLY' | 'QUARTERLY' | 'SEMIANNUAL' | 'ANNUAL';
}

export interface ProjectExperienceInput {
  resultSnapshot: ResultSnapshot;
  purposeAssessment?: PurposeAssessmentInput | null;
  direction?: DirectionInput | null;
  focusSelection?: FocusSelectionInput | null;
  objectiveSelection?: ObjectiveSelectionInput | null;
  action?: ActionInput | null;
  subscriptionContext: SubscriptionContext;
  experienceDefinition: ExperienceDefinition;
}

export interface ExperienceProjection {
  provenance: {
    matrix_definition_ref: string;
    matrix_definition_sha256: string;
    engine_semver: string;
    experience_ref: string;
    experience_sha256: string;
    hypothesis: typeof PRODUCT_HYPOTHESIS;
  };
  direction: {
    statement: string | null;
    display: string;
    missing: boolean;
    source: ProvenanceSource;
    blocks_product: false;
  };
  profile: {
    domains: Array<{
      key: string;
      score_display: number | null;
      state: string | null;
      classification: string;
      source: 'MATRIX';
    }>;
    scores_are_hero: false;
  };
  purpose: {
    matrix_stage: null;
    matrix_note: string;
    rafa_stage: PurposeStage | null;
    dimension_scores_lab_only: ResultSnapshot['purpose']['dimension_scores'];
    never_user_purpose_score: true;
  };
  focus: {
    matrix_candidate: string | null;
    matrix_candidate_reason: string | null;
    tie_break_provisional: boolean;
    selected_focus: FocusKind | null;
    selection_source: ProvenanceSource | null;
    selection_reason: string | null;
    awaiting_selection: boolean;
  };
  route: {
    kind: 'MATRIX_PLAN' | 'PRODUCT_ROUTE' | null;
    matrix_plan_id: string | null;
    product_route_id: string | null;
    title: string | null;
    duration_text: string | null;
    source: ProvenanceSource | null;
    needs_curation: boolean;
  };
  cycle: {
    number: 1;
    start: string;
    end: string;
    status: 'PROJECTED';
    source: typeof PRODUCT_HYPOTHESIS;
    billing_cadence: SubscriptionContext['billing_cadence'];
    monthly_even_if_prepaid: true;
  };
  objective: {
    available: Array<{ id: string; source: 'MATRIX' | 'CATALOG' }>;
    selected_id: string | null;
    source: ProvenanceSource | null;
    needs_human_curation: boolean;
  };
  action: {
    text: string | null;
    source: ProvenanceSource | null;
    executable: boolean;
  };
  restrictions: RestrictionCode[];
  safety: {
    blocked: boolean;
    reasons: string[];
    source: 'SAFETY';
  };
}

export interface UserView {
  direction: string;
  cycle: { start: string; end: string; label: string };
  focus: string;
  why_now: string;
  objective: string;
  this_week: string;
  map: Array<{ key: string; state: string | null }>;
}

export interface ProductReviewInput {
  verdicts: Record<string, 'CORRECT' | 'PARTIAL' | 'INCORRECT' | 'UNCERTAIN'>;
  purpose_feels: 'CENTRAL' | 'PRESENT_BUT_WEAK' | 'DECORATIVE' | 'OVERPOWERING' | 'UNCERTAIN';
  still_mk: 'YES' | 'PARTLY' | 'NO' | 'UNSURE';
  first_product_divergence: string;
  what_would_change?: string | null;
  what_was_missing?: string | null;
}
