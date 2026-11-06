import type { DirectionMode, EvidenceItem, EvidenceSection } from '@/lib/journey-api';

/** How a saved direction reads to the person. The mode decides the status; the UI never promotes it. */
export const DIRECTION_STATUS: Record<DirectionMode, { label: string; help: string }> = {
  CLEAR: {
    label: 'Confirmada por ti',
    help: 'La escribiste como tu propósito. Puedes cambiarla cuando quieras.',
  },
  EXPLORE: {
    label: 'Provisional',
    help: 'Es una idea que estás probando. Puede cambiar a medida que aprendas.',
  },
  UNKNOWN: {
    label: 'En exploración',
    help: 'Salió de una exploración. No es una conclusión sobre quién eres.',
  },
};

export function directionStatusLabel(mode: DirectionMode | null): string {
  return mode ? DIRECTION_STATUS[mode].label : 'Sin estado';
}

export const EVIDENCE_ITEM_LABEL: Record<Exclude<EvidenceItem['status'], 'ANSWERED'>, string> = {
  UNKNOWN: 'Marcaste que no lo sabes.',
  DECLINED: 'Preferiste no responder.',
  NOT_APPLICABLE: 'Marcaste que no aplica.',
  PENDING: 'Lo dejaste para después.',
  SKIPPED: 'La saltaste.',
  EMPTY: 'Sin respuesta todavía.',
};

/** What the person can do to reach a part of the questionnaire, without skipping its order. */
export function evidenceAccess(section: EvidenceSection): { text: string; action: string | null } | null {
  if (section.access === 'NOT_STARTED') {
    return { text: 'Esta parte está dentro del cuestionario y todavía no lo empezaste.', action: 'Empezar el cuestionario' };
  }
  if (section.access === 'LATER') {
    return { text: 'Esta parte aparece más adelante en el cuestionario. Llegas a ella siguiendo el orden de las preguntas.', action: 'Seguir el cuestionario' };
  }
  if (section.access === 'CURRENT') {
    return { text: 'Es la parte del cuestionario en la que vas.', action: 'Seguir respondiendo' };
  }
  if (section.access === 'CLOSED') {
    return { text: 'El cuestionario quedó cerrado sin respuestas en esta parte.', action: null };
  }
  return null;
}

export const CROSS_VALUATION = [
  { value: 'RECOGNIZED', label: 'Tiene sentido para mí' },
  { value: 'PARTIAL', label: 'Tiene sentido en parte' },
  { value: 'NOT_RECOGNIZED', label: 'No veo esta conexión' },
  { value: 'INSUFFICIENT', label: 'Todavía no lo sé' },
] as const;

export function crossValuationLabel(value: string | null): string {
  return CROSS_VALUATION.find((row) => row.value === value)?.label ?? 'Sin valorar';
}

export function savedDateLabel(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('es', { day: 'numeric', month: 'long', year: 'numeric' }).format(date);
}
