export const MEN_A1_FAMILY = 'MEN-A1';

export type MenA1Priority = {
  id: string;
  advance: string;
  recognize: string;
  nextStep: string;
};

export type MenA1PrepPayload = {
  priorities: MenA1Priority[];
  primaryId: string | null;
  prepConfirmedAt: string | null;
};

export type PriorityReviewOutcome = 'ACHIEVED' | 'NOT_ACHIEVED' | 'UNKNOWN';

export type MenA1ReviewOutcomes = {
  priorities: { id: string; outcome: PriorityReviewOutcome; note?: string | null }[];
};

export function maxPriorities(minimum: boolean): number {
  return minimum ? 1 : 3;
}

export function normalizePrepPayload(input: unknown, minimum: boolean): MenA1PrepPayload {
  const max = maxPriorities(minimum);
  if (!input || typeof input !== 'object') {
    return { priorities: [], primaryId: null, prepConfirmedAt: null };
  }
  const raw = input as { priorities?: unknown; primaryId?: unknown; prepConfirmedAt?: unknown };
  const priorities: MenA1Priority[] = [];
  if (Array.isArray(raw.priorities)) {
    for (const item of raw.priorities.slice(0, max)) {
      if (!item || typeof item !== 'object') continue;
      const row = item as { id?: unknown; advance?: unknown; recognize?: unknown; nextStep?: unknown };
      if (typeof row.id !== 'string' || !row.id.trim()) continue;
      priorities.push({
        id: row.id.trim(),
        advance: typeof row.advance === 'string' ? row.advance : '',
        recognize: typeof row.recognize === 'string' ? row.recognize : '',
        nextStep: typeof row.nextStep === 'string' ? row.nextStep : '',
      });
    }
  }
  let primaryId = typeof raw.primaryId === 'string' && raw.primaryId.trim() ? raw.primaryId.trim() : null;
  if (primaryId && !priorities.some((row) => row.id === primaryId)) primaryId = priorities[0]?.id ?? null;
  if (!primaryId && priorities.length === 1) primaryId = priorities[0]!.id;
  const prepConfirmedAt = typeof raw.prepConfirmedAt === 'string' ? raw.prepConfirmedAt : null;
  return { priorities, primaryId, prepConfirmedAt };
}

export function validateConfirmPrep(payload: MenA1PrepPayload, minimum: boolean): string | null {
  const max = maxPriorities(minimum);
  const filled = payload.priorities.filter((row) => row.advance.trim() && row.recognize.trim() && row.nextStep.trim());
  if (filled.length < 1) return 'Escribe al menos una prioridad completa.';
  if (filled.length > max) return minimum ? 'En la versión mínima solo cabe una prioridad.' : 'Solo caben tres prioridades.';
  if (!minimum && filled.length > 1 && !payload.primaryId) return 'Elige cuál es la prioridad principal.';
  if (minimum && !filled[0]) return 'Completa la prioridad de la versión mínima.';
  return null;
}

export function digestMenA1Evidence(input: {
  minimum: boolean;
  prep: MenA1PrepPayload;
  review: MenA1ReviewOutcomes | null;
  indicatorRef: string;
}): string {
  return JSON.stringify({
    minimum: input.minimum,
    indicatorRef: input.indicatorRef,
    priorities: input.prep.priorities.map((row) => ({
      id: row.id,
      advance: row.advance.trim(),
      recognize: row.recognize.trim(),
      nextStep: row.nextStep.trim(),
    })),
    primaryId: input.prep.primaryId,
    review: input.review?.priorities ?? [],
  });
}

export function deriveIndicatorFromReview(
  minimum: boolean,
  prep: MenA1PrepPayload,
  review: MenA1ReviewOutcomes | null,
): { value: number | null; complete: boolean; unknownCount: number; reason?: string } {
  if (!review?.priorities?.length) {
    return { value: null, complete: false, unknownCount: 0, reason: 'Faltan las respuestas por prioridad.' };
  }
  const activeIds = prep.priorities.filter((row) => row.advance.trim()).map((row) => row.id);
  if (!activeIds.length) {
    return { value: null, complete: false, unknownCount: 0, reason: 'No hay prioridades acordadas para esta semana.' };
  }
  const byId = new Map(review.priorities.map((row) => [row.id, row.outcome]));
  let unknownCount = 0;
  let achieved = 0;
  for (const id of activeIds) {
    const outcome = byId.get(id);
    if (!outcome) return { value: null, complete: false, unknownCount: 0, reason: 'Responde cada prioridad acordada.' };
    if (outcome === 'UNKNOWN') unknownCount += 1;
    else if (outcome === 'ACHIEVED') achieved += 1;
  }
  if (unknownCount > 0) {
    return { value: null, complete: false, unknownCount, reason: 'Hay prioridades sin resolver. No publiquemos un resultado completo.' };
  }
  if (minimum) {
    const primary = prep.primaryId ?? activeIds[0]!;
    const outcome = byId.get(primary);
    if (outcome === 'ACHIEVED') return { value: 1, complete: true, unknownCount: 0 };
    if (outcome === 'NOT_ACHIEVED') return { value: 0, complete: true, unknownCount: 0 };
    return { value: null, complete: false, unknownCount: 1, reason: 'Indica si avanzó tu prioridad.' };
  }
  return { value: achieved, complete: true, unknownCount: 0 };
}
