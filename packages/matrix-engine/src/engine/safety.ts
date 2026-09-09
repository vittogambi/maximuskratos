import { STATE_RANK } from '../constants';
import type {
  DomainResult,
  InterpretationDefinition,
  MatrixDefinition,
  QuestionRisk,
  ResponseInput,
  SafetyAlert,
  SafetySnapshot,
  StateSource,
} from '../types';
import { responseById } from './responses';

export interface RiskEvaluation {
  question_id: string;
  domain: string;
  severity: QuestionRisk['severity'];
  status: 'FIRED' | 'SUPPRESSED_BY_INPUT' | 'NOT_FIRED' | 'NOT_EVALUATED';
  fired: boolean;
  override_applies: boolean;
  condition_confirmed: SafetyAlert['condition_confirmed'];
  condition_text: string;
  numeric_met: boolean | null;
  qualitative_confirmed: boolean | null;
  immediate_action: string;
  referral: string;
  override_applied: SafetyAlert['override_applied'];
}

function rawNumber(raw: number | string | null): number | null {
  if (typeof raw === 'number' && Number.isFinite(raw)) return raw;
  if (typeof raw === 'string' && raw.trim() !== '') {
    const parsed = Number(raw.trim().replace(',', '.'));
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function numericMet(risk: QuestionRisk, raw: number | string | null): boolean {
  const value = rawNumber(raw);
  if (value == null) return false;
  return risk.numeric_clause.values.includes(value);
}

function overrideRule(
  severity: QuestionRisk['severity'],
): SafetyAlert['override_applied'] {
  if (severity === 'CRITICA') return 'R-OVR-01';
  if (severity === 'ALTA') return 'R-OVR-02';
  return null;
}

export function evaluateSafety(
  definition: MatrixDefinition,
  responses: ResponseInput[],
): { evaluations: RiskEvaluation[]; snapshot: SafetySnapshot } {
  const byId = responseById(responses);
  const evaluations: RiskEvaluation[] = definition.risks.map((risk) => {
    const response = byId.get(risk.question_id);
    const answered = response?.status === 'ANSWERED';
    if (!answered) {
      return {
        question_id: risk.question_id,
        domain: risk.domain,
        severity: risk.severity,
        status: 'NOT_EVALUATED',
        fired: false,
        override_applies: false,
        condition_confirmed: null,
        condition_text: risk.condition_text,
        numeric_met: null,
        qualitative_confirmed: null,
        immediate_action: risk.immediate_action,
        referral: risk.referral,
        override_applied: null,
      };
    }

    const met = numericMet(risk, response.rawValue);
    if (!met) {
      return {
        question_id: risk.question_id,
        domain: risk.domain,
        severity: risk.severity,
        status: 'NOT_FIRED',
        fired: false,
        override_applies: false,
        condition_confirmed: null,
        condition_text: risk.condition_text,
        numeric_met: false,
        qualitative_confirmed: response.qualitativeConfirmed ?? null,
        immediate_action: risk.immediate_action,
        referral: risk.referral,
        override_applied: null,
      };
    }

    if (!risk.qualitative_clause) {
      return {
        question_id: risk.question_id,
        domain: risk.domain,
        severity: risk.severity,
        status: 'FIRED',
        fired: true,
        override_applies: risk.severity !== 'MEDIA',
        condition_confirmed: 'FULL',
        condition_text: risk.condition_text,
        numeric_met: true,
        qualitative_confirmed: null,
        immediate_action: risk.immediate_action,
        referral: risk.referral,
        override_applied: overrideRule(risk.severity),
      };
    }

    const qualitative = response.qualitativeConfirmed ?? null;
    if (qualitative === false) {
      return {
        question_id: risk.question_id,
        domain: risk.domain,
        severity: risk.severity,
        status: 'SUPPRESSED_BY_INPUT',
        fired: false,
        override_applies: false,
        condition_confirmed: 'SUPPRESSED_BY_INPUT',
        condition_text: risk.condition_text,
        numeric_met: true,
        qualitative_confirmed: false,
        immediate_action: risk.immediate_action,
        referral: risk.referral,
        override_applied: null,
      };
    }

    const confirmed = qualitative === true ? 'FULL' : 'PARTIAL';
    return {
      question_id: risk.question_id,
      domain: risk.domain,
      severity: risk.severity,
      status: 'FIRED',
      fired: true,
      override_applies: risk.severity !== 'MEDIA',
      condition_confirmed: confirmed,
      condition_text: risk.condition_text,
      numeric_met: true,
      qualitative_confirmed: qualitative,
      immediate_action: risk.immediate_action,
      referral: risk.referral,
      override_applied: overrideRule(risk.severity),
    };
  });

  const notEvaluated = evaluations
    .filter((item) => item.status === 'NOT_EVALUATED')
    .map((item) => item.question_id);
  const evaluated = definition.risks.length - notEvaluated.length;
  const riskCoverage =
    definition.risks.length === 0 ? 1 : evaluated / definition.risks.length;

  const alerts: SafetyAlert[] = evaluations
    .filter(
      (item) => item.status === 'FIRED' || item.status === 'SUPPRESSED_BY_INPUT',
    )
    .map((item) => ({
      question_id: item.question_id,
      domain: item.domain,
      severity: item.severity,
      fired: item.fired,
      condition_confirmed: item.condition_confirmed,
      condition_text: item.condition_text,
      immediate_action: item.immediate_action,
      referral: item.referral,
      override_applied: item.override_applied,
    }));

  return {
    evaluations,
    snapshot: {
      alerts,
      not_evaluated: notEvaluated,
      risk_coverage: riskCoverage,
      safety_incomplete: riskCoverage < 1,
    },
  };
}

export function blockingAlertsFor(
  evaluations: RiskEvaluation[],
  domain: string,
): RiskEvaluation[] {
  return evaluations.filter(
    (item) =>
      item.domain === domain &&
      item.fired &&
      (item.severity === 'CRITICA' || item.severity === 'ALTA'),
  );
}

export function overrideSeverityFor(
  evaluations: RiskEvaluation[],
  domain: string,
): 'CRITICA' | 'ALTA' | null {
  const active = evaluations.filter(
    (item) => item.domain === domain && item.override_applies,
  );
  if (active.some((item) => item.severity === 'CRITICA')) return 'CRITICA';
  if (active.some((item) => item.severity === 'ALTA')) return 'ALTA';
  return null;
}

function interpParam(
  interpretations: InterpretationDefinition[],
  id: string,
  key: string,
): unknown {
  return interpretations.find((item) => item.id === id)?.params[key];
}

export function applyOverrides(
  domain: Omit<DomainResult, 'state_final' | 'state_source' | 'state_rule_id'> & {
    state_from_band: string | null;
    band_rule_id: string | null;
  },
  evaluations: RiskEvaluation[],
  interpretations: InterpretationDefinition[],
): Pick<DomainResult, 'state_final' | 'state_source' | 'state_rule_id' | 'score'> {
  const severity = overrideSeverityFor(evaluations, domain.key);
  const classified = domain.classification !== 'NO_CLASIFICADO';
  const criticaUnclassified =
    interpParam(interpretations, 'LAB-OVR-02', 'critica_unclassified') ??
    'FORCE_CONTENCION';
  const altaUnclassified =
    interpParam(interpretations, 'LAB-OVR-03', 'alta_unclassified') ?? 'STATE_NULL';
  const altaAs = interpParam(interpretations, 'LAB-OVR-01', 'alta_as') ?? 'CAP';

  if (severity === 'CRITICA') {
    const forceUnclassified = criticaUnclassified === 'FORCE_CONTENCION';
    return {
      score: classified ? domain.score : null,
      state_final:
        classified || forceUnclassified ? 'CONTENCIÓN' : domain.state_from_band,
      state_source: 'FORCED_BY_R-OVR-01',
      state_rule_id: 'R-OVR-01',
    };
  }

  if (severity === 'ALTA') {
    if (!classified) {
      return {
        score: null,
        state_final: altaUnclassified === 'STATE_NULL' ? null : domain.state_from_band,
        state_source: null,
        state_rule_id: null,
      };
    }
    const fromBand = domain.state_from_band;
    const capped =
      altaAs === 'CAP' &&
      fromBand != null &&
      (STATE_RANK[fromBand] ?? 0) > STATE_RANK.ESTABILIZACIÓN
        ? 'ESTABILIZACIÓN'
        : fromBand;
    return {
      score: domain.score,
      state_final: capped,
      state_source: 'CAPPED_BY_R-OVR-02',
      state_rule_id: 'R-OVR-02',
    };
  }

  const source: StateSource | null = domain.state_from_band ? 'BAND' : null;
  return {
    score: domain.score,
    state_final: domain.state_from_band,
    state_source: source,
    state_rule_id: domain.band_rule_id,
  };
}
