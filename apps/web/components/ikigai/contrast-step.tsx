'use client';

import type { IkigaiDefinition, IkigaiDraft } from '@/lib/ikigai-api';
import { CONTRAST_ONE_NOTE } from '@/lib/ikigai-ui/copy';
import { contrastScreens } from '@/lib/ikigai-ui/format';

export function IkigaiContrastStep({
  definition,
  draft,
  index,
  onChange,
}: {
  definition: IkigaiDefinition;
  draft: IkigaiDraft;
  index: number;
  onChange: (draft: IkigaiDraft) => void;
}) {
  const screens = contrastScreens(draft);
  const screen = screens[index];
  if (!screen) return null;
  const criterion = definition.criteria.find((c) => c.key === screen.criterionKey);
  const hyp = draft.hypotheses.find((h) => h.id === screen.hypId);
  if (!criterion || !hyp) return null;
  const answered = Object.prototype.hasOwnProperty.call(hyp.criteria, screen.criterionKey);
  const value = hyp.criteria[screen.criterionKey];

  function setValue(next: 1 | 2 | 3 | 4 | 5 | null) {
    onChange({
      ...draft,
      hypotheses: draft.hypotheses.map((h) =>
        h.id === screen.hypId
          ? { ...h, criteria: { ...h.criteria, [screen.criterionKey]: next } }
          : h,
      ),
    });
  }

  return (
    <>
      <p className="ik-kicker">
        {screen.criterionIndex + 1} de 6 · {criterion.label}
      </p>
      <h1 className="ik-question font-body">{criterion.text}</h1>
      <p className="font-body-md ik-support">{hyp.text}</p>
      <p className="ik-hint">{CONTRAST_ONE_NOTE}</p>
      <div className="ik-likert" role="radiogroup" aria-label={criterion.text}>
        {definition.likertAnchors.map((anchor) => (
          <button
            key={anchor.value}
            type="button"
            className={value === anchor.value ? 'is-on' : ''}
            aria-pressed={value === anchor.value}
            onClick={() => setValue(anchor.value)}
          >
            {anchor.label}
          </button>
        ))}
      </div>
      <button type="button" className="ik-text" onClick={() => setValue(null)}>
        {definition.skipCriterionLabel}
      </button>
      {answered ? <span className="sr-only">Respondido</span> : null}
    </>
  );
}
