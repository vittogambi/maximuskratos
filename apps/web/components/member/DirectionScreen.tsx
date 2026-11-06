'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { getAccessToken } from '@/lib/auth-storage';
import {
  fetchDirection,
  fetchDirectionExploration,
  fetchDirectionOverview,
  saveDirection,
  type DirectionMode,
  type DirectionOverview,
  type DirectionSourceId,
  type MemberDirection,
} from '@/lib/journey-api';
import { DIRECTION_STATUS, directionStatusLabel, savedDateLabel } from '@/lib/direction-ui';
import { territoryLabel } from '@/lib/design-flow';
import { DirectionExplorationWizard } from './DirectionExplorationWizard';
import { DirectionUnknownWelcome } from './DirectionUnknownWelcome';

const MODES: { id: DirectionMode; title: string; hint: string }[] = [
  {
    id: 'CLEAR',
    title: 'Tengo claro mi propósito',
    hint: 'Quiero ponerlo en palabras y tenerlo presente en mis decisiones.',
  },
  {
    id: 'EXPLORE',
    title: 'Tengo una idea para explorar',
    hint: 'Tengo algunas ideas y quiero empezar a darles forma.',
  },
  {
    id: 'UNKNOWN',
    title: 'Todavía no lo sé',
    hint: 'Quiero explorar algunas preguntas sin tener que definirlo todavía.',
  },
];

type Snapshot = {
  mode: DirectionMode;
  statement: string;
  desiredChange: string;
};

type PagePhase = 'overview' | 'choose' | 'develop';

/** CLEAR y EXPLORE se persisten con `saveDirection` y el `mode` del contrato; el backend asigna el estado de dirección. La UI no convierte EXPLORE en propósito confirmado. */
const CLEAR_FIELD = {
  label: '¿Qué quieres construir, cuidar o aportar?',
  placeholder: 'Por ejemplo: compartir lo que sé para que otros sean más autónomos',
} as const;

const EXPLORE_FIELD = {
  label: '¿Qué dirección te gustaría explorar?',
  help: 'Puedes cambiar esta idea a medida que aprendas más sobre ti.',
  placeholder: 'Por ejemplo: explorar cómo enseñar sin quemarme',
} as const;

function hasDirectionSources(sources: MemberDirection['sources']): boolean {
  return Boolean(sources.vision || sources.values.length > 0 || sources.ikigaiPurpose);
}

function shouldOpenDevelopView(m: DirectionMode, statement: string, desiredChange: string): boolean {
  if (statement.trim() || desiredChange.trim()) return true;
  if (m === 'CLEAR' || m === 'EXPLORE') return true;
  return false;
}

function DirectionSourcesBlock({
  sources,
  used,
  onUse,
}: {
  sources: MemberDirection['sources'];
  used: DirectionSourceId[];
  onUse: (text: string, id: DirectionSourceId) => void;
}) {
  const rows: { id: DirectionSourceId; label: string; text: string; seed: string }[] = [];
  if (sources.vision) rows.push({ id: 'vision', label: 'Tu respuesta sobre visión', text: sources.vision, seed: sources.vision });
  if (sources.values.length) rows.push({ id: 'values', label: 'Valores que elegiste', text: sources.values.join(', '), seed: sources.values.join('. ') });
  if (sources.ikigaiPurpose) {
    rows.push({ id: 'ikigaiPurpose', label: 'Frase de tu cruce IKIGAI, armada con la plantilla', text: sources.ikigaiPurpose, seed: sources.ikigaiPurpose });
  }
  return (
    <section className="mk-dir-mode__section">
      <h3 className="mk-dir-mode__section-title">Ideas que ya compartiste</h3>
      <p className="mk-m-field-help">
        Puedes usarlas como punto de partida si te resuenan. No tienen que definirte por completo.
      </p>
      {rows.map((row) => (
        <div key={row.id} className="mk-dir-mode__source">
          <p className="mk-m-muted">{row.label}</p>
          <p className="mk-plans-body">{row.text}</p>
          <button type="button" className="mk-mx__textlink" onClick={() => onUse(row.seed, row.id)}>
            {used.includes(row.id) ? 'Usada como punto de partida' : 'Usar como punto de partida'}
          </button>
        </div>
      ))}
      <Link href="/proposito/respuestas" className="mk-mx__textlink">Ver todas tus respuestas de Visión, Valores e IKIGAI</Link>
    </section>
  );
}

function DirectionSaved({
  data,
  overview,
  notice,
  onChange,
}: {
  data: MemberDirection;
  overview: DirectionOverview | null;
  notice: string | null;
  onChange: () => void;
}) {
  const mode = data.mode;
  const status = mode ? DIRECTION_STATUS[mode] : null;
  const savedAt = overview?.history.find((row) => row.current)?.savedAt ?? data.updatedAt;
  const older = (overview?.history ?? []).filter((row) => !row.current);
  const plans = overview?.linkedPlans ?? [];
  const answered = (overview?.evidence ?? []).filter((row) => row.answered > 0).map((row) => row.title);
  return (
    <div className="mk-dir-saved">
      <header className="mk-dir-page__header">
        <h1 className="mk-m-title">Tu dirección</h1>
      </header>
      {notice ? <p className="mk-m-success" role="status">{notice}</p> : null}

      <section className="mk-dir-saved__card" aria-label="Lo que decidiste expresar">
        {status ? <span className="mk-m-badge">{status.label}</span> : null}
        <p className="mk-dir-saved__statement">{data.statement}</p>
        {status ? <p className="mk-m-field-help">{status.help}</p> : null}
        {savedAt ? <p className="mk-m-muted">Guardada el {savedDateLabel(savedAt)}.</p> : null}
        <div className="mk-dir-save-done__actions">
          <Link href="/disenar" className="mk-mx__action mk-mx__action--primary">Diseñar un cambio con esta dirección</Link>
          <button type="button" className="mk-mx__action" onClick={onChange}>Cambiar mi dirección</button>
        </div>
        <p className="mk-m-field-help">
          Cambiarla guarda una versión nueva. Las anteriores y los planes que ya vinculaste no se modifican.
        </p>
      </section>

      <section className="mk-dir-mode" aria-labelledby="dir-saved-from">
        <h2 id="dir-saved-from" className="mk-dir-mode__section-title">De dónde salió</h2>
        {data.sourcesUsed.length ? (
          <ul className="mk-dir-saved__list">
            {data.sourcesUsed.map((row) => (
              <li key={row.id}>
                <p className="mk-m-muted">{row.label}</p>
                <p className="mk-plans-body">{row.text}</p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mk-plans-body">La escribiste sin partir de respuestas anteriores.</p>
        )}
      </section>

      <section className="mk-dir-mode" aria-labelledby="dir-saved-plans">
        <h2 id="dir-saved-plans" className="mk-dir-mode__section-title">Planes vinculados</h2>
        {plans.length ? (
          <ul className="mk-dir-saved__list">
            {plans.map((plan) => (
              <li key={plan.id}>
                <Link href={`/planes/${plan.id}`} className="mk-mx__textlink">{plan.title}</Link>
                <p className="mk-m-muted">
                  {plan.territory ? `${territoryLabel(plan.territory)}. ` : ''}
                  {plan.current
                    ? 'Vinculado a esta dirección.'
                    : `Vinculado a una dirección anterior${plan.directionStatement ? `: «${plan.directionStatement}»` : ''}. Se mantiene así.`}
                </p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mk-plans-body">Ningún plan está vinculado a tu dirección. Vincularlo es opcional y se elige al diseñar.</p>
        )}
      </section>

      {older.length ? (
        <details className="mk-dir-ev">
          <summary className="mk-dir-ev__summary">
            <span className="mk-dir-ev__title">Versiones anteriores</span>
            <span className="mk-dir-ev__count">{older.length}</span>
          </summary>
          <ul className="mk-dir-ev__list">
            {older.map((row) => (
              <li key={row.purposeRevisionId} className="mk-dir-ev__group">
                <p className="mk-dir-ev__answer">{row.statement}</p>
                <p className="mk-dir-ev__hint">
                  {directionStatusLabel(row.mode)}. Guardada el {savedDateLabel(row.savedAt)}.
                </p>
              </li>
            ))}
          </ul>
        </details>
      ) : null}

      <section className="mk-dir-mode" aria-labelledby="dir-saved-answers">
        <h2 id="dir-saved-answers" className="mk-dir-mode__section-title">Lo que ya respondiste</h2>
        <p className="mk-plans-body">
          {answered.length
            ? `Tienes respuestas de ${answered.length > 1 ? `${answered.slice(0, -1).join(', ')} y ${answered[answered.length - 1]}` : answered[0]} en el cuestionario.`
            : 'Todavía no hay respuestas de Visión, Valores ni IKIGAI en tu cuestionario.'}
        </p>
        <Link href="/proposito/respuestas" className="mk-mx__textlink">Ver tus respuestas</Link>
      </section>
    </div>
  );
}

export function DirectionScreen() {
  const [data, setData] = useState<MemberDirection | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<DirectionMode>('UNKNOWN');
  const [statement, setStatement] = useState('');
  const [desiredChange, setDesiredChange] = useState('');
  const [savedSnap, setSavedSnap] = useState<Snapshot | null>(null);
  const [phase, setPhase] = useState<PagePhase>('choose');
  const [saving, setSaving] = useState(false);
  const [modeChangeOpen, setModeChangeOpen] = useState(false);
  const [pendingMode, setPendingMode] = useState<DirectionMode | null>(null);
  const [backToChoosePending, setBackToChoosePending] = useState(false);
  const [unknownExploring, setUnknownExploring] = useState(false);
  const [skipWizardIntro, setSkipWizardIntro] = useState(false);
  const [overview, setOverview] = useState<DirectionOverview | null>(null);
  const [usedSources, setUsedSources] = useState<DirectionSourceId[]>([]);
  const [notice, setNotice] = useState<string | null>(null);
  const chooseHeadingRef = useRef<HTMLHeadingElement>(null);
  const developRegionRef = useRef<HTMLDivElement>(null);

  const load = useCallback(() => {
    const token = getAccessToken();
    if (!token) {
      setError('Inicia sesión para ver tu dirección.');
      return;
    }
    fetchDirectionOverview(token).then(setOverview).catch(() => setOverview(null));
    fetchDirection(token)
      .then((view) => {
        setData(view);
        const m = view.mode ?? 'UNKNOWN';
        const st = view.statement ?? '';
        const dc = view.desiredChange ?? '';
        setMode(m);
        setStatement(st);
        setDesiredChange(dc);
        setSavedSnap({ mode: m, statement: st, desiredChange: dc });
        setUsedSources([]);
        if (st.trim()) {
          setPhase('overview');
          return;
        }
        setPhase(shouldOpenDevelopView(m, st, dc) ? 'develop' : 'choose');
        if (m === 'UNKNOWN') {
          fetchDirectionExploration(token)
            .then((exp) => {
              if (exp.draft.step !== 'intro') {
                setUnknownExploring(true);
                setPhase('develop');
              }
            })
            .catch(() => undefined);
        }
      })
      .catch(() => setError('No pudimos cargar tu dirección. Inténtalo nuevamente.'));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const dirty = useMemo(() => {
    if (!savedSnap) return false;
    return (
      mode !== savedSnap.mode
      || statement !== savedSnap.statement
      || desiredChange !== savedSnap.desiredChange
    );
  }, [mode, statement, desiredChange, savedSnap]);

  const textDirty = useMemo(() => {
    if (!savedSnap) return Boolean(statement.trim() || desiredChange.trim());
    return statement !== savedSnap.statement || desiredChange !== savedSnap.desiredChange;
  }, [statement, desiredChange, savedSnap]);

  const savedHasText = Boolean(savedSnap?.statement.trim() || savedSnap?.desiredChange.trim());
  const statementTrimmed = statement.trim();
  const canSave = statementTrimmed.length > 0;
  const unchanged = !dirty && savedHasText;

  async function onSave(): Promise<void> {
    const token = getAccessToken();
    if (!token || saving) return;
    if (!statementTrimmed) {
      setError(
        mode === 'CLEAR'
          ? 'Escribe tu propósito antes de guardar.'
          : 'Escribe la idea que quieres explorar antes de guardar.',
      );
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await saveDirection(token, {
        mode,
        statement: statementTrimmed,
        desiredChange: desiredChange.trim() || null,
        commandKey: crypto.randomUUID(),
        ...(mode === 'EXPLORE' && usedSources.length ? { sourceIds: usedSources } : {}),
      });
      setSavedSnap({
        mode,
        statement: statementTrimmed,
        desiredChange: desiredChange.trim(),
      });
      setNotice(mode === 'CLEAR'
        ? 'Guardamos tu propósito. Quedará disponible cuando diseñes un cambio.'
        : 'Guardamos esta idea como dirección provisional. Puedes seguir explorándola cuando quieras.');
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No pudimos guardar tu dirección. Inténtalo nuevamente.');
    } finally {
      setSaving(false);
    }
  }

  function useSource(text: string, id: DirectionSourceId) {
    setStatement(text);
    setUsedSources((current) => (current.includes(id) ? current : [...current, id]));
  }

  function startChange() {
    setNotice(null);
    setPhase('choose');
    requestAnimationFrame(() => {
      chooseHeadingRef.current?.focus({ preventScroll: true });
    });
  }

  function focusDevelopRegion() {
    requestAnimationFrame(() => {
      developRegionRef.current?.focus({ preventScroll: true });
    });
  }

  function goToChooseView() {
    setPhase('choose');
    setBackToChoosePending(false);
    setPendingMode(null);
    setModeChangeOpen(false);
    requestAnimationFrame(() => {
      chooseHeadingRef.current?.focus({ preventScroll: true });
    });
  }

  function applyModeChange(next: DirectionMode) {
    setMode(next);
    setUnknownExploring(false);
    setSkipWizardIntro(false);
    setPendingMode(null);
    setModeChangeOpen(false);
    setBackToChoosePending(false);
    setPhase('develop');
    focusDevelopRegion();
  }

  function openDevelopWithMode(next: DirectionMode) {
    if (next === mode) {
      setPhase('develop');
      focusDevelopRegion();
      return;
    }
    const losingText =
      (mode === 'CLEAR' || mode === 'EXPLORE')
      && textDirty;
    if (losingText) {
      setPendingMode(next);
      setBackToChoosePending(false);
      setModeChangeOpen(true);
      return;
    }
    setMode(next);
    setPhase('develop');
    focusDevelopRegion();
  }

  function requestBackToChoose() {
    const losingText = (mode === 'CLEAR' || mode === 'EXPLORE') && textDirty;
    if (losingText) {
      setBackToChoosePending(true);
      setPendingMode(null);
      setModeChangeOpen(true);
      return;
    }
    goToChooseView();
  }

  function beginUnknownExploration() {
    setSkipWizardIntro(true);
    setUnknownExploring(true);
  }

  if (error && !data) {
    return (
      <div className="mk-m-page">
        <h1 className="mk-m-title">Tu dirección</h1>
        <p className="mk-m-error">{error}</p>
        <button type="button" className="mk-mx__action" onClick={load}>
          Reintentar
        </button>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="mk-m-page" aria-busy="true">
        <div className="mk-mx-skeleton"><span /><span /></div>
      </div>
    );
  }

  if (mode === 'UNKNOWN' && unknownExploring) {
    return (
      <DirectionExplorationWizard
        skipIntro={skipWizardIntro}
        onExit={() => {
          setUnknownExploring(false);
          setSkipWizardIntro(false);
          setPhase(data?.statement ? 'overview' : 'develop');
          load();
        }}
        onSavedDirection={() => load()}
      />
    );
  }

  const sources = data.sources;

  if (phase === 'overview' && data.statement) {
    return (
      <div className="mk-m-page mk-dir-page">
        <DirectionSaved data={data} overview={overview} notice={notice} onChange={startChange} />
      </div>
    );
  }

  return (
    <div className={`mk-m-page mk-dir-page${phase === 'choose' ? ' mk-dir-page--choose' : ' mk-dir-page--develop'}`}>
      {phase === 'choose' ? (
        <>
          {data.statement ? (
            <button type="button" className="mk-dir-page__back mk-mx__textlink" onClick={() => setPhase('overview')}>
              ← Volver a tu dirección
            </button>
          ) : null}
          <header className="mk-dir-page__header">
            <h1 ref={chooseHeadingRef} className="mk-m-title" tabIndex={-1}>
              Tu dirección
            </h1>
            <p className="mk-dir-page__intro">
              Puedes partir de una idea que ya tengas o explorar qué es importante para ti. Ninguna de las tres opciones es necesaria para diseñar un plan.
            </p>
          </header>

          <section aria-labelledby="direction-choose-title">
            <h2 id="direction-choose-title" className="mk-dir-page__choose-label">
              ¿Cómo quieres empezar?
            </h2>
            <ul className="mk-m-choice-list">
              {MODES.map((row) => (
                <li key={row.id}>
                  <button
                    type="button"
                    className="mk-m-choice"
                    onClick={() => openDevelopWithMode(row.id)}
                  >
                    <span className="mk-m-choice__content">
                      <span className="mk-m-choice__title">{row.title}</span>
                      <span className="mk-m-choice__desc">{row.hint}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </section>
          <p className="mk-m-field-help">
            <Link href="/proposito/respuestas" className="mk-mx__textlink">Ver lo que ya respondiste sobre Visión, Valores e IKIGAI</Link>
          </p>
          {!data.statement ? (
            <Link href="/disenar" className="mk-mx__textlink mk-dir-page__skip">Seguir a Diseña sin definir mi dirección</Link>
          ) : null}
        </>
      ) : (
        <div
          ref={developRegionRef}
          tabIndex={-1}
          className="mk-dir-page__develop"
          aria-label="Desarrollar tu dirección"
        >
          <button type="button" className="mk-dir-page__back mk-mx__textlink" onClick={requestBackToChoose}>
            ← Cambiar forma de empezar
          </button>

          {mode === 'UNKNOWN' ? (
            <DirectionUnknownWelcome variant="compact" onPrimary={beginUnknownExploration} />
          ) : null}

          {mode === 'CLEAR' ? (
            <section className="mk-dir-mode mk-dir-mode--flush" aria-labelledby="dir-clear-title">
              <h2 id="dir-clear-title" className="mk-dir-mode__title">
                Pon en palabras tu propósito
              </h2>
              <p className="mk-dir-mode__lead">
                Escribe la dirección que quieres tener presente en tus decisiones. Podrás revisarla cuando lo necesites.
              </p>
              <label className="mk-m-label" htmlFor="direction-statement">
                {CLEAR_FIELD.label}
              </label>
              <textarea
                id="direction-statement"
                className="mk-m-textarea mk-dir-mode__textarea"
                rows={5}
                value={statement}
                onChange={(e) => {
                  setStatement(e.target.value);
                }}
                placeholder={CLEAR_FIELD.placeholder}
                aria-describedby={error ? 'direction-save-error' : undefined}
              />
            </section>
          ) : null}

          {mode === 'EXPLORE' ? (
            <section className="mk-dir-mode mk-dir-mode--flush" aria-labelledby="dir-explore-title">
              <h2 id="dir-explore-title" className="mk-dir-mode__title">
                Dale forma a tu dirección
              </h2>
              <p className="mk-dir-mode__lead">
                No necesitas tenerlo todo claro. Empieza por una idea que te interese y descubre qué significa para ti.
              </p>
              {hasDirectionSources(sources) ? (
                <DirectionSourcesBlock sources={sources} used={usedSources} onUse={useSource} />
              ) : null}
              <label className="mk-m-label" htmlFor="direction-statement">
                {EXPLORE_FIELD.label}
              </label>
              <p className="mk-m-field-help">{EXPLORE_FIELD.help}</p>
              <textarea
                id="direction-statement"
                className="mk-m-textarea mk-dir-mode__textarea"
                rows={5}
                value={statement}
                onChange={(e) => {
                  setStatement(e.target.value);
                }}
                placeholder={EXPLORE_FIELD.placeholder}
                aria-describedby={error ? 'direction-save-error' : undefined}
              />
            </section>
          ) : null}

          {error ? (
            <p id="direction-save-error" className="mk-m-error" role="alert">
              {error}
            </p>
          ) : null}

          {mode === 'CLEAR' || mode === 'EXPLORE' ? (
            <div className="mk-dir-page__save-row">
              <button
                type="button"
                className="mk-mx__action mk-mx__action--primary mk-dir-page__save-cta"
                disabled={saving || !canSave || unchanged}
                onClick={() => void onSave()}
              >
                {saving
                  ? 'Guardando…'
                  : mode === 'CLEAR'
                    ? 'Guardar mi propósito'
                    : 'Guardar esta idea'}
              </button>
              {unchanged ? <p className="mk-m-field-help">Es la misma dirección que ya guardaste. Cambia el texto o la forma de empezar para guardar una versión nueva.</p> : null}
              {!savedHasText && !statementTrimmed ? (
                <Link href="/disenar" className="mk-mx__textlink mk-dir-page__skip">
                  Seguir a Diseña sin definir mi propósito
                </Link>
              ) : null}
            </div>
          ) : null}

          {data.revision != null && data.statement ? (
            <p className="mk-m-muted mk-dir-page__footnote">
              Guardar crea una versión nueva. Los planes vinculados conservan la dirección con la que comenzaron.
            </p>
          ) : null}
        </div>
      )}

      {modeChangeOpen ? (
        <div className="mk-m-modal" role="dialog" aria-labelledby="direction-mode-title">
          <div className="mk-m-modal__panel">
            <h2 id="direction-mode-title">Cambios sin guardar</h2>
            <p className="mk-plans-body">
              Tienes texto que aún no guardaste. Puedes guardarlo, descartarlo o seguir editando.
            </p>
            <div className="mk-week-task__actions">
              <button
                type="button"
                className="mk-mx__action mk-mx__action--primary"
                disabled={saving}
                onClick={() => {
                  void onSave().then(() => {
                    if (backToChoosePending) {
                      goToChooseView();
                    } else if (pendingMode) {
                      applyModeChange(pendingMode);
                    }
                  });
                }}
              >
                Guardar y continuar
              </button>
              <button
                type="button"
                className="mk-mx__action"
                onClick={() => {
                  setStatement(savedSnap?.statement ?? '');
                  setDesiredChange(savedSnap?.desiredChange ?? '');
                  if (backToChoosePending) {
                    goToChooseView();
                  } else if (pendingMode) {
                    applyModeChange(pendingMode);
                  }
                }}
              >
                Descartar cambios
              </button>
              <button
                type="button"
                className="mk-mx__action"
                onClick={() => {
                  setModeChangeOpen(false);
                  setPendingMode(null);
                  setBackToChoosePending(false);
                }}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
