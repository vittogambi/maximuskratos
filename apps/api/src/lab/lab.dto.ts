import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Allow, IsArray, IsBoolean, IsIn, IsObject, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateCaseDto {
  @IsString()
  @MaxLength(160)
  label!: string;

  @IsIn(['REAL', 'SYNTHETIC', 'SELF', 'IMPORTED', 'SIMULATION'])
  kind!: 'REAL' | 'SYNTHETIC' | 'SELF' | 'IMPORTED' | 'SIMULATION';

  @IsOptional()
  @IsBoolean()
  blind?: boolean;

  @IsOptional()
  @IsString()
  expert_context?: string;
}

export class PatchCaseDto {
  @IsOptional()
  @IsString()
  @MaxLength(160)
  label?: string;

  @IsOptional()
  @IsString()
  expert_context?: string;

  @IsOptional()
  @IsBoolean()
  archived?: boolean;

  @IsOptional()
  @IsBoolean()
  blind?: boolean;
}

export class CreateRunDto {
  @IsOptional()
  @IsString()
  policy_id?: string;

  @IsOptional()
  @IsString()
  definition_ref?: string;
}

export class SaveResponseDto {
  @IsString()
  question_id!: string;

  @Allow()
  raw_value?: unknown;

  @IsOptional()
  @IsBoolean()
  qualitative_confirmed?: boolean | null;

  @IsOptional()
  @IsString()
  status?: string;
}

export class SaveResponsesBatchDto {
  @IsArray()
  responses!: SaveResponseDto[];
}

export class ExpectationDto {
  @IsObject()
  expected_states!: Record<string, string>;

  @IsString()
  expected_priority_domain!: string;

  @IsOptional()
  @IsString()
  expected_plan_id?: string | null;

  @IsOptional()
  @IsString()
  expected_plan_free_text?: string | null;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  expected_alerts?: string[];

  @IsString()
  expected_purpose_stage!: string;

  @IsIn(['ALTA', 'MEDIA', 'BAJA'])
  confidence!: 'ALTA' | 'MEDIA' | 'BAJA';

  @IsOptional()
  @IsString()
  notes?: string | null;

  // LAB-ONLY open reading, captured before the MK categories. Never reaches the engine.
  @IsOptional()
  @IsString()
  @MaxLength(4000)
  open_what_is_happening?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(4000)
  open_main_concern?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(4000)
  open_first_focus?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(4000)
  open_first_action?: string | null;

  @IsOptional()
  @IsString()
  personal_first_domain?: string | null;
}

export class GuidedChangeDto {
  @IsIn([
    'RULE_THRESHOLD',
    'QUESTION_WEIGHT',
    'QUESTION_ACTIVE',
    'DIMENSION_ALIAS',
    'INTERPRETATION',
  ])
  kind!:
    | 'RULE_THRESHOLD'
    | 'QUESTION_WEIGHT'
    | 'QUESTION_ACTIVE'
    | 'DIMENSION_ALIAS'
    | 'INTERPRETATION';

  @IsString()
  @MaxLength(200)
  target_id!: string;

  @Allow()
  to!: unknown;

  @IsString()
  @MaxLength(2000)
  reason!: string;
}

export class ReviewDto {
  @IsObject()
  verdicts!: Record<string, unknown>;

  @IsOptional()
  @IsString()
  first_wrong_layer?: string | null;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  root_cause_codes?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  evidence_refs?: string[];

  @IsOptional()
  @IsString()
  notes?: string | null;

  @IsOptional()
  @IsString()
  recommended_plan_id?: string | null;

  @IsOptional()
  @Allow()
  post_reveal_states?: Record<string, string> | null;

  @IsOptional()
  @IsString()
  post_reveal_priority_domain?: string | null;

  @IsOptional()
  @IsBoolean()
  no_methodological_problem?: boolean;

  @IsOptional()
  @IsString()
  case_verdict?: string | null;

  @IsOptional()
  @IsString()
  hypothesis?: string | null;

  @IsOptional()
  @IsString()
  disposition?: string | null;

  @IsOptional()
  @IsString()
  linked_finding_id?: string | null;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  doubted_rules?: string[];
}

export class ReviewVerdictDto {
  @IsString()
  case_verdict!: string;

  @IsOptional()
  @IsString()
  family_id?: string | null;

  @IsOptional()
  @IsBoolean()
  pair_conclusion?: boolean;

  @IsOptional()
  @IsString()
  hypothesis?: string | null;

  @IsOptional()
  @IsString()
  disposition?: string | null;

  @IsOptional()
  @IsString()
  linked_finding_id?: string | null;

  @IsOptional()
  @IsString()
  criterion_id?: string | null;
}

export class PurposeAssessmentDto {
  @IsIn(['DIFUSO', 'HIPOTETICO', 'EN_CONTRASTE', 'INTEGRADO', 'UNSURE'])
  stage!: 'DIFUSO' | 'HIPOTETICO' | 'EN_CONTRASTE' | 'INTEGRADO' | 'UNSURE';

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  evidence_refs?: string[];

  @IsIn(['ALTA', 'MEDIA', 'BAJA'])
  confidence!: 'ALTA' | 'MEDIA' | 'BAJA';

  @IsOptional()
  @IsString()
  notes?: string | null;
}

export class SafetyAssessmentDto {
  @IsString()
  question_id!: string;

  @IsString()
  verdict!: string;

  @IsOptional()
  @IsString()
  notes?: string | null;
}

export class CreateWorkspaceDto {
  @IsString()
  base_definition_ref!: string;
}

export class PatchOperationsDto {
  @IsArray()
  operations!: unknown[];
}

export class MaterializeDto {
  @IsString()
  @MaxLength(2000)
  reason!: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  related_case_ids?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  related_run_ids?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  related_review_ids?: string[];
}

export class CreateReplayDto {
  @IsOptional()
  @IsString()
  changeset_id?: string;

  @IsOptional()
  @IsString()
  base_ref?: string;

  @IsOptional()
  @IsString()
  candidate_ref?: string;

  @Allow()
  run_ids?: string[] | 'all';
}

export class ReplayVerdictDto {
  @IsIn(['BETTER', 'WORSE', 'NEUTRAL', 'UNCERTAIN'])
  verdict!: 'BETTER' | 'WORSE' | 'NEUTRAL' | 'UNCERTAIN';
}

export class AcceptChangeSetDto {
  @IsOptional()
  @IsBoolean()
  accept_safety_change?: boolean;

  @IsOptional()
  @IsString()
  safety_note?: string;
}

export class DirectionDto {
  @IsString()
  statement!: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsIn(['USER_CHOICE', 'RAFA_JUDGMENT', 'USER_SELF_ASSESSMENT', 'CASE', 'PRODUCT_HYPOTHESIS'])
  source?: 'USER_CHOICE' | 'RAFA_JUDGMENT' | 'USER_SELF_ASSESSMENT' | 'CASE' | 'PRODUCT_HYPOTHESIS';

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  evidence_refs?: string[];

  @IsOptional()
  @IsString()
  confidence?: string;
}

export class ProjectExperienceDto {
  @IsOptional()
  @IsString()
  selected_focus?: string | null;

  @IsOptional()
  @IsString()
  selection_source?: string | null;

  @IsOptional()
  @IsString()
  selection_reason?: string | null;

  @IsOptional()
  @IsString()
  objective_id?: string | null;

  @IsOptional()
  @IsString()
  action_text?: string | null;

  @IsOptional()
  @IsString()
  period_start?: string;

  @IsOptional()
  @IsIn(['MONTHLY', 'QUARTERLY', 'SEMIANNUAL', 'ANNUAL'])
  billing_cadence?: 'MONTHLY' | 'QUARTERLY' | 'SEMIANNUAL' | 'ANNUAL';

  @IsOptional()
  @IsBoolean()
  confirm_matrix_focus?: boolean;
}

export class ProductReviewDto {
  @IsObject()
  verdicts!: Record<string, 'CORRECT' | 'PARTIAL' | 'INCORRECT' | 'UNCERTAIN'>;

  @IsString()
  purpose_feels!: string;

  @IsString()
  still_mk!: string;

  @IsString()
  first_product_divergence!: string;

  @IsOptional()
  @IsString()
  what_would_change?: string | null;

  @IsOptional()
  @IsString()
  what_was_missing?: string | null;
}

export class RejectDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  note?: string;
}

export class CreateFindingDto {
  @IsString()
  @MaxLength(200)
  title!: string;

  @IsString()
  @MaxLength(4000)
  summary!: string;

  @IsString()
  layer!: string;

  @IsIn(['CRITICAL', 'IMPORTANT', 'MINOR', 'UNSURE'])
  severity!: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  hypothesis?: string | null;

  @IsString()
  current_behavior!: string;

  @IsString()
  rafa_expected_behavior!: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  related_rules?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  evidence_ids?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  case_ids?: string[];

  @IsOptional()
  @IsBoolean()
  content_change_required?: boolean;
}

export class PatchFindingDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  summary?: string;

  @IsOptional()
  @IsString()
  layer?: string;

  @IsOptional()
  @IsString()
  severity?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  hypothesis?: string | null;

  @IsOptional()
  @IsString()
  current_behavior?: string;

  @IsOptional()
  @IsString()
  rafa_expected_behavior?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  related_rules?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  evidence_ids?: string[];

  @IsOptional()
  @IsString()
  decision?: string | null;

  @IsOptional()
  @IsString()
  decision_reason?: string | null;
}

export class LinkFindingCasesDto {
  @IsArray()
  @IsString({ each: true })
  case_ids!: string[];
}

export class FindingConsistencyDto {
  @IsString()
  accepted_case_key!: string;

  @IsString()
  rejected_case_key!: string;

  @IsOptional()
  @IsString()
  answer?: string | null;

  @IsOptional()
  @IsString()
  notes?: string | null;
}

export class FindingChangeDto extends GuidedChangeDto {
  @IsString()
  run_id!: string;
}

export class CreateWorkSessionDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsArray()
  @IsString({ each: true })
  casebook_keys!: string[];

  @IsOptional()
  @IsBoolean()
  close_observation_before_changes?: boolean;
}

export class ComposeCandidateDto {
  @IsArray()
  @IsString({ each: true })
  changeset_ids!: string[];

  @IsString()
  @MaxLength(2000)
  reason!: string;
}

export class ReplayReviewedDto {
  @IsOptional()
  @IsString()
  changeset_id?: string;

  @IsOptional()
  @IsString()
  candidate_ref?: string;
}

export class ReadinessDecisionDto {
  @IsString()
  candidate_ref!: string;

  @IsIn(['READY', 'NOT_READY', 'NEED_MORE_CASES'])
  decision!: 'READY' | 'NOT_READY' | 'NEED_MORE_CASES';

  @IsOptional()
  @IsString()
  note?: string | null;
}

export class CreateMethodologyCaseDto {
  @IsString()
  @MaxLength(160)
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(4000)
  context?: string;

  @IsOptional()
  @IsIn(['SELF'])
  kind?: 'SELF';

  @IsOptional()
  @IsString()
  policy_id?: string;
}

export class DuplicateCaseDto {
  @IsOptional()
  @IsString()
  @MaxLength(160)
  label?: string;
}

const OBSERVATION_CODES = [
  'WORDING_OK',
  'WORDING_UNCLEAR',
  'WORDING_AMBIGUOUS',
  'WORDING_DOUBLE',
  'WORDING_UNNATURAL',
  'WORDING_OTHER',
  'SCALE_OK',
  'SCALE_MISMATCH',
  'SCALE_MISSING_OPTIONS',
  'SCALE_BAD_ANCHORS',
  'SCALE_NOT_REALITY',
  'SCALE_OTHER',
  'SCORE_OK',
  'SCORE_HIGHER',
  'SCORE_LOWER',
  'SCORE_INVERSE',
  'SCORE_NONE',
  'SCORE_UNSURE',
  'DOMAIN_OK',
  'DOMAIN_OTHER',
  'DIMENSION_OK',
  'DIMENSION_OTHER',
  'WEIGHT_OK',
  'WEIGHT_MORE',
  'WEIGHT_LESS',
  'WEIGHT_EXCLUDE',
  'SAFETY_OK',
  'SAFETY_FALSE_POSITIVE',
  'SAFETY_FALSE_NEGATIVE',
  'SAFETY_SEVERITY',
  'SAFETY_UNSURE',
] as const;

export class CreateObservationDto {
  @IsString()
  question_id!: string;

  @IsOptional()
  @IsArray()
  @IsIn(OBSERVATION_CODES, { each: true })
  issue_types?: string[];

  @IsOptional()
  @IsObject()
  aspects?: Record<string, string | null>;

  @IsOptional()
  @IsString()
  @MaxLength(4000)
  note?: string;

  @IsOptional()
  @IsString()
  @MaxLength(4000)
  proposal?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(4000)
  proposed_wording?: string | null;

  @IsOptional()
  @IsObject()
  fidelity?: {
    verdict: string;
    change_targets?: string[];
    intended_measure?: string | null;
  };
}

export class PatchMigrationDto {
  @IsOptional()
  @IsIn([
    'KEEP_V2',
    'KEEP_V2_PARTIAL',
    'RECOVER_MATRIX',
    'RECOVER_DIRECTION',
    'ARCHIVE_LEGACY',
    'NOT_APPLICABLE',
    'ADD_BANK',
    'REVISIT',
    'UNSURE',
    'CONFIRM',
    'CONFIRM_WITH_ADJUSTMENT',
    'REJECT',
  ])
  rafa_verdict?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(4000)
  rafa_note?: string | null;
}

export class PatchObservationDto {
  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  finding_id?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(4000)
  note?: string;

  @IsOptional()
  @IsString()
  @MaxLength(4000)
  proposal?: string | null;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  issue_types?: string[];
}

export class ObservationFindingDto {
  @IsOptional()
  @IsString()
  finding_id?: string;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  summary?: string;

  @IsOptional()
  @IsString()
  severity?: string;
}

export class FindingCaseLedgerDto {
  @IsString()
  case_id!: string;

  @IsOptional()
  @IsString()
  supports_finding?: string | null;

  @IsOptional()
  @IsString()
  rafa_criterion?: string | null;

  @IsOptional()
  @IsString()
  matrix_result?: string | null;

  @IsOptional()
  @IsString()
  difference?: string | null;
}

export class SeedDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  fixtures?: boolean;

  @IsOptional()
  @IsBoolean()
  casebook?: boolean;
}
