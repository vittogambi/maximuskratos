'use client';

import type { IkigaiDefinition, IkigaiDraft } from '@/lib/ikigai-api';
import { CONTRAST_SUBJECT } from '@/lib/ikigai-ui/copy';
import { contrastScreens, speakOfDirection } from '@/lib/ikigai-ui/format';

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
  const prompt = speakOfDirection(criterion.text);

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

  const skipped = answered && value == null;

  return (
    <div className="ik-contrast">
      <article className="ik-contrast__subject">
        <p className="ik-contrast__label">{CONTRAST_SUBJECT}</p>
        <p className="ik-contrast__phrase">{hyp.text}</p>
      </article>
      <p className="ik-contrast__kicker">{criterion.label}</p>
      <h1 className="ik-question font-body">{prompt}</h1>
      <div className="ik-contrast__options" role="radiogroup" aria-label={prompt}>
        {definition.likertAnchors.map((anchor) => {
          const on = value === anchor.value;
          return (
            <button
              key={anchor.value}
              type="button"
              role="radio"
              className={on ? 'is-on' : ''}
              aria-checked={on}
              onClick={() => setValue(anchor.value)}
            >
              <span className="ik-contrast__check" aria-hidden />
              <span>{anchor.label}</span>
            </button>
          );
        })}
      </div>
      <button type="button" className={`ik-contrast__skip${skipped ? ' is-on' : ''}`} onClick={() => setValue(null)}>
        {definition.skipCriterionLabel}
      </button>
      {answered ? <span className="sr-only">Respondido</span> : null}
    </div>
  );
}
