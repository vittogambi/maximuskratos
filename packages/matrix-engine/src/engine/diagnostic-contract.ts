import { PLAN_DOMAINS } from '../constants';
import type { ResultSnapshot } from '../types';

const PLANED = PLAN_DOMAINS as readonly string[];

export type DiagnosticContract = {
  definition_ref: string;
  definition_sha256: string;
  engine_semver: string;
  policy_id: string;
  dimensions: Array<{
    key: string;
    domain: string;
    score: number | null;
    score_display: number | null;
    coverage: number;
  }>;
  domains: Array<{
    key: string;
    score: number | null;
    score_display: number | null;
    state_final: string | null;
    classification: string;
    coverage_definition: number;
  }>;
  safety: {
    fired: Array<{ question_id: string; domain: string; severity: string }>;
    safety_incomplete: boolean;
  };
  priority: {
    domain: string | null;
    tier: string | null;
    rule_id: string;
  };
  route: {
    plan_id: string | null;
    executable: string | null;
  };
};

export function toDiagnosticContract(snapshot: ResultSnapshot): DiagnosticContract {
  return {
    definition_ref: snapshot.definition_ref,
    definition_sha256: snapshot.definition_sha256,
    engine_semver: snapshot.engine_semver,
    policy_id: snapshot.policy_id,
    dimensions: snapshot.dimensions
      .filter((item) => PLANED.includes(item.domain))
      .map((item) => ({
        key: item.key,
        domain: item.domain,
        score: item.score,
        score_display: item.score_display,
        coverage: item.coverage,
      })),
    domains: snapshot.domains
      .filter((item) => PLANED.includes(item.key))
      .map((item) => ({
        key: item.key,
        score: item.score,
        score_display: item.score_display,
        state_final: item.state_final,
        classification: item.classification,
        coverage_definition: item.coverage_definition,
      })),
    safety: {
      fired: snapshot.safety.alerts
        .filter((alert) => alert.fired)
        .map((alert) => ({
          question_id: alert.question_id,
          domain: alert.domain,
          severity: alert.severity,
        })),
      safety_incomplete: snapshot.safety.safety_incomplete,
    },
    priority: {
      domain: snapshot.priority.domain,
      tier: snapshot.priority.tier,
      rule_id: snapshot.priority.rule_id,
    },
    route: {
      plan_id: snapshot.recommendations.primary?.plan_id ?? null,
      executable: snapshot.recommendations.primary?.executable_recommendation ?? null,
    },
  };
}

export function diagnosticContractsEqual(left: DiagnosticContract, right: DiagnosticContract): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}
