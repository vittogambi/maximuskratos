export type ReviewSituation =
  | 'STUCK_RESULT'
  | 'LOW_CAPACITY'
  | 'ALIGNMENT_GAP'
  | 'BODY_CARE'
  | 'DIRECTION_CHANGED'
  | 'MISSING_INFORMATION';

export type ReviewGuidance = {
  situation: ReviewSituation;
  prompt: string;
  options: string[];
};

/**
 * A question the person can use in the review. It does not change the plan by itself
 * and it does not state a cause.
 */
export function reviewGuidance(input: {
  done: number;
  applicable: number;
  result: 'MOVED' | 'STUCK' | 'UNKNOWN';
  alignmentLow: boolean;
  bodyCareLow: boolean;
  directionChanged: boolean;
}): ReviewGuidance | null {
  const coverage = input.applicable > 0 ? input.done / input.applicable : null;
  if (input.directionChanged) {
    return {
      situation: 'DIRECTION_CHANGED',
      prompt: 'Cambió la dirección o una hipótesis ya no se sostiene. ¿Qué planes siguen teniendo sentido?',
      options: ['Revisar la dirección', 'Sustituir el objetivo', 'Cerrar el experimento'],
    };
  }
  if (coverage != null && coverage >= 0.7 && input.result === 'STUCK') {
    return {
      situation: 'STUCK_RESULT',
      prompt: 'Varias acciones quedaron hechas y el resultado que observas no se movió. ¿Revisamos la estrategia, el indicador o el alcance?',
      options: ['Sustituir la estrategia', 'Reformular el resultado'],
    };
  }
  if (coverage != null && coverage < 0.4 && input.result !== 'MOVED') {
    return {
      situation: 'LOW_CAPACITY',
      prompt: 'Hay pocas acciones hechas. ¿La carga, el día o la ayuda no alcanzan?',
      options: ['Reducir', 'Reprogramar', 'Pausar'],
    };
  }
  if (coverage != null && coverage >= 0.7 && input.alignmentLow) {
    return {
      situation: 'ALIGNMENT_GAP',
      prompt: 'El cumplimiento y la alineación que declaras no dicen lo mismo. ¿El objetivo sigue teniendo sentido para ti?',
      options: ['Revisar el objetivo o el vínculo', 'Mantener, con una razón', 'Cerrar'],
    };
  }
  if (input.bodyCareLow) {
    return {
      situation: 'BODY_CARE',
      prompt: 'El cuidado del cuerpo te quedó corto. ¿Hace falta ajustar la carga o elegir una alternativa que lo proteja?',
      options: ['Ajustar la carga', 'Elegir una alternativa protectora'],
    };
  }
  if (input.result === 'UNKNOWN' || coverage == null) {
    return {
      situation: 'MISSING_INFORMATION',
      prompt: 'Falta información para leer el resultado. ¿Qué vas a observar, y qué puedes preparar igual?',
      options: ['Mantener de forma provisional', 'Preparar una comprobación'],
    };
  }
  return null;
}

/** Counters come from persisted occasions. A note without a result status stays unknown. */
export function guidanceFromOccasions(input: {
  valid: number;
  done: number;
  omitted: number;
  noInformation: number;
  results: Array<string | null>;
  directionChanged: boolean;
}): ReviewGuidance | null {
  if (input.directionChanged) {
    return reviewGuidance({ done: 0, applicable: 0, result: 'UNKNOWN', alignmentLow: false, bodyCareLow: false, directionChanged: true });
  }
  if (input.valid === 0) {
    return {
      situation: 'MISSING_INFORMATION',
      prompt: 'Esta semana no tiene ocasiones válidas. No hay un porcentaje. ¿Qué dato cambiaría el paso?',
      options: ['Mantener de forma provisional', 'Preparar una comprobación'],
    };
  }
  const observed = input.results.includes('OBSERVED');
  const stuck = input.done > 0 && input.results.includes('NOT_OBSERVED') && !observed;
  if (stuck) {
    return reviewGuidance({ done: input.done, applicable: input.valid, result: 'STUCK', alignmentLow: false, bodyCareLow: false, directionChanged: false });
  }
  if (input.noInformation === input.valid) {
    return {
      situation: 'MISSING_INFORMATION',
      prompt: 'Las ocasiones quedaron sin información. No se cuentan como omisiones ni como un porcentaje.',
      options: ['Anotar lo que pasó', 'Dejar la incertidumbre'],
    };
  }
  const known = input.done + input.omitted;
  if (known > 0 && input.done / input.valid < 0.4 && !observed) {
    return {
      situation: 'LOW_CAPACITY',
      prompt: 'Hay pocas ocasiones hechas. ¿La ocasión, la carga o la preparación no alcanzaron?',
      options: ['Reducir', 'Reprogramar', 'Pausar'],
    };
  }
  return null;
}
