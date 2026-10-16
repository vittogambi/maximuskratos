import type { ContentTag, HealthFact } from '../instrumentos/restrictions';

/** Directions that let a member write plans. Exploring counts; a missing direction does not. */
export const WORKING_DIRECTIONS: readonly string[] = ['EXPLORANDO', 'PROVISIONAL', 'CONFIRMADO_POR_USUARIO'];

export const PLAN_LINKS: readonly string[] = ['DIRECT', 'ENABLING', 'PROTECTIVE', 'EXPLORATORY'];

export type WriterBlock = {
  code: 'FORMULARIO_REQUIRED' | 'DIRECTION_REQUIRED';
  message: string;
  nextHref: string;
};

export function isWorkingDirection(status: string | null): boolean {
  return status != null && WORKING_DIRECTIONS.includes(status);
}

/**
 * Shared server rule for every writer that creates or activates plans and actions.
 * `formularioCompleted` must come from a persisted reading of a completed formulario completo session.
 */
export function writerBlock(input: { formularioCompleted: boolean; directionStatus: string | null }): WriterBlock | null {
  if (!input.formularioCompleted) {
    return {
      code: 'FORMULARIO_REQUIRED',
      message: 'Termina el cuestionario antes de guardar planes o tareas.',
      nextHref: '/diagnostico',
    };
  }
  if (!isWorkingDirection(input.directionStatus)) {
    return {
      code: 'DIRECTION_REQUIRED',
      message: 'Elige una dirección en la hoja de ruta antes de guardar planes o tareas.',
      nextHref: '/proposito',
    };
  }
  return null;
}

/** The link is stored as the prefix of `priorityNote`, for example `DIRECT: ...`. */
export function planLink(priorityNote: string | null | undefined): string | null {
  const match = /^([A-Z]+): /.exec((priorityNote ?? '').trim());
  return match && PLAN_LINKS.includes(match[1]) ? match[1] : null;
}

/** A stored link kind wins. The note prefix remains for plans written before that column. */
export function resolvePlanLink(input: { linkKind?: string | null; priorityNote?: string | null }): string | null {
  if (input.linkKind && PLAN_LINKS.includes(input.linkKind)) return input.linkKind;
  return planLink(input.priorityNote);
}

/**
 * Content tags the member can declare on one action. The rule applies to this
 * declaration, not to the words of the title and not to the guide.
 * FINANCIAL_DECISION stays out: the member is not asked to mark it.
 */
export const DECLARED_TAGS: readonly ContentTag[] = [
  'PHYSICAL_EXERTION',
  'DIET',
  'SUPPLEMENT',
  'MEDICATION',
  'CONFRONTATION',
  'INVESTMENT',
  'DEBT',
];

/** Empty or omitted means the member declared no content marks. Unknown values are refused. */
export function parseContentTags(value: unknown): ContentTag[] | null {
  if (value == null) return [];
  if (!Array.isArray(value)) return null;
  const tags: ContentTag[] = [];
  for (const item of value) {
    if (typeof item !== 'string' || !DECLARED_TAGS.includes(item as ContentTag)) return null;
    const tag = item as ContentTag;
    if (!tags.includes(tag)) tags.push(tag);
  }
  return tags;
}

/**
 * Content tags per guide. Guides only prepare a draft, so none of them carry tags.
 * Keys must match apps/web/lib/plan-guides.ts.
 */
export const GUIDE_TAGS: Record<string, ContentTag[]> = {
  resultado: [],
  prioridades: [],
  semana: [],
  friccion: [],
  aprender: [],
  estandar: [],
  conversacion: [],
  dinero: [],
  cuidado: [],
  hipotesis: [],
  revisar: [],
};

export function valueHelpTemplate(valueRef: string): string {
  return `Valor: ${valueRef}. Esta semana escribo la conducta. Excepción: ninguna.`;
}

/** A guide starter is an example. Brackets and the untouched value sentence are not an artifact yet. */
export function unfinishedHelp(note: string | null | undefined, valueRef: string | null | undefined): string | null {
  const text = note?.trim() ?? '';
  if (text.includes('[')) return 'El ejemplo todavía tiene huecos. Escribe el artefacto con tus palabras.';
  const value = valueRef?.trim();
  if (value && text === valueHelpTemplate(value)) {
    return 'Escribe qué cambia esta semana por ese valor. El ejemplo no se guarda solo.';
  }
  return null;
}

export function guideTags(guideId: string): ContentTag[] | null {
  return Object.prototype.hasOwnProperty.call(GUIDE_TAGS, guideId) ? GUIDE_TAGS[guideId] : null;
}

const NEGATIVE_ANSWER = /^no[.!]*$/;

export type HealthLimitOutcome = 'NO_CURRENT_LIMIT' | 'CURRENT_LIMIT';
export type ConversationOutcome = 'VIABLE' | 'UNSAFE';

/**
 * Health facts from the F-RAD-001 free-text answers of formulario-completo@1.
 * Only an exact "No" counts as absence. Any other text stays ambiguous: it is not a confirmed limit.
 * Missing answers stay UNKNOWN. The original answer is not rewritten.
 */
export function healthFactFromAnswers(answerAt: (ref: string) => string | null): HealthFact {
  const read = (ref: string): HealthFact['illness'] => {
    const text = answerAt(ref)?.trim().toLowerCase() ?? '';
    if (!text) return 'UNKNOWN';
    return NEGATIVE_ANSWER.test(text) ? 'NO' : 'AMBIGUOUS';
  };
  return {
    illness: read('R18'),
    injuryHistory: read('R20'),
    injuryLimitsNow: null,
    medication: read('R22'),
    pain: read('R24'),
    medicalLimit: read('R27'),
    conversationUnsafe: null,
  };
}

export function parseHealthLimit(value: unknown): HealthLimitOutcome | null {
  if (value == null) return null;
  if (value === 'NO_CURRENT_LIMIT' || value === 'CURRENT_LIMIT') return value;
  throw new Error('invalid');
}

export function parseConversation(value: unknown): ConversationOutcome | null {
  if (value == null) return null;
  if (value === 'VIABLE' || value === 'UNSAFE') return value;
  throw new Error('invalid');
}

/**
 * Applies a dated clarification to the decision copy. Stored questionnaire answers stay as they were.
 * A cleared injury does not erase illness, pain, medication or another confirmed limit.
 * A subject-scoped limit does not rewrite the rest of the health picture.
 */
export function applyOperationalClarification(
  health: HealthFact,
  input: { healthLimit: HealthLimitOutcome | null; conversation: ConversationOutcome | null; subjectRef?: string | null },
): HealthFact {
  let next = { ...health };
  if (input.healthLimit === 'CURRENT_LIMIT') {
    next = input.subjectRef
      ? { ...next, injuryLimitsNow: true }
      : { ...next, medicalLimit: 'YES', injuryLimitsNow: true };
  }
  if (input.healthLimit === 'NO_CURRENT_LIMIT') {
    next = { ...next, injuryLimitsNow: false };
    if (!input.subjectRef) {
      const open = (value: HealthFact['illness']): HealthFact['illness'] => (value === 'YES' ? 'YES' : 'NO');
      next = { ...next, illness: open(next.illness), pain: open(next.pain), medicalLimit: open(next.medicalLimit) };
    }
  }
  if (input.conversation === 'VIABLE') next = { ...next, conversationUnsafe: false };
  if (input.conversation === 'UNSAFE') next = { ...next, conversationUnsafe: true };
  return next;
}
