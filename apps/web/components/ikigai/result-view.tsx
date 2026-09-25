'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { IkigaiCircles } from '@/components/ikigai/ikigai-circles';
import { IkigaiLensMark } from '@/components/ikigai/lens-mark';
import type {
  ExperimentContext,
  IkigaiDefinition,
  IkigaiFieldKey,
  IkigaiNextExperiment,
  IkigaiResult,
} from '@/lib/ikigai-api';
import { trackIkigai } from '@/lib/ikigai-ui/analytics';
import {
  ANSWERS_FRAME,
  EXPERIMENT_ACTION,
  EXPERIMENT_ACTION_PLACEHOLDER,
  EXPERIMENT_FOCUS,
  EXPERIMENT_FOCUS_PLACEHOLDER,
  EXPERIMENT_HORIZON_NOTE,
  EXPERIMENT_INVITE,
  EXPERIMENT_LEAD,
  EXPERIMENT_SAVE,
  EXPERIMENT_SAVED,
  EXPERIMENT_SIGNAL,
  EXPERIMENT_SIGNAL_PLACEHOLDER,
} from '@/lib/ikigai-ui/copy';
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

type PieceRow = { id: string; text: string; key: IkigaiFieldKey };

function PieceRows({ definition, rows }: { definition: IkigaiDefinition; rows: PieceRow[] }) {
  return (
    <ul className="ik-rpieces">
      {rows.map((row) => (
        <li key={row.id}>
          <IkigaiLensMark field={row.key} size={16} />
          <span>
            <span className="ik-rpieces__text">{row.text}</span>
            <span className="ik-rpieces__field">{fieldTitle(definition, row.key)}</span>
          </span>
        </li>
      ))}
    </ul>
  );
}

function SignalList({ blocks }: { blocks: SignalBlock[] }) {
  return (
    <ul className="ik-notes">
      {blocks.map((block, index) =>
        block.kind === 'areas' ? (
          <li key={`${block.lead}-${index}`}>
            <p>{block.lead}</p>
            <div className="ik-notes__chips">
              {block.titles.map((title) => (
                <span key={title}>{title}</span>
              ))}
            </div>
          </li>
        ) : (
          <li key={block.key}>
            <p>{block.text}</p>
          </li>
        ),
      )}
    </ul>
  );
}

function OtherDirections({
  definition,
  hypotheses,
  fieldOf,
}: {
  definition: IkigaiDefinition;
  hypotheses: IkigaiResult['hypotheses'];
  fieldOf: Map<string, IkigaiFieldKey>;
}) {
  return (
    <div className="ik-others">
      {hypotheses.map((hyp) => (
        <article className="ik-other" key={hyp.id}>
          <p className="ik-other__text">{hyp.text}</p>
          <PieceRows
            definition={definition}
            rows={(hyp.linkedItems ?? []).flatMap((item) => {
              const key = fieldOf.get(item.id);
              return key ? [{ id: item.id, text: item.text, key }] : [];
            })}
          />
        </article>
      ))}
    </div>
  );
}

export function ResultView({
  result,
  definition,
  experiment = { state: 'NONE' },
  onReopen,
  onSaveExperiment,
  busy,
  error,
}: {
  result: IkigaiResult;
  revision: number;
  definition: IkigaiDefinition;
  experiment?: ExperimentContext;
  onReopen: () => void;
  onSaveExperiment: (body: Omit<IkigaiNextExperiment, 'savedAt' | 'reviewStatus'>) => Promise<void>;
  busy?: boolean;
  error?: string | null;
}) {
  const primary = result.selectedHypothesisId
    ? (result.hypotheses.find((hyp) => hyp.id === result.selectedHypothesisId) ?? null)
    : null;
  const others = result.hypotheses.filter((hyp) => hyp.id !== primary?.id);
  const live = experiment.state === 'NONE' ? null : experiment.experiment;
  const needsReview = experiment.state === 'NEEDS_REVIEW';
  const [focus, setFocus] = useState(live?.focus ?? '');
  const [horizon, setHorizon] = useState<30 | 60 | 90>(live?.horizonDays ?? 30);
  const [action, setAction] = useState(live?.action ?? '');
  const [signal, setSignal] = useState(live?.signal ?? '');
  const [saved, setSaved] = useState(experiment.state === 'CURRENT');
  const [showExperiment, setShowExperiment] = useState(experiment.state !== 'NONE');

  useEffect(() => {
    trackIkigai('result_viewed');
  }, []);

  const material = FIELD_STEPS.map((key) => ({
    key,
    items: result.material.fields.find((row) => row.key === key)?.items ?? [],
  }));
  const fieldOf = new Map<string, IkigaiFieldKey>(
    material.flatMap(({ key, items }) => items.map((item) => [item.id, key] as const)),
  );
  const circleCounts = {
    PASION: material.find((row) => row.key === 'PASION')?.items.length ?? 0,
    CAPACIDAD: material.find((row) => row.key === 'CAPACIDAD')?.items.length ?? 0,
    NECESIDAD: material.find((row) => row.key === 'NECESIDAD')?.items.length ?? 0,
    VALOR: material.find((row) => row.key === 'VALOR')?.items.length ?? 0,
  };
  const circleUnclear = {
    PASION: result.fieldClarity?.PASION === 'UNCLEAR' && circleCounts.PASION === 0,
    CAPACIDAD: result.fieldClarity?.CAPACIDAD === 'UNCLEAR' && circleCounts.CAPACIDAD === 0,
    NECESIDAD: result.fieldClarity?.NECESIDAD === 'UNCLEAR' && circleCounts.NECESIDAD === 0,
    VALOR: result.fieldClarity?.VALOR === 'UNCLEAR' && circleCounts.VALOR === 0,
  };
  const circleMarkers = result.hypotheses.map((hyp, index) => ({
    id: hyp.id,
    index: index + 1,
    fields: FIELD_STEPS.filter((key) => hyp.coverage[key]),
  }));
  const circleMap = (
    <div className="ik-result-map">
    <IkigaiCircles
      definition={definition}
      counts={circleCounts}
      unclear={circleUnclear}
      markers={circleMarkers}
      activeId={result.selectedHypothesisId}
      interactive={false}
      reached={[...FIELD_STEPS]}
    />
    </div>
  );

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
        {circleMap}

        <section className="ik-rsec">
          <h2>Las piezas que recogiste</h2>
          {collected.length > 0 ? (
            <div className="ik-rcard">
              <PieceRows
                definition={definition}
                rows={collected.flatMap(({ key, items }) => items.map((item) => ({ ...item, key })))}
              />
            </div>
          ) : (
            <p className="ik-hint">Todavía no hay piezas en el mapa.</p>
          )}
          {collected.length > 0 && emptyKeys.length > 0 ? (
            <p className="ik-rsec__foot">
              {EMPTY_LENSES_PREFIX} {lensList(definition, emptyKeys)}.
            </p>
          ) : null}
        </section>

        {tensions.length ? (
          <section className="ik-rsec">
            <h2>Qué aparece al mirar el conjunto</h2>
            <SignalList blocks={clusterSignals(tensions, definition)} />
            <p className="ik-rsec__foot">Un hueco o una incertidumbre. No significa que algo esté mal.</p>
          </section>
        ) : null}

        {result.convergences.patternNote ? (
          <p className="font-body-md ik-support">{speakOfDirection(result.convergences.patternNote)}</p>
        ) : null}

        {result.hypotheses.length ? (
          <section className="ik-rsec">
            <h2>Posibilidades guardadas</h2>
            <OtherDirections definition={definition} hypotheses={result.hypotheses} fieldOf={fieldOf} />
          </section>
        ) : null}

        {questions.length ? (
          <section className="ik-rsec">
            <h2>Qué falta descubrir</h2>
            <ul className="ik-notes ik-notes--ask">
              {questions.map((note) => (
                <li key={note}>
                  <p>{note}</p>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <div className="ik-rend">
          <button type="button" className="ag-btn-primary font-label-lg ik-btn-main" onClick={onReopen}>
            Volver a explorar
          </button>
          <Link href="/ikigai/empezar" className="ik-btn-quiet">
            Terminar por ahora
          </Link>
        </div>
      </>
    );
  }

  const linkedRows: PieceRow[] = (primary.linkedItems ?? []).flatMap((item) => {
    const key = fieldOf.get(item.id);
    return key ? [{ id: item.id, text: item.text, key }] : [];
  });
  const untouchedKeys = FIELD_STEPS.filter((key) => !primary.coverage[key]);

  const tensions = result.tensions.filter(
    (tension) =>
      (!tension.hypothesisId || tension.hypothesisId === primary.id) &&
      !(tension.ruleId === 'T_HYP_GAP' && tension.fieldKey && untouchedKeys.includes(tension.fieldKey)),
  );
  const tensionTexts = new Set(tensions.map((tension) => tension.text));
  const ownQuestion = (note: string) => {
    const match = /hipótesis (\d+)/i.exec(note);
    return !match || Number(match[1]) === primary.index;
  };
  const discoveries = [...new Set([...discoveryNotes(result), ...result.openQuestions.filter(ownQuestion)])]
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
      <p className="font-body-md ik-support">Una dirección para explorar, no una definición de quién eres.</p>
      {circleMap}

      <section className="ik-rsec">
        <h2>Tu dirección</h2>
        <article className="ik-rcard ik-rcard--lead">
          <p className="ik-rlead">{primary.text}</p>
          <h3 className="ik-rcard__label">Las piezas que la forman</h3>
          <PieceRows definition={definition} rows={linkedRows} />
          {untouchedKeys.length > 0 ? (
            <p className="ik-rcard__foot">
              {UNTOUCHED_PREFIX} {lensList(definition, untouchedKeys)}.
            </p>
          ) : null}
        </article>
      </section>

      <section className="ik-rsec">
        <h2>Cómo se ve hoy</h2>
        <p className="ik-rsec__lead">{ANSWERS_FRAME}.</p>
        <div className="ik-rcard ik-read">
          {bands.map(({ band, items }) =>
            items.length ? (
              <div className={`ik-read__band is-${band}`} key={band}>
                <h3>
                  <span className="ik-read__dot" aria-hidden />
                  {BAND_LABELS[band]}
                </h3>
                <ul>
                  {items.map((criterion) => (
                    <li key={criterion.key}>
                      <span className="ik-read__name">{criterion.label}</span>
                      <span className="ik-read__answer">{criterion.answerLabel}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null,
          )}
        </div>
      </section>

      {tensions.length ? (
        <section className="ik-rsec">
          <h2>Qué aparece al mirar el conjunto</h2>
          <SignalList blocks={clusterSignals(tensions, definition)} />
          <p className="ik-rsec__foot">Un hueco o una incertidumbre. No significa que algo esté mal.</p>
        </section>
      ) : null}

      {discoveries.length ? (
        <section className="ik-rsec">
          <h2>Qué falta descubrir</h2>
          <ul className="ik-notes ik-notes--ask">
            {discoveries.map((note) => (
              <li key={note}>
                <p>{note}</p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {others.length ? (
        <section className="ik-rsec">
          <h2>Otras direcciones que aparecieron</h2>
          <OtherDirections definition={definition} hypotheses={others} fieldOf={fieldOf} />
        </section>
      ) : null}

      {needsReview ? (
        <p className="ik-hint">
          Este experimento necesita revisión. Conservamos lo que escribiste; revísalo antes de volver a usarlo.
        </p>
      ) : null}
      {showExperiment && primary ? (
        <section className="ik-experiment">
          <h2>Ponla a prueba</h2>
          <p className="ik-experiment__lead">{EXPERIMENT_LEAD}</p>
          <p className="ik-note">Durante</p>
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
          <p className="ik-experiment__note">{EXPERIMENT_HORIZON_NOTE}</p>
          <label className="ik-note" htmlFor="exp-action">
            {EXPERIMENT_ACTION}
          </label>
          <textarea
            id="exp-action"
            className="ik-area ik-area--write"
            maxLength={280}
            placeholder={EXPERIMENT_ACTION_PLACEHOLDER}
            value={action}
            onChange={(e) => setAction(e.target.value)}
          />
          <label className="ik-note" htmlFor="exp-focus">
            {EXPERIMENT_FOCUS}
          </label>
          <textarea
            id="exp-focus"
            className="ik-area ik-area--write"
            maxLength={200}
            placeholder={EXPERIMENT_FOCUS_PLACEHOLDER}
            value={focus}
            onChange={(e) => setFocus(e.target.value)}
          />
          <label className="ik-note" htmlFor="exp-signal">
            {EXPERIMENT_SIGNAL}
          </label>
          <textarea
            id="exp-signal"
            className="ik-area ik-area--write"
            maxLength={200}
            placeholder={EXPERIMENT_SIGNAL_PLACEHOLDER}
            value={signal}
            onChange={(e) => setSignal(e.target.value)}
          />
          {error ? (
            <p className="ik-warn" role="alert">
              {error}
            </p>
          ) : null}
          {!canSave ? <p className="ik-experiment__note">Completa los tres campos para guardar.</p> : null}
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
            {EXPERIMENT_SAVE}
          </button>
          {saved ? (
            <div className="ik-after">
              <p className="ik-hint">{EXPERIMENT_SAVED}</p>
              <p className="ik-note">¿Quieres seguir trabajando esta dirección con MK?</p>
              <Link href="/acceso" className="ik-btn-quiet">
                Quiero seguir trabajando esto
              </Link>
            </div>
          ) : null}
        </section>
      ) : (
        <div className="ik-rend">
          <button type="button" className="ag-btn-primary font-label-lg ik-btn-main" onClick={() => setShowExperiment(true)}>
            {EXPERIMENT_INVITE}
          </button>
        </div>
      )}

      <div className={`ik-rend${showExperiment ? '' : ' ik-rend--tight'}`}>
        <button type="button" className="ik-btn-quiet" onClick={onReopen}>
          Volver a explorar
        </button>
      </div>
    </>
  );
}
