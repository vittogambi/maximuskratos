'use client';

import { useEffect, useState } from 'react';
import { IkigaiIdeaLibrary } from '@/components/ikigai/idea-library';
import { IkigaiItemEditor } from '@/components/ikigai/item-editor';
import { IkigaiLensMark } from '@/components/ikigai/lens-mark';
import { IkigaiCircles } from '@/components/ikigai/ikigai-circles';
import type { FieldClarity, IkigaiDefinition, IkigaiFieldKey, IkigaiItem } from '@/lib/ikigai-api';
import { trackIkigai } from '@/lib/ikigai-ui/analytics';
import { EXPLORE_CTA, FIELD_UI, PIECES_FULL, UNCLEAR_LABEL } from '@/lib/ikigai-ui/copy';
import { FIELD_STEPS, filledCount, filledItems, newItemId } from '@/lib/ikigai-ui/format';

export function IkigaiFieldStep({
  definition,
  fieldKey,
  items,
  clarity,
  onChange,
  onClarity,
  onEditingChange,
  linkedUses,
  itemsByField,
  clarityByField,
  onContinue,
  continueLabel,
}: {
  definition: IkigaiDefinition;
  fieldKey: IkigaiFieldKey;
  items: IkigaiItem[];
  clarity: FieldClarity;
  onChange: (items: IkigaiItem[]) => void;
  onClarity: (clarity: FieldClarity) => void;
  onEditingChange?: (editing: boolean) => void;
  linkedUses?: (id: string) => number;
  itemsByField?: Record<IkigaiFieldKey, IkigaiItem[]>;
  clarityByField?: Partial<Record<IkigaiFieldKey, FieldClarity | null>>;
  onContinue?: () => void;
  continueLabel?: string;
}) {
  const field = definition.fields.find((f) => f.key === fieldKey);
  const ui = FIELD_UI[fieldKey];
  const filled = filledItems(items);
  const [editing, setEditing] = useState<string | 'new' | null>(null);
  const [explore, setExplore] = useState(false);
  const [draftText, setDraftText] = useState('');

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

  const mapItems = itemsByField ?? {
    PASION: fieldKey === 'PASION' ? items : [],
    CAPACIDAD: fieldKey === 'CAPACIDAD' ? items : [],
    NECESIDAD: fieldKey === 'NECESIDAD' ? items : [],
    VALOR: fieldKey === 'VALOR' ? items : [],
  };
  const typing = draftText.trim().length >= 3;
  const canContinue = n > 0 || unclear;
  const nextIsPrimary = !typing && canContinue;

  function submitDraft() {
    const text = draftText.trim();
    if (text.length < 3 || !canAdd) return;
    addText(text);
    setDraftText('');
  }

  return (
    <div className="ik-explore">
      <IkigaiCircles
        definition={definition}
        counts={{
          PASION: filledItems(mapItems.PASION).length,
          CAPACIDAD: filledItems(mapItems.CAPACIDAD).length,
          NECESIDAD: filledItems(mapItems.NECESIDAD).length,
          VALOR: filledItems(mapItems.VALOR).length,
        }}
        unclear={{
          PASION: (clarityByField?.PASION ?? (fieldKey === 'PASION' ? clarity : null)) === 'UNCLEAR',
          CAPACIDAD: (clarityByField?.CAPACIDAD ?? (fieldKey === 'CAPACIDAD' ? clarity : null)) === 'UNCLEAR',
          NECESIDAD: (clarityByField?.NECESIDAD ?? (fieldKey === 'NECESIDAD' ? clarity : null)) === 'UNCLEAR',
          VALOR: (clarityByField?.VALOR ?? (fieldKey === 'VALOR' ? clarity : null)) === 'UNCLEAR',
        }}
        markers={[]}
        interactive={false}
        focus={fieldKey}
        reached={[...FIELD_STEPS.slice(0, FIELD_STEPS.indexOf(fieldKey)), ...(canContinue ? [fieldKey] : [])]}
      />
      <section className="ik-create" aria-labelledby="ik-q">
        <p className="ik-create__lens">
          <IkigaiLensMark field={fieldKey} />
          {field.title}
          <span>
            {FIELD_STEPS.indexOf(fieldKey) + 1} de 4{n > 0 ? `, ${n === 1 ? '1 idea' : `${n} ideas`}` : ''}
          </span>
        </p>
        <h1 className="ik-question font-body" id="ik-q">{field.prompt}</h1>
        <details className="ik-help">
          <summary>Ver ayuda</summary>
          <p>{field.help}</p>
        </details>
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
                    const uses = linkedUses?.(draftItem.id) ?? 0;
                    if (uses > 0 && !window.confirm(`Esta idea se usa en ${uses} posibilidades. Se quitará de ellas y tendrás que revisar sus respuestas.`)) return;
                    const next = filled.filter((item) => item.id !== draftItem.id).map((item, order) => ({ ...item, order }));
                    onChange(next);
                    onClarity(next.length > 0 ? 'ANSWERED' : null);
                    trackIkigai('item_removed', { field: fieldKey });
                    setEditing(null);
                  }
                : undefined
            }
            onSubmit={(text) => {
              if (draftItem) upsert({ ...draftItem, text, evidence: draftItem.evidence });
              setEditing(null);
            }}
          />
        ) : (
          <div className="ik-create__row">
            <label className="sr-only" htmlFor="ik-piece-in">Escribe una idea para {field.title}</label>
            <textarea id="ik-piece-in" rows={1} maxLength={140} placeholder="Escribe una idea" value={draftText} onChange={(event) => setDraftText(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); submitDraft(); } }} />
            <div className="ik-create__foot">
              <span className="ik-create__count">{draftText.length} / 140</span>
              <button type="button" className={typing && canAdd ? 'ag-btn-primary font-label-lg' : 'ik-create__add is-secondary'} disabled={!typing || !canAdd} onClick={submitDraft}>Añadir al círculo</button>
            </div>
          </div>
        )}
        {filled.length > 0 && !editing ? (
          <div className="ik-create__own">
            {filled.map((item) => (
              <button key={item.id} type="button" className="ik-text" onClick={() => setEditing(item.id)}>{item.text}</button>
            ))}
          </div>
        ) : null}
        {!canAdd && !editing ? <p className="ik-hint">{PIECES_FULL}</p> : null}
        {n === 0 && !editing ? (
          <button type="button" className={`ik-unclear${unclear ? ' is-on' : ''}`} aria-pressed={unclear} onClick={() => onClarity(unclear ? null : 'UNCLEAR')}>
            {UNCLEAR_LABEL}
          </button>
        ) : null}
        <button type="button" className="ik-text" onClick={() => { setExplore(true); trackIkigai('idea_library_opened', { field: fieldKey }); }}>{EXPLORE_CTA}</button>
        {onContinue ? (
          <button id="ik-next" type="button" className={`font-label-lg ik-create__next${nextIsPrimary ? ' ag-btn-primary' : ' is-secondary'}`} disabled={!canContinue || typing} onClick={onContinue}>
            {continueLabel ?? 'Continuar'}
          </button>
        ) : null}
        {!canContinue && !typing ? <p className="ik-hint">Para seguir, coloca una idea en el círculo o marca que todavía no lo tienes claro.</p> : null}
      </section>
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
    </div>
  );
}

export { IkigaiFieldStep as FieldStep };
