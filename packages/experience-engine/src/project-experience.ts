import type { ResultSnapshot } from '@mk/matrix-engine';
import { projectMonthlyCycle } from './cycle';
import type {
  ExperienceProjection,
  FocusKind,
  ProjectExperienceInput,
  RestrictionCode,
} from './types';
import { PRODUCT_HYPOTHESIS } from './types';

const PLANNED = ['MENTALIDAD', 'RELACIONES', 'FINANZAS', 'CUERPO'] as const;

function cloneSnapshot<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

export function isTieBreakProvisional(snapshot: ResultSnapshot): boolean {
  const planned = snapshot.domains.filter((domain) =>
    (PLANNED as readonly string[]).includes(domain.key),
  );
  if (planned.length !== 4) return false;
  const scores = planned.map((domain) => domain.score);
  if (scores.some((score) => score == null)) return false;
  const first = scores[0];
  const tied = scores.every((score) => score === first);
  return tied && snapshot.priority.domain === 'MENTALIDAD' && snapshot.priority.tier === 'STATE';
}

export function coverageInsufficient(snapshot: ResultSnapshot): boolean {
  const planned = snapshot.domains.filter((domain) =>
    (PLANNED as readonly string[]).includes(domain.key),
  );
  const allUnclassified = planned.every((domain) => domain.classification === 'NO_CLASIFICADO');
  return allUnclassified || snapshot.priority.domain == null;
}

export function safetyBlocksExecution(snapshot: ResultSnapshot): boolean {
  return (
    snapshot.recommendations.primary?.executable_recommendation === 'BLOCKED' ||
    snapshot.safety.alerts.some((alert) => alert.fired && alert.severity === 'CRITICA')
  );
}

export function projectExperience(input: ProjectExperienceInput): ExperienceProjection {
  const snapshot = input.resultSnapshot;
  const definition = input.experienceDefinition;
  const selected = input.focusSelection?.selected_focus ?? null;
  const awaiting = selected == null;
  const tieBreak = isTieBreakProvisional(snapshot);
  const insufficient = coverageInsufficient(snapshot);
  const blocked = safetyBlocksExecution(snapshot);
  const directionStatement = input.direction?.statement?.trim() || null;
  const directionMissing = directionStatement == null;
  const cycle = projectMonthlyCycle(input.subscriptionContext);
  const primary = snapshot.recommendations.primary;
  const restrictions: RestrictionCode[] = [];

  if (blocked) restrictions.push('SAFETY_BLOCKED');
  if (insufficient) restrictions.push('INSUFFICIENT_DATA');
  if (awaiting) restrictions.push('MISSING_FOCUS_DECISION');
  if (directionMissing) restrictions.push('MISSING_DIRECTION');

  let routeKind: ExperienceProjection['route']['kind'] = null;
  let matrixPlanId: string | null = null;
  let productRouteId: string | null = null;
  let routeTitle: string | null = null;
  let durationText: string | null = null;
  let routeSource: ExperienceProjection['route']['source'] = null;
  let needsCuration = false;
  const availableObjectives: Array<{ id: string; source: 'MATRIX' | 'CATALOG' }> = [];

  if (selected === 'PURPOSE') {
    routeKind = 'PRODUCT_ROUTE';
    productRouteId = 'PURPOSE_EXPLORATION';
    routeTitle = 'Exploración de propósito';
    routeSource = 'PRODUCT_HYPOTHESIS';
    needsCuration = true;
    restrictions.push('ROUTE_NEEDS_CURATION');
    restrictions.push('NEEDS_HUMAN_CURATION');
  } else if (
    selected &&
    selected !== 'NONE' &&
    (PLANNED as readonly string[]).includes(selected) &&
    !insufficient
  ) {
    if (primary?.plan_id && primary.domain === selected) {
      routeKind = 'MATRIX_PLAN';
      matrixPlanId = primary.plan_id;
      routeTitle = primary.plan_id;
      durationText = null;
      routeSource = 'MATRIX';
      for (const id of primary.objectives) {
        availableObjectives.push({ id, source: 'MATRIX' });
      }
    } else if (primary?.plan_id && selected === snapshot.priority.domain) {
      routeKind = 'MATRIX_PLAN';
      matrixPlanId = primary.plan_id;
      routeTitle = primary.plan_id;
      routeSource = 'CATALOG';
      for (const id of primary.objectives) {
        availableObjectives.push({ id, source: 'CATALOG' });
      }
    } else {
      needsCuration = true;
      restrictions.push('ROUTE_NEEDS_CURATION');
    }
  }

  const objectiveId = input.objectiveSelection?.objective_id ?? null;
  if (selected && selected !== 'NONE' && selected !== 'PURPOSE' && !objectiveId && availableObjectives.length) {
    restrictions.push('MISSING_OBJECTIVE');
  }
  if (selected === 'PURPOSE' && !objectiveId) {
    restrictions.push('MISSING_OBJECTIVE');
  }

  const actionText = input.action?.text?.trim() || null;
  if (selected && selected !== 'NONE' && !actionText) restrictions.push('MISSING_ACTION');

  const uniqueRestrictions = [...new Set(restrictions)];

  return {
    provenance: {
      matrix_definition_ref: snapshot.definition_ref,
      matrix_definition_sha256: snapshot.definition_sha256,
      engine_semver: snapshot.engine_semver,
      experience_ref: definition.experience_ref,
      experience_sha256: definition.sha256,
      hypothesis: PRODUCT_HYPOTHESIS,
    },
    direction: {
      statement: directionStatement,
      display: directionStatement ?? 'Todavía está en construcción.',
      missing: directionMissing,
      source: input.direction?.source ?? (directionMissing ? 'DATA_GAP' : 'USER_CHOICE'),
      blocks_product: false,
    },
    profile: {
      domains: snapshot.domains
        .filter((domain) => (PLANNED as readonly string[]).includes(domain.key))
        .map((domain) => ({
          key: domain.key,
          score_display: domain.score_display,
          state: domain.state_final,
          classification: domain.classification,
          source: 'MATRIX' as const,
        })),
      scores_are_hero: false,
    },
    purpose: {
      matrix_stage: null,
      matrix_note: snapshot.purpose.stage_reason,
      rafa_stage: input.purposeAssessment?.stage ?? null,
      dimension_scores_lab_only: cloneSnapshot(snapshot.purpose.dimension_scores),
      never_user_purpose_score: true,
    },
    focus: {
      matrix_candidate: insufficient ? null : snapshot.priority.domain,
      matrix_candidate_reason: snapshot.priority.reason,
      tie_break_provisional: tieBreak,
      selected_focus: selected,
      selection_source: input.focusSelection?.selection_source ?? null,
      selection_reason: input.focusSelection?.selection_reason ?? null,
      awaiting_selection: awaiting,
    },
    route: {
      kind: routeKind,
      matrix_plan_id: matrixPlanId,
      product_route_id: productRouteId,
      title: routeTitle,
      duration_text: durationText,
      source: routeSource,
      needs_curation: needsCuration,
    },
    cycle: {
      number: 1,
      start: cycle.start,
      end: cycle.end,
      status: 'PROJECTED',
      source: PRODUCT_HYPOTHESIS,
      billing_cadence: input.subscriptionContext.billing_cadence,
      monthly_even_if_prepaid: true,
    },
    objective: {
      available: availableObjectives,
      selected_id: objectiveId,
      source: input.objectiveSelection?.source ?? null,
      needs_human_curation: selected === 'PURPOSE',
    },
    action: {
      text: actionText,
      source: input.action?.source ?? null,
      executable: Boolean(actionText) && !blocked,
    },
    restrictions: uniqueRestrictions,
    safety: {
      blocked,
      reasons: [
        ...snapshot.safety.alerts
          .filter((alert) => alert.fired)
          .map((alert) => `${alert.question_id} ${alert.severity}`),
        ...(primary?.blocked_reason ? [primary.blocked_reason] : []),
      ],
      source: 'SAFETY',
    },
  };
}

export function assertSnapshotUntouched(
  before: ResultSnapshot,
  after: ResultSnapshot,
): void {
  const omit = (snapshot: ResultSnapshot) => {
    const copy = cloneSnapshot(snapshot);
    return copy;
  };
  if (JSON.stringify(omit(before)) !== JSON.stringify(omit(after))) {
    throw new Error('ResultSnapshot mutated');
  }
}

export function isFocusKind(value: string | null | undefined): value is FocusKind {
  return (
    value === 'MENTALIDAD' ||
    value === 'RELACIONES' ||
    value === 'FINANZAS' ||
    value === 'CUERPO' ||
    value === 'PURPOSE' ||
    value === 'NONE'
  );
}
