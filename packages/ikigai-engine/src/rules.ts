import { classifyEvidence, itemById, normalizeText } from './draft';
import {
  CRITERION_KEYS,
  FIELD_KEYS,
  type IkigaiCriterionKey,
  type IkigaiDefinition,
  type IkigaiDraft,
  type IkigaiFieldKey,
  type Tension,
} from './types';

function interpolate(template: string, vars: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => vars[key] ?? `{${key}}`);
}

function copyOf(definition: IkigaiDefinition, id: string): string {
  return definition.rules.find((r) => r.id === id)?.copy ?? id;
}

function enabled(definition: IkigaiDefinition, id: string): boolean {
  return definition.rules.find((r) => r.id === id)?.enabled === true;
}

function fieldTitle(definition: IkigaiDefinition, key: IkigaiFieldKey): string {
  return definition.fields.find((f) => f.key === key)?.title ?? key;
}

function criterionLabel(definition: IkigaiDefinition, key: IkigaiCriterionKey): string {
  return definition.criteria.find((c) => c.key === key)?.label ?? key;
}

function hypIndex(draft: IkigaiDraft, id: string): number {
  const i = draft.hypotheses.findIndex((h) => h.id === id);
  return i >= 0 ? i + 1 : 1;
}

function filled(draft: IkigaiDraft, key: IkigaiFieldKey) {
  return (draft.items[key] ?? []).filter((item) => item.text.trim().length >= 3);
}

export function deriveTensions(definition: IkigaiDefinition, draft: IkigaiDraft): Tension[] {
  const out: Tension[] = [];
  const map = itemById(draft);

  for (const key of FIELD_KEYS) {
    const items = filled(draft, key);
    if (items.length === 0 && enabled(definition, 'T_FIELD_EMPTY')) {
      out.push({
        ruleId: 'T_FIELD_EMPTY',
        fieldKey: key,
        text: interpolate(copyOf(definition, 'T_FIELD_EMPTY'), { campo: fieldTitle(definition, key) }),
      });
    }
    if (items.length > 0 && items.length <= 2 && enabled(definition, 'T_FIELD_THIN')) {
      out.push({
        ruleId: 'T_FIELD_THIN',
        fieldKey: key,
        text: interpolate(copyOf(definition, 'T_FIELD_THIN'), { campo: fieldTitle(definition, key) }),
      });
    }
    if (items.length > 0 && enabled(definition, 'T_FIELD_INTUITION_ONLY')) {
      const classes = items.map((item) => classifyEvidence(item.evidence));
      const anyBacked = classes.includes('backed');
      const anyIntuition = classes.includes('intuition');
      if (!anyBacked && anyIntuition) {
        out.push({
          ruleId: 'T_FIELD_INTUITION_ONLY',
          fieldKey: key,
          text: interpolate(copyOf(definition, 'T_FIELD_INTUITION_ONLY'), {
            campo: fieldTitle(definition, key),
          }),
        });
      }
    }
  }

  if (draft.noHypothesisYet && enabled(definition, 'T_NO_HYPOTHESIS')) {
    out.push({
      ruleId: 'T_NO_HYPOTHESIS',
      text: copyOf(definition, 'T_NO_HYPOTHESIS'),
    });
  }

  const hyps = draft.noHypothesisYet ? [] : draft.hypotheses;

  if (hyps.length > 0 && enabled(definition, 'T_ALL_UNLINKED')) {
    const anyLinked = hyps.some((hyp) => {
      const fields = new Set(
        hyp.itemIds.map((id) => map.get(id)?.fieldKey).filter(Boolean),
      );
      return fields.size > 1;
    });
    if (!anyLinked) {
      out.push({
        ruleId: 'T_ALL_UNLINKED',
        text: copyOf(definition, 'T_ALL_UNLINKED'),
      });
    }
  }

  for (const hyp of hyps) {
    const n = String(hypIndex(draft, hyp.id));
    const covered = new Set(hyp.itemIds.map((id) => map.get(id)?.fieldKey).filter(Boolean));
    for (const key of FIELD_KEYS) {
      if (!covered.has(key) && enabled(definition, 'T_HYP_GAP')) {
        out.push({
          ruleId: 'T_HYP_GAP',
          hypothesisId: hyp.id,
          fieldKey: key,
          text: interpolate(copyOf(definition, 'T_HYP_GAP'), {
            n,
            campo: fieldTitle(definition, key),
          }),
        });
      }
    }

    const linked = hyp.itemIds.map((id) => map.get(id)).filter(Boolean);
    if (linked.length > 0 && enabled(definition, 'T_HYP_WEAK_EVIDENCE')) {
      const weak = linked.filter((item) => classifyEvidence(item!.evidence) !== 'backed').length;
      if (weak * 2 > linked.length) {
        out.push({
          ruleId: 'T_HYP_WEAK_EVIDENCE',
          hypothesisId: hyp.id,
          text: copyOf(definition, 'T_HYP_WEAK_EVIDENCE'),
        });
      }
    }

    const lowLabels: string[] = [];
    for (const key of CRITERION_KEYS) {
      const value = hyp.criteria[key];
      if (value === 1 || value === 2) {
        lowLabels.push(criterionLabel(definition, key));
        if (key === 'COHERENCIA_MORAL' && enabled(definition, 'T_HYP_MORAL_CONFLICT')) {
          out.push({
            ruleId: 'T_HYP_MORAL_CONFLICT',
            hypothesisId: hyp.id,
            text: copyOf(definition, 'T_HYP_MORAL_CONFLICT'),
          });
        }
      }
    }
    if (lowLabels.length > 0 && enabled(definition, 'T_HYP_CRITERION_LOW')) {
      out.push({
        ruleId: 'T_HYP_CRITERION_LOW',
        hypothesisId: hyp.id,
        text: interpolate(copyOf(definition, 'T_HYP_CRITERION_LOW'), {
          n,
          criterio: lowLabels.join(', '),
        }),
      });
    }

    if (enabled(definition, 'T_ENJOY_NOT_SUSTAINED')) {
      const passionAttract = hyp.itemIds.some((id) => {
        const item = map.get(id);
        return item?.fieldKey === 'PASION' && item.evidence === 'ATRACCION';
      });
      const valorSustained = hyp.itemIds.some((id) => {
        const item = map.get(id);
        return (
          item?.fieldKey === 'VALOR' &&
          (item.evidence === 'SOSTUVO_A_MI' || item.evidence === 'SOSTIENE_A_OTROS')
        );
      });
      if (passionAttract && !valorSustained) {
        out.push({
          ruleId: 'T_ENJOY_NOT_SUSTAINED',
          hypothesisId: hyp.id,
          text: copyOf(definition, 'T_ENJOY_NOT_SUSTAINED'),
        });
      }
    }

    if (enabled(definition, 'T_SKILL_NO_ENJOY')) {
      const skilled = hyp.itemIds.some((id) => {
        const item = map.get(id);
        return (
          item?.fieldKey === 'CAPACIDAD' &&
          (item.evidence === 'RESULTADOS' || item.evidence === 'EXPERIENCIA')
        );
      });
      if (skilled && (hyp.criteria.DISFRUTE_SOSTENIBLE === 1 || hyp.criteria.DISFRUTE_SOSTENIBLE === 2)) {
        out.push({
          ruleId: 'T_SKILL_NO_ENJOY',
          hypothesisId: hyp.id,
          text: copyOf(definition, 'T_SKILL_NO_ENJOY'),
        });
      }
    }
  }

  if (enabled(definition, 'T_SAME_TEXT_ALL_FIELDS')) {
    const byNorm = new Map<string, Set<IkigaiFieldKey>>();
    const original = new Map<string, string>();
    for (const key of FIELD_KEYS) {
      for (const item of filled(draft, key)) {
        const norm = normalizeText(item.text);
        if (!norm) continue;
        if (!byNorm.has(norm)) byNorm.set(norm, new Set());
        byNorm.get(norm)!.add(key);
        if (!original.has(norm)) original.set(norm, item.text.trim());
      }
    }
    for (const [norm, fields] of byNorm) {
      if (fields.size >= 3) {
        out.push({
          ruleId: 'T_SAME_TEXT_ALL_FIELDS',
          text: interpolate(copyOf(definition, 'T_SAME_TEXT_ALL_FIELDS'), {
            texto: original.get(norm) ?? norm,
          }),
        });
      }
    }
  }

  return out;
}

export function deriveOpenQuestions(
  definition: IkigaiDefinition,
  draft: IkigaiDraft,
): string[] {
  const questions: string[] = [];
  const map = itemById(draft);
  const hyps = draft.noHypothesisYet ? [] : draft.hypotheses;

  for (const hyp of hyps) {
    const n = String(hypIndex(draft, hyp.id));
    for (const criterion of definition.criteria) {
      if (hyp.criteria[criterion.key] === null || hyp.criteria[criterion.key] === undefined) {
        if (criterion.key in hyp.criteria && hyp.criteria[criterion.key] === null) {
          questions.push(`No respondiste "${criterion.label}" en la hipótesis ${n}.`);
        }
      }
    }
    const covered = new Set(hyp.itemIds.map((id) => map.get(id)?.fieldKey).filter(Boolean));
    for (const key of FIELD_KEYS) {
      if (!covered.has(key)) {
        questions.push(
          interpolate(definition.gapQuestionByField[key], { n }),
        );
      }
    }
  }

  const used = new Set(hyps.flatMap((h) => h.itemIds));
  const unusedCount = FIELD_KEYS.reduce((acc, key) => {
    return acc + filled(draft, key).filter((item) => !used.has(item.id)).length;
  }, 0);
  if (unusedCount > 0 && hyps.length > 0) {
    questions.push(`¿Por qué ${unusedCount} elementos no entraron en ninguna hipótesis?`);
  }

  return questions.slice(0, 8);
}

export function deriveConvergences(definition: IkigaiDefinition, draft: IkigaiDraft) {
  const map = itemById(draft);
  const hyps = draft.noHypothesisYet ? [] : draft.hypotheses;
  const byHypothesis = hyps.map((hyp) => {
    const counts: Record<IkigaiFieldKey, number> = {
      PASION: 0,
      CAPACIDAD: 0,
      NECESIDAD: 0,
      VALOR: 0,
    };
    for (const id of hyp.itemIds) {
      const item = map.get(id);
      if (item) counts[item.fieldKey] += 1;
    }
    return { hypothesisId: hyp.id, text: hyp.text, counts };
  });

  const usage = new Map<string, { text: string; count: number }>();
  for (const hyp of hyps) {
    const seen = new Set<string>();
    for (const id of hyp.itemIds) {
      if (seen.has(id)) continue;
      seen.add(id);
      const item = map.get(id);
      if (!item) continue;
      const cur = usage.get(id) ?? { text: item.text, count: 0 };
      cur.count += 1;
      usage.set(id, cur);
    }
  }
  const recurring = [...usage.values()].filter((row) => row.count >= 2);

  const used = new Set(hyps.flatMap((h) => h.itemIds));
  const unused: Array<{ fieldKey: IkigaiFieldKey; title: string; text: string }> = [];
  for (const field of definition.fields) {
    for (const item of filled(draft, field.key)) {
      if (!used.has(item.id)) {
        unused.push({ fieldKey: field.key, title: field.title, text: item.text });
      }
    }
  }

  return {
    byHypothesis,
    recurring,
    unused,
    patternNote: draft.patternNote?.trim() ? draft.patternNote.trim() : null,
  };
}

export function suggestNextExperiment(): null {
  return null;
}
