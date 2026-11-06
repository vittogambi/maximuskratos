'use client';

import Link from 'next/link';
import { useRef, useState, type ReactNode } from 'react';
import { getAccessToken } from '@/lib/auth-storage';
import { JourneyApiError } from '@/lib/journey-api';
import { activateInterventionPlan, newCommandKey, type DesignView } from '@/lib/intervention-api';
import { invalidatePlansListCache } from '@/lib/plans-cache';
import { LINK_OPTIONS, NOTHING_TO_PROTECT, MARK_LABELS, loadLine, scheduleLabel, weeksLabel } from '@/lib/plan-design';

type Props = { design: DesignView; onGo: (step: number) => void; onReload: () => void };

function Section({ title, step, onGo, children }: { title: string; step: number; onGo: (step: number) => void; children: ReactNode }) {
  return (
    <section className="mk-dp-review" aria-label={title}>
      <header className="mk-dp-review__head">
        <h3>{title}</h3>
        <button type="button" className="mk-mx__textlink" onClick={() => onGo(step)} aria-label={`Editar ${title.toLowerCase()}`}>Editar</button>
      </header>
      {children}
    </section>
  );
}

export function StepReview({ design, onGo, onReload }: Props) {
  const { context, result, strategy, template } = design;
  const exploring = result.mode === 'EXPLORATION';
  const [health, setHealth] = useState<'NO_CURRENT_LIMIT' | 'CURRENT_LIMIT' | ''>('');
  const [conversation, setConversation] = useState<'VIABLE' | 'UNSAFE' | ''>('');
  const [direction, setDirection] = useState<'draft' | 'current' | 'none' | ''>('');
  const [minimumOk, setMinimumOk] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [active, setActive] = useState(false);
  const keyRef = useRef<string | null>(null);

  const readings = context.readings.filter((row) => design.change.contextReadingIds.includes(row.id));
  const resultIndicators = template?.indicators.filter((row) => row.role === 'RESULT') ?? [];
  const perception = template?.indicators.filter((row) => row.role === 'PERCEPTION') ?? [];
  const strategyTitle = strategy?.kind === 'CATALOG' ? template?.title ?? 'Estrategia del catálogo' : strategy?.title ?? '';
  const pattern = strategy?.kind === 'OWN' ? context.patterns.find((row) => row.id === strategy.pattern) : null;
  const currentDirection = context.direction;
  const directionChoice = Boolean(design.directionAtDraft && currentDirection?.purposeRevisionId && design.directionAtDraft.purposeRevisionId !== currentDirection.purposeRevisionId);
  const needsMinimumConfirm = design.minimum && Boolean(design.protectNote?.trim()) && design.protectNote !== NOTHING_TO_PROTECT;
  const missing = design.readiness.missing;
  const first = design.actions[0];

  async function activate() {
    const token = getAccessToken();
    if (!token) return;
    if (design.safety.health && !health) return setError('Indica si hay un límite de salud que el plan pueda contradecir.');
    if (design.safety.conversation && !conversation) return setError('Indica si puedes tener esa conversación de forma segura.');
    if (directionChoice && !direction) return setError('Elige qué dirección queda vinculada.');
    if (needsMinimumConfirm && !minimumOk) return setError('Confirma que la carga mínima no contradice lo que necesitas cuidar.');
    keyRef.current = keyRef.current ?? newCommandKey(`activate-${design.planId}`);
    setBusy(true);
    setError(null);
    try {
      await activateInterventionPlan(token, design.territory, design.planId, {
        confirmed: true,
        commandKey: keyRef.current,
        ...(health ? { healthLimit: health } : {}),
        ...(conversation ? { conversation } : {}),
        ...(needsMinimumConfirm ? { minimumLoadConfirmed: true } : {}),
        ...(direction === 'current' && currentDirection?.purposeRevisionId ? { purposeRevisionId: currentDirection.purposeRevisionId } : {}),
        ...(direction === 'none' ? { keepDraftPurposeRevision: false } : {}),
      });
      invalidatePlansListCache();
      setActive(true);
    } catch (err) {
      keyRef.current = null;
      const alternatives = err instanceof JourneyApiError && err.alternatives.length ? ` Puedes: ${err.alternatives.join(', ').toLowerCase()}.` : '';
      setError(err instanceof JourneyApiError && err.code === 'ACTIVATION_INCOMPLETE'
        ? 'Todavía falta completar información antes de activar tu plan. Revisa las indicaciones de arriba.'
        : err instanceof JourneyApiError
          ? `${err.message}${alternatives}`
          : 'No se pudo activar tu plan. El borrador sigue guardado en preparación.');
      if (err instanceof JourneyApiError && err.code === 'ACTIVATION_INCOMPLETE') onReload();
    } finally {
      setBusy(false);
    }
  }

  if (active) {
    return (
      <section className="mk-ds-proposal" aria-live="polite">
        <h2 className="mk-ds-question">Tu plan está activo</h2>
        {first ? <p>Empiezas con: {first.title}{first.cue ? `, ${first.cue.charAt(0).toLowerCase()}${first.cue.slice(1)}` : ''}.</p> : null}
        <p>
          {design.load.occasionsFirstWeek
            ? `Esta semana tienes ${design.load.occasionsFirstWeek} ${design.load.occasionsFirstWeek === 1 ? 'actividad prevista' : 'actividades previstas'}. Puedes elegir cuándo realizarlas.`
            : 'Esta semana no tienes actividades previstas.'}
        </p>
        <p className="mk-m-muted">
          En tu semana marcas si hiciste cada acción. Aparte, al revisar, anotas {exploring ? 'lo que aprendiste' : 'si el resultado ocurrió'}. Hacer las acciones no cuenta solo como resultado.
        </p>
        <div className="mk-ds-actions">
          <Link className="mk-mx__action mk-mx__action--primary" href={`/semana?planId=${design.planId}`}>Ver mi semana</Link>
          <Link className="mk-mx__action" href={`/planes/${design.planId}`}>Ver el plan</Link>
        </div>
      </section>
    );
  }

  return (
    <div className="mk-ds-proposal">
      <h2 className="mk-ds-question">Revisa tu plan antes de empezar</h2>

      {missing.length ? (
        <section className="mk-m-callout" aria-labelledby="mk-dp-missing">
          <p id="mk-dp-missing"><strong>Todavía falta completar información antes de activar tu plan</strong></p>
          <ul className="mk-dp-missing">
            {missing.map((row) => (
              <li key={`${row.code}-${row.actionKey ?? ''}`}>
                {row.message}{' '}
                <button type="button" className="mk-mx__textlink" onClick={() => onGo(row.step)}>Ir al paso {row.step}</button>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <Section title="Tu cambio" step={1} onGo={onGo}>
        <p>{design.change.text}</p>
        {design.change.why ? <p className="mk-m-muted">Por qué te importa: {design.change.why}</p> : null}
        {design.directionAtDraft?.statement ? (
          <p className="mk-m-muted">
            Vinculado a tu dirección: {design.directionAtDraft.statement}
            {design.change.linkKind ? `. ${LINK_OPTIONS.find((row) => row.value === design.change.linkKind)?.label ?? ''}` : ''}
          </p>
        ) : <p className="mk-m-muted">Sin dirección vinculada.</p>}
        {readings.length ? readings.map((row) => (
          <p key={row.id} className="mk-m-muted">Tienes en cuenta: {row.interpretation} ({row.recognition === 'PARTIAL' ? 'te representa en parte' : 'te representa'})</p>
        )) : null}
      </Section>

      <Section title={exploring ? 'Lo que quieres explorar' : 'El resultado que buscas'} step={2} onGo={onGo}>
        <p>{result.soughtOutcome}</p>
        <p className="mk-m-muted">{exploring ? 'Quieres saber: ' : 'Lo reconocerás porque: '}{result.criterion}</p>
        {!exploring && result.evidenceHint ? <p className="mk-m-muted">Evidencia: {result.evidenceHint}</p> : null}
        <p className="mk-m-muted">Revisión: a las {weeksLabel(result.horizonWeeks)} de activar.</p>
      </Section>

      <Section title="La estrategia" step={3} onGo={onGo}>
        <p>{strategyTitle}</p>
        {strategy?.kind === 'CATALOG' && template ? <p className="mk-m-muted">{template.seeks}</p> : null}
        {pattern ? <p className="mk-m-muted">Estrategia propia: {pattern.label.toLowerCase()}.</p> : null}
        {strategy?.kind === 'OWN' && strategy.approach ? <p className="mk-m-muted">{strategy.approach}</p> : null}
        {strategy?.kind === 'CATALOG' ? (
          <p className="mk-m-muted">
            {readings.some((row) => row.plans.includes(strategy.templateId))
              ? 'Orientada por una lectura de tus respuestas que reconociste.'
              : 'Estrategia general del catálogo. No parte de una lectura de tus respuestas.'}
          </p>
        ) : null}
        {strategy?.kind === 'CATALOG' && strategy.focusText ? <p className="mk-m-muted">Foco: {strategy.focusText}</p> : null}
        {strategy?.kind === 'CATALOG' && strategy.stageDefinition ? <p className="mk-m-muted">Lo que definiste: {strategy.stageDefinition}</p> : null}
        {template?.notes.map((note) => <p key={note} className="mk-ds-need">{note}</p>)}
      </Section>

      <Section title="Las acciones" step={4} onGo={onGo}>
        <ol className="mk-dp-list">
          {design.actions.map((row) => (
            <li key={row.key}>
              <strong>{row.title || 'Acción sin describir'}</strong>
              <p className="mk-m-muted">{scheduleLabel(row.schedule)}{row.cue ? `. ${row.cue}` : ''}</p>
              <p className="mk-m-muted">Hecha cuando: {row.doneWhen || 'sin definir'}</p>
              {row.minimum ? <p className="mk-m-muted">Versión mínima: {row.minimum}</p> : null}
              {row.contentTags.length ? <p className="mk-m-muted">Incluye: {row.contentTags.map((tag) => MARK_LABELS[tag].toLowerCase()).join(', ')}</p> : null}
            </li>
          ))}
        </ol>
        <p className="mk-m-muted">Tiempo estimado: {loadLine(design.load.byWeek)}</p>
        {design.obstacles.length ? (
          <>
            <p><strong>Si algo se interpone</strong></p>
            {design.obstacles.map((row) => <p key={row.obstacle} className="mk-m-muted">Si {row.obstacle}, entonces {row.response}</p>)}
          </>
        ) : null}
        {design.resources ? <p className="mk-m-muted">Tener a mano: {design.resources}</p> : null}
        <p className="mk-m-muted">Cuidar: {design.protectNote || 'sin responder'}</p>
      </Section>

      <section className="mk-dp-review" aria-label="Cómo se revisa">
        <header className="mk-dp-review__head"><h3>Cómo se revisa</h3></header>
        <p className="mk-m-muted">Cada semana marcas si hiciste cada acción. Una acción a medias no cuenta como hecha.</p>
        <p className="mk-m-muted">
          {exploring
            ? 'Al revisar anotas lo que aprendiste. No se cuenta como un resultado conseguido.'
            : 'Al revisar compruebas aparte si el resultado ocurrió, con tu criterio y tu evidencia.'}
        </p>
        {resultIndicators.map((row) => <p key={row.ref} className="mk-m-muted">La estrategia también pregunta cada semana: {row.question}</p>)}
        {perception.map((row) => <p key={row.ref} className="mk-m-muted">Opcional: {row.question}</p>)}
        <p className="mk-m-muted">En la revisión decides si sigues, ajustas, pausas o cierras. Nada cambia solo.</p>
      </section>

      {design.safety.health ? (
        <fieldset className="mk-ds-choices">
          <legend className="mk-dp-legend">¿Hay un límite de salud que este plan pueda contradecir?</legend>
          <label className={health === 'NO_CURRENT_LIMIT' ? 'is-selected' : undefined}>
            <input type="radio" name="health" checked={health === 'NO_CURRENT_LIMIT'} onChange={() => setHealth('NO_CURRENT_LIMIT')} />
            <span><strong>No limita lo que voy a hacer</strong></span>
          </label>
          <label className={health === 'CURRENT_LIMIT' ? 'is-selected' : undefined}>
            <input type="radio" name="health" checked={health === 'CURRENT_LIMIT'} onChange={() => setHealth('CURRENT_LIMIT')} />
            <span><strong>Hay un límite vigente</strong><small>Sigue la indicación que tengas. Puedes cambiar la acción por una compatible.</small></span>
          </label>
        </fieldset>
      ) : null}
      {design.safety.conversation ? (
        <fieldset className="mk-ds-choices">
          <legend className="mk-dp-legend">La conversación que planeaste, ¿es segura para ti?</legend>
          <label className={conversation === 'VIABLE' ? 'is-selected' : undefined}>
            <input type="radio" name="conversation" checked={conversation === 'VIABLE'} onChange={() => setConversation('VIABLE')} />
            <span><strong>Puedo tener esta conversación de forma segura</strong></span>
          </label>
          <label className={conversation === 'UNSAFE' ? 'is-selected' : undefined}>
            <input type="radio" name="conversation" checked={conversation === 'UNSAFE'} onChange={() => setConversation('UNSAFE')} />
            <span><strong>No es seguro tener esta conversación</strong><small>Puedes preparar el paso sin confrontación o elegir otro.</small></span>
          </label>
        </fieldset>
      ) : null}
      {directionChoice ? (
        <fieldset className="mk-ds-choices">
          <legend className="mk-dp-legend">Tu dirección cambió desde que empezaste este borrador</legend>
          <label className={direction === 'draft' ? 'is-selected' : undefined}>
            <input type="radio" name="direction" checked={direction === 'draft'} onChange={() => setDirection('draft')} />
            <span><strong>Conservar la del borrador</strong><small>{design.directionAtDraft?.statement}</small></span>
          </label>
          <label className={direction === 'current' ? 'is-selected' : undefined}>
            <input type="radio" name="direction" checked={direction === 'current'} onChange={() => setDirection('current')} />
            <span><strong>Usar la actual</strong><small>{currentDirection?.statement}</small></span>
          </label>
          <label className={direction === 'none' ? 'is-selected' : undefined}>
            <input type="radio" name="direction" checked={direction === 'none'} onChange={() => setDirection('none')} />
            <span><strong>No vincular dirección</strong></span>
          </label>
        </fieldset>
      ) : null}
      {needsMinimumConfirm ? (
        <label className="mk-ds-check">
          <input type="checkbox" checked={minimumOk} onChange={(event) => setMinimumOk(event.target.checked)} />
          Confirmo que la carga mínima no contradice lo que necesito cuidar.
        </label>
      ) : null}

      <label className="mk-ds-check">
        <input type="checkbox" checked={confirmed} disabled={!design.readiness.ready} onChange={(event) => setConfirmed(event.target.checked)} />
        Confirmo que quiero activar este plan.
      </label>
      {!design.readiness.ready ? <p className="mk-ds-need">Para activar, completa lo que falta en la lista de arriba.</p> : null}
      {error ? <p className="mk-ds-error" role="alert">{error}</p> : null}
      <div className="mk-ds-foot">
        <button type="button" className="mk-mx__action" onClick={() => onGo(4)}>Anterior</button>
        <span>El borrador queda guardado aunque no lo actives hoy.</span>
        <button type="button" className="mk-mx__action mk-mx__action--primary" disabled={busy || !confirmed || !design.readiness.ready} onClick={() => void activate()}>
          {busy ? 'Activando' : 'Activar mi plan'}
        </button>
      </div>
    </div>
  );
}
