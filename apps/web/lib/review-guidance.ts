export type ReviewSituation =
  | 'STUCK_RESULT'
  | 'LOW_CAPACITY'
  | 'ALIGNMENT_GAP'
  | 'BODY_CARE'
  | 'DIRECTION_CHANGED'
  | 'MISSING_INFORMATION';

/** Same questions as the server helper. The person chooses. Nothing here changes the plan. */
export function reviewGuidance(input: {
  done: number;
  applicable: number;
  result: 'MOVED' | 'STUCK' | 'UNKNOWN';
  alignmentLow: boolean;
  bodyCareLow: boolean;
  directionChanged: boolean;
}): { situation: ReviewSituation; prompt: string; options: string[] } | null {
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
