import { allItems, filledItemsOf, normalizeDraft, resolveSelectedHypothesisId, validHypotheses } from './draft';
import { CRITERION_KEYS, FIELD_KEYS, type CompletionCheck, type IkigaiDefinition, type IkigaiDraft } from './types';

export function validateDraft(definition: IkigaiDefinition, draft: IkigaiDraft): string[] {
  const errors: string[] = [];
  const knownIds = new Set(definition.fields.flatMap((f) => f.evidenceOptions.map((o) => o.key)));
  const knownItemIds = new Set(allItems(draft).map((item) => item.id));
  for (const field of FIELD_KEYS) {
    const items = draft.items[field] ?? [];
    if (items.length > 5) errors.push(`${field} has more than 5 items`);
    const clarity = draft.fieldClarity?.[field];
    if (clarity != null && clarity !== 'ANSWERED' && clarity !== 'UNCLEAR') {
      errors.push(`${field} invalid fieldClarity`);
    }
    for (const item of items) {
      if (item.text.length > 140) errors.push(`${field} item exceeds 140`);
      if (item.evidence && !knownIds.has(item.evidence)) {
        errors.push(`${field} unknown evidence ${item.evidence}`);
      }
    }
  }
  if (draft.hypotheses.length > 3) errors.push('more than 3 hypotheses');
  if (draft.patternNote && draft.patternNote.length > 280) errors.push('patternNote too long');
  if (draft.selectedHypothesisId && !draft.hypotheses.some((hyp) => hyp.id === draft.selectedHypothesisId)) {
    errors.push('selectedHypothesisId not found');
  }
  for (const hyp of draft.hypotheses) {
    if (hyp.itemIds.some((id) => !knownItemIds.has(id))) {
      errors.push(`hypothesis ${hyp.id} has unknown item ids`);
    }
  }
  return errors;
}

export function validateForCompletion(
  definition: IkigaiDefinition,
  draft: IkigaiDraft,
): CompletionCheck {
  void definition;
  const normalized = normalizeDraft(draft);
  for (const field of FIELD_KEYS) {
    const items = filledItemsOf(normalized, field);
    const clarity = normalized.fieldClarity[field];
    if (clarity !== 'ANSWERED' && clarity !== 'UNCLEAR') {
      return { ok: false, step: field, details: 'Añade algo o indica que todavía no está claro.' };
    }
    for (const item of items) {
      if (item.text.trim().length > 140) {
        return { ok: false, step: field, details: 'Texto demasiado largo.' };
      }
    }
  }

  if (normalized.noHypothesisYet) {
    return { ok: true };
  }

  const hyps = validHypotheses(normalized);
  const attempted = normalized.hypotheses.filter((h) => h.text.trim().length > 0 || h.itemIds.length > 0);
  if (hyps.length < 1) {
    return {
      ok: false,
      step: 'HIPOTESIS',
      details: 'Crea una hipótesis o marca que todavía no ves una clara.',
    };
  }
  for (const hyp of attempted) {
    if (hyp.text.trim().length < 12) {
      return { ok: false, step: 'HIPOTESIS', details: 'Escribe la hipótesis en una frase.' };
    }
    if (hyp.text.length > 400) {
      return { ok: false, step: 'HIPOTESIS', details: 'La hipótesis es demasiado larga.' };
    }
    if (hyp.itemIds.length < 1) {
      return { ok: false, step: 'HIPOTESIS', details: 'Elige al menos un elemento.' };
    }
    const known = new Set(allItems(normalized).map((item) => item.id));
    if (hyp.itemIds.some((id) => !known.has(id))) {
      return { ok: false, step: 'HIPOTESIS', details: 'Hay piezas que ya no existen.' };
    }
  }

  const selectedId = resolveSelectedHypothesisId(normalized);
  const selected = hyps.find((hyp) => hyp.id === selectedId);
  if (!selected) {
    return { ok: false, step: 'HIPOTESIS', details: 'Elige qué dirección quieres contrastar primero.' };
  }
  for (const key of CRITERION_KEYS) {
    if (!(key in selected.criteria)) {
      return { ok: false, step: 'CONTRASTE', details: 'Falta completar este paso.' };
    }
  }

  return { ok: true };
}

export function validateNextExperiment(input: {
  focus: string;
  horizonDays: number;
  action: string;
  signal: string;
}): string | null {
  if (!input.focus.trim()) return 'Elige qué quieres comprobar.';
  if (input.focus.length > 200) return 'El foco es demasiado largo.';
  if (![30, 60, 90].includes(input.horizonDays)) return 'Elige 30, 60 o 90 días.';
  if (!input.action.trim() || input.action.length > 280) return 'Escribe una acción concreta.';
  if (!input.signal.trim() || input.signal.length > 200) return 'Escribe una señal observable.';
  return null;
}
