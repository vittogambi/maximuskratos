import type { Option } from './labels';
import {
  EXPECTED_PRIORITY_OPTIONS,
  EXPECTED_STATE_OPTIONS,
  ROOT_CAUSE_OPTIONS,
  SAFETY_REVIEW_OPTIONS,
  optionLabel,
} from './labels';

export function needsFirstProblem(sense: string): boolean {
  return sense === 'PARTIAL' || sense === 'NO';
}

export function canCloseWithoutFinding(sense: string): boolean {
  return sense === 'YES' || sense === 'UNSURE';
}

export function shouldRegisterFinding(sense: string, firstDivergence: string): boolean {
  return (
    needsFirstProblem(sense) &&
    Boolean(firstDivergence) &&
    firstDivergence !== 'NONE' &&
    firstDivergence !== 'UNSURE'
  );
}

export const DOUBT_OPTIONS: Option[] = [
  { value: 'NEED_SIMILAR_CASE', label: 'Otro caso parecido' },
  { value: 'NEED_PERSON_INFO', label: 'Más información de esta persona' },
  { value: 'NEED_QUESTION', label: 'Revisar una pregunta' },
  { value: 'NEED_CALCULATION', label: 'Entender mejor cómo calculó la Matriz' },
  { value: 'NEED_CONVERSATION', label: 'Conversarlo' },
  { value: 'UNKNOWN', label: 'Otro' },
];

export const QUESTION_FOLLOWUP_OPTIONS: Option[] = [
  { value: 'QUESTION_WORDING', label: 'No mide lo que debería medir' },
  { value: 'QUESTION_UNCLEAR', label: 'Se entiende mal' },
  { value: 'QUESTION_TOO_BROAD', label: 'Es demasiado amplia' },
  { value: 'QUESTION_DOUBLE', label: 'Mezcla dos cosas distintas' },
  { value: 'QUESTION_REDUNDANT', label: 'Se repite con otra' },
  { value: 'QUESTION_NEEDS_CONTEXT', label: 'Falta contexto' },
  { value: 'QUESTION_IRRELEVANT', label: 'No debería estar' },
  { value: 'QUESTION_MISSING', label: 'Falta otra pregunta' },
  { value: 'UNKNOWN', label: 'Otra cosa' },
];

export const INTERPRETATION_FOLLOWUP_OPTIONS: Option[] = [
  { value: 'NORMALIZATION', label: 'El mapa respuesta a valor no representa lo que quiero' },
  { value: 'INVERSE', label: 'Está invertida' },
  { value: 'QUESTION_NEEDS_CONTEXT', label: 'La respuesta necesita contexto' },
  { value: 'NEEDS_QUALITATIVE', label: 'Necesita confirmación cualitativa' },
  { value: 'AMBIGUOUS', label: 'La misma respuesta puede significar cosas distintas' },
  { value: 'UNKNOWN', label: 'Otro' },
];

export const SCALE_FOLLOWUP_OPTIONS: Option[] = [
  { value: 'SCALE_OPTION', label: 'Faltan opciones' },
  { value: 'SCALE', label: 'Las anclas no representan bien la diferencia' },
  { value: 'SCALE_TOO_WIDE', label: 'La escala es demasiado amplia' },
  { value: 'SCALE_TOO_NARROW', label: 'La escala es demasiado estrecha' },
  { value: 'NOT_NUMERIC', label: 'La pregunta no debería ser numérica' },
  { value: 'UNKNOWN', label: 'Otro' },
];

export const DIMENSION_FOLLOWUP_OPTIONS: Option[] = [
  { value: 'DIMENSION_OK', label: 'Sí' },
  { value: 'DIMENSION_ASSIGNMENT', label: 'Debería estar en otra' },
  { value: 'DOMAIN_ASSIGNMENT', label: 'Debería influir en más de una' },
  { value: 'QUESTION_IRRELEVANT', label: 'No debería puntuar' },
  { value: 'UNKNOWN', label: 'No estoy seguro' },
];

export const CALCULATION_FOLLOWUP_OPTIONS: Option[] = [
  { value: 'QUESTION_DOMINATES', label: 'Una pregunta domina demasiado' },
  { value: 'SINGLE_EQUALS_MANY', label: 'Una dimensión con 1 pregunta pesa igual que una de 5' },
  { value: 'AVERAGE_LOSS', label: 'Promediar pierde información' },
  { value: 'INTERPRETATION', label: 'La composición interna es incorrecta' },
  { value: 'WEIGHT', label: 'Esta pregunta debería influir menos o más' },
  { value: 'UNKNOWN', label: 'No estoy seguro' },
];

export const COVERAGE_FOLLOWUP_OPTIONS: Option[] = [
  { value: 'COVERAGE', label: 'No debería clasificar' },
  { value: 'COVERAGE_INTERPRETABLE', label: 'Sí debería clasificar' },
  { value: 'COVERAGE_PROVISIONAL', label: 'Debería pedir más información' },
  { value: 'SAFETY', label: 'Una señal especial debería prevalecer' },
  { value: 'UNKNOWN', label: 'No estoy seguro' },
  { value: 'OTHER', label: 'Otro' },
];

export const STATE_ORIGIN_OPTIONS: Option[] = [
  { value: 'THRESHOLD', label: 'Parece ser el umbral' },
  { value: 'INTERPRETATION', label: 'Creo que viene del cálculo anterior' },
  { value: 'UNKNOWN', label: 'No estoy seguro' },
];

export const PRIORITY_FOLLOWUP_OPTIONS: Option[] = [
  { value: 'INTERPRETATION', label: 'Otro ámbito está claramente peor' },
  { value: 'SAFETY', label: 'Hay una alerta' },
  { value: 'PRIORITY_RULE', label: 'El empate se resolvió mal' },
  { value: 'CONTEXT_MISSING', label: 'Falta información' },
  { value: 'AVERAGE_LOSS', label: 'El resumen perdió información importante' },
  { value: 'CONTEXT', label: 'El contexto cambia el ámbito prioritario' },
  { value: 'UNKNOWN', label: 'Otro' },
];

export const ROUTE_FOLLOWUP_OPTIONS: Option[] = [
  { value: 'PLAN', label: 'Sí' },
  { value: 'PRIORITY_RULE', label: 'No' },
  { value: 'UNKNOWN', label: 'No estoy seguro' },
];

export const INFO_LOSS_FOLLOWUP_OPTIONS: Option[] = [
  { value: 'INTERPRETATION', label: 'Una dimensión' },
  { value: 'QUESTION_NEEDS_CONTEXT', label: 'Preguntas concretas' },
  { value: 'AVERAGE_LOSS', label: 'La composición interna' },
  { value: 'UNKNOWN', label: 'Texto libre' },
];

export const WEIGHT_INTENT_OPTIONS: Option[] = [
  { value: 'LESS', label: 'Menos que ahora' },
  { value: 'OK', label: 'Igual' },
  { value: 'MORE', label: 'Más que ahora' },
  { value: 'CUSTOM', label: 'Valor específico' },
];

export const STATE_EXPECTATION_OPTIONS: Option[] = [
  ...EXPECTED_STATE_OPTIONS.filter((item) => item.value !== 'UNSURE'),
  { value: 'UNSURE', label: 'No estoy seguro' },
];

export const PRIORITY_EXPECTATION_OPTIONS: Option[] = [
  ...EXPECTED_PRIORITY_OPTIONS.filter((item) => item.value !== 'UNSURE' && item.value !== 'NONE'),
  { value: 'NONE', label: 'Ninguno todavía' },
  { value: 'UNSURE', label: 'No estoy seguro' },
];

export const SAFETY_EFFECT_OPTIONS: Option[] = [
  { value: 'SAFETY_ALERT', label: 'Solo mostrar alerta' },
  { value: 'SAFETY_CONFIRM', label: 'Pedir confirmación' },
  { value: 'SAFETY', label: 'Bloquear recomendación' },
  { value: 'OVERRIDE', label: 'Imponer el estado de ese ámbito' },
  { value: 'SAFETY_FALSE_POSITIVE', label: 'No afectar el estado' },
  { value: 'UNKNOWN', label: 'Otra' },
  ...SAFETY_REVIEW_OPTIONS.filter((item) => item.value === 'SAFETY_UNSURE'),
];

export function followupForLayer(layer: string): { title: string; options: Option[] } | null {
  if (layer === 'RESPONSE_VALIDATION') {
    return { title: '¿Qué pasa con esta pregunta?', options: QUESTION_FOLLOWUP_OPTIONS };
  }
  if (layer === 'NORMALIZE_ITEM') {
    return {
      title: '¿La respuesta es correcta pero la Matriz la interpreta mal?',
      options: INTERPRETATION_FOLLOWUP_OPTIONS,
    };
  }
  if (layer === 'SCALE_MAP') {
    return {
      title: '¿Qué ocurre con la escala?',
      options: SCALE_FOLLOWUP_OPTIONS,
    };
  }
  if (layer === 'QUESTION_GROUPING') {
    return { title: '¿Esta pregunta está en la dimensión correcta?', options: DIMENSION_FOLLOWUP_OPTIONS };
  }
  if (layer === 'DIMENSION_SCORE' || layer === 'DOMAIN_SCORE') {
    return { title: '¿Qué parte del cálculo te parece incorrecta?', options: CALCULATION_FOLLOWUP_OPTIONS };
  }
  if (layer === 'DOMAIN_COVERAGE') {
    return {
      title: '¿Qué esperabas que ocurriera con esta cantidad de información?',
      options: COVERAGE_FOLLOWUP_OPTIONS,
    };
  }
  if (layer === 'STATE_BAND') {
    return { title: '¿Crees que el problema está en el umbral o viene de antes?', options: STATE_ORIGIN_OPTIONS };
  }
  if (layer === 'SAFETY_EVAL' || layer === 'OVERRIDE') {
    return { title: '¿Qué debería provocar esta señal?', options: SAFETY_EFFECT_OPTIONS };
  }
  if (layer === 'PRIORITY') {
    return { title: '¿Por qué?', options: PRIORITY_FOLLOWUP_OPTIONS };
  }
  if (layer === 'RECOMMENDATION') {
    return { title: '¿El ámbito prioritario está bien pero la ruta no?', options: ROUTE_FOLLOWUP_OPTIONS };
  }
  if (layer === 'CONTEXT_MISSING') {
    return {
      title: '¿Qué información importante desaparece al resumir el caso?',
      options: INFO_LOSS_FOLLOWUP_OPTIONS,
    };
  }
  return null;
}

/** Spanish label Rafa picked. Never the stored enum. */
export function followupCauseLabel(layer: string, causes: string[]): string {
  const primary = causes[0];
  if (!primary) return '';
  const fromLayer = followupForLayer(layer)?.options.find((item) => item.value === primary)?.label;
  const primaryLabel = fromLayer ?? optionLabel(ROOT_CAUSE_OPTIONS, primary);
  if (!showsWeightFollowup(layer, primary) || !causes[1]) return primaryLabel;
  const intent = WEIGHT_INTENT_OPTIONS.find((item) => item.value === causes[1])?.label;
  return intent ? `${primaryLabel}. ${intent}` : primaryLabel;
}

export function findingLayerFromProblem(problem: string): string {
  if (problem === 'RESPONSE_VALIDATION') return 'QUESTION';
  if (problem === 'NORMALIZE_ITEM' || problem === 'SCALE_MAP') return 'INTERPRETATION';
  if (problem === 'QUESTION_GROUPING') return 'DIMENSION';
  if (problem === 'DIMENSION_SCORE' || problem === 'DOMAIN_SCORE') return 'SCORE';
  if (problem === 'DOMAIN_COVERAGE') return 'COVERAGE';
  if (problem === 'STATE_BAND') return 'STATE';
  if (problem === 'SAFETY_EVAL' || problem === 'OVERRIDE') return 'SAFETY';
  if (problem === 'PRIORITY') return 'PRIORITY';
  if (problem === 'RECOMMENDATION') return 'PLAN';
  if (problem === 'CONTEXT_MISSING') return 'MISSING_INFO';
  return 'OTHER';
}

export function definitionChangeFromCause(problem: string, cause: string): boolean {
  if (problem === 'RESPONSE_VALIDATION') {
    return cause !== 'QUESTION_IRRELEVANT' && cause !== 'QUESTION_REDUNDANT';
  }
  if (problem === 'NORMALIZE_ITEM' || problem === 'SCALE_MAP') return true;
  if (problem === 'SAFETY_EVAL' || problem === 'OVERRIDE') return true;
  if (problem === 'RECOMMENDATION') return true;
  if (problem === 'CONTEXT_MISSING') return true;
  if (cause === 'QUESTION_MISSING' || cause === 'QUESTION_WORDING' || cause === 'QUESTION_UNCLEAR') return true;
  if (cause === 'NOT_NUMERIC' || cause === 'SCALE_TOO_WIDE' || cause === 'SCALE_TOO_NARROW') return true;
  if (cause === 'WEIGHT') return false;
  return false;
}

export function weightFromIntent(current: number, intent: string): string {
  if (intent === 'LESS') return String(current / 2);
  if (intent === 'MORE') return String(current * 2);
  return '';
}

export function showsWeightFollowup(problem: string, cause: string): boolean {
  return (problem === 'DIMENSION_SCORE' || problem === 'DOMAIN_SCORE') && cause === 'WEIGHT';
}
