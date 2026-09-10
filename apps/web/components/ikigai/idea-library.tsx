'use client';

import { useEffect, useMemo, useState } from 'react';
import { IkigaiItemEditor } from '@/components/ikigai/item-editor';
import { IkigaiSheet } from '@/components/ikigai/sheet';
import type { IkigaiFieldKey } from '@/lib/ikigai-api';
import { trackIkigai } from '@/lib/ikigai-ui/analytics';
import { EXPLORE_ALL, EXPLORE_SEARCH, FIELD_UI } from '@/lib/ikigai-ui/copy';
import {
  IDEA_CATEGORIES,
  libraryForField,
  placeholderFor,
  type IkigaiIdea,
} from '@/lib/ikigai-ui/idea-bank';

export function IkigaiIdeaLibrary({
  open,
  fieldKey,
  onClose,
  onAdopt,
}: {
  open: boolean;
  fieldKey: IkigaiFieldKey;
  onClose: () => void;
  onAdopt: (text: string) => void;
}) {
  const ui = FIELD_UI[fieldKey];
  const [query, setQuery] = useState('');
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [picked, setPicked] = useState<IkigaiIdea | null>(null);
  const matches = useMemo(() => libraryForField(fieldKey, query), [fieldKey, query]);
  const groups = categoryId ? matches.filter((group) => group.id === categoryId) : matches;
  const chips = query ? matches.map((group) => ({ id: group.id, label: group.label })) : IDEA_CATEGORIES[fieldKey];

  useEffect(() => {
    if (categoryId && !matches.some((group) => group.id === categoryId)) {
      setCategoryId(null);
    }
  }, [categoryId, matches]);

  function close() {
    setQuery('');
    setCategoryId(null);
    setPicked(null);
    onClose();
  }

  if (!open) return null;

  if (picked) {
    return (
      <IkigaiSheet open title={picked.label} onClose={close} variant="library">
        <div className="ik-library">
          <button type="button" className="ik-text" onClick={() => setPicked(null)}>
            Volver
          </button>
          <p className="font-body-md ik-support">{picked.description}</p>
          <IkigaiItemEditor
            htmlId="ik-adopt-text"
            label={ui.adoptQuestion}
            placeholder={placeholderFor(picked, fieldKey)}
            submitLabel="Añadir a mis ideas"
            onCancel={() => setPicked(null)}
            onSubmit={(text) => {
              trackIkigai('idea_adopted', { field: fieldKey, idea: picked.id });
              onAdopt(text);
              close();
            }}
          />
        </div>
      </IkigaiSheet>
    );
  }

  return (
    <IkigaiSheet open title="Explorar ideas" onClose={close} variant="library">
      <div className="ik-library__tools">
        <label className="ik-search">
          <span className="sr-only">{EXPLORE_SEARCH}</span>
          <input
            id="ik-idea-search"
            className="ik-input"
            type="search"
            placeholder={EXPLORE_SEARCH}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
        <div className="ik-filters" role="group" aria-label="Categorías">
          <button
            type="button"
            className={`ik-chip${categoryId == null ? ' is-on' : ''}`}
            aria-pressed={categoryId == null}
            onClick={() => setCategoryId(null)}
          >
            {EXPLORE_ALL}
          </button>
          {chips.map((chip) => (
            <button
              key={chip.id}
              type="button"
              className={`ik-chip${categoryId === chip.id ? ' is-on' : ''}`}
              aria-pressed={categoryId === chip.id}
              onClick={() => setCategoryId(chip.id)}
            >
              {chip.label}
            </button>
          ))}
        </div>
      </div>
      <div className="ik-library">
        {groups.length === 0 ? <p className="ik-hint">No hay ideas con esa búsqueda.</p> : null}
        {groups.map((group) => (
          <section className="ik-section" key={group.id}>
            {categoryId ? null : <h2>{group.label}</h2>}
            <div className="ik-idea-list">
              {group.ideas.map((row) => (
                <button type="button" key={row.id} onClick={() => setPicked(row)}>
                  {row.label}
                </button>
              ))}
            </div>
          </section>
        ))}
      </div>
    </IkigaiSheet>
  );
}
