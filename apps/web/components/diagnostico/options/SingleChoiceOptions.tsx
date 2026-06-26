'use client';

import { motion, useReducedMotion } from 'motion/react';
import type { AnswerOptionDto } from '@/lib/api';
import { optionListContainer, optionListItem } from '../diagnostic-motion';

type Props = {
  options: AnswerOptionDto[];
  selected: string | null;
  onSelect: (id: string) => void;
};

export function SingleChoiceOptions({ options, selected, onSelect }: Props) {
  const reduced = useReducedMotion();
  const hasSelection = selected !== null;

  return (
    <motion.ul
      role="listbox"
      aria-label="Opciones de respuesta"
      className={`dk-choice-list${hasSelection ? ' dk-choice-list--dim-unselected' : ''}`}
      variants={reduced ? undefined : optionListContainer}
      initial={reduced ? false : 'hidden'}
      animate={reduced ? undefined : 'show'}
    >
      {options.map((opt) => {
        const isSelected = selected === opt.id;
        return (
          <motion.li
            key={opt.id}
            variants={reduced ? undefined : optionListItem}
          >
            <button
              type="button"
              role="option"
              aria-selected={isSelected}
              onClick={() => onSelect(opt.id)}
              className={`dk-choice-option${isSelected ? ' dk-choice-option--selected' : ''}`}
            >
              <span className="dk-choice-radio" aria-hidden />
              <span className="font-body-md">{opt.textEs}</span>
            </button>
          </motion.li>
        );
      })}
    </motion.ul>
  );
}
