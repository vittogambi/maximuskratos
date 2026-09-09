import { PLAN_DOMAINS } from '../constants';
import type {
  DomainResult,
  MatrixDefinition,
  RecommendationItem,
  RecommendationsSnapshot,
} from '../types';
import type { RiskEvaluation } from './safety';
import { blockingAlertsFor } from './safety';

const LABEL = 'MATRIX RECOMMENDATION' as const;

function lookupPlan(
  definition: MatrixDefinition,
  domain: string,
  state: string | null,
) {
  if (!state) return null;
  const matches = definition.plans.filter(
    (plan) => plan.domain === domain && plan.state === state,
  );
  if (matches.length > 1) {
    throw new Error(`non unique plan for ${domain} ${state}`);
  }
  return matches[0] ?? null;
}

function catalogIds(
  definition: MatrixDefinition,
  planId: string | null,
): { objectives: string[]; activities: string[] } {
  if (!planId) return { objectives: [], activities: [] };
  const plan = definition.plans.find((item) => item.id === planId);
  if (!plan) return { objectives: [], activities: [] };
  const objectives = [...plan.objective_ids].sort((left, right) => {
    const a = definition.objectives.find((item) => item.id === left)?.sequence ?? 0;
    const b = definition.objectives.find((item) => item.id === right)?.sequence ?? 0;
    return a - b;
  });
  const activities = objectives.flatMap((objectiveId) => {
    const objective = definition.objectives.find((item) => item.id === objectiveId);
    return objective?.activity_ids ?? [];
  });
  return { objectives, activities };
}

function buildItem(
  definition: MatrixDefinition,
  domain: DomainResult,
  evaluations: RiskEvaluation[],
  catalogLookup: boolean,
): RecommendationItem {
  const blocking = blockingAlertsFor(evaluations, domain.key);
  const plan = lookupPlan(definition, domain.key, domain.state_final);
  const ids = catalogIds(definition, plan?.id ?? null);
  const blocked = blocking.length > 0;
  const first = blocking[0];
  let blockedReason: string | null = null;
  if (blocked && !domain.state_final) {
    blockedReason = `cobertura insuficiente y alerta ${first.severity} activa en ${domain.key} (${first.question_id})`;
  } else if (blocked) {
    blockedReason = `alerta ${first.severity} activa en ${domain.key} (${first.question_id})`;
  } else if (!domain.state_final) {
    blockedReason = null;
  }

  return {
    domain: domain.key,
    plan_id: plan?.id ?? null,
    label: LABEL,
    objectives: ids.objectives,
    activities: ids.activities,
    catalog_lookup: catalogLookup,
    executable_recommendation: blocked ? 'BLOCKED' : 'ALLOWED',
    blocked_reason: blocked ? blockedReason : null,
    derivation_required: blocked,
    activities_unfiltered_warning: blocked,
    reason: plan ? undefined : domain.classification === 'NO_CLASIFICADO'
      ? 'NO_CLASIFICADO'
      : 'SIN_ESTADO',
  };
}

export function buildRecommendations(
  definition: MatrixDefinition,
  domains: DomainResult[],
  evaluations: RiskEvaluation[],
  priorityDomain: string | null,
  maintenanceDomain: string | null,
): RecommendationsSnapshot {
  const byKey = new Map(domains.map((domain) => [domain.key, domain]));
  const primary = priorityDomain ? byKey.get(priorityDomain) : undefined;
  const maintenance = maintenanceDomain
    ? byKey.get(maintenanceDomain)
    : undefined;

  const lookup = PLAN_DOMAINS.filter(
    (key) => key !== priorityDomain && key !== maintenanceDomain,
  )
    .map((key) => byKey.get(key))
    .filter((domain): domain is DomainResult => domain != null)
    .map((domain) => buildItem(definition, domain, evaluations, true));

  return {
    primary: primary
      ? buildItem(definition, primary, evaluations, Boolean(primary.state_final))
      : null,
    maintenance: maintenance
      ? buildItem(definition, maintenance, evaluations, Boolean(maintenance.state_final))
      : null,
    catalog_lookup: lookup,
  };
}
