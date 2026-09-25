import { FIELD_KEYS, type IkigaiDraft, type IkigaiFieldKey, type IkigaiItem } from './types';

export function materialText(text: string): string {
  return text.normalize('NFC').trim();
}

type IndexedItem = { field: IkigaiFieldKey; text: string; evidence: string | null };

export function indexItems(items: IkigaiDraft['items']): Map<string, IndexedItem> {
  const map = new Map<string, IndexedItem>();
  for (const field of FIELD_KEYS) {
    for (const item of items[field] ?? []) {
      map.set(item.id, { field, text: item.text, evidence: item.evidence });
    }
  }
  return map;
}

function sameIds(left: string[], right: string[]): boolean {
  const a = [...left].sort();
  const b = [...right].sort();
  return a.length === b.length && a.every((id, index) => id === b[index]);
}

function clearEvidenceOnTextChange(previous: IkigaiDraft, next: IkigaiDraft) {
  const before = indexItems(previous.items);
  for (const field of FIELD_KEYS) {
    next.items[field] = (next.items[field] ?? []).map((item: IkigaiItem) => {
      const prior = before.get(item.id);
      if (!prior || prior.field !== field) return item;
      if (materialText(prior.text) === materialText(item.text)) return item;
      return { ...item, evidence: null };
    });
  }
}

export function reconcileDraft(previous: IkigaiDraft, candidate: IkigaiDraft): {
  draft: IkigaiDraft;
  affectedHypothesisIds: string[];
} {
  const next = structuredClone(candidate);
  clearEvidenceOnTextChange(previous, next);
  const beforeItems = indexItems(previous.items);
  const afterItems = indexItems(next.items);
  const removedItems = new Set([...beforeItems.keys()].filter((id) => !afterItems.has(id)));
  const changedItems = new Set(
    [...beforeItems.keys()].filter((id) => {
      const before = beforeItems.get(id);
      const after = afterItems.get(id);
      if (!before) return false;
      return !after || before.field !== after.field || materialText(before.text) !== materialText(after.text);
    }),
  );
  const beforeHypotheses = new Map(previous.hypotheses.map((h) => [h.id, h]));
  const affected = new Set<string>();

  for (const hypothesis of next.hypotheses) {
    hypothesis.itemIds = hypothesis.itemIds.filter((id) => !removedItems.has(id));
    const before = beforeHypotheses.get(hypothesis.id);
    const materialChange =
      !before ||
      materialText(before.text) !== materialText(hypothesis.text) ||
      !sameIds(before.itemIds, hypothesis.itemIds) ||
      before.itemIds.some((id) => changedItems.has(id));
    if (materialChange) {
      hypothesis.criteria = {};
      affected.add(hypothesis.id);
    }
  }

  const remaining = new Set(next.hypotheses.map((h) => h.id));
  const removedHypotheses = new Set(previous.hypotheses.filter((h) => !remaining.has(h.id)).map((h) => h.id));
  if (next.selectedHypothesisId && removedHypotheses.has(next.selectedHypothesisId)) {
    next.selectedHypothesisId = null;
  }

  next.nextExperiment = previous.nextExperiment ? structuredClone(previous.nextExperiment) : null;
  const experiment = next.nextExperiment;
  if (experiment) {
    const id = experiment.hypothesisId;
    const requiresReview =
      experiment.reviewStatus !== 'CURRENT' ||
      !id ||
      affected.has(id) ||
      !remaining.has(id) ||
      id !== next.selectedHypothesisId;
    if (requiresReview) {
      experiment.reviewStatus = 'NEEDS_REVIEW';
      experiment.hypothesisId = null;
    }
  }

  return { draft: next, affectedHypothesisIds: [...affected] };
}
