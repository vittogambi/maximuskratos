'use client';

import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import type { QuestionDto } from '@/lib/api';
import { optionListItem, reasonBoxVariants } from './diagnostic-motion';
import { FreeTextOption } from './options/FreeTextOption';
import { MultiChoiceOptions } from './options/MultiChoiceOptions';
import { ScaleOptions } from './options/ScaleOptions';
import { SingleChoiceOptions } from './options/SingleChoiceOptions';

type SelectionState =
  | { type: 'single'; selected: string | null }
  | { type: 'multi'; selected: string[] }
  | { type: 'scale'; selected: string | null; selectedOrder: number | null; reason: string }
  | { type: 'text'; value: string }
  | { type: 'ranking'; order: string[] };

type Props = {
  question: QuestionDto;
  selection: SelectionState;
  onChange: (next: SelectionState) => void;
};

export function QuestionCard({ question, selection, onChange }: Props) {
  const reduced = useReducedMotion();
  const showReasonBox =
    question.type === 'SCALE_1_5' &&
    question.reasonThreshold != null &&
    question.reasonPromptEs != null &&
    selection.type === 'scale' &&
    selection.selectedOrder != null &&
    selection.selectedOrder <= question.reasonThreshold;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
        <h2 className="dk-question-text">{question.textEs}</h2>
        {question.contextEs && (
          <p className="dk-question-context">{question.contextEs}</p>
        )}
        {question.type === 'MULTI_CHOICE' &&
          question.maxSelections != null &&
          selection.type === 'multi' && (
            <p
              className="dk-multi-counter"
              aria-label={`${selection.selected.length} de ${question.maxSelections} seleccionadas`}
            >
              {selection.selected.length}/{question.maxSelections}
            </p>
          )}
      </div>

      <div>
        {question.type === 'SINGLE_CHOICE' && selection.type === 'single' && (
          <SingleChoiceOptions
            options={question.options}
            selected={selection.selected}
            onSelect={(id) => onChange({ type: 'single', selected: id })}
          />
        )}

        {question.type === 'MULTI_CHOICE' && selection.type === 'multi' && (
          <MultiChoiceOptions
            options={question.options}
            selected={selection.selected}
            maxSelections={question.maxSelections}
            onToggle={(id) => {
              const current = selection.selected;
              const next = current.includes(id)
                ? current.filter((s) => s !== id)
                : [...current, id];
              onChange({ type: 'multi', selected: next });
            }}
          />
        )}

        {question.type === 'SCALE_1_5' && selection.type === 'scale' && (
          <>
            <ScaleOptions
              options={question.options}
              selected={selection.selected}
              scaleType={question.scaleType}
              onSelect={(id) => {
                const opt = question.options.find((o) => o.id === id);
                onChange({
                  type: 'scale',
                  selected: id,
                  selectedOrder: opt?.order ?? null,
                  reason: selection.reason,
                });
              }}
            />
            <AnimatePresence initial={false}>
              {showReasonBox && (
                <motion.div
                  key="reason"
                  className="dk-reason-box"
                  variants={reduced ? undefined : reasonBoxVariants}
                  initial={reduced ? false : 'hidden'}
                  animate={reduced ? undefined : 'visible'}
                  exit={reduced ? undefined : 'hidden'}
                  style={{ overflow: 'hidden' }}
                >
                  <label className="dk-reason-label" htmlFor="dk-reason-input">
                    {question.reasonPromptEs}
                  </label>
                  <textarea
                    id="dk-reason-input"
                    className="dk-reason-textarea"
                    value={selection.reason}
                    onChange={(e) =>
                      onChange({
                        ...selection,
                        reason: e.target.value,
                      })
                    }
                    maxLength={500}
                    rows={3}
                    placeholder="Escribe aquí tu respuesta (opcional)…"
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}

        {question.type === 'FREE_TEXT' && selection.type === 'text' && (
          <motion.div
            variants={reduced ? undefined : optionListItem}
            initial={reduced ? false : 'hidden'}
            animate={reduced ? undefined : 'show'}
          >
            <FreeTextOption
              value={selection.value}
              onChange={(v) => onChange({ type: 'text', value: v })}
            />
          </motion.div>
        )}

        {question.type === 'RANKING' && (
          <motion.p
            className="font-body-sm"
            style={{ color: 'var(--color-text-muted)' }}
            variants={reduced ? undefined : optionListItem}
            initial={reduced ? false : 'hidden'}
            animate={reduced ? undefined : 'show'}
          >
            (Ranking: disponible en M1)
          </motion.p>
        )}
      </div>
    </div>
  );
}

/** Build initial selection state from question type */
export function buildInitialSelection(question: QuestionDto): SelectionState {
  switch (question.type) {
    case 'SINGLE_CHOICE':
      return { type: 'single', selected: null };
    case 'MULTI_CHOICE':
      return { type: 'multi', selected: [] };
    case 'SCALE_1_5':
      return { type: 'scale', selected: null, selectedOrder: null, reason: '' };
    case 'FREE_TEXT':
      return { type: 'text', value: '' };
    case 'RANKING':
      return { type: 'ranking', order: question.options.map((o) => o.id) };
  }
}

/** Check if selection is valid to submit */
export function isSelectionValid(q: QuestionDto, sel: SelectionState): boolean {
  if (sel.type === 'single') return sel.selected !== null;
  if (sel.type === 'scale') return sel.selected !== null;
  if (sel.type === 'multi') return sel.selected.length > 0;
  if (sel.type === 'text') return sel.value.trim().length > 0;
  if (sel.type === 'ranking') return sel.order.length > 0;
  return false;
}

/** Extract payload for API from selection */
export function selectionToPayload(sel: SelectionState): {
  selectedOptionIds?: string[];
  freeText?: string;
  rankingOrder?: string[];
} {
  if (sel.type === 'single' && sel.selected) {
    return { selectedOptionIds: [sel.selected] };
  }
  if (sel.type === 'scale' && sel.selected) {
    const payload: { selectedOptionIds: string[]; freeText?: string } = {
      selectedOptionIds: [sel.selected],
    };
    if (sel.reason.trim()) {
      payload.freeText = sel.reason.trim();
    }
    return payload;
  }
  if (sel.type === 'multi') {
    return { selectedOptionIds: sel.selected };
  }
  if (sel.type === 'text') {
    return { freeText: sel.value.trim() };
  }
  if (sel.type === 'ranking') {
    return { rankingOrder: sel.order };
  }
  return {};
}
