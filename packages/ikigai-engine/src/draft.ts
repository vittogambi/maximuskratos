import {
  BACKED_KEYS,
  FIELD_KEYS,
  INTUITION_KEYS,
  type EvidenceClass,
  type FieldClarity,
  type FieldClarityMap,
  type IkigaiDraft,
  type IkigaiFieldKey,
  type IkigaiHypothesis,
} from './types';

export function emptyFieldClarity(): FieldClarityMap {
  return {
    PASION: null,
    CAPACIDAD: null,
    NECESIDAD: null,
    VALOR: null,
  };
}

export function emptyDraft(): IkigaiDraft {
  return {
    items: {
      PASION: [],
      CAPACIDAD: [],
      NECESIDAD: [],
      VALOR: [],
    },
    patternNote: null,
    hypotheses: [],
    noHypothesisYet: false,
    nextExperiment: null,
    fieldClarity: emptyFieldClarity(),
    selectedHypothesisId: null,
  };
}

function isClarity(value: unknown): value is Exclude<FieldClarity, null> {
  return value === 'ANSWERED' || value === 'UNCLEAR';
}

export function filledItemsOf(draft: IkigaiDraft, key: IkigaiFieldKey) {
  return (draft.items[key] ?? []).filter((item) => item.text.trim().length >= 3);
}

export function validHypotheses(draft: IkigaiDraft): IkigaiHypothesis[] {
  return draft.hypotheses.filter(
    (hyp) => hyp.text.trim().length >= 12 && hyp.text.length <= 400 && hyp.itemIds.length >= 1,
  );
}

export function resolveSelectedHypothesisId(draft: IkigaiDraft): string | null {
  const id = draft.selectedHypothesisId;
  return id && draft.hypotheses.some((hypothesis) => hypothesis.id === id) ? id : null;
}

export function normalizeDraft(value: unknown): IkigaiDraft {
  const fallback = emptyDraft();
  if (!value || typeof value !== 'object') return fallback;
  const raw = value as Partial<IkigaiDraft>;
  const items = {
    PASION: Array.isArray(raw.items?.PASION) ? raw.items.PASION : fallback.items.PASION,
    CAPACIDAD: Array.isArray(raw.items?.CAPACIDAD) ? raw.items.CAPACIDAD : fallback.items.CAPACIDAD,
    NECESIDAD: Array.isArray(raw.items?.NECESIDAD) ? raw.items.NECESIDAD : fallback.items.NECESIDAD,
    VALOR: Array.isArray(raw.items?.VALOR) ? raw.items.VALOR : fallback.items.VALOR,
  };
  const fieldClarity = emptyFieldClarity();
  for (const key of FIELD_KEYS) {
    const hasItems = items[key].some((item) => item.text.trim().length >= 3);
    const rawClarity = raw.fieldClarity?.[key];
    if (hasItems) fieldClarity[key] = 'ANSWERED';
    else if (isClarity(rawClarity)) fieldClarity[key] = rawClarity;
    else fieldClarity[key] = null;
  }
  const hypotheses = Array.isArray(raw.hypotheses) ? raw.hypotheses : fallback.hypotheses;
  let selected = typeof raw.selectedHypothesisId === 'string' ? raw.selectedHypothesisId : null;
  if (selected && !hypotheses.some((hyp) => hyp.id === selected)) selected = null;
  return {
    items,
    patternNote: raw.patternNote ?? null,
    hypotheses,
    noHypothesisYet: Boolean(raw.noHypothesisYet),
    nextExperiment: raw.nextExperiment ?? null,
    fieldClarity,
    selectedHypothesisId: selected,
  };
}

export function classifyEvidence(key: string | null | undefined): EvidenceClass {
  if (!key) return 'unmarked';
  if ((INTUITION_KEYS as readonly string[]).includes(key)) return 'intuition';
  if ((BACKED_KEYS as readonly string[]).includes(key)) return 'backed';
  return 'unmarked';
}

export function normalizeText(text: string): string {
  return text.trim().toLowerCase().replace(/\s+/g, ' ');
}

export function allItems(draft: IkigaiDraft) {
  return FIELD_KEYS.flatMap((key) =>
    (draft.items[key] ?? []).map((item) => ({ ...item, fieldKey: key })),
  );
}

export function itemById(draft: IkigaiDraft) {
  const map = new Map<string, ReturnType<typeof allItems>[number]>();
  for (const item of allItems(draft)) map.set(item.id, item);
  return map;
}
