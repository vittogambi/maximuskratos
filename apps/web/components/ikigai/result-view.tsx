'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { IkigaiDefinition, IkigaiNextExperiment, IkigaiResult } from '@/lib/ikigai-api';
import { trackIkigai } from '@/lib/ikigai-ui/analytics';
import { BAND_LABELS, criterionBand, discoveryNotes, FIELD_STEPS, fieldTitle } from '@/lib/ikigai-ui/format';

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

  useEffect(() => {
    trackIkigai('result_viewed');
  }, []);

  if (!primary) {
    return (
      <>
        <p className="ik-kicker">TU MAPA DE DIRECCIÓN</p>
        <h1 className="ik-question font-body">Todavía no aparece una dirección suficientemente clara.</h1>
        <p className="font-body-md ik-support">
          Eso también es información útil. Ya tienes material que puedes seguir explorando más adelante.
        </p>
        {FIELD_STEPS.map((key) => {
          const field = result.material.fields.find((row) => row.key === key);
          const unclear = result.fieldClarity?.[key] === 'UNCLEAR';
          return (
            <section className="ik-section" key={key}>
              <h2>{fieldTitle(definition, key)}</h2>
              {field?.items.length ? (
                <ul className="ik-list">
                  {field.items.map((item) => (
                    <li key={item.id}>{item.text}</li>
                  ))}
                </ul>
              ) : (
                <p className="ik-hint">{unclear ? 'Todavía no está claro' : 'Todavía no está definido.'}</p>
              )}
            </section>
          );
        })}
        {result.tensions.length ? (
          <section className="ik-section">
            <h2>Qué aparece al mirar el conjunto</h2>
            <ul className="ik-list">
              {result.tensions.map((tension) => (
                <li key={`${tension.ruleId}-${tension.fieldKey ?? ''}-${tension.hypothesisId ?? ''}`}>
                  {tension.text}
                </li>
              ))}
            </ul>
            <p className="ik-hint">Un hueco o una incertidumbre. No significa que algo esté mal.</p>
          </section>
        ) : null}
        {result.convergences.patternNote ? (
          <p className="font-body-md ik-support">{result.convergences.patternNote}</p>
        ) : null}
        {result.openQuestions.length ? (
          <section className="ik-section">
            <h2>Qué falta descubrir</h2>
            <ul className="ik-list">
              {result.openQuestions.map((note) => (
                <li key={note}>{note}</li>
              ))}
            </ul>
          </section>
        ) : null}
        <div className="ik-inline-actions">
          <button type="button" className="ag-btn-primary font-label-lg" onClick={onReopen}>
            Volver a explorar
          </button>
          <Link href="/ikigai/empezar" className="ik-btn-quiet font-label-lg">
            Terminar por ahora
          </Link>
        </div>
      </>
    );
  }

  const linkedIds = new Set((primary.linkedItems ?? []).map((item) => item.id));
  const linkedByField = FIELD_STEPS.map((key) => {
    const field = result.material.fields.find((row) => row.key === key);
    return {
      key,
      items: (field?.items ?? []).filter((item) => linkedIds.has(item.id)),
    };
  });

  const discoveries = [...new Set([...discoveryNotes(result), ...result.openQuestions])];
  const bands = (['solid', 'uncertain', 'needs', 'unknown'] as const).map((band) => ({
    band,
    items: primary.criteria.filter((criterion) => criterionBand(criterion.value) === band),
  }));

  const canSave = Boolean(focus.trim() && action.trim() && signal.trim());

  return (
    <>
      <p className="ik-kicker">TU MAPA DE DIRECCIÓN</p>
      <h1 className="ik-hero-title ag-type-section text-white">Esto es lo que empieza a aparecer.</h1>
      <section className="ik-section">
        <h2>Tu hipótesis de dirección</h2>
        <div className="ik-direction">
          <p>{primary.text}</p>
        </div>
        <p className="ik-hint">Una dirección para explorar, no una definición de quién eres.</p>
      </section>

      <section className="ik-section">
        <h2>Cómo se construye</h2>
        {linkedByField.map(({ key, items }) => (
          <div className="ik-build" key={key}>
            <h3>{fieldTitle(definition, key)}</h3>
            {items.length ? (
              <ul className="ik-list">
                {items.map((item) => (
                  <li key={item.id}>{item.text}</li>
                ))}
              </ul>
            ) : (
              <p className="ik-hint">Todavía no está definido.</p>
            )}
          </div>
        ))}
      </section>

      <section className="ik-section">
        <h2>Cómo se ve hoy</h2>
        {bands.map(({ band, items }) =>
          items.length ? (
            <div className="ik-band" key={band}>
              <h3>{BAND_LABELS[band]}</h3>
              <ul className="ik-list">
                {items.map((criterion) => (
                  <li key={criterion.key}>
                    {criterion.label}
                    <small>{criterion.answerLabel}</small>
                  </li>
                ))}
              </ul>
            </div>
          ) : null,
        )}
        <p className="ik-hint">
          Estas son tus respuestas actuales, no una evaluación objetiva de tu propósito.
        </p>
      </section>

      {result.tensions.length ? (
        <section className="ik-section">
          <h2>Qué aparece al mirar el conjunto</h2>
          <ul className="ik-list">
            {result.tensions.map((tension) => (
              <li key={`${tension.ruleId}-${tension.fieldKey ?? ''}-${tension.hypothesisId ?? ''}`}>
                {tension.text}
              </li>
            ))}
          </ul>
          <p className="ik-hint">Un hueco o una incertidumbre. No significa que algo esté mal.</p>
        </section>
      ) : null}

      {discoveries.length ? (
        <section className="ik-section">
          <h2>Qué falta descubrir</h2>
          <ul className="ik-list">
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

      <section className="ik-experiment">
        <h1 className="ik-question font-body">Ponla a prueba.</h1>
        <label className="ik-note" htmlFor="exp-focus">
          {definition.nextExperiment.focusLabel}
        </label>
        <textarea
          id="exp-focus"
          className="ik-area"
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
              className={horizon === days ? 'is-on' : ''}
              aria-pressed={horizon === days}
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
          className="ik-area"
          maxLength={280}
          value={action}
          onChange={(e) => setAction(e.target.value)}
        />
        <label className="ik-note" htmlFor="exp-signal">
          {definition.nextExperiment.signalLabel}
        </label>
        <textarea
          id="exp-signal"
          className="ik-area"
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
            <Link href="/acceso" className="ik-btn-quiet font-label-lg">
              Quiero seguir trabajando esto
            </Link>
          </div>
        ) : null}
      </section>

      <button type="button" className="ik-text" onClick={onReopen}>
        Volver a explorar
      </button>
    </>
  );
}
