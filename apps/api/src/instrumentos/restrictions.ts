/** Product restrictions restricciones@1. Separate from native form signals. */

export type ContentTag =
  | 'PHYSICAL_EXERTION'
  | 'DIET'
  | 'SUPPLEMENT'
  | 'MEDICATION'
  | 'CONFRONTATION'
  | 'FINANCIAL_DECISION'
  | 'DEBT'
  | 'INVESTMENT';

export type HealthAnswer = 'NO' | 'YES' | 'UNKNOWN' | 'AMBIGUOUS';

export type HealthFact = {
  illness: HealthAnswer;
  injuryHistory: HealthAnswer;
  injuryLimitsNow: boolean | null;
  medication: HealthAnswer;
  pain: HealthAnswer;
  medicalLimit: HealthAnswer;
  conversationUnsafe: boolean | null;
};

export type RestrictionDecision = {
  allowed: boolean;
  reason: string | null;
  alternatives: string[];
  /** Set when the member can answer and retry. A confirmed limit or an unsafe conversation is a refusal. */
  needsClarification: 'HEALTH' | 'CONVERSATION' | null;
};

const HEALTH_TAGS: ContentTag[] = ['PHYSICAL_EXERTION', 'DIET', 'SUPPLEMENT', 'MEDICATION'];

const refuse = (
  reason: string,
  alternatives: string[],
  needsClarification: RestrictionDecision['needsClarification'] = null,
): RestrictionDecision => ({ allowed: false, reason, alternatives, needsClarification });

export function decideAction(tags: ContentTag[], health: HealthFact): RestrictionDecision {
  if (tags.includes('CONFRONTATION') && health.conversationUnsafe === true) {
    return refuse('Declaraste que la conversación no es segura.', ['Preparar el paso sin confrontación', 'Elegir otro paso']);
  }
  if (tags.includes('CONFRONTATION') && health.conversationUnsafe == null) {
    return refuse(
      'Falta aclarar si esta conversación es viable.',
      ['Puedo hacerla', 'Preparar el paso sin confrontación'],
      'CONVERSATION',
    );
  }
  if (tags.some((tag) => HEALTH_TAGS.includes(tag))) {
    if (health.medicalLimit === 'YES' || health.pain === 'YES' || health.injuryLimitsNow === true) {
      return refuse('Hay un límite vigente que esta acción puede contradecir.', [
        'Organizar un cuidado ya indicado',
        'Preparar una consulta',
        'Elegir una tarea compatible',
      ]);
    }
    const ambiguous = [health.medicalLimit, health.pain, health.illness].includes('AMBIGUOUS');
    if (ambiguous) {
      return refuse(
        'Falta aclarar si hay un límite vigente. El texto guardado no basta para afirmarlo.',
        ['No limita lo que voy a hacer', 'Hay un límite vigente', 'Elegir una tarea compatible'],
        'HEALTH',
      );
    }
    if (health.medicalLimit === 'UNKNOWN' || health.illness === 'UNKNOWN') {
      return refuse(
        'Falta un dato que esta acción necesita.',
        ['Aclarar solo ese dato', 'Elegir una alternativa que no lo necesite'],
        'HEALTH',
      );
    }
  }
  if (tags.includes('INVESTMENT') || tags.includes('DEBT')) {
    return refuse('MK no propone inversiones ni endeudarte para seguir una ruta.', [
      'Ordenar la información de tus obligaciones',
    ]);
  }
  return { allowed: true, reason: null, alternatives: [], needsClarification: null };
}
