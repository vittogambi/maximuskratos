'use client';

import { motion, useReducedMotion } from 'motion/react';
import type { AnswerOptionDto } from '@/lib/api';
import { optionListContainer, optionListItem } from '../diagnostic-motion';

type Props = {
  options: AnswerOptionDto[];
  selected: string[];
  maxSelections: number | null;
  onToggle: (id: string) => void;
};

export function MultiChoiceOptions({ options, selected, maxSelections, onToggle }: Props) {
  const reduced = useReducedMotion();
  const max = maxSelections ?? options.length;
  const hasSelection = selected.length > 0;

  return (
    <motion.ul
      role="listbox"
      aria-multiselectable
      className={`dk-choice-list${hasSelection ? ' dk-choice-list--dim-unselected' : ''}`}
      variants={reduced ? undefined : optionListContainer}
      initial={reduced ? false : 'hidden'}
      animate={reduced ? undefined : 'show'}
    >
      {options.map((opt) => {
        const isSelected = selected.includes(opt.id);
        const isDisabled = !isSelected && selected.length >= max;
        return (
          <motion.li
            key={opt.id}
            variants={reduced ? undefined : optionListItem}
          >
            <button
              type="button"
              role="option"
              aria-selected={isSelected}
              disabled={isDisabled}
              onClick={() => onToggle(opt.id)}
              className={`dk-choice-option${isSelected ? ' dk-choice-option--selected' : ''}`}
            >
              <span className="dk-choice-checkbox" aria-hidden>
                {isSelected && (
                  <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                    <path
                      d="M1 4l3 3 5-6"
                      stroke="#0a0a0a"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
              </span>
              <span className="font-body-md">{opt.textEs}</span>
            </button>
          </motion.li>
        );
      })}
    </motion.ul>
  );
}
