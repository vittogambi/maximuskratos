'use client';

import { useEffect, useState } from 'react';
import { IkigaiLensMark } from '@/components/ikigai/lens-mark';
import type { IkigaiDefinition, IkigaiDraft, IkigaiHypothesis } from '@/lib/ikigai-api';
import {
  CONTRAST_ONE_NOTE,
  HYPOTHESIS_GUIDE_ITEMS,
  HYPOTHESIS_GUIDE_NOTE,
  HYPOTHESIS_PLACEHOLDER,
  RELATE_EMPTY,
  RELATE_LEAD,
  RELATE_NO_PIECES_PREFIX,
  SAVE_DIRECTION,
  TRAY_EMPTY,
  TRAY_LABEL,
  WRITE_PIECES_LABEL,
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
  onBackToLenses,
}: {
  definition: IkigaiDefinition;
  draft: IkigaiDraft;
  onChange: (patch: Partial<IkigaiDraft>) => void;
  onContrast: (selectedHypothesisId: string) => void;
  onNoHypothesis: () => void;
  onBackToLenses?: () => void;
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

  useEffect(() => {
    document.querySelector('.ik-main')?.scrollTo(0, 0);
  }, [phase]);

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

  const chosen = FIELD_STEPS.flatMap((key) =>
    byField[key].filter((row) => itemIds.includes(row.id)).map((row) => ({ ...row, field: key })),
  );

  if (phase === 'write') {
    return (
      <>
        <h1 className="ik-question font-body">{definition.hypothesis.label}</h1>
        <p className="font-body-md ik-support">{definition.hypothesis.help}</p>
        <div className="ik-chosen">
          <p className="ik-chosen__label">{WRITE_PIECES_LABEL}</p>
          <div className="ik-chosen__chips">
            {chosen.map((row) => (
                <span className="ik-token" key={row.id}>
                <span className="ik-token__lens">
                  <IkigaiLensMark field={row.field} size={12} />
                  {fieldTitle(definition, row.field)}
                </span>
                {row.text}
              </span>
            ))}
          </div>
        </div>
        <label className="sr-only" htmlFor="hyp-text">
          Dirección
        </label>
        <textarea
          id="hyp-text"
          className="ik-area ik-area--write"
          rows={5}
          maxLength={HYPOTHESIS_MAX}
          placeholder={HYPOTHESIS_PLACEHOLDER}
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <p className={`ik-count${text.length >= HYPOTHESIS_MAX ? ' is-over' : ''}`}>
          {text.length} / {HYPOTHESIS_MAX}
        </p>
        <div className="ik-aux-row">
          <button
            type="button"
            className="ik-text"
            aria-pressed={guide}
            onClick={() => {
              setGuide((open) => !open);
              setExamples(false);
            }}
          >
            Necesito una guía
          </button>
          <button
            type="button"
            className="ik-text"
            aria-pressed={examples}
            onClick={() => {
              setExamples((open) => !open);
              setGuide(false);
            }}
          >
            Ver ejemplos
          </button>
        </div>
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
        {examples ? (
          <ul className="ik-help-list">
            {definition.hypothesis.examples.map((row) => (
              <li key={row}>{row}</li>
            ))}
          </ul>
        ) : null}
        <div className="ik-write-foot">
          <button type="button" className="ik-text" onClick={() => setPhase('map')}>
            ← Volver
          </button>
          <button
            type="button"
            className="ag-btn-primary font-label-lg"
            disabled={!canSave}
            onClick={saveCurrent}
          >
            {SAVE_DIRECTION}
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
    const lastPieces = last
      ? FIELD_STEPS.flatMap((key) =>
          byField[key]
            .filter((row) => last.itemIds.includes(row.id))
            .map((row) => ({ ...row, field: key })),
        )
      : [];
    return (
      <>
        <h1 className="ik-question font-body">Una dirección que apareció</h1>
        {last ? (
          <div className="ik-direction ik-direction--saved">
            <p>{last.text}</p>
          </div>
        ) : null}
        {lastPieces.length > 0 ? (
          <div className="ik-chosen">
            <p className="ik-chosen__label">{WRITE_PIECES_LABEL}</p>
            <div className="ik-chosen__chips">
              {lastPieces.map((row) => (
                <span className="ik-token" key={row.id}>
                <span className="ik-token__lens">
                  <IkigaiLensMark field={row.field} size={12} />
                  {fieldTitle(definition, row.field)}
                </span>
                {row.text}
              </span>
              ))}
            </div>
          </div>
        ) : null}
        {saved.length > 1
          ? saved.slice(0, -1).map((hyp) => (
              <div className="ik-direction" key={hyp.id}>
                <p>{hyp.text}</p>
                <small>Otra dirección</small>
              </div>
            ))
          : null}
        <p className="ik-hint">{CONTRAST_ONE_NOTE}</p>
        <div className="ik-inline-actions">
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
          {canAddAnother ? (
            <button
              type="button"
              className="ik-btn-quiet"
              onClick={() => {
                setItemIds([]);
                setText('');
                setPhase('map');
              }}
            >
              Explorar otra dirección
            </button>
          ) : null}
        </div>
        <button type="button" className="ik-text" onClick={() => setConfirmNone(true)}>
          {definition.hypothesis.noHypothesisLabel}
        </button>
        {confirmNone ? <NoneModal onCancel={() => setConfirmNone(false)} onConfirm={onNoHypothesis} /> : null}
      </>
    );
  }

  const withPieces = FIELD_STEPS.filter((key) => byField[key].length > 0);
  const withoutPieces = FIELD_STEPS.filter((key) => byField[key].length === 0);

  if (withPieces.length === 0) {
    return (
      <>
        <h1 className="ik-question font-body">¿Qué piezas parecen pertenecer a una misma dirección?</h1>
        <div className="ik-slot">
          <p className="ik-slot__text">{RELATE_EMPTY}</p>
          {onBackToLenses ? (
            <div className="ik-add-row">
              <button type="button" className="ik-add" onClick={onBackToLenses}>
                <span className="ik-add__mark" aria-hidden>
                  +
                </span>
                Volver a explorar
              </button>
            </div>
          ) : null}
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
      {withPieces.map((key) => (
        <LensGroup
          key={key}
          title={fieldTitle(definition, key)}
          items={byField[key]}
          selected={itemIds}
          onToggle={toggle}
        />
      ))}
      {withoutPieces.length > 0 ? (
        <p className="ik-hint ik-hint--gap">
          {RELATE_NO_PIECES_PREFIX}{' '}
          {withoutPieces.map((key) => fieldTitle(definition, key).toLowerCase()).join(', ')}.
        </p>
      ) : null}
      <div className="ik-aux-row">
        {onBackToLenses ? (
          <button type="button" className="ik-text" onClick={onBackToLenses}>
            Volver a explorar
          </button>
        ) : null}
        <button type="button" className="ik-text" onClick={() => setConfirmNone(true)}>
          {definition.hypothesis.noHypothesisLabel}
        </button>
      </div>
      <div className="ik-tray">
        <div className="ik-tray__head">
          <p className="ik-tray__label">{TRAY_LABEL}</p>
          {chosen.length > 0 ? <span className="ik-tray__count">{chosen.length}</span> : null}
        </div>
        {chosen.length > 0 ? (
          <div className="ik-tray__chips">
            {chosen.map((row) => (
              <span className="ik-token ik-token--chip" key={row.id}>
                <IkigaiLensMark field={row.field} size={12} />
                {row.text}
              </span>
            ))}
          </div>
        ) : (
          <p className="ik-tray__empty">{TRAY_EMPTY}</p>
        )}
        {missing ? <p className="ik-tray__note">{missing}</p> : null}
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
      {confirmNone ? <NoneModal onCancel={() => setConfirmNone(false)} onConfirm={onNoHypothesis} /> : null}
    </>
  );
}

function LensGroup({
  title,
  items,
  selected,
  onToggle,
}: {
  title: string;
  items: { id: string; text: string }[];
  selected: string[];
  onToggle: (id: string) => void;
}) {
  return (
    <section className="ik-section">
      <h2>{title}</h2>
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
          <button type="button" className="ik-btn-quiet" onClick={onCancel}>
            Seguir explorando
          </button>
        </div>
      </div>
    </div>
  );
}

export { IkigaiRelateStep as IkigaiHypothesisBuilder };
