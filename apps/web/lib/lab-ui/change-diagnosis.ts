import type { Option } from './labels';

export type ChangeDiagnosis =
  | 'QUESTION'
  | 'DIMENSION'
  | 'SCALE'
  | 'CALCULATION'
  | 'COVERAGE'
  | 'STATE'
  | 'PRIORITY'
  | 'SAFETY'
  | 'ROUTE';

export type QuestionFault =
  | 'WORDING'
  | 'SCALE'
  | 'WRONG_PLACE'
  | 'WEIGHT'
  | 'REDUNDANT'
  | 'MISSING';

export type ChangeKindId =
  | 'RULE_THRESHOLD'
  | 'QUESTION_WEIGHT'
  | 'QUESTION_ACTIVE'
  | 'DIMENSION_ALIAS'
  | 'INTERPRETATION'
  | 'DOMAIN_AGGREGATION';

export const DIAGNOSIS_OPTIONS: Array<Option & { value: ChangeDiagnosis }> = [
  {
    value: 'QUESTION',
    label: 'La pregunta',
    help: 'Está mal planteada, no mide lo que debe, está en el lugar equivocado, o no debería participar.',
  },
  {
    value: 'DIMENSION',
    label: 'La dimensión',
    help: 'Las preguntas se agrupan mal, o la dimensión no representa lo que esperarías.',
  },
  {
    value: 'SCALE',
    label: 'La escala',
    help: 'Las opciones de respuesta no representan lo que la persona quiere decir.',
  },
  {
    value: 'CALCULATION',
    label: 'El cálculo',
    help: 'El número de la dimensión o del ámbito no representa lo que debería.',
  },
  {
    value: 'COVERAGE',
    label: 'La cobertura',
    help: 'Se clasifica con demasiado poca información, o se pide demasiado para leer.',
  },
  {
    value: 'STATE',
    label: 'El estado',
    help: 'Los cortes entre bandas producen un salto que no tiene sentido.',
  },
  {
    value: 'PRIORITY',
    label: 'El ámbito prioritario',
    help: 'El ámbito que propone la Matriz no es el problema real, o el desempate no convence.',
  },
  {
    value: 'SAFETY',
    label: 'Alertas',
    help: 'Una alerta debería bloquear, forzar o dejar pasar algo distinto.',
  },
  {
    value: 'ROUTE',
    label: 'La ruta sugerida',
    help: 'El plan asociado a ese estado no es el que usarías.',
  },
];

export const QUESTION_FAULT_OPTIONS: Array<Option & { value: QuestionFault }> = [
  {
    value: 'WORDING',
    label: 'Está mal planteada o no mide lo que debe',
    help: 'Hay que cambiar el texto o el constructo. No se simula con un número.',
  },
  {
    value: 'SCALE',
    label: 'La escala no representa bien la respuesta',
    help: 'Las anclas o el tipo de respuesta no calzan. Eso es contenido de la Matriz.',
  },
  {
    value: 'WRONG_PLACE',
    label: 'Pertenece a otra dimensión o a otro ámbito',
    help: 'Moverla es un cambio de contenido. Se anota en el cierre.',
  },
  {
    value: 'WEIGHT',
    label: 'Influye demasiado o demasiado poco',
    help: 'Solo si la pregunta está bien y pertenece aquí, pero cuenta de más o de menos respecto de las otras.',
  },
  {
    value: 'REDUNDANT',
    label: 'Sobran, o no debería participar en el cálculo',
    help: 'Puedes probar el caso sin esa pregunta.',
  },
  {
    value: 'MISSING',
    label: 'Falta una pregunta importante',
    help: 'Eso no se inventa aquí. Se anota en el cierre.',
  },
];

export type ChangePath =
  | {
      mode: 'experiment';
      kind: ChangeKindId;
      autoTarget?: string;
      autoValue?: string;
      optionFilter?: 'coverage' | 'state' | 'priority' | 'aggregation' | 'alias';
    }
  | { mode: 'finding'; title: string; body: string };

const FINDING_CONTENT: ChangePath = {
  mode: 'finding',
  title: 'Esto no se simula aquí',
  body: 'Hay que cambiar el contenido de la Matriz. Anótalo en el cierre. No se arregla subiendo o bajando un número.',
};

export function changePath(
  diagnosis: ChangeDiagnosis | '',
  fault: QuestionFault | '' = '',
): ChangePath | null {
  if (!diagnosis) return null;
  if (diagnosis === 'QUESTION') {
    if (!fault) return null;
    if (fault === 'WEIGHT') return { mode: 'experiment', kind: 'QUESTION_WEIGHT' };
    if (fault === 'REDUNDANT') {
      return { mode: 'experiment', kind: 'QUESTION_ACTIVE', autoValue: 'false' };
    }
    return FINDING_CONTENT;
  }
  if (diagnosis === 'DIMENSION') {
    return {
      mode: 'experiment',
      kind: 'DIMENSION_ALIAS',
      optionFilter: 'alias',
    };
  }
  if (diagnosis === 'SCALE' || diagnosis === 'SAFETY' || diagnosis === 'ROUTE') {
    return FINDING_CONTENT;
  }
  if (diagnosis === 'CALCULATION') {
    return {
      mode: 'experiment',
      kind: 'DOMAIN_AGGREGATION',
      autoTarget: 'LAB-SCORE-01.domain_aggregation',
      optionFilter: 'aggregation',
    };
  }
  if (diagnosis === 'COVERAGE') {
    return { mode: 'experiment', kind: 'RULE_THRESHOLD', optionFilter: 'coverage' };
  }
  if (diagnosis === 'STATE') {
    return { mode: 'experiment', kind: 'RULE_THRESHOLD', optionFilter: 'state' };
  }
  return { mode: 'experiment', kind: 'INTERPRETATION', optionFilter: 'priority' };
}

export function seedDiagnosis(kind?: ChangeKindId | '', targetId?: string): {
  diagnosis: ChangeDiagnosis | '';
  fault: QuestionFault | '';
} {
  if (kind === 'QUESTION_WEIGHT') return { diagnosis: 'QUESTION', fault: 'WEIGHT' };
  if (kind === 'QUESTION_ACTIVE') return { diagnosis: 'QUESTION', fault: 'REDUNDANT' };
  if (kind === 'DIMENSION_ALIAS') return { diagnosis: 'DIMENSION', fault: '' };
  if (kind === 'DOMAIN_AGGREGATION' || targetId === 'LAB-SCORE-01.domain_aggregation') {
    return { diagnosis: 'CALCULATION', fault: '' };
  }
  if (kind === 'RULE_THRESHOLD') {
    if (targetId && /insufficient_below|provisional_below/.test(targetId)) {
      return { diagnosis: 'COVERAGE', fault: '' };
    }
    return { diagnosis: 'STATE', fault: '' };
  }
  if (kind === 'INTERPRETATION') return { diagnosis: 'PRIORITY', fault: '' };
  return { diagnosis: '', fault: '' };
}

export function matchesOptionFilter(
  filter: NonNullable<Extract<ChangePath, { mode: 'experiment' }>['optionFilter']> | undefined,
  option: { kind: string; target_id: string },
): boolean {
  if (!filter) return true;
  if (filter === 'coverage') return /insufficient_below|provisional_below/.test(option.target_id);
  if (filter === 'state') {
    return option.kind === 'RULE_THRESHOLD' && !/insufficient_below|provisional_below/.test(option.target_id);
  }
  if (filter === 'priority') {
    return option.kind === 'INTERPRETATION' && option.target_id !== 'LAB-SCORE-01.domain_aggregation';
  }
  if (filter === 'aggregation') return option.target_id === 'LAB-SCORE-01.domain_aggregation';
  if (filter === 'alias') return option.kind === 'DIMENSION_ALIAS';
  return true;
}
