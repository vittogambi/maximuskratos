'use client';

import { useEffect, useState } from 'react';
import { IkigaiIdeaLibrary } from '@/components/ikigai/idea-library';
import { IkigaiItemCard } from '@/components/ikigai/item-card';
import { IkigaiItemEditor } from '@/components/ikigai/item-editor';
import { IkigaiLensMark } from '@/components/ikigai/lens-mark';
import type { FieldClarity, IkigaiDefinition, IkigaiFieldKey, IkigaiItem } from '@/lib/ikigai-api';
import { trackIkigai } from '@/lib/ikigai-ui/analytics';
import {
  CONTINUE_NUDGE,
  EXPLORE_CTA,
  FIELD_UI,
  PIECES_EMPTY,
  PIECES_EMPTY_LEAD,
  PIECES_FULL,
  PIECES_TITLE,
  UNCLEAR_LABEL,
} from '@/lib/ikigai-ui/copy';
import { filledCount, filledItems, newItemId } from '@/lib/ikigai-ui/format';

export function IkigaiFieldStep({
  definition,
  fieldKey,
  items,
  clarity,
  onChange,
  onClarity,
  onEditingChange,
}: {
  definition: IkigaiDefinition;
  fieldKey: IkigaiFieldKey;
  items: IkigaiItem[];
  clarity: FieldClarity;
  onChange: (items: IkigaiItem[]) => void;
  onClarity: (clarity: FieldClarity) => void;
  onEditingChange?: (editing: boolean) => void;
}) {
  const field = definition.fields.find((f) => f.key === fieldKey);
  const ui = FIELD_UI[fieldKey];
  const filled = filledItems(items);
  const [editing, setEditing] = useState<string | 'new' | null>(null);
  const [explore, setExplore] = useState(false);

  useEffect(() => {
    onEditingChange?.(Boolean(editing));
  }, [editing, onEditingChange]);

  if (!field || !ui) return null;

  function upsert(next: IkigaiItem) {
    const rest = items.filter((item) => item.id !== next.id && item.text.trim().length >= 3);
    onChange([...rest, next].map((item, order) => ({ ...item, order, evidence: item.evidence ?? null })));
    onClarity('ANSWERED');
  }

  function addText(text: string) {
    const item: IkigaiItem = { id: newItemId(), text, evidence: null, order: filled.length };
    upsert(item);
    trackIkigai('item_added', { field: fieldKey });
    setEditing(null);
  }

  const draftItem = editing && editing !== 'new' ? items.find((i) => i.id === editing) : null;
  const canAdd = filled.length < 5;
  const n = filledCount(items);
  const unclear = clarity === 'UNCLEAR' && n === 0;

  const addActions = (
    <div className="ik-add-row">
      <button type="button" className="ik-add" onClick={() => setEditing('new')}>
        <span className="ik-add__mark" aria-hidden>
          +
        </span>
        {ui.writeEmpty}
      </button>
      <button
        type="button"
        className="ik-secondary"
        onClick={() => {
          setExplore(true);
          trackIkigai('idea_library_opened', { field: fieldKey });
        }}
      >
        {EXPLORE_CTA}
        <span className="ik-secondary__go" aria-hidden>
          →
        </span>
      </button>
    </div>
  );

  return (
    <>
      <p className="ik-kicker">
        <IkigaiLensMark field={fieldKey} />
        {field.title}
      </p>
      <h1 className="ik-question font-body">{field.prompt}</h1>
      <p className="font-body-md ik-support">{field.help}</p>

      <section className="ik-pieces">
        <div className="ik-pieces__head">
          <h2>{PIECES_TITLE}</h2>
          <span className="ik-pieces__count">{n} de 5</span>
        </div>

        {filled.length === 0 && !editing ? (
          <div className="ik-slot">
            <p className="ik-slot__text">{PIECES_EMPTY}</p>
            <p className="ik-slot__lead">{PIECES_EMPTY_LEAD}</p>
            {addActions}
          </div>
        ) : null}

        {filled.length > 0 || editing ? (
          <div className="ik-stack ik-stack--tight">
            {filled.map((item, index) =>
              editing === item.id ? null : (
                <IkigaiItemCard
                  key={item.id}
                  item={item}
                  fieldKey={fieldKey}
                  index={index + 1}
                  onClick={() => setEditing(item.id)}
                />
              ),
            )}
            {editing ? (
              <IkigaiItemEditor
                key={editing}
                initial={draftItem?.text ?? ''}
                label={ui.editorLabel}
                placeholder={field.placeholder.replace(/^Por ejemplo:\s*/i, '')}
                submitLabel="Guardar"
                onCancel={() => setEditing(null)}
                onRemove={
                  draftItem
                    ? () => {
                        const next = filled
                          .filter((item) => item.id !== draftItem.id)
                          .map((item, order) => ({ ...item, order }));
                        onChange(next);
                        onClarity(next.length > 0 ? 'ANSWERED' : null);
                        trackIkigai('item_removed', { field: fieldKey });
                        setEditing(null);
                      }
                    : undefined
                }
                onSubmit={(text) => {
                  if (editing === 'new') addText(text);
                  else if (draftItem) {
                    upsert({ ...draftItem, text, evidence: null });
                    setEditing(null);
                  }
                }}
              />
            ) : null}
          </div>
        ) : null}

        {filled.length > 0 && canAdd && !editing ? addActions : null}
        {!canAdd && !editing ? <p className="ik-hint">{PIECES_FULL}</p> : null}
      </section>

      {n === 0 && !editing ? (
        <button
          type="button"
          className={`ik-unclear${unclear ? ' is-on' : ''}`}
          aria-pressed={unclear}
          onClick={() => onClarity(unclear ? null : 'UNCLEAR')}
        >
          <span className={`ik-likert__choice${unclear ? ' is-on' : ''}`} aria-hidden />
          {UNCLEAR_LABEL}
        </button>
      ) : null}

      {n > 0 && n < 3 && !editing ? <p className="ik-hint">{CONTINUE_NUDGE}</p> : null}

      <IkigaiIdeaLibrary
        open={explore}
        fieldKey={fieldKey}
        lensTitle={field.title}
        onClose={() => setExplore(false)}
        onAdopt={(text) => {
          if (!canAdd) return;
          addText(text);
        }}
      />
    </>
  );
}

export { IkigaiFieldStep as FieldStep };
