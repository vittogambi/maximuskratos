'use client';

import { useEffect, useMemo, useState } from 'react';
import { IkigaiLensMark } from '@/components/ikigai/lens-mark';
import { IkigaiCircles } from '@/components/ikigai/ikigai-circles';
import type { IkigaiDefinition, IkigaiDraft, IkigaiFieldKey, IkigaiHypothesis, IkigaiItem } from '@/lib/ikigai-api';
import { HYPOTHESIS_GUIDE_NOTE } from '@/lib/ikigai-ui/copy';
import { fieldTitle, FIELD_STEPS, filledItems, HYPOTHESIS_MAX, newItemId } from '@/lib/ikigai-ui/format';

function newHypId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return `h-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function gapCopy(text: string, count: number): string | null {
  if (count < 1) return 'Elige al menos una idea.';
  const missing = 12 - text.trim().length;
  if (missing > 0) return `Faltan ${missing} caracteres.`;
  if (text.length > HYPOTHESIS_MAX) return 'La frase es demasiado larga.';
  return null;
}

type Composer = { ids: string[]; text: string; editingId: string | null };
const EMPTY_COMPOSER: Composer = { ids: [], text: '', editingId: null };
const CENTER_ZONE = 'CAPACIDAD+NECESIDAD+PASION+VALOR';

const ZONE_CAPTION: Record<string, string> = {
  'CAPACIDAD+PASION': 'Pasión. Lo que amas y en lo que eres bueno.',
  'NECESIDAD+PASION': 'Misión. Lo que amas y el mundo necesita, aunque todavía no seas tan bueno en ello.',
  'CAPACIDAD+VALOR': 'Profesión. En lo que eres bueno y por lo que te pueden pagar, aunque no te guste especialmente.',
  'NECESIDAD+VALOR': 'Vocación. Lo que el mundo necesita y por lo que te pueden pagar, aunque no te guste ni se te dé bien.',
  [CENTER_ZONE]: 'Ikigai. Lo que cumple los cuatro a la vez.',
};

function zoneCaption(id: string | null): string {
  if (!id) return '';
  return ZONE_CAPTION[id] ?? '';
}

export function IkigaiRelateStep({
  definition,
  draft,
  onChange,
  onExplore,
  onStopExplore,
  onNoHypothesis,
  onEditField,
  onShapeChange,
}: {
  definition: IkigaiDefinition;
  draft: IkigaiDraft;
  onChange: (patch: Partial<IkigaiDraft>) => void;
  onExplore: (selectedHypothesisId: string) => void;
  onStopExplore: () => void;
  onNoHypothesis: () => void;
  onEditField: (field: IkigaiFieldKey) => void;
  onShapeChange?: (open: boolean) => void;
}) {
  const [composer, setComposer] = useState<Composer>(EMPTY_COMPOSER);
  const [confirmDrop, setConfirmDrop] = useState<string | null>(null);
  const [confirmNone, setConfirmNone] = useState(false);
  const [adding, setAdding] = useState<IkigaiFieldKey | null>(null);
  const [manage, setManage] = useState<IkigaiFieldKey | null>(null);
  const [shape, setShape] = useState(false);
  const [narrow, setNarrow] = useState(false);
  const [live, setLive] = useState('');
  const [flashId, setFlashId] = useState<string | null>(null);
  const [composing, setComposing] = useState(false);
  const [asList, setAsList] = useState(false);
  const [hoverZone, setHoverZone] = useState<string | null>(null);

  useEffect(() => {
    const query = window.matchMedia('(max-width: 899px)');
    const sync = () => setNarrow(query.matches);
    sync();
    query.addEventListener('change', sync);
    return () => query.removeEventListener('change', sync);
  }, []);

  useEffect(() => {
    onShapeChange?.(narrow && shape);
  }, [narrow, shape, onShapeChange]);

  useEffect(() => {
    if (!live) return;
    const timer = window.setTimeout(() => setLive(''), 1600);
    return () => window.clearTimeout(timer);
  }, [live]);

  const counts = useMemo(() => {
    const next = { PASION: 0, CAPACIDAD: 0, NECESIDAD: 0, VALOR: 0 };
    for (const key of FIELD_STEPS) next[key] = filledItems(draft.items[key] ?? []).length;
    return next;
  }, [draft.items]);
  const unclear = {
    PASION: draft.fieldClarity.PASION === 'UNCLEAR' && counts.PASION === 0,
    CAPACIDAD: draft.fieldClarity.CAPACIDAD === 'UNCLEAR' && counts.CAPACIDAD === 0,
    NECESIDAD: draft.fieldClarity.NECESIDAD === 'UNCLEAR' && counts.NECESIDAD === 0,
    VALOR: draft.fieldClarity.VALOR === 'UNCLEAR' && counts.VALOR === 0,
  };
  const ideasMet = composer.ids.length > 0;
  const charsMet = composer.text.trim().length >= 12;
  const reason = gapCopy(composer.text, composer.ids.length);
  const atLimit = draft.hypotheses.length >= 3 && !composer.editingId;
  const showSavedPanel = draft.hypotheses.length > 0 && !composing && !composer.editingId && composer.ids.length === 0 && !composer.text;

  useEffect(() => {
    if (!showSavedPanel) return;
    document.querySelector<HTMLElement>('.ik-connect__card .ag-btn-primary')?.focus();
  }, [showSavedPanel]);

  function announce(message: string) {
    setLive('');
    window.setTimeout(() => setLive(message), 20);
  }

  function toggle(id: string) {
    setComposing(true);
    setComposer((current) => {
      const on = current.ids.includes(id);
      announce(on ? 'Idea quitada.' : 'Idea añadida.');
      if (!on) setFlashId(id);
      return { ...current, ids: on ? current.ids.filter((item) => item !== id) : [...current.ids, id] };
    });
  }

  function saveComposer() {
    if (reason || atLimit) return;
    const next: IkigaiHypothesis = {
      id: composer.editingId ?? newHypId(),
      text: composer.text.trim(),
      itemIds: composer.ids,
      criteria: draft.hypotheses.find((hyp) => hyp.id === composer.editingId)?.criteria ?? {},
      order: draft.hypotheses.find((hyp) => hyp.id === composer.editingId)?.order ?? draft.hypotheses.length,
    };
    const exists = draft.hypotheses.some((hyp) => hyp.id === next.id);
    onChange({
      hypotheses: exists ? draft.hypotheses.map((hyp) => (hyp.id === next.id ? next : hyp)) : [...draft.hypotheses, next],
      noHypothesisYet: false,
    });
    setComposer(EMPTY_COMPOSER);
    setComposing(false);
    setShape(false);
    setFlashId(null);
  }

  function addIdea(field: IkigaiFieldKey, text: string) {
    const current = filledItems(draft.items[field] ?? []);
    if (current.length >= 5) return;
    const item: IkigaiItem = { id: newItemId(), text, evidence: null, order: current.length };
    onChange({
      items: { ...draft.items, [field]: [...current, item] },
      fieldClarity: { ...draft.fieldClarity, [field]: 'ANSWERED' },
    });
    setComposer((state) => ({ ...state, ids: [...state.ids, item.id] }));
    setComposing(true);
    setAdding(null);
    setManage(null);
    announce('Idea añadida.');
    setFlashId(item.id);
  }

  const picks = composer.ids.flatMap((id) => {
    for (const key of FIELD_STEPS) {
      const item = filledItems(draft.items[key] ?? []).find((row) => row.id === id);
      if (item) return [{ id, text: item.text, field: fieldTitle(definition, key) }];
    }
    return [];
  });

  const shapeNode = showSavedPanel ? (
    <div className="ik-connect__saved">
      <h2 className="ik-connect__step">Tu posibilidad</h2>
      {draft.hypotheses.map((hyp) => (
        <SavedCard
          key={hyp.id}
          definition={definition}
          draft={draft}
          hyp={hyp}
          onExplore={() => onExplore(hyp.id)}
          onEdit={() => {
            setComposer({ ids: [...hyp.itemIds], text: hyp.text, editingId: hyp.id });
            setComposing(true);
            setShape(true);
          }}
          onDrop={() => setConfirmDrop(hyp.id)}
          onStop={hyp.id === draft.selectedHypothesisId ? onStopExplore : undefined}
        />
      ))}
      {!atLimit ? (
        <button type="button" className="ik-connect__secondary" onClick={() => setComposing(true)}>
          Escribir otra posibilidad
        </button>
      ) : (
        <p className="ik-hint">Tres posibilidades es el límite. Edita o elimina una para escribir otra.</p>
      )}
    </div>
  ) : (
    <ComposerPanel
      picks={picks}
      text={composer.text}
      ideasMet={ideasMet}
      charsMet={charsMet}
      flashId={flashId}
      live={live}
      atLimit={atLimit}
      disabled={Boolean(reason) || atLimit}
      onText={(value) => {
        setComposing(true);
        setComposer({ ...composer, text: value });
      }}
      onRemove={(id) => {
        setComposer({ ...composer, ids: composer.ids.filter((item) => item !== id) });
        announce('Idea quitada.');
      }}
      onSave={saveComposer}
    />
  );

  return (
    <div className={`ik-connect${narrow && shape ? ' is-shape' : ''}`}>
      <p className="ik-live" aria-live="polite">{live}</p>
      <div className="ik-connect__pick">
        <h1 className="ik-connect__title">Conecta tus ideas</h1>
        <p className="ik-connect__lead">Ahora conecta las ideas que para ti van en la misma dirección. Toca una idea para llevarla al centro.</p>
        <button type="button" className="ik-text" onClick={() => setAsList((value) => !value)}>{asList ? 'Ver como mapa' : 'Ver como lista'}</button>
        {!asList ? (
          <IkigaiCircles
            definition={definition}
            counts={counts}
            unclear={unclear}
            markers={draft.hypotheses.map((hyp, index) => ({
              id: hyp.id,
              index: index + 1,
              fields: FIELD_STEPS.filter((key) => filledItems(draft.items[key] ?? []).some((item) => hyp.itemIds.includes(item.id))),
            }))}
            reached={[...FIELD_STEPS]}
            onHoverZone={setHoverZone}
            onOpenCircle={(key) => {
              if (counts[key] === 0) return;
              document.getElementById(`ik-lens-${key}`)?.scrollIntoView({ block: 'nearest' });
            }}
          />
        ) : null}
        {!asList ? <p className="ik-connect__zone">{zoneCaption(hoverZone)}</p> : null}
        <div className="ik-connect__lenses">
          {FIELD_STEPS.map((key) => {
            const items = filledItems(draft.items[key] ?? []);
            const expanded = true;
            return (
              <section className={`ik-connect__lens${expanded ? ' is-open' : ''}`} id={`ik-lens-${key}`} key={key}>
                <div className="ik-connect__lens-head">
                  <button
                    type="button"
                    className="ik-connect__lens-toggle"
                    aria-expanded={expanded}
                    onClick={() => undefined}
                  >
                    <IkigaiLensMark field={key} />
                    <span>
                      <span className="ik-connect__lens-name">{fieldTitle(definition, key)}</span>
                      <span className="ik-connect__count">
                        {unclear[key] ? 'sin ideas' : `${counts[key]} ${counts[key] === 1 ? 'idea' : 'ideas'}`}
                      </span>
                    </span>
                  </button>
                  <div className="ik-connect__manage">
                    <button
                      type="button"
                      className="ik-connect__manage-btn"
                      aria-haspopup="menu"
                      aria-expanded={manage === key}
                      aria-label={`Gestionar ideas de ${fieldTitle(definition, key)}`}
                      onClick={() => setManage(manage === key ? null : key)}
                    >
                      Gestionar
                    </button>
                    {manage === key ? (
                      <div className="ik-connect__menu" role="menu">
                        {items.length < 5 ? (
                          <button type="button" role="menuitem" onClick={() => { setAdding(key); setManage(null); }}>
                            Añadir idea
                          </button>
                        ) : null}
                        <button type="button" role="menuitem" onClick={() => onEditField(key)}>
                          Editar respuestas
                        </button>
                      </div>
                    ) : null}
                  </div>
                </div>
                {expanded ? (
                  <div className="ik-connect__lens-body">
                    {unclear[key] ? <p className="ik-connect__unclear">Por ahora no lo tienes claro. Puedes seguir sin ideas aquí.</p> : null}
                    {items.map((item) => {
                      const on = composer.ids.includes(item.id);
                      return (
                        <button
                          key={item.id}
                          type="button"
                          className={`ik-connect__idea${on ? ' is-on' : ''}${flashId === item.id ? ' is-flash' : ''}`}
                          aria-pressed={on}
                          onClick={() => toggle(item.id)}
                        >
                          <span className="ik-connect__check" aria-hidden />
                          <span>{item.text}</span>
                        </button>
                      );
                    })}
                    {adding === key ? (
                      <IdeaBox onCancel={() => setAdding(null)} onSubmit={(text) => addIdea(key, text)} />
                    ) : null}
                  </div>
                ) : null}
              </section>
            );
          })}
        </div>
        <button type="button" className="ik-connect__exit" onClick={() => setConfirmNone(true)}>
          {definition.hypothesis.noHypothesisLabel}
        </button>
      </div>
      <aside className="ik-connect__shape">{shapeNode}</aside>
      {narrow && ideasMet && !shape ? (
        <div className="ik-connect__tray">
          <p>{composer.ids.length === 1 ? '1 seleccionada' : `${composer.ids.length} seleccionadas`}</p>
          <button
            type="button"
            className="ag-btn-primary font-label-lg"
            onClick={() => {
              setShape(true);
              window.setTimeout(() => document.querySelector('.ik-connect__shape')?.scrollIntoView({ block: 'start' }), 0);
            }}
          >
            Darles forma
          </button>
        </div>
      ) : null}
      {confirmDrop ? (
        <Confirm
          title="Eliminar posibilidad"
          body="Se eliminará solo esta posibilidad."
          confirmLabel="Eliminar"
          onCancel={() => setConfirmDrop(null)}
          onConfirm={() => {
            onChange({
              hypotheses: draft.hypotheses.filter((hyp) => hyp.id !== confirmDrop),
              selectedHypothesisId: draft.selectedHypothesisId === confirmDrop ? null : draft.selectedHypothesisId,
            });
            if (composer.editingId === confirmDrop) setComposer(EMPTY_COMPOSER);
            setConfirmDrop(null);
          }}
        />
      ) : null}
      {confirmNone ? (
        <Confirm
          title="También es un resultado."
          body="Puedes terminar con lo que encontraste hasta ahora y volver más adelante."
          confirmLabel="Guardar mi mapa"
          onCancel={() => setConfirmNone(false)}
          onConfirm={onNoHypothesis}
        />
      ) : null}
    </div>
  );
}

function ComposerPanel({
  picks,
  text,
  ideasMet,
  charsMet,
  flashId,
  live,
  atLimit,
  disabled,
  onText,
  onRemove,
  onSave,
}: {
  picks: { id: string; text: string; field: string }[];
  text: string;
  ideasMet: boolean;
  charsMet: boolean;
  flashId: string | null;
  live: string;
  atLimit: boolean;
  disabled: boolean;
  onText: (value: string) => void;
  onRemove: (id: string) => void;
  onSave: () => void;
}) {
  return (
    <>
      <h2 className="ik-connect__step">Dale forma</h2>
      <p className="ik-connect__countline">
        <span>{picks.length} {picks.length === 1 ? 'idea elegida' : 'ideas elegidas'}</span>
        {live ? <span className="ik-connect__added">{live}</span> : null}
      </p>
      {picks.length === 0 ? <p className="ik-connect__empty">Las ideas que elijas aparecerán aquí.</p> : null}
      <div className="ik-connect__picks">
        {picks.map((row) => (
          <div className={`ik-connect__pickrow${flashId === row.id ? ' is-in' : ''}`} key={row.id}>
            <p><b>{row.text}</b><span>{row.field}</span></p>
            <button type="button" aria-label={`Quitar ${row.text}`} onClick={() => onRemove(row.id)}>×</button>
          </div>
        ))}
      </div>
      {atLimit ? <p className="ik-hint">Tres posibilidades es el límite. Edita o elimina una para escribir otra.</p> : null}
      <label htmlFor="hyp-text">Descríbela con tus palabras</label>
      <textarea id="hyp-text" className="ik-connect__text" rows={4} maxLength={HYPOTHESIS_MAX} placeholder="Me gustaría…" value={text} onChange={(event) => onText(event.target.value)} />
      <ul className="ik-connect__reqs" aria-label="Condiciones para guardar">
        <li className={ideasMet ? 'is-met' : ''} id="req-ideas"><span aria-hidden />Elige al menos una idea</li>
        <li className={charsMet ? 'is-met' : ''} id="req-chars"><span aria-hidden />Escribe al menos 12 caracteres</li>
      </ul>
      <button type="button" className="ag-btn-primary font-label-lg ik-connect__save" disabled={disabled} aria-describedby="req-ideas req-chars" onClick={onSave}>
        Guardar posibilidad
      </button>
      <p className="ik-hint">Guardar crea un borrador. Después podrás decidir si quieres explorar esta posibilidad.</p>
      <details className="ik-guide">
        <summary>¿Te cuesta conectarlas? Ver una guía</summary>
        <p className="ik-hint">{HYPOTHESIS_GUIDE_NOTE}</p>
      </details>
    </>
  );
}

function SavedCard({
  definition,
  draft,
  hyp,
  onExplore,
  onEdit,
  onDrop,
  onStop,
}: {
  definition: IkigaiDefinition;
  draft: IkigaiDraft;
  hyp: IkigaiHypothesis;
  onExplore: () => void;
  onEdit: () => void;
  onDrop: () => void;
  onStop?: () => void;
}) {
  const ready = !gapCopy(hyp.text, hyp.itemIds.length);
  const sources = FIELD_STEPS.flatMap((key) =>
    filledItems(draft.items[key] ?? []).filter((item) => hyp.itemIds.includes(item.id)).map((item) => ({ id: item.id, text: item.text, field: fieldTitle(definition, key), key })),
  );
  return (
    <article className="ik-connect__card" id={`ik-hyp-${hyp.id}`}>
      <p className="ik-connect__status">Guardada. Todavía no la has elegido para explorar.</p>
      <p className="ik-connect__phrase">{hyp.text}</p>
      <ul className="ik-connect__sources">
        {sources.map((row) => (
          <li key={row.id}>
            <IkigaiLensMark field={row.key} />
            <span>
              <b>{row.text}</b>
              <span>{row.field}</span>
            </span>
          </li>
        ))}
      </ul>
      <button type="button" className="ag-btn-primary font-label-lg" disabled={!ready} onClick={onExplore}>
        Explorar esta posibilidad
      </button>
      <div className="ik-aux-row">
        <button type="button" className="ik-text" onClick={onEdit}>Editar</button>
        <button type="button" className="ik-text" onClick={onDrop}>Eliminar</button>
        {onStop ? <button type="button" className="ik-text" onClick={onStop}>Dejar de explorar esta</button> : null}
      </div>
    </article>
  );
}

function IdeaBox({ onCancel, onSubmit }: { onCancel: () => void; onSubmit: (text: string) => void }) {
  const [text, setText] = useState('');
  const short = text.length > 0 && text.trim().length < 3;
  return (
    <div className="ik-editor">
      <label htmlFor="ik-relate-add">Escribe tu idea</label>
      <textarea id="ik-relate-add" className="ik-area" rows={3} maxLength={140} value={text} onChange={(event) => setText(event.target.value)} />
      {short ? <p className="ik-hint">Escribe al menos 3 caracteres.</p> : null}
      <div className="ik-editor__actions">
        <button type="button" className="ik-text" onClick={onCancel}>Cancelar</button>
        <button type="button" className="ag-btn-primary font-label-lg" disabled={text.trim().length < 3} onClick={() => onSubmit(text.trim())}>Añadir</button>
      </div>
    </div>
  );
}

function Confirm({ title, body, confirmLabel, onCancel, onConfirm }: { title: string; body: string; confirmLabel: string; onCancel: () => void; onConfirm: () => void }) {
  return (
    <div className="ik-modal" role="dialog" aria-modal aria-labelledby="ik-confirm-title">
      <button type="button" className="ik-modal__scrim" aria-label="Cerrar" onClick={onCancel} />
      <div className="ik-modal__panel">
        <h2 id="ik-confirm-title" className="ik-question font-body">{title}</h2>
        <p className="font-body-md ik-support">{body}</p>
        <div className="ik-inline-actions">
          <button type="button" className="ag-btn-primary font-label-lg" onClick={onConfirm}>{confirmLabel}</button>
          <button type="button" className="ik-text" onClick={onCancel}>Cancelar</button>
        </div>
      </div>
    </div>
  );
}
