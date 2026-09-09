import type { ChangeDiagnosis, ChangeKindId, QuestionFault } from './change-diagnosis';

export type ChangePreset = {
  diagnosis?: ChangeDiagnosis;
  questionFault?: QuestionFault;
  kind?: ChangeKindId;
  target_id: string;
  value: string;
};

const LABELS: Record<string, string> = {
  RESPONSE_VALIDATION: 'Esto se anota en el cierre',
  NORMALIZE_ITEM: 'Esto se anota en el cierre',
  QUESTION_GROUPING: 'Probar otro agrupamiento',
  DOMAIN_SCORE: 'Probar otra forma de calcular el ámbito',
  DIMENSION_SCORE: 'Probar otra forma de calcular el ámbito',
  DOMAIN_COVERAGE: 'Probar otro mínimo de cobertura',
  STATE_BAND: 'Probar otro límite de estado',
  SAFETY_EVAL: 'Esto se anota en el cierre',
  PRIORITY: 'Probar otro orden de desempate',
  RECOMMENDATION: 'Esto se anota en el cierre',
  CONTEXT_MISSING: 'Esto se anota en el cierre',
  UNKNOWN: 'Registrar el problema',
};

export function tryChangeLabel(firstProblem: string, rootCause?: string): string {
  if ((firstProblem === 'DOMAIN_SCORE' || firstProblem === 'DIMENSION_SCORE') && rootCause === 'WEIGHT') {
    return 'Probar si influye demasiado o demasiado poco';
  }
  if (
    firstProblem === 'RESPONSE_VALIDATION' &&
    (rootCause === 'QUESTION_IRRELEVANT' || rootCause === 'QUESTION_REDUNDANT')
  ) {
    return 'Probar el caso sin esta pregunta';
  }
  return LABELS[firstProblem] ?? 'Registrar el problema';
}

export function presetFromFirstProblem(
  firstProblem: string,
  context?: { evidence?: string[]; rootCause?: string },
): ChangePreset {
  const questionId = context?.evidence?.[0] ?? '';
  if (
    (firstProblem === 'DOMAIN_SCORE' || firstProblem === 'DIMENSION_SCORE') &&
    context?.rootCause === 'WEIGHT'
  ) {
    return {
      diagnosis: 'QUESTION',
      questionFault: 'WEIGHT',
      kind: 'QUESTION_WEIGHT',
      target_id: questionId,
      value: '',
    };
  }
  if (
    firstProblem === 'RESPONSE_VALIDATION' &&
    (context?.rootCause === 'QUESTION_IRRELEVANT' || context?.rootCause === 'QUESTION_REDUNDANT')
  ) {
    return {
      diagnosis: 'QUESTION',
      questionFault: 'REDUNDANT',
      kind: 'QUESTION_ACTIVE',
      target_id: questionId,
      value: 'false',
    };
  }
  switch (firstProblem) {
    case 'DIMENSION_SCORE':
    case 'DOMAIN_SCORE':
      return {
        diagnosis: 'CALCULATION',
        kind: 'DOMAIN_AGGREGATION',
        target_id: 'LAB-SCORE-01.domain_aggregation',
        value: 'ITEM_WEIGHTED',
      };
    case 'STATE_BAND':
      return { diagnosis: 'STATE', kind: 'RULE_THRESHOLD', target_id: '', value: '' };
    case 'PRIORITY':
      return {
        diagnosis: 'PRIORITY',
        kind: 'INTERPRETATION',
        target_id: 'LAB-PRIORITY-01.domain_tie_break',
        value: '',
      };
    case 'QUESTION_GROUPING':
      return { diagnosis: 'DIMENSION', kind: 'DIMENSION_ALIAS', target_id: '', value: '' };
    case 'NORMALIZE_ITEM':
    case 'SCALE_MAP':
      return { diagnosis: 'SCALE', target_id: '', value: '' };
    case 'RESPONSE_VALIDATION':
      return {
        diagnosis: 'QUESTION',
        questionFault: 'WORDING',
        target_id: questionId,
        value: '',
      };
    case 'DOMAIN_COVERAGE':
      return { diagnosis: 'COVERAGE', kind: 'RULE_THRESHOLD', target_id: '', value: '' };
    case 'SAFETY_EVAL':
    case 'OVERRIDE':
      return { diagnosis: 'SAFETY', target_id: '', value: '' };
    case 'RECOMMENDATION':
      return { diagnosis: 'ROUTE', target_id: '', value: '' };
    default:
      return { target_id: questionId, value: '' };
  }
}
