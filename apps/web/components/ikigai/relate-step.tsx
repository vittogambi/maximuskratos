'use client';

import { useState } from 'react';
import type { IkigaiDefinition, IkigaiDraft, IkigaiHypothesis } from '@/lib/ikigai-api';
import {
  CONTRAST_ONE_NOTE,
  HYPOTHESIS_GUIDE_ITEMS,
  HYPOTHESIS_GUIDE_NOTE,
  HYPOTHESIS_PLACEHOLDER,
  RELATE_LEAD,
} from '@/lib/ikigai-ui/copy';
import {
  coverageOf,
  fieldTitle,
  FIELD_STEPS,
  HYPOTHESIS_MAX,
  missingLensCopy,
  selectableByField,
} from '@/lib/ikigai-ui/format';

type Phase = 'map' | 'write' | 'saved' | 'choose' | 'none';

function newHypId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return `h-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function IkigaiRelateStep({
  definition,
  draft,
  onChange,
  onContrast,
  onNoHypothesis,
}: {
  definition: IkigaiDefinition;
  draft: IkigaiDraft;
  onChange: (patch: Partial<IkigaiDraft>) => void;
  onContrast: (selectedHypothesisId: string) => void;
  onNoHypothesis: () => void;
}) {
  const saved = draft.hypotheses.filter(
    (h) => h.text.trim().length >= 12 && h.itemIds.length >= 1,
  );
  const [phase, setPhase] = useState<Phase>(saved.length > 0 ? 'saved' : 'map');
  const [itemIds, setItemIds] = useState<string[]>([]);
  const [text, setText] = useState('');
  const [guide, setGuide] = useState(false);
  const [examples, setExamples] = useState(false);
  const [confirmNone, setConfirmNone] = useState(false);
  const byField = selectableByField(draft);
  const covered = coverageOf({ itemIds }, draft);
  const missing = missingLensCopy(covered, definition);
  const canWrite = itemIds.length >= 1;
  const canSave = text.trim().length >= 12 && text.length <= HYPOTHESIS_MAX && itemIds.length >= 1;
  const canAddAnother = saved.length < 3;

  function toggle(id: string) {
    setItemIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  function saveCurrent() {
    const hyp: IkigaiHypothesis = {
      id: newHypId(),
      text: text.trim(),
      itemIds,
      criteria: {},
      order: saved.length,
    };
    onChange({
      hypotheses: [...saved, hyp],
      noHypothesisYet: false,
      selectedHypothesisId: saved.length === 0 ? hyp.id : draft.selectedHypothesisId ?? hyp.id,
    });
    setItemIds([]);
    setText('');
    setGuide(false);
    setExamples(false);
    setPhase('saved');
  }

  if (phase === 'write') {
    return (
      <>
        <h1 className="ik-question font-body">{definition.hypothesis.label}</h1>
        <p className="font-body-md ik-support">{definition.hypothesis.help}</p>
        <div className="ik-compose" aria-label="Piezas de esta dirección">
          {FIELD_STEPS.map((key) => {
            const item = byField[key].find((row) => itemIds.includes(row.id));
            return (
              <div key={key} className="ik-compose__row">
                <span>{fieldTitle(definition, key)}</span>
                <span>{item?.text ?? 'Sin definir'}</span>
              </div>
            );
          })}
        </div>
        <label className="sr-only" htmlFor="hyp-text">
          Dirección
        </label>
        <textarea
          id="hyp-text"
          className="ik-area"
          rows={6}
          maxLength={HYPOTHESIS_MAX}
          placeholder={HYPOTHESIS_PLACEHOLDER}
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <p className={`ik-count${text.length >= HYPOTHESIS_MAX ? ' is-over' : ''}`}>
          {text.length} / {HYPOTHESIS_MAX}
        </p>
        <button type="button" className="ik-text" onClick={() => setGuide((v) => !v)}>
          Necesito una guía
        </button>
        {guide ? (
          <div className="ik-guide">
            <p className="ik-note">Puedes pensar en:</p>
            <ul className="ik-help-list">
              {HYPOTHESIS_GUIDE_ITEMS.map((row) => (
                <li key={row}>{row}</li>
              ))}
            </ul>
            <p className="ik-hint">{HYPOTHESIS_GUIDE_NOTE}</p>
          </div>
        ) : null}
        <button type="button" className="ik-text" onClick={() => setExamples((v) => !v)}>
          Ver ejemplos
        </button>
        {examples ? (
          <ul className="ik-help-list">
            {definition.hypothesis.examples.map((row) => (
              <li key={row}>{row}</li>
            ))}
          </ul>
        ) : null}
        <div className="ik-inline-actions">
          <button type="button" className="ik-btn-quiet font-label-lg" onClick={() => setPhase('map')}>
            Atrás
          </button>
          <button
            type="button"
            className="ag-btn-primary font-label-lg"
            disabled={!canSave}
            onClick={saveCurrent}
          >
            Guardar
          </button>
        </div>
      </>
    );
  }

  if (phase === 'choose') {
    return (
      <>
        <h1 className="ik-question font-body">¿Cuál quieres poner a prueba primero?</h1>
        <div className="ik-stack">
          {saved.map((hyp) => (
            <button
              key={hyp.id}
              type="button"
              className="ik-item"
              onClick={() => onContrast(hyp.id)}
            >
              <p className="ik-item__text">{hyp.text}</p>
            </button>
          ))}
        </div>
      </>
    );
  }

  if (phase === 'saved') {
    const last = saved[saved.length - 1];
    return (
      <>
        <h1 className="ik-question font-body">Una dirección que apareció</h1>
        {last ? <div className="ik-direction"><p>{last.text}</p></div> : null}
        {saved.length > 1
          ? saved.slice(0, -1).map((hyp) => (
              <div className="ik-direction" key={hyp.id}>
                <p>{hyp.text}</p>
                <small>Otra dirección</small>
              </div>
            ))
          : null}
        <p className="ik-hint">Una es suficiente para continuar.</p>
        <p className="ik-hint">{CONTRAST_ONE_NOTE}</p>
        <div className="ik-inline-actions">
          {canAddAnother ? (
            <button
              type="button"
              className="ik-btn-quiet font-label-lg"
              onClick={() => {
                setItemIds([]);
                setText('');
                setPhase('map');
              }}
            >
              Explorar otra dirección
            </button>
          ) : null}
          <button
            type="button"
            className="ag-btn-primary font-label-lg"
            onClick={() => {
              if (saved.length === 1) onContrast(saved[0].id);
              else setPhase('choose');
            }}
          >
            {saved.length === 1 ? 'Contrastar esta dirección' : 'Elegir cuál contrastar'}
          </button>
        </div>
        <button type="button" className="ik-text" onClick={() => setConfirmNone(true)}>
          {definition.hypothesis.noHypothesisLabel}
        </button>
        {confirmNone ? <NoneModal onCancel={() => setConfirmNone(false)} onConfirm={onNoHypothesis} /> : null}
      </>
    );
  }

  return (
    <>
      <h1 className="ik-question font-body">¿Qué piezas parecen pertenecer a una misma dirección?</h1>
      <p className="font-body-md ik-support">{RELATE_LEAD}</p>
      {FIELD_STEPS.map((key) => (
        <LensGroup
          key={key}
          title={fieldTitle(definition, key)}
          items={byField[key]}
          unclear={draft.fieldClarity?.[key] === 'UNCLEAR' && byField[key].length === 0}
          selected={itemIds}
          onToggle={toggle}
        />
      ))}
      <div className="ik-compose" aria-label="Composición">
        {FIELD_STEPS.map((key) => (
          <div key={key} className="ik-compose__row">
            <span>{fieldTitle(definition, key)}</span>
            <span>{covered[key] ? '✓' : 'Sin definir'}</span>
          </div>
        ))}
      </div>
      {missing ? <p className="ik-hint">{missing}</p> : null}
      <div className="ik-inline-actions">
        <button
          type="button"
          className="ag-btn-primary font-label-lg"
          disabled={!canWrite}
          onClick={() => {
            setText('');
            setPhase('write');
          }}
        >
          Ponerlo en palabras
        </button>
      </div>
      <button type="button" className="ik-text" onClick={() => setConfirmNone(true)}>
        {definition.hypothesis.noHypothesisLabel}
      </button>
      {confirmNone ? <NoneModal onCancel={() => setConfirmNone(false)} onConfirm={onNoHypothesis} /> : null}
    </>
  );
}

function LensGroup({
  title,
  items,
  unclear,
  selected,
  onToggle,
}: {
  title: string;
  items: { id: string; text: string }[];
  unclear: boolean;
  selected: string[];
  onToggle: (id: string) => void;
}) {
  return (
    <section className="ik-section">
      <h2>{title}</h2>
      {unclear || items.length === 0 ? <p className="ik-hint">Todavía no está claro</p> : null}
      <div className="ik-stack ik-stack--tight">
        {items.map((item) => {
          const on = selected.includes(item.id);
          return (
            <button
              key={item.id}
              type="button"
              className={`ik-item ik-item--pick${on ? ' is-on' : ''}`}
              aria-pressed={on}
              onClick={() => onToggle(item.id)}
            >
              <span className={`ik-check${on ? ' is-on' : ''}`} aria-hidden>
                {on ? '✓' : ''}
              </span>
              <p className="ik-item__text">{item.text}</p>
            </button>
          );
        })}
      </div>
    </section>
  );
}

function NoneModal({ onCancel, onConfirm }: { onCancel: () => void; onConfirm: () => void }) {
  return (
    <div className="ik-modal" role="dialog" aria-modal aria-labelledby="ik-none-title">
      <button type="button" className="ik-modal__scrim" aria-label="Cerrar" onClick={onCancel} />
      <div className="ik-modal__panel">
        <h2 id="ik-none-title" className="ik-question font-body">
          También es un resultado.
        </h2>
        <p className="font-body-md ik-support">
          Puedes terminar con lo que encontraste hasta ahora y volver más adelante.
        </p>
        <div className="ik-inline-actions">
          <button type="button" className="ag-btn-primary font-label-lg" onClick={onConfirm}>
            Ver mi mapa
          </button>
          <button type="button" className="ik-btn-quiet font-label-lg" onClick={onCancel}>
            Seguir explorando
          </button>
        </div>
      </div>
    </div>
  );
}

export { IkigaiRelateStep as IkigaiHypothesisBuilder };
