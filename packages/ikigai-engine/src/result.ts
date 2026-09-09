import { classifyEvidence, itemById, normalizeDraft, resolveSelectedHypothesisId } from './draft';
import { ENGINE_VERSION } from './types';
import { deriveConvergences, deriveOpenQuestions, deriveTensions } from './rules';
import type {
  EvidenceClass,
  IkigaiDefinition,
  IkigaiDraft,
  IkigaiFieldKey,
  IkigaiResult,
  MaterialItemView,
} from './types';

function evidenceLabel(definition: IkigaiDefinition, fieldKey: IkigaiFieldKey, key: string | null): string | null {
  if (!key) return null;
  const field = definition.fields.find((f) => f.key === fieldKey);
  return field?.evidenceOptions.find((o) => o.key === key)?.label ?? null;
}

function toView(
  definition: IkigaiDefinition,
  fieldKey: IkigaiFieldKey,
  item: { id: string; text: string; evidence: string | null },
): MaterialItemView {
  const classification: EvidenceClass = classifyEvidence(item.evidence);
  return {
    id: item.id,
    text: item.text,
    evidence: item.evidence,
    evidenceLabel: evidenceLabel(definition, fieldKey, item.evidence),
    classification,
  };
}

function likertLabel(definition: IkigaiDefinition, value: 1 | 2 | 3 | 4 | 5 | null | undefined): string {
  if (value === null || value === undefined) return 'Sin responder';
  return definition.likertAnchors.find((a) => a.value === value)?.label ?? 'Sin responder';
}

export function buildResult(definition: IkigaiDefinition, draft: IkigaiDraft, now = '1970-01-01T00:00:00.000Z'): IkigaiResult {
  const normalized = normalizeDraft(draft);
  const map = itemById(normalized);
  const tensions = deriveTensions(definition, normalized);
  const convergences = deriveConvergences(definition, normalized);
  const openQuestions = deriveOpenQuestions(definition, normalized);

  const fields = definition.fields.map((field) => {
    const items = (normalized.items[field.key] ?? [])
      .filter((item) => item.text.trim().length >= 3)
      .map((item) => toView(definition, field.key, item));
    return {
      key: field.key,
      title: field.title,
      items,
      thin: items.length > 0 && items.length <= 2,
      untagged: items.length > 0 && items.every((item) => item.classification === 'unmarked'),
    };
  });

  const shownHyps = normalized.noHypothesisYet ? [] : normalized.hypotheses;

  const hypotheses = shownHyps.map((hyp, index) => {
    const coverage = {
      PASION: false,
      CAPACIDAD: false,
      NECESIDAD: false,
      VALOR: false,
    } as Record<IkigaiFieldKey, boolean>;
    const linkedItems: MaterialItemView[] = [];
    for (const id of hyp.itemIds) {
      const item = map.get(id);
      if (!item) continue;
      coverage[item.fieldKey] = true;
      linkedItems.push(toView(definition, item.fieldKey, item));
    }
    return {
      id: hyp.id,
      index: index + 1,
      text: hyp.text,
      coverage,
      criteria: definition.criteria.map((criterion) => ({
        key: criterion.key,
        label: criterion.label,
        text: criterion.text,
        value: hyp.criteria[criterion.key],
        answerLabel: likertLabel(definition, hyp.criteria[criterion.key]),
      })),
      linkedItems,
    };
  });

  const evidence = {
    byHypothesis: hypotheses.map((hyp) => ({
      hypothesisId: hyp.id,
      backed: hyp.linkedItems.filter((item) => item.classification === 'backed'),
      intuition: hyp.linkedItems.filter((item) => item.classification !== 'backed'),
    })),
  };

  return {
    definitionRef: definition.ref,
    engineVersion: ENGINE_VERSION,
    generatedAt: now,
    selectedHypothesisId: resolveSelectedHypothesisId(normalized),
    fieldClarity: normalized.fieldClarity,
    material: { fields },
    convergences,
    tensions,
    hypotheses,
    evidence,
    openQuestions,
    nextExperiment: normalized.nextExperiment,
  };
}
