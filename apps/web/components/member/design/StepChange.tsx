'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { getAccessToken } from '@/lib/auth-storage';
import { readDirectionExploreHandoff } from '@/lib/direction-explore-handoff';
import { territoryLabel } from '@/lib/design-flow';
import {
  createDesign,
  fetchDesignContext,
  newCommandKey,
  patchDesign,
  recognizeReading,
  type DesignContext,
  type DesignView,
  type Reading,
  type Recognition,
} from '@/lib/intervention-api';
import { CHANGE_EXAMPLES, LINK_OPTIONS } from '@/lib/plan-design';
import { planStageLabel } from '@/lib/territory-ui-copy';
import { DIRECTION_STATUS } from '@/lib/direction-ui';

const RECOGNITION: { value: Recognition; label: string }[] = [
  { value: 'REPRESENTS', label: 'Me representa' },
  { value: 'PARTIAL', label: 'En parte' },
  { value: 'NOT', label: 'No me representa' },
];

type Props = {
  territory: string;
  context: DesignContext;
  design: DesignView | null;
  onContext: (context: DesignContext) => void;
  onSaved: (view: DesignView) => void;
};

function ReadingCard({
  reading,
  selected,
  busy,
  onRecognize,
  onToggle,
}: {
  reading: Reading;
  selected: boolean;
  busy: boolean;
  onRecognize: (outcome: Recognition) => void;
  onToggle: () => void;
}) {
  const oriented = reading.recognition === 'REPRESENTS' || reading.recognition === 'PARTIAL';
  return (
    <article className="mk-dp-reading">
      {reading.declared.map((line) => <p key={line} className="mk-dp-reading__quote">{line}</p>)}
      <p>{reading.interpretation}</p>
      {oriented ? (
        <label className="mk-ds-check">
          <input type="checkbox" checked={selected} onChange={onToggle} />
          Quiero tenerlo en cuenta en este plan
        </label>
      ) : (
        <fieldset className="mk-ds-recognition">
          <legend>{reading.question}</legend>
          {RECOGNITION.map((option) => (
            <button key={option.value} type="button" className="mk-mx__action" disabled={busy} onClick={() => onRecognize(option.value)}>
              {option.label}
            </button>
          ))}
        </fieldset>
      )}
    </article>
  );
}

export function StepChange({ territory, context, design, onContext, onSaved }: Props) {
  const label = territoryLabel(context.territory);
  const [change, setChange] = useState(design?.change.text ?? '');
  const [why, setWhy] = useState(design?.change.why ?? '');
  const [goal, setGoal] = useState<string | null>(design?.change.goal ?? null);
  const [readingIds, setReadingIds] = useState<string[]>(design?.change.contextReadingIds ?? []);
  const [linked, setLinked] = useState(Boolean(design?.change.purposeRevisionId));
  const [linkKind, setLinkKind] = useState(design?.change.linkKind ?? '');
  const [showAllReadings, setShowAllReadings] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const keyRef = useRef<string | null>(null);

  useEffect(() => {
    if (design) return;
    const handoff = readDirectionExploreHandoff();
    const brought = handoff?.trialWhat?.trim() || '';
    if (brought) setChange((current) => current || brought);
  }, [design]);

  const direction = context.direction;
  const directionStatus = direction?.mode && direction.mode in DIRECTION_STATUS
    ? DIRECTION_STATUS[direction.mode as keyof typeof DIRECTION_STATUS]
    : null;
  const readings = context.readings;
  const visibleReadings = showAllReadings ? readings : readings.slice(0, 3);
  const active = context.priorPlans.filter((row) => row.stage === 'ACTIVE' || row.stage === 'MAINTENANCE');

  async function recognize(reading: Reading, outcome: Recognition) {
    const token = getAccessToken();
    if (!token) return;
    setBusy(true);
    setError(null);
    try {
      await recognizeReading(token, context.territory, { readingId: reading.id, outcome, signature: reading.signature });
      onContext(await fetchDesignContext(token, context.territory));
      if (outcome === 'NOT') setReadingIds((ids) => ids.filter((id) => id !== reading.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar tu respuesta.');
    } finally {
      setBusy(false);
    }
  }

  function toggleReading(reading: Reading) {
    const on = !readingIds.includes(reading.id);
    setReadingIds((ids) => (on ? [...ids, reading.id] : ids.filter((id) => id !== reading.id)));
    if (on && !goal) setGoal(reading.goal);
    if (on && !change.trim()) setChange(context.goals.find((row) => row.id === reading.goal)?.label ?? '');
  }

  async function save() {
    const token = getAccessToken();
    if (!token) return;
    if (!change.trim()) {
      setError('Escribe qué te gustaría cambiar.');
      return;
    }
    const body = {
      change: change.trim(),
      why: why.trim() || null,
      goal,
      contextReadingIds: readingIds,
      purposeRevisionId: linked && direction?.purposeRevisionId ? (design?.change.purposeRevisionId ?? direction.purposeRevisionId) : null,
      linkKind: linked && linkKind ? linkKind : null,
    };
    setBusy(true);
    setError(null);
    try {
      if (design) {
        onSaved(await patchDesign(token, territory, design.planId, { section: 'change', ...body }));
      } else {
        keyRef.current = keyRef.current ?? newCommandKey('design');
        onSaved(await createDesign(token, territory, { ...body, commandKey: keyRef.current }));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar. Lo que escribiste sigue aquí.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mk-ds-proposal">
      <div>
        <h2 className="mk-ds-question">¿Qué te gustaría cambiar en {label}?</h2>
        <p className="mk-ds-help">Piensa en algo que te gustaría hacer o vivir de otra manera. Después veremos cómo llevarlo a la práctica.</p>
        {!design ? <Link href="/disenar?elegir=1" className="mk-ds-direction-link">Elegir otro ámbito</Link> : null}
      </div>

      {direction ? (
        <details className="mk-dp-context">
          <summary className="mk-dp-context__title">Tu dirección{linked ? ', vinculada a este plan' : ''}</summary>
          {directionStatus ? <p className="mk-m-muted">{directionStatus.label}. {directionStatus.help}</p> : null}
          {direction.statement ? <p>{direction.statement}</p> : null}
          {direction.desiredChange ? <p className="mk-m-muted">Cambio que buscas: {direction.desiredChange}</p> : null}
          {direction.values.length ? <p className="mk-m-muted">Lo que valoras: {direction.values.join(', ')}</p> : null}
          <div className="mk-ds-actions">
            {direction.desiredChange && !change.trim() ? (
              <button type="button" className="mk-mx__action" onClick={() => setChange(direction.desiredChange ?? '')}>Usar este cambio como punto de partida</button>
            ) : null}
            {direction.statement && !why.trim() ? (
              <button type="button" className="mk-mx__action" onClick={() => setWhy(direction.statement ?? '')}>Usar mi dirección como motivo</button>
            ) : null}
          </div>
          {direction.desiredChange && change.trim() === direction.desiredChange.trim() ? (
            <p className="mk-ds-need">Es una aspiración de largo plazo. En el paso 2 la bajas a algo que puedas ver en pocas semanas.</p>
          ) : null}
          <label className="mk-ds-check">
            <input type="checkbox" checked={linked} onChange={(event) => setLinked(event.target.checked)} />
            Vincular este plan a mi dirección
          </label>
          <p className="mk-m-muted">
            Es opcional. No todo cambio tiene que servir a tu dirección. Si después la cambias, este plan conserva la versión con la que lo vinculaste.
          </p>
          {linked ? (
            <label className="mk-ds-field">
              ¿Cómo se relaciona este plan con tu dirección? (opcional)
              <select value={linkKind} onChange={(event) => setLinkKind(event.target.value)}>
                <option value="">Prefiero no decirlo</option>
                {LINK_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            </label>
          ) : null}
        </details>
      ) : null}

      {readings.length ? (
        <details className="mk-dp-context">
          <summary className="mk-dp-context__title">
            Desde tus respuestas: {readings.length === 1 ? '1 lectura' : `${readings.length} lecturas`}
            {readingIds.length ? `, ${readingIds.length === 1 ? '1 elegida' : `${readingIds.length} elegidas`}` : ''}
          </summary>
          <p className="mk-m-muted">Son lecturas de lo que respondiste, sin orden de importancia. Solo cuentan si te representan y eliges tenerlas en cuenta.</p>
          {visibleReadings.map((reading) => (
            <ReadingCard
              key={reading.id}
              reading={reading}
              selected={readingIds.includes(reading.id)}
              busy={busy}
              onRecognize={(outcome) => void recognize(reading, outcome)}
              onToggle={() => toggleReading(reading)}
            />
          ))}
          {readings.length > 3 && !showAllReadings ? (
            <button type="button" className="mk-mx__textlink" onClick={() => setShowAllReadings(true)}>Ver {readings.length - 3} más</button>
          ) : null}
        </details>
      ) : !context.hasAnswers ? (
        <p className="mk-ds-need">
          Si quieres, puedes responder las preguntas de {label} para ver lo que ya dijiste antes de diseñar. No hace falta.{' '}
          <Link href={`/ambito/${context.territory}?fase=descubre`} className="mk-mx__textlink">Responder preguntas</Link>
        </p>
      ) : null}

      {context.priorPlans.length ? (
        <details className="mk-dp-context">
          <summary className="mk-dp-context__title">Lo que ya probaste en {label}{active.length ? ', con un plan en marcha' : ''}</summary>
          <ul className="mk-dp-list">
            {context.priorPlans.map((row) => (
              <li key={row.id}>
                <strong>{row.title}</strong> <span className="mk-m-muted">{planStageLabel(row.stage)}</span>
                {row.learning ? <p className="mk-m-muted">Aprendiste: {row.learning}</p> : null}
              </li>
            ))}
          </ul>
          {active.length ? <p className="mk-ds-need">Ya tienes un plan en marcha aquí. Puedes sumar otro, pero conviene que todo quepa en tu semana.</p> : null}
        </details>
      ) : null}

      <label className="mk-ds-field">
        Quiero…
        <textarea rows={2} value={change} maxLength={180} placeholder={CHANGE_EXAMPLES[context.territory]} aria-invalid={error === 'Escribe qué te gustaría cambiar.'} onChange={(event) => setChange(event.target.value)} />
      </label>

      <fieldset className="mk-dp-chips">
        <legend>¿Cuál de estas opciones se acerca más a tu cambio? (opcional)</legend>
        <p className="mk-m-muted">Elige una opción para recibir sugerencias más relevantes, o continúa sin elegir.</p>
        <div className="mk-ds-actions">
          {context.goals.map((row) => (
            <button
              key={row.id}
              type="button"
              className="mk-mx__action"
              aria-pressed={goal === row.id}
              onClick={() => {
                setGoal(goal === row.id ? null : row.id);
                if (goal !== row.id && !change.trim()) setChange(row.label);
              }}
            >
              {row.label}
            </button>
          ))}
        </div>
      </fieldset>

      <label className="mk-ds-field">
        ¿Por qué es importante para ti? (opcional)
        <textarea rows={2} value={why} maxLength={1000} onChange={(event) => setWhy(event.target.value)} />
        <small>Tener presente tu motivo puede ayudarte cuando sea difícil sostener el plan.</small>
      </label>

      {error ? <p className="mk-ds-error" role="alert">{error}</p> : null}
      {!change.trim() ? <p className="mk-ds-need">Escribe qué te gustaría cambiar para continuar.</p> : null}
      <div className="mk-ds-foot">
        <span>{design ? 'Borrador guardado en tu cuenta.' : 'Guardaremos tu plan cuando continúes.'}</span>
        <button type="button" className="mk-mx__action mk-mx__action--primary" disabled={busy || !change.trim()} onClick={() => void save()}>
          {busy ? 'Guardando' : 'Continuar'}
        </button>
      </div>
    </div>
  );
}
