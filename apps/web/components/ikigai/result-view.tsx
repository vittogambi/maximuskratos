'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { IkigaiLensMark } from '@/components/ikigai/lens-mark';
import type {
  IkigaiDefinition,
  IkigaiFieldKey,
  IkigaiNextExperiment,
  IkigaiResult,
} from '@/lib/ikigai-api';
import { trackIkigai } from '@/lib/ikigai-ui/analytics';
import { ANSWERS_FRAME, EXPERIMENT_INVITE } from '@/lib/ikigai-ui/copy';
import {
  BAND_LABELS,
  clusterSignals,
  criterionBand,
  discoveryNotes,
  FIELD_STEPS,
  fieldTitle,
  speakOfDirection,
  type SignalBlock,
} from '@/lib/ikigai-ui/format';

const EMPTY_LENSES_PREFIX = 'Todavía sin piezas:';
const UNTOUCHED_PREFIX = 'Esta dirección todavía no toca:';

function lensList(definition: IkigaiDefinition, keys: IkigaiFieldKey[]) {
  return keys.map((key) => fieldTitle(definition, key).toLowerCase()).join(', ');
}

function PieceTokens({
  definition,
  groups,
}: {
  definition: IkigaiDefinition;
  groups: Array<{ key: IkigaiFieldKey; items: Array<{ id: string; text: string }> }>;
}) {
  return (
    <div className="ik-chosen__chips">
      {groups.flatMap(({ key, items }) =>
        items.map((item) => (
          <span className="ik-token ik-token--plain" key={item.id}>
            <span className="ik-token__lens">
              <IkigaiLensMark field={key} size={12} />
              {fieldTitle(definition, key)}
            </span>
            {item.text}
          </span>
        )),
      )}
    </div>
  );
}

function SignalList({ blocks }: { blocks: SignalBlock[] }) {
  return (
    <div className="ik-signals">
      {blocks.map((block, index) =>
        block.kind === 'areas' ? (
          <div className="ik-signal" key={`${block.lead}-${index}`}>
            <p>{block.lead}</p>
            <ul className="ik-signal__areas">
              {block.titles.map((title) => (
                <li key={title}>{title}</li>
              ))}
            </ul>
          </div>
        ) : (
          <p className="ik-signal" key={block.key}>
            {block.text}
          </p>
        ),
      )}
    </div>
  );
}

export function ResultView({
  result,
  definition,
  onReopen,
  onSaveExperiment,
  busy,
  error,
}: {
  result: IkigaiResult;
  revision: number;
  definition: IkigaiDefinition;
  onReopen: () => void;
  onSaveExperiment: (body: Omit<IkigaiNextExperiment, 'savedAt'>) => Promise<void>;
  busy?: boolean;
  error?: string | null;
}) {
  const primary =
    result.hypotheses.find((hyp) => hyp.id === result.selectedHypothesisId) ?? result.hypotheses[0] ?? null;
  const others = result.hypotheses.filter((hyp) => hyp.id !== primary?.id);
  const [focus, setFocus] = useState(result.nextExperiment?.focus ?? '');
  const [horizon, setHorizon] = useState<30 | 60 | 90>(result.nextExperiment?.horizonDays ?? 30);
  const [action, setAction] = useState(result.nextExperiment?.action ?? '');
  const [signal, setSignal] = useState(result.nextExperiment?.signal ?? '');
  const [saved, setSaved] = useState(Boolean(result.nextExperiment));
  const [showExperiment, setShowExperiment] = useState(Boolean(result.nextExperiment));

  useEffect(() => {
    trackIkigai('result_viewed');
  }, []);

  const material = FIELD_STEPS.map((key) => ({
    key,
    items: result.material.fields.find((row) => row.key === key)?.items ?? [],
  }));

  if (!primary) {
    const collected = material.filter((row) => row.items.length > 0);
    const emptyKeys = material.filter((row) => row.items.length === 0).map((row) => row.key);
    const tensions = result.tensions.filter(
      (tension) =>
        !(tension.ruleId === 'T_FIELD_EMPTY' && tension.fieldKey && emptyKeys.includes(tension.fieldKey)),
    );
    const tensionTexts = new Set(tensions.map((tension) => tension.text));
    const questions = [...new Set(result.openQuestions)]
      .filter((note) => !tensionTexts.has(note))
      .map(speakOfDirection);

    return (
      <>
        <h1 className="ik-hero-title">Esto es lo que recogiste.</h1>
        <p className="font-body-md ik-support">Todavía sin dirección elegida. Eso también es información útil.</p>

        <section className="ik-section">
          <h2>Las piezas que recogiste</h2>
          {collected.length > 0 ? (
            <PieceTokens definition={definition} groups={collected} />
          ) : (
            <p className="ik-hint">Todavía no hay piezas en el mapa.</p>
          )}
          {collected.length > 0 && emptyKeys.length > 0 ? (
            <p className="ik-hint">
              {EMPTY_LENSES_PREFIX} {lensList(definition, emptyKeys)}.
            </p>
          ) : null}
        </section>

        {tensions.length ? (
          <section className="ik-section">
            <h2>Qué aparece al mirar el conjunto</h2>
            <SignalList blocks={clusterSignals(tensions, definition)} />
            <p className="ik-hint">Un hueco o una incertidumbre. No significa que algo esté mal.</p>
          </section>
        ) : null}

        {result.convergences.patternNote ? (
          <p className="font-body-md ik-support">{speakOfDirection(result.convergences.patternNote)}</p>
        ) : null}

        {questions.length ? (
          <section className="ik-section">
            <h2>Qué falta descubrir</h2>
            <ul className="ik-ask">
              {questions.map((note) => (
                <li key={note}>{note}</li>
              ))}
            </ul>
          </section>
        ) : null}

        <div className="ik-inline-actions">
          <button type="button" className="ag-btn-primary font-label-lg" onClick={onReopen}>
            Volver a explorar
          </button>
          <Link href="/ikigai/empezar" className="ik-btn-quiet">
            Terminar por ahora
          </Link>
        </div>
      </>
    );
  }

  const linkedIds = new Set((primary.linkedItems ?? []).map((item) => item.id));
  const linked = material.map(({ key, items }) => ({
    key,
    items: items.filter((item) => linkedIds.has(item.id)),
  }));
  const linkedGroups = linked.filter((row) => row.items.length > 0);
  const untouchedKeys = linked.filter((row) => row.items.length === 0).map((row) => row.key);

  const tensions = result.tensions.filter(
    (tension) => !(tension.ruleId === 'T_HYP_GAP' && tension.fieldKey && untouchedKeys.includes(tension.fieldKey)),
  );
  const tensionTexts = new Set(tensions.map((tension) => tension.text));
  const discoveries = [...new Set([...discoveryNotes(result), ...result.openQuestions])]
    .filter((note) => !tensionTexts.has(note))
    .map(speakOfDirection);
  const bands = (['solid', 'uncertain', 'needs', 'unknown'] as const).map((band) => ({
    band,
    items: primary.criteria.filter((criterion) => criterionBand(criterion.value) === band),
  }));

  const canSave = Boolean(focus.trim() && action.trim() && signal.trim());

  return (
    <>
      <h1 className="ik-hero-title">Esto es lo que construiste.</h1>

      <section className="ik-build">
        <h2>Tu dirección</h2>
        <p className="ik-build__text">{primary.text}</p>
        <div className="ik-build__pieces">
          <h3>Las piezas que la forman</h3>
          <PieceTokens definition={definition} groups={linkedGroups} />
          {untouchedKeys.length > 0 ? (
            <p className="ik-hint">
              {UNTOUCHED_PREFIX} {lensList(definition, untouchedKeys)}.
            </p>
          ) : null}
        </div>
      </section>
      <p className="ik-hint">Una dirección para explorar, no una definición de quién eres.</p>

      <section className="ik-section">
        <p className="ik-kicker">{ANSWERS_FRAME}</p>
        <h2>Cómo se ve hoy</h2>
        {bands.map(({ band, items }) =>
          items.length ? (
            <div className="ik-band" key={band}>
              <h3>{BAND_LABELS[band]}</h3>
              <ul className="ik-angles">
                {items.map((criterion) => (
                  <li key={criterion.key}>
                    <span>{criterion.label}</span>
                    <small>{criterion.answerLabel}</small>
                  </li>
                ))}
              </ul>
            </div>
          ) : null,
        )}
      </section>

      {tensions.length ? (
        <section className="ik-section">
          <h2>Qué aparece al mirar el conjunto</h2>
          <SignalList blocks={clusterSignals(tensions, definition)} />
          <p className="ik-hint">Un hueco o una incertidumbre. No significa que algo esté mal.</p>
        </section>
      ) : null}

      {discoveries.length ? (
        <section className="ik-section">
          <h2>Qué falta descubrir</h2>
          <ul className="ik-ask">
            {discoveries.map((note) => (
              <li key={note}>{note}</li>
            ))}
          </ul>
        </section>
      ) : null}

      {others.length ? (
        <section className="ik-section">
          <h2>Otras direcciones que aparecieron</h2>
          {others.map((hyp) => (
            <div className="ik-direction" key={hyp.id}>
              <p>{hyp.text}</p>
            </div>
          ))}
        </section>
      ) : null}

      {showExperiment ? (
        <section className="ik-experiment">
          <h2>Ponla a prueba</h2>
          <label className="ik-note" htmlFor="exp-focus">
            {definition.nextExperiment.focusLabel}
          </label>
          <textarea
            id="exp-focus"
            className="ik-area ik-area--write"
            maxLength={200}
            value={focus}
            onChange={(e) => setFocus(e.target.value)}
          />
          <p className="ik-note">{definition.nextExperiment.horizonLabel}</p>
          <div className="ik-horizons" role="radiogroup" aria-label="Duración">
            {([30, 60, 90] as const).map((days) => (
              <button
                key={days}
                type="button"
                role="radio"
                className={horizon === days ? 'is-on' : ''}
                aria-checked={horizon === days}
                onClick={() => setHorizon(days)}
              >
                {days} días
              </button>
            ))}
          </div>
          <label className="ik-note" htmlFor="exp-action">
            {definition.nextExperiment.actionLabel}
          </label>
          <textarea
            id="exp-action"
            className="ik-area ik-area--write"
            maxLength={280}
            value={action}
            onChange={(e) => setAction(e.target.value)}
          />
          <label className="ik-note" htmlFor="exp-signal">
            {definition.nextExperiment.signalLabel}
          </label>
          <textarea
            id="exp-signal"
            className="ik-area ik-area--write"
            maxLength={200}
            value={signal}
            onChange={(e) => setSignal(e.target.value)}
          />
          {error ? (
            <p className="ik-warn" role="alert">
              {error}
            </p>
          ) : null}
          <button
            type="button"
            className="ag-btn-primary font-label-lg ik-btn-main"
            disabled={!canSave || busy}
            onClick={() => {
              void onSaveExperiment({
                hypothesisId: primary.id,
                focus: focus.trim(),
                horizonDays: horizon,
                action: action.trim(),
                signal: signal.trim(),
              }).then(() => {
                setSaved(true);
                trackIkigai('experiment_saved');
              });
            }}
          >
            Guardar experimento
          </button>
          {saved ? (
            <div className="ik-after">
              <p className="ik-hint">
                Tu dirección sigue siendo una hipótesis. Lo que viene ahora es obtener evidencia real.
              </p>
              <p className="ik-note">¿Quieres seguir trabajando esta dirección con MK?</p>
              <Link href="/acceso" className="ik-btn-quiet">
                Quiero seguir trabajando esto
              </Link>
            </div>
          ) : null}
        </section>
      ) : (
        <div className="ik-experiment ik-experiment--invite">
          <button type="button" className="ik-invite" onClick={() => setShowExperiment(true)}>
            {EXPERIMENT_INVITE}
          </button>
        </div>
      )}

      <div className="ik-map-end">
        <button type="button" className="ik-text" onClick={onReopen}>
          Volver a explorar
        </button>
      </div>
    </>
  );
}
