import { POLICY_CORE_PURPOSE_IDS } from './constants';
import type { InterpretationDefinition, JsonValue } from './types';

function interp(
  id: string,
  params: Record<string, JsonValue>,
): InterpretationDefinition {
  return { id, status: 'PROVISIONAL', params };
}

export function buildInterpretations(input: {
  policyCoreQuestionIds: string[];
}): InterpretationDefinition[] {
  return [
    interp('LAB-ALIAS-01', {
      pairs: 5,
      fuse_security: true,
    }),
    interp('LAB-NORM-01', {
      unscoreable_question_ids: ['D-CUE-07'],
      unscoreable_reason: 'SCALE_HAS_NO_SCORE_MAP',
    }),
    interp('LAB-SCORE-01', {
      domain_aggregation: 'DIMENSION_EQUAL',
    }),
    interp('LAB-COV-01', {
      denominator: 'DEFINITION',
      independent_of_policy: true,
    }),
    interp('LAB-COV-02', {
      critical_dimensions: 'NOT_APPLICABLE',
    }),
    interp('LAB-COV-03', {
      compare_on: 'EXACT_RATIO',
      precision: 4,
    }),
    interp('LAB-STATE-01', {
      rounding: 'HALF_UP',
      precision: 0,
      apply_before_band: true,
    }),
    interp('LAB-OVR-01', {
      alta_as: 'CAP',
    }),
    interp('LAB-OVR-02', {
      critica_unclassified: 'FORCE_CONTENCION',
      score: null,
    }),
    interp('LAB-OVR-03', {
      alta_unclassified: 'STATE_NULL',
      plan: null,
    }),
    interp('LAB-SAFETY-01', {
      qualitative_null: 'PARTIAL_FIRE_AND_OVERRIDE',
      qualitative_true: 'FULL_FIRE_AND_OVERRIDE',
      qualitative_false: 'SUPPRESSED_BY_INPUT_NO_OVERRIDE',
    }),
    interp('LAB-SAFETY-02', {
      executable_recommendation: 'BLOCKED_WHEN_ALERT_ACTIVE',
      keep_catalog_lookup: true,
      filter_activities: false,
    }),
    interp('LAB-SAFETY-03', {
      unanswered_risk: 'NOT_EVALUATED',
    }),
    interp('LAB-PRIORITY-01', {
      tier_order: ['CRITICA', 'ALTA', 'STATE', 'SCORE', 'DOMAIN_ORDER'],
      domain_tie_break: ['MENTALIDAD', 'CUERPO', 'FINANZAS', 'RELACIONES'],
      exclude_domains: ['PROPÓSITO'],
      unclassified_can_be_priority: false,
    }),
    interp('LAB-PRIORITY-02', {
      pick: 'SECOND_OF_SAME_ORDER',
      must_be_classified: true,
    }),
    interp('LAB-PURPOSE-01', {
      domain_score: false,
      domain_state: false,
      domain_plan: false,
      participates_in_priority: false,
    }),
    interp('LAB-GLOBAL-01', {
      average: 'CLASSIFIED_DOMAINS',
      narrative_only: true,
      label: 'NOT_APPLICABLE',
    }),
    interp('LAB-RECO-01', {
      recommend: ['priority', 'maintenance'],
      catalog_lookup_others: true,
    }),
    interp('LAB-POLICY-01', {
      granularity: 'FULL_INSTRUMENT',
      trigger_values: [1, 2],
      dedupe_same_domain: true,
    }),
    interp('LAB-POLICY-02', {
      include_instruments: ['AUD-001', 'D-MEN-001'],
      include_question_ids:
        input.policyCoreQuestionIds.length > 0
          ? input.policyCoreQuestionIds
          : [...POLICY_CORE_PURPOSE_IDS],
    }),
  ];
}
