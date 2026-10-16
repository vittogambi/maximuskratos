'use client';

import { motion, useReducedMotion } from 'motion/react';
import type { AnswerOptionDto } from '@/lib/api';
import { optionListContainer, optionListItem } from '../diagnostic-motion';

type Props = {
  options: AnswerOptionDto[];
  selected: string | null;
  onSelect: (id: string) => void;
  figures?: boolean;
};

function SexFigure({ kind }: { kind: 'hombre' | 'mujer' }) {
  return (
    <svg className="dk-choice-figure" viewBox="0 0 24 24" width="22" height="22" aria-hidden>
      {kind === 'hombre' ? (
        <g fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="10" cy="14" r="5.2" />
          <path d="M13.7 10.3L20 4M20 4h-5.2M20 4v5.2" />
        </g>
      ) : (
        <g fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="8.2" r="5" />
          <path d="M12 13.2V21M8.4 17.1h7.2" />
        </g>
      )}
    </svg>
  );
}

export function SingleChoiceOptions({ options, selected, onSelect, figures = false }: Props) {
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
              {figures && (opt.textEs === 'Hombre' || opt.textEs === 'Mujer') ? (
                <SexFigure kind={opt.textEs === 'Hombre' ? 'hombre' : 'mujer'} />
              ) : null}
              <span className="font-body-md">{opt.textEs}</span>
            </button>
          </motion.li>
        );
      })}
    </motion.ul>
  );
}
