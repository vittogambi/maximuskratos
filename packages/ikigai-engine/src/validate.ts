import { filledItemsOf, normalizeDraft, resolveSelectedHypothesisId } from './draft';
import {
  CRITERION_KEYS,
  FIELD_KEYS,
  type CompletionCheck,
  type IkigaiCriterionKey,
  type IkigaiDefinition,
  type IkigaiDraft,
  type IkigaiFieldKey,
} from './types';

export type DraftValidationIssue = { path: string; message: string };

const CRITERION_SET = new Set<string>(CRITERION_KEYS);

function isFieldKey(value: string): value is IkigaiFieldKey {
  return (FIELD_KEYS as readonly string[]).includes(value);
}

export function validateDraftStructure(definition: IkigaiDefinition, draft: IkigaiDraft): DraftValidationIssue[] {
  const issues: DraftValidationIssue[] = [];
  const evidenceByField = new Map(definition.fields.map((field) => [field.key, new Set(field.evidenceOptions.map((option) => option.key))]));
  const seenItemIds = new Set<string>();

  for (const field of FIELD_KEYS) {
    const items = draft.items?.[field] ?? [];
    if (items.length > 5) {
      issues.push({ path: `items.${field}`, message: `${field} has more than 5 items` });
    }
    const clarity = draft.fieldClarity?.[field];
    if (clarity != null && clarity !== 'ANSWERED' && clarity !== 'UNCLEAR') {
      issues.push({ path: `fieldClarity.${field}`, message: `${field} invalid fieldClarity` });
    }
    items.forEach((item, index) => {
      const path = `items.${field}[${index}]`;
      if (!item.id) issues.push({ path: `${path}.id`, message: 'empty item id' });
      else if (seenItemIds.has(item.id)) issues.push({ path: `${path}.id`, message: `duplicate item id ${item.id}` });
      else seenItemIds.add(item.id);
      if (item.text.length > 140) issues.push({ path: `${path}.text`, message: `${field} item exceeds 140` });
      if (item.evidence) {
        const allowed = evidenceByField.get(field);
        if (!allowed?.has(item.evidence)) {
          issues.push({ path: `${path}.evidence`, message: `${field} unknown evidence ${item.evidence}` });
        }
      }
    });
  }

  if (draft.hypotheses.length > 3) issues.push({ path: 'hypotheses', message: 'more than 3 hypotheses' });
  if (draft.patternNote && draft.patternNote.length > 280) {
    issues.push({ path: 'patternNote', message: 'patternNote too long' });
  }
  if (draft.noHypothesisYet && (draft.hypotheses.length > 0 || draft.selectedHypothesisId)) {
    issues.push({
      path: 'noHypothesisYet',
      message: 'noHypothesisYet cannot be combined with hypotheses or a selection',
    });
  }

  const hypIds = new Set<string>();
  draft.hypotheses.forEach((hyp, index) => {
    const path = `hypotheses[${index}]`;
    if (!hyp.id) issues.push({ path: `${path}.id`, message: 'empty hypothesis id' });
    else if (hypIds.has(hyp.id)) issues.push({ path: `${path}.id`, message: `duplicate hypothesis id ${hyp.id}` });
    else hypIds.add(hyp.id);
    if (hyp.text.length > 400) issues.push({ path: `${path}.text`, message: 'hypothesis text exceeds 400' });
    const local = new Set<string>();
    hyp.itemIds.forEach((id, itemIndex) => {
      if (local.has(id)) {
        issues.push({ path: `${path}.itemIds[${itemIndex}]`, message: `hypothesis ${hyp.id} repeats item ${id}` });
      }
      local.add(id);
      if (!seenItemIds.has(id)) {
        issues.push({ path: `${path}.itemIds[${itemIndex}]`, message: `hypothesis ${hyp.id} has unknown item ids` });
      }
    });
    for (const [key, value] of Object.entries(hyp.criteria ?? {})) {
      if (!CRITERION_SET.has(key)) {
        issues.push({ path: `${path}.criteria.${key}`, message: `unknown criterion ${key}` });
        continue;
      }
      if (value != null && ![1, 2, 3, 4, 5].includes(value)) {
        issues.push({ path: `${path}.criteria.${key}`, message: `invalid criterion value ${key}` });
      }
    }
  });

  if (draft.selectedHypothesisId && !draft.hypotheses.some((hyp) => hyp.id === draft.selectedHypothesisId)) {
    issues.push({ path: 'selectedHypothesisId', message: 'selectedHypothesisId not found' });
  }

  for (const key of Object.keys(draft.items ?? {})) {
    if (!isFieldKey(key)) issues.push({ path: `items.${key}`, message: `unknown field ${key}` });
  }

  return issues;
}

export function validateDraft(definition: IkigaiDefinition, draft: IkigaiDraft): string[] {
  return validateDraftStructure(definition, draft).map((issue) => issue.message);
}

function hypothesisReady(text: string, itemIds: string[]): boolean {
  return text.trim().length >= 12 && text.length <= 400 && itemIds.length >= 1;
}

export function validateForCompletion(definition: IkigaiDefinition, draft: IkigaiDraft): CompletionCheck {
  const structural = validateDraftStructure(definition, draft);
  if (structural.length > 0) {
    return { ok: false, step: 'HIPOTESIS', details: structural[0].message };
  }

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
    if (normalized.hypotheses.length > 0 || normalized.selectedHypothesisId) {
      return { ok: false, step: 'HIPOTESIS', details: 'noHypothesisYet cannot be combined with hypotheses or a selection' };
    }
    return { ok: true };
  }

  if (normalized.hypotheses.length < 1) {
    return {
      ok: false,
      step: 'HIPOTESIS',
      details: 'Crea una hipótesis o marca que todavía no ves una clara.',
    };
  }

  const selectedId = resolveSelectedHypothesisId(normalized);
  const selected = normalized.hypotheses.find((hyp) => hyp.id === selectedId);
  if (!selected) {
    return { ok: false, step: 'HIPOTESIS', details: 'Elige qué dirección quieres contrastar primero.' };
  }
  if (!hypothesisReady(selected.text, selected.itemIds)) {
    return { ok: false, step: 'HIPOTESIS', details: 'La posibilidad elegida todavía está por completar.' };
  }
  for (const key of CRITERION_KEYS) {
    if (!Object.prototype.hasOwnProperty.call(selected.criteria, key)) {
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

export function criterionAnswered(criteria: Partial<Record<IkigaiCriterionKey, 1 | 2 | 3 | 4 | 5 | null>>): boolean {
  return CRITERION_KEYS.every((id) => Object.prototype.hasOwnProperty.call(criteria, id));
}
