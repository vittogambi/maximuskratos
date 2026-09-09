import type { LabQuestion } from '@/lib/lab-api';
import { snapshotForm } from './dirty-form';
import { expandChoiceAnchors, formatNumericLabel, isTypedScale } from './play-scale';

export function answersSnapshot(
  questions: Array<{ id: string; raw_value?: unknown; status: string }>,
): string {
  return snapshotForm(
    [...questions]
      .sort((a, b) => a.id.localeCompare(b.id))
      .map((item) => ({ id: item.id, raw: item.raw_value ?? null, status: item.status })),
  );
}

export function applyQuestionAnswer(
  question: LabQuestion,
  raw: unknown,
  status?: string,
): LabQuestion {
  const skipped = status === 'SKIPPED_BY_USER';
  const empty = raw == null || raw === '';
  const nextStatus = status ?? (empty ? 'UNANSWERED' : 'ANSWERED');
  const anchors = expandChoiceAnchors(question.scale);
  const anchor = anchors.find((item) => String(item.value) === String(raw));
  const ordinalIndex = anchors.findIndex((item) => String(item.value) === String(raw));
  const cleared = skipped || empty || nextStatus !== 'ANSWERED';
  const typed = isTypedScale(question);
  const typedLabel = typed ? formatNumericLabel(question, raw) ?? (typeof raw === 'string' || typeof raw === 'number' ? String(raw) : null) : null;
  return {
    ...question,
    raw_value: cleared ? null : (raw as string | number),
    status: nextStatus,
    skipped,
    answer_label: cleared ? null : (anchor?.label ?? typedLabel ?? question.answer_label),
    answer_ordinal:
      cleared || ordinalIndex < 0 ? null : `${ordinalIndex + 1} de ${anchors.length}`,
  };
}

export function changedResponses(
  draft: Array<{
    id: string;
    raw_value?: unknown;
    status: string;
    qualitative_confirmed?: boolean | null;
  }>,
  baseline: Array<{ id: string; raw_value?: unknown; status: string }>,
) {
  const previous = new Map(baseline.map((item) => [item.id, item]));
  return draft.filter((item) => {
    const saved = previous.get(item.id);
    if (!saved) return item.status !== 'UNANSWERED' || item.raw_value != null;
    return String(saved.raw_value ?? '') !== String(item.raw_value ?? '') || saved.status !== item.status;
  });
}
