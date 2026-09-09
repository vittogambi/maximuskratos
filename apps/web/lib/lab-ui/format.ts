import { labUiLabels } from './labels';

export interface AnswerLike {
  status: string;
  raw_value?: number | string | null;
  answer_label?: string | null;
  answer_ordinal?: string | null;
}

/**
 * What Rafa reads as the answer. A bare number is only used when the definition
 * offers nothing better: label first, then position in the scale, then raw value.
 */
export function formatAnswer(answer: AnswerLike): string {
  if (answer.status !== 'ANSWERED') return labUiLabels.responseStatus(answer.status);
  if (answer.answer_label) return answer.answer_label;
  if (answer.answer_ordinal) return answer.answer_ordinal;
  if (answer.raw_value != null && answer.raw_value !== '') return String(answer.raw_value);
  return labUiLabels.responseStatus('UNANSWERED');
}

export function answerIsInterpreted(answer: AnswerLike): boolean {
  return Boolean(answer.answer_label || answer.answer_ordinal);
}

export interface ResponseCounts {
  answered: number;
  unanswered: number;
  skipped: number;
  notServed: number;
  total: number;
}

export function countResponses(list: Array<{ status: string }>): ResponseCounts {
  const counts: ResponseCounts = {
    answered: 0,
    unanswered: 0,
    skipped: 0,
    notServed: 0,
    total: list.length,
  };
  for (const item of list) {
    if (item.status === 'ANSWERED') counts.answered += 1;
    else if (item.status === 'SKIPPED_BY_USER') counts.skipped += 1;
    else if (item.status === 'NOT_SERVED_BY_POLICY') counts.notServed += 1;
    else counts.unanswered += 1;
  }
  return counts;
}

export function countNoun(n: number, one: string, many: string): string {
  return `${n} ${n === 1 ? one : many}`;
}

export function describeResponseBuckets(counts: ResponseCounts): string {
  const parts = [countNoun(counts.answered, 'respuesta', 'respuestas')];
  if (counts.unanswered) parts.push(countNoun(counts.unanswered, 'sin respuesta', 'sin respuesta'));
  if (counts.skipped) parts.push(countNoun(counts.skipped, 'omitida', 'omitidas'));
  if (counts.notServed) parts.push(countNoun(counts.notServed, 'no presentada', 'no presentadas'));
  return parts.join(', ');
}

/** Purpose never counts toward domain coverage. */
export function describeResponseCounts(input: {
  scoreableUnanswered: number;
  purposeAnswered: number;
  purposeTotal?: number;
}): string {
  const domains =
    input.scoreableUnanswered === 0
      ? 'Los 4 ámbitos tienen cobertura suficiente.'
      : `Faltan ${input.scoreableUnanswered} respuestas en los ámbitos.`;
  const purpose =
    input.purposeAnswered === 0 ? ' Propósito no fue respondido en este caso.' : '';
  return `${domains}${purpose}`;
}

export function formatScore(score: number | null | undefined): string {
  if (score == null) return 'Sin puntaje';
  return `${score} / 100`;
}

export function formatState(state: string | null | undefined): string {
  if (state == null) return 'No clasificado';
  return labUiLabels.state(state);
}

export function formatCoverage(value: number | null | undefined): string {
  if (value == null) return 'Sin dato';
  const percent = value <= 1 ? value * 100 : value;
  return `${Math.round(percent)}%`;
}

export function formatDay(iso: string | null | undefined): string {
  if (!iso) return 'Sin fecha';
  const [year, month, day] = iso.slice(0, 10).split('-');
  if (!year || !month || !day) return iso;
  const months = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
  return `${Number(day)} ${months[Number(month) - 1]} ${year}`;
}

/** A plan or objective always reads by name; the catalog id stays secondary. */
export function nameWithId(name: string | null | undefined, id: string | null | undefined): {
  name: string;
  id: string | null;
} {
  if (name && id && name !== id) return { name, id };
  if (name) return { name, id: null };
  if (id) return { name: id, id: null };
  return { name: 'Sin dato', id: null };
}

/**
 * Human error copy for the operator. Raw server text stays off screen.
 */
export function humanError(error: unknown, fallback = 'No pudimos completar esta acción.'): {
  message: string;
  hint: string | null;
  technical: string | null;
} {
  const status = (error as { status?: number } | null)?.status;
  const reason = (error as { reason?: string } | null)?.reason;
  const technical = error instanceof Error ? `${status ?? ''} ${reason ?? ''} ${error.message}`.trim() : null;

  if (reason === 'EXPECTATION_PENDING') {
    return {
      message: 'Todavía no podemos mostrar el resultado.',
      hint: 'Registra tu predicción y después revelamos lo que hizo la Matriz.',
      technical,
    };
  }
  if (reason === 'CHANGE_NOT_APPLICABLE') {
    return {
      message: 'Este cambio no se puede aplicar sobre la definición actual.',
      hint: 'El valor actual ya no coincide con el que tenía cuando abriste esta pantalla. Vuelve a cargar y elige de nuevo.',
      technical,
    };
  }
  if (reason === 'CHANGE_NO_EFFECT') {
    return {
      message: 'Este cambio no modifica nada.',
      hint: 'El valor nuevo es igual al actual. Elige otro valor.',
      technical,
    };
  }
  if (reason === 'BASE_SNAPSHOT_DRIFT') {
    return {
      message: 'No pudimos comparar este cambio.',
      hint: 'El resultado original no se reprodujo igual, así que la comparación no sería fiable.',
      technical,
    };
  }
  if (status === 401) {
    return {
      message: 'La sesión venció.',
      hint: 'Entra de nuevo para continuar donde estabas.',
      technical,
    };
  }
  if (status === 403) {
    return { message: 'Esta acción no está permitida.', hint: null, technical };
  }
  if (status === 409) {
    return {
      message: 'El caso ya avanzó de este paso.',
      hint: 'Seguimos con el estado actual.',
      technical,
    };
  }
  if (status === 422 || status === 400) {
    return { message: 'Hay datos que no podemos aceptar.', hint: 'Revisa los campos marcados.', technical };
  }
  if (status && status >= 500) {
    return { message: fallback, hint: 'Puedes reintentar.', technical };
  }
  return { message: fallback, hint: 'Revisa tu conexión y reintenta.', technical };
}

const LAB_RUN_PATH = /^\/admin\/lab\/runs\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function flaggedQuestionHref(questionId: string, runId: string): string {
  return `/admin/lab/findings/questions/${encodeURIComponent(questionId)}?from=${encodeURIComponent(`/admin/lab/runs/${runId}`)}`;
}

export function labRunReturnPath(from: string | null | undefined): string | null {
  if (!from) return null;
  return LAB_RUN_PATH.test(from) ? from : null;
}
