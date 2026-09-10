'use client';

import { useEffect, useState } from 'react';
import { IkigaiIdeaLibrary } from '@/components/ikigai/idea-library';
import { IkigaiItemCard } from '@/components/ikigai/item-card';
import { IkigaiItemEditor } from '@/components/ikigai/item-editor';
import type { FieldClarity, IkigaiDefinition, IkigaiFieldKey, IkigaiItem } from '@/lib/ikigai-api';
import { trackIkigai } from '@/lib/ikigai-ui/analytics';
import { CONTINUE_NUDGE, FIELD_UI, UNCLEAR_LABEL } from '@/lib/ikigai-ui/copy';
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

  return (
    <>
      <p className="ik-kicker">{field.title}</p>
      <h1 className="ik-question font-body">{field.prompt}</h1>
      <p className="font-body-md ik-support">{field.help}</p>

      {filled.length > 0 ? <p className="ik-note">Tus respuestas</p> : null}

      <div className="ik-stack">
        {filled.map((item) =>
          editing === item.id ? null : (
            <IkigaiItemCard key={item.id} item={item} onClick={() => setEditing(item.id)} />
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

      {canAdd && !editing ? (
        <div className="ik-actions">
          <button type="button" className="ik-item ik-item--action" onClick={() => setEditing('new')}>
            <span className="ik-item__text">{ui.writeEmpty}</span>
          </button>
          <button
            type="button"
            className="ik-item ik-item--action"
            onClick={() => {
              setExplore(true);
              trackIkigai('idea_library_opened', { field: fieldKey });
            }}
          >
            <span className="ik-item__text">Explorar ideas</span>
          </button>
        </div>
      ) : null}

      {n === 0 && !editing ? (
        <button
          type="button"
          className={`ik-unclear${unclear ? ' is-on' : ''}`}
          aria-pressed={unclear}
          onClick={() => onClarity(unclear ? null : 'UNCLEAR')}
        >
          {UNCLEAR_LABEL}
        </button>
      ) : null}

      {n > 0 && n < 3 && !editing ? <p className="ik-hint">{CONTINUE_NUDGE}</p> : null}

      <IkigaiIdeaLibrary
        open={explore}
        fieldKey={fieldKey}
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
