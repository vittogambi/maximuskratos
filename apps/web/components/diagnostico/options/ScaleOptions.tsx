'use client';

import { useRef, type KeyboardEvent } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import type { AnswerOptionDto } from '@/lib/api';
import { isBareScaleLabel, resolveScaleLabel } from '@/lib/scale-labels';
import type { ScalePrompt } from '@/lib/scale-prompts';
import { optionListContainer, optionListItem } from '../diagnostic-motion';

type Props = {
  options: AnswerOptionDto[];
  selected: string | null;
  onSelect: (id: string) => void;
  scaleType?: 'BEHAVIORAL' | 'FREQUENCY' | null;
  prompt?: ScalePrompt | null;
};

/** The printed label of the point, else its catalog label, else the printed anchor for 1 and 5. Points 2 to 4 without a label get none. */
function captionFor(opt: AnswerOptionDto, prompt: ScalePrompt | null | undefined, ends: { low: string; high: string }): string | null {
  const printed = prompt?.points?.[opt.order];
  if (printed) return printed;
  if (!isBareScaleLabel(opt.textEs, opt.order)) return resolveScaleLabel(opt, null, ends);
  if (opt.order === 1 && prompt?.low) return prompt.low;
  if (opt.order === 5 && prompt?.high) return prompt.high;
  return null;
}

function radioName(order: number, caption: string | null, detail: string | null): string {
  if (!caption) return String(order);
  return detail ? `${order}. ${caption}. ${detail}` : `${order}. ${caption}`;
}

export function ScaleOptions({ options, selected, onSelect, prompt }: Props) {
  const reduced = useReducedMotion();
  const refs = useRef<Array<HTMLButtonElement | null>>([]);
  const sorted = [...options].sort((a, b) => a.order - b.order);
  const last = sorted.length - 1;
  const ends = { low: sorted[0]?.textEs ?? '', high: sorted[last]?.textEs ?? '' };
  const captions = sorted.map((opt) => captionFor(opt, prompt, ends));
  const tabStop = Math.max(0, sorted.findIndex((opt) => opt.id === selected));
  // A label on 2, 3 or 4 means each point needs its own row. Otherwise the five points
  // sit on one row, in the thumb zone, and only the printed ends carry a sentence.
  const labeled = captions.some((caption, index) => caption !== null && index > 0 && index < last);

  function choose(index: number) {
    const opt = sorted[index];
    if (!opt) return;
    onSelect(opt.id);
    refs.current[index]?.focus();
  }

  // Radio group keyboard model: arrows and Home/End move and select, one tab stop for the group.
  function onKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    if (event.key === 'ArrowDown' || event.key === 'ArrowRight') {
      event.preventDefault();
      choose((index + 1) % sorted.length);
    } else if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') {
      event.preventDefault();
      choose((index - 1 + sorted.length) % sorted.length);
    } else if (event.key === 'Home') {
      event.preventDefault();
      choose(0);
    } else if (event.key === 'End') {
      event.preventDefault();
      choose(last);
    }
  }

  if (!labeled) {
    return (
      <div className="dk-scale-thumb">
        <div className="dk-scale-anchors" id="dk-scale-anchors">
          {captions[0] ? (
            <p className="dk-scale-anchor">
              <span className="dk-scale-anchor__n">{sorted[0]?.order}</span>
              <span>{captions[0]}</span>
            </p>
          ) : null}
          {captions[last] ? (
            <p className="dk-scale-anchor">
              <span className="dk-scale-anchor__n">{sorted[last]?.order}</span>
              <span>{captions[last]}</span>
            </p>
          ) : null}
        </div>
        <div
          className="dk-scale-thumb__row"
          role="radiogroup"
          aria-labelledby="dk-question-title"
          aria-describedby="dk-scale-anchors"
        >
          {sorted.map((opt, index) => {
            const isSelected = selected === opt.id;
            return (
              <button
                key={opt.id}
                ref={(el) => {
                  refs.current[index] = el;
                }}
                type="button"
                role="radio"
                aria-checked={isSelected}
                aria-label={radioName(opt.order, captions[index], null)}
                tabIndex={index === tabStop ? 0 : -1}
                onKeyDown={(event) => onKeyDown(event, index)}
                onClick={() => onSelect(opt.id)}
                className={`dk-scale-key${isSelected ? ' is-selected' : ''}`}
              >
                {opt.order}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <motion.div
      className="dk-scale-options"
      role="radiogroup"
      aria-labelledby="dk-question-title"
      variants={reduced ? undefined : optionListContainer}
      initial={reduced ? false : 'hidden'}
      animate={reduced ? undefined : 'show'}
    >
      {sorted.map((opt, index) => {
        const isSelected = selected === opt.id;
        const caption = captions[index];
        const detail = prompt?.details?.[opt.order] ?? null;
        return (
          <motion.button
            key={opt.id}
            ref={(el: HTMLButtonElement | null) => {
              refs.current[index] = el;
            }}
            type="button"
            role="radio"
            aria-checked={isSelected}
            aria-label={radioName(opt.order, caption, detail)}
            tabIndex={index === tabStop ? 0 : -1}
            onKeyDown={(event: KeyboardEvent<HTMLButtonElement>) => onKeyDown(event, index)}
            onClick={() => onSelect(opt.id)}
            variants={reduced ? undefined : optionListItem}
            className={`dk-scale-row${isSelected ? ' is-selected' : ''}${caption ? '' : ' dk-scale-row--bare'}${detail ? ' dk-scale-row--defined' : ''}`}
          >
            <span className="dk-scale-number">{opt.order}</span>
            <span className="dk-scale-label">
              {caption}
              {detail ? <span className="dk-scale-detail">{detail}</span> : null}
            </span>
            <span className="dk-scale-radio" aria-hidden />
          </motion.button>
        );
      })}
    </motion.div>
  );
}
