import { PLAN_DOMAINS, STATE_RANK } from '../constants';
import type {
  DomainResult,
  InterpretationDefinition,
  JsonValue,
  MaintenanceResult,
  PriorityCandidate,
  PriorityResult,
} from '../types';
import type { RiskEvaluation } from './safety';
import { overrideSeverityFor } from './safety';

const PURPOSE_NOTE =
  'PROPÓSITO no participa en la prioridad de v0 porque la matriz todavía no define cómo hacerlo (R-PUR no ejecutable, sin planes de propósito). Esto no significa que MK concluya que este ámbito importe más que el propósito.';

const CRITERIA_NOT_EVALUATED = [
  { criterion: 'deterioro', reason: 'requiere dos mediciones' },
  { criterion: 'palanca', reason: 'sin modelo de datos' },
  { criterion: 'proposito', reason: 'R-PUR no ejecutable' },
];

function asStringArray(value: JsonValue | undefined, fallback: string[]): string[] {
  if (!Array.isArray(value)) return fallback;
  return value.filter((item): item is string => typeof item === 'string');
}

function interpretationParams(
  interpretations: InterpretationDefinition[],
  id: string,
): Record<string, JsonValue> {
  return interpretations.find((item) => item.id === id)?.params ?? {};
}

function candidateTier(
  domain: DomainResult,
  evaluations: RiskEvaluation[],
  unclassifiedCanBePriority: boolean,
): PriorityCandidate['tier'] | null {
  const severity = overrideSeverityFor(evaluations, domain.key);
  if (severity === 'CRITICA') return 'CRITICA';
  if (severity === 'ALTA') return 'ALTA';
  if (domain.classification === 'NO_CLASIFICADO') {
    return unclassifiedCanBePriority ? 'STATE' : null;
  }
  return 'STATE';
}

function sortCandidates(
  left: PriorityCandidate,
  right: PriorityCandidate,
  tieBreak: string[],
): number {
  const tierRank = { CRITICA: 0, ALTA: 1, STATE: 2 };
  const tierDiff = tierRank[left.tier] - tierRank[right.tier];
  if (tierDiff !== 0) return tierDiff;

  const leftState = left.state == null ? 99 : (STATE_RANK[left.state] ?? 99);
  const rightState = right.state == null ? 99 : (STATE_RANK[right.state] ?? 99);
  if (leftState !== rightState) return leftState - rightState;

  const leftScore = left.score_display;
  const rightScore = right.score_display;
  if (leftScore != null && rightScore != null && leftScore !== rightScore) {
    return leftScore - rightScore;
  }
  if (leftScore != null && rightScore == null) return -1;
  if (leftScore == null && rightScore != null) return 1;

  const leftTie = tieBreak.indexOf(left.domain);
  const rightTie = tieBreak.indexOf(right.domain);
  const leftIndex = leftTie === -1 ? 99 : leftTie;
  const rightIndex = rightTie === -1 ? 99 : rightTie;
  return leftIndex - rightIndex;
}

export function selectPriority(
  domainResults: DomainResult[],
  evaluations: RiskEvaluation[],
  interpretations: InterpretationDefinition[],
): { priority: PriorityResult; maintenance: MaintenanceResult } {
  const params = interpretationParams(interpretations, 'LAB-PRIORITY-01');
  const maintenanceParams = interpretationParams(interpretations, 'LAB-PRIORITY-02');
  const exclude = new Set(
    asStringArray(params.exclude_domains, ['PROPÓSITO']),
  );
  const tieBreak = asStringArray(
    params.domain_tie_break,
    ['MENTALIDAD', 'CUERPO', 'FINANZAS', 'RELACIONES'],
  );
  const unclassifiedCanBePriority = params.unclassified_can_be_priority === true;
  const mustBeClassified = maintenanceParams.must_be_classified !== false;

  const scoped = domainResults.filter(
    (domain) =>
      (PLAN_DOMAINS as readonly string[]).includes(domain.key) &&
      !exclude.has(domain.key),
  );

  const candidates: PriorityCandidate[] = [];
  for (const domain of scoped) {
    const tier = candidateTier(domain, evaluations, unclassifiedCanBePriority);
    if (!tier) continue;
    candidates.push({
      domain: domain.key,
      tier,
      state: domain.state_final,
      score_display: domain.score_display,
      classified: domain.classification !== 'NO_CLASIFICADO',
    });
  }

  const ordered = [...candidates].sort((left, right) =>
    sortCandidates(left, right, tieBreak),
  );
  const winner = ordered[0] ?? null;
  const second = ordered[1] ?? null;
  const maintenanceDomain =
    second && (!mustBeClassified || second.classified) ? second.domain : null;

  return {
    priority: {
      domain: winner?.domain ?? null,
      tier: winner?.tier ?? null,
      rule_id: 'LAB-PRIORITY-01',
      reason: winner ? null : 'INSUFFICIENT_COVERAGE',
      candidates: ordered,
      criteria_not_evaluated: CRITERIA_NOT_EVALUATED,
      purpose_excluded: true,
      purpose_note: PURPOSE_NOTE,
    },
    maintenance: {
      domain: maintenanceDomain,
      rule_id: 'LAB-PRIORITY-02',
    },
  };
}
