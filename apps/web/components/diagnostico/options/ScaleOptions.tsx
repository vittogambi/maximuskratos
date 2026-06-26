'use client';

import { motion, useReducedMotion } from 'motion/react';
import type { AnswerOptionDto } from '@/lib/api';
import { resolveScaleLabel } from '@/lib/scale-labels';
import { optionListContainer, optionListItem } from '../diagnostic-motion';

type Props = {
  options: AnswerOptionDto[];
  selected: string | null;
  onSelect: (id: string) => void;
  scaleType?: 'BEHAVIORAL' | 'FREQUENCY' | null;
};

export function ScaleOptions({ options, selected, onSelect, scaleType }: Props) {
  const reduced = useReducedMotion();
  const sorted = [...options].sort((a, b) => a.order - b.order);
  const hasSelection = selected !== null;

  return (
    <motion.div
      className={`dk-scale-options${hasSelection ? ' dk-scale-options--dim-unselected' : ''}`}
      role="group"
      aria-label="Selecciona una respuesta"
      variants={reduced ? undefined : optionListContainer}
      initial={reduced ? false : 'hidden'}
      animate={reduced ? undefined : 'show'}
    >
      {scaleType && (
        <p className="dk-scale-type-hint">
          {scaleType === 'FREQUENCY' ? 'Frecuencia' : 'Grado de acuerdo'}
        </p>
      )}
      {sorted.map((opt) => {
        const isSelected = selected === opt.id;
        const label = resolveScaleLabel(opt, scaleType);
        return (
          <motion.button
            key={opt.id}
            type="button"
            variants={reduced ? undefined : optionListItem}
            className={`dk-scale-option${isSelected ? ' dk-scale-option--selected' : ''}`}
            onClick={() => onSelect(opt.id)}
            aria-pressed={isSelected}
          >
            <span className="dk-scale-number">{opt.order}</span>
            <span className="dk-scale-label">{label}</span>
            <span className="dk-scale-check" aria-hidden={!isSelected}>✓</span>
          </motion.button>
        );
      })}
    </motion.div>
  );
}
