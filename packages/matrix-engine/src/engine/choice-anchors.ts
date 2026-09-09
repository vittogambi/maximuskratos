import type { ScaleAnchor, ScaleDefinition } from '../types';

export function expandChoiceAnchors(
  scale: Pick<ScaleDefinition, 'kind' | 'anchors'>,
): ScaleAnchor[] {
  const anchors = scale.anchors;
  if (scale.kind !== 'CHOICE' || anchors.length !== 1) return anchors;
  const only = anchors[0];
  if (only.value != null) return anchors;
  const parts = only.label.split(/\s*\/\s*/).map((part) => part.trim()).filter(Boolean);
  if (parts.length < 2) return anchors;
  return parts.map((label) => ({ value: label, label, score: only.score }));
}
