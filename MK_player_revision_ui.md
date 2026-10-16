# Revisión del player móvil del cuestionario

Documento para revisar la pantalla sin el repositorio. El código y el CSS salen del árbol de trabajo el 15 oct 2026. No hay estilos medidos en el navegador: lo que sigue se deduce del fuente. Donde algo se vio en una captura, se dice aparte.

No se modificó la aplicación para escribir este archivo.

## 1. Mapa de componentes

La ruta que monta la pregunta es `apps/web/app/diagnostico/modulo/[moduleSlug]/pregunta/page.tsx`. Solo renderiza `DiagnosticPlayer`.

Antecesores:

- `apps/web/app/layout.tsx` carga fuentes, `globals.css` y el viewport (`width: device-width`, `initialScale: 1`, `viewportFit: 'cover'`).
- `apps/web/app/diagnostico/layout.tsx` monta `.dk-shell` con altura `100dvh`, columna flex y `overflow: hidden`. Dentro va `DiagnosticAccessGate`, que solo redirige si no hay sesión. No aporta alto ni scroll.
- El grupo `(member)` y `AppShell` no envuelven estas rutas. El player no tiene la barra inferior de la app de miembros.

Otras pantallas del mismo recorrido, con el mismo shell de navegación (`PlayerStage`):

- Bienvenida: `apps/web/app/diagnostico/bienvenida/page.tsx` → `DiagnosticWelcome`.
- Cierre de módulo: `apps/web/app/diagnostico/outro/[moduleSlug]/page.tsx` → `ModuleOutro`.
- Entrada: `apps/web/app/diagnostico/page.tsx` → `DiagnosticEntry`, que decide si manda a bienvenida o al módulo. No es el player.

Shell del player: `apps/web/components/diagnostico/PlayerStage.tsx`.

Rejilla de tres filas: `auto minmax(0, 1fr) auto`.

1. Encabezado: `ProgressRail` (contexto «Auditoría inicial», título de sección, «Pregunta N de M», barra y porcentaje).
2. Área central: `.dk-stage__body`, `min-height: 0`, `overflow-y: auto`. Ahí van la introducción, `QuestionCard` o el cierre.
3. Barra inferior: `.dk-stage__nav`. El botón no lo pinta el renderer.

Quién controla qué, según el código:

- Altura disponible: el layout de diagnóstico fija `100dvh` en `.dk-shell`. `PlayerStage` es `flex: 1; min-height: 0` y no declara otro `100dvh`.
- Scroll: solo `.dk-stage__body`. El stage tiene `overflow: hidden`.
- Selección: estado local de `DiagnosticPlayer`, pasado a `QuestionCard`. Una escala guarda el id de la opción. Una excepción cambia el tipo de selección.
- Guardado: `DiagnosticPlayer.handleSubmit` llama a la API con `selectionToPayload` y `expectedRevision`. Mientras tanto el botón dice «Guardando…» y queda deshabilitado. No hay un estado persistente «Guardado» en la pantalla siguiente.
- Avance: si la API devuelve otra pregunta, se reemplaza el estado. Si es el inicio de módulo, se muestra la introducción. Si es el cierre, se navega a `/diagnostico/outro/...`. «Comenzar» en la introducción no guarda: solo pasa de `module_intro` a `question`.

Botón, radio y desplegable que esta pantalla usa de verdad:

- Botón principal: `<button class="ag-btn-cta">` dentro de `.dk-shell`. No es un componente React aparte.
- «Anterior»: `<button class="dk-back-btn">` en la misma fila de la barra.
- Radio de la escala: `<button role="radio">` en `ScaleOptions`. No usa `<input type="radio">`.
- Excepciones: `<details class="dk-exceptions">` nativo.

## 2. Código actual

Los archivos cortos van enteros. `QuestionCard.tsx` y `globals.css` van en parte, y el ZIP trae los archivos citados.

### `apps/web/app/diagnostico/layout.tsx`
```tsx
import type { ReactNode } from 'react';
import { DiagnosticAccessGate } from '@/components/diagnostico/DiagnosticAccessGate';
import { buildPageMetadata } from '@/lib/seo';

export const metadata = buildPageMetadata({
  title: 'Diagnóstico',
  description: 'Diagnóstico Maestro MK. Disponible para cuentas autenticadas.',
  path: '/diagnostico',
  noIndex: true,
});

/** Full-screen cinematic shell — no public nav, no footer. */
export default function DiagnosticoLayout({ children }: { children: ReactNode }) {
  return (
    <div
      className="dk-shell"
      style={{
        height: '100dvh',
        minHeight: '100dvh',
        background: 'var(--color-obsidian)',
        color: 'var(--color-text)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      <DiagnosticAccessGate>{children}</DiagnosticAccessGate>
    </div>
  );
}
```

### `apps/web/app/diagnostico/modulo/[moduleSlug]/pregunta/page.tsx`
```tsx
import { DiagnosticPlayer } from '@/components/diagnostico/DiagnosticPlayer';

export default function PreguntaPage() {
  return <DiagnosticPlayer />;
}
```

### `apps/web/app/diagnostico/bienvenida/page.tsx`
```tsx
import { DiagnosticWelcome } from '@/components/diagnostico/DiagnosticWelcome';

export default function BienvenidaPage() {
  return <DiagnosticWelcome />;
}
```

### `apps/web/app/diagnostico/outro/[moduleSlug]/page.tsx`
```tsx
import { ModuleOutro } from '@/components/diagnostico/ModuleOutro';

export default function OutroPage() {
  return <ModuleOutro />;
}
```

### `apps/web/components/diagnostico/PlayerStage.tsx`
```tsx
'use client';

import type { ReactNode, Ref } from 'react';

type Action = {
  label: string;
  onClick: () => void;
  disabled?: boolean;
};

type Props = {
  header: ReactNode;
  children: ReactNode;
  primary: Action;
  back?: Action | null;
  /** Shown when the primary action is blocked. The slot keeps its height either way. */
  hint?: string | null;
  bodyRef?: Ref<HTMLDivElement>;
};

/** Header, scrolling body, stable bottom bar. Screens do not place their own button. */
export function PlayerStage({ header, children, primary, back, hint, bodyRef }: Props) {
  return (
    <main className="dk-stage">
      <div className="dk-stage__header">{header}</div>
      <div className="dk-stage__body" ref={bodyRef}>
        {children}
      </div>
      <div className="dk-stage__nav">
        <p className="dk-stage__hint" id="dk-continue-hint">{hint ?? ''}</p>
        <div className="dk-stage__nav-row">
          {back ? (
            <button
              type="button"
              className="dk-back-btn"
              onClick={back.onClick}
              disabled={back.disabled}
            >
              {back.label}
            </button>
          ) : null}
          <button
            type="button"
            className="ag-btn-cta"
            onClick={primary.onClick}
            disabled={primary.disabled}
            aria-describedby={hint ? 'dk-continue-hint' : undefined}
          >
            {primary.label}
          </button>
        </div>
      </div>
    </main>
  );
}
```

### `apps/web/components/diagnostico/ProgressRail.tsx`
```tsx
'use client';

import { useEffect, useRef, useState } from 'react';

type Props = {
  pct: number;
  questionIndex?: number | null;
  questionTotal?: number | null;
  moduleTitle?: string | null;
  /** Short name of this pass, shown with the exit action. */
  contextLabel?: string | null;
  /** default = in-question; outro = module just finished */
  variant?: 'default' | 'outro';
  exitLabel?: string | null;
  exitDisabled?: boolean;
  onExit?: () => void;
  /** Replaces the percent on screens that already state their own context, such as a module intro. */
  aside?: string | null;
};

export function ProgressRail({
  pct,
  questionIndex,
  questionTotal,
  moduleTitle,
  contextLabel,
  variant = 'default',
  exitLabel,
  exitDisabled,
  onExit,
  aside,
}: Props) {
  const displayPct = Math.min(100, Math.max(0, Math.round(pct)));
  const isOutro = variant === 'outro';
  const hasCounter = questionIndex != null && questionTotal != null && questionTotal > 0;
  const prevPctRef = useRef(displayPct);
  const [pulse, setPulse] = useState(false);

  useEffect(() => {
    if (displayPct > prevPctRef.current) {
      setPulse(true);
      prevPctRef.current = displayPct;
      const timer = window.setTimeout(() => setPulse(false), 650);
      return () => window.clearTimeout(timer);
    }
    prevPctRef.current = displayPct;
  }, [displayPct]);

  const statusLabel = aside
    ? aside
    : isOutro
      ? 'Completo'
      : hasCounter
        ? `Pregunta ${questionIndex} de ${questionTotal}`
        : `${displayPct}%`;
  const showPercent = Boolean(aside || isOutro || hasCounter);

  return (
    <div
      className={`dk-progress-rail${isOutro ? ' dk-progress-rail--complete' : ''}`}
      role="progressbar"
      aria-valuenow={displayPct}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={`Diagnóstico ${displayPct}% completado`}
    >
      {(contextLabel || (exitLabel && onExit)) && (
        <div className="dk-rail-top">
          {contextLabel ? <p className="dk-rail-context">{contextLabel}</p> : <span />}
          {exitLabel && onExit ? (
            <button
              type="button"
              className="dk-exit-link"
              onClick={onExit}
              disabled={exitDisabled}
            >
              {exitLabel}
            </button>
          ) : null}
        </div>
      )}
      <div className="dk-rail-info">
        <span className="dk-rail-module-name">
          {moduleTitle ?? 'Diagnóstico'}
        </span>
        <span className={`dk-rail-counter${isOutro ? ' dk-rail-counter--done' : ''}`}>
          {statusLabel}
        </span>
      </div>

      <div className="dk-rail-track">
        <div
          className={`dk-rail-fill${pulse ? ' dk-rail-fill--pulse' : ''}`}
          style={{ width: `${displayPct}%` }}
        />
      </div>
      {showPercent ? <p className="dk-rail-pct">{displayPct}%</p> : null}
    </div>
  );
}
```

### `apps/web/components/diagnostico/DiagnosticPlayer.tsx`
```tsx
'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useAuthSession } from '@/components/auth-session-provider';
import {
  apiDiagnosticState,
  apiDiagnosticSubmitResponse,
  type DiagnosticState,
} from '@/lib/api';
import { getAccessToken } from '@/lib/auth-storage';
import { AppIcon } from '@/components/app-icon';
import { ReviewVersionNote } from '@/components/app-shell/ReviewVersionNote';
import {
  buildInitialSelection,
  continueHint,
  isSelectionValid,
  QuestionCard,
  selectionToPayload,
} from './QuestionCard';
import { moduleIntroIcon } from './module-intro-icon';
import { ProgressRail } from './ProgressRail';
import { PlayerStage } from './PlayerStage';
import { DiagnosticBlackout } from './DiagnosticBlackout';
import { stashOutroBootstrap } from '@/lib/diagnostic-outro-bootstrap';
import {
  introIconItem,
  introStaggerContainer,
  introStaggerItem,
  moduleIntroVariants,
  questionScreenVariants,
} from './diagnostic-motion';

type PlayerStatus = 'loading' | 'module_intro' | 'question' | 'error';

type HistoryEntry = {
  state: DiagnosticState;
  selection: ReturnType<typeof buildInitialSelection>;
};

export function DiagnosticPlayer() {
  const router = useRouter();
  const { status } = useAuthSession();
  const reduced = useReducedMotion();
  const [playerStatus, setPlayerStatus] = useState<PlayerStatus>('loading');
  const [state, setState] = useState<DiagnosticState | null>(null);
  const [selection, setSelection] = useState<ReturnType<typeof buildInitialSelection> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [blackout, setBlackout] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const shownAtRef = useRef<number>(Date.now());
  const historyRef = useRef<HistoryEntry[]>([]);
  const stateRef = useRef(state);
  const scrollRef = useRef<HTMLDivElement>(null);
  stateRef.current = state;

  useEffect(() => {
    if (status === 'guest') {
      router.replace('/login');
      return;
    }

    const token = getAccessToken();
    if (status === 'loading' && !token) return;
    if (!token) {
      router.replace('/login');
      return;
    }

    let cancelled = false;

    apiDiagnosticState(token)
      .then((s) => {
        if (cancelled) return;
        if (s.sessionState.showWelcomeScreen) {
          router.replace('/diagnostico/bienvenida');
          return;
        }
        applyState(s);
      })
      .catch(() => {
        if (cancelled) return;
        setError('No se pudo cargar el cuestionario.');
        setPlayerStatus('error');
      });

    return () => {
      cancelled = true;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  function applyState(s: DiagnosticState, skipIntro = false, pushHistory = false) {
    if (s.sessionState.showWelcomeScreen) {
      router.replace('/diagnostico/bienvenida');
      return;
    }
    if (pushHistory && state?.nextStep.type === 'question' && selection) {
      historyRef.current = [...historyRef.current, { state, selection }];
    }
    setState(s);
    if (s.nextStep.type === 'question') {
      if (s.sessionState.isModuleStart && !skipIntro) {
        setPlayerStatus('module_intro');
      } else {
        setSelection(buildInitialSelection(s.nextStep.data));
        setPlayerStatus('question');
        shownAtRef.current = Date.now();
      }
    } else if (s.nextStep.type === 'module_outro') {
      stashOutroBootstrap(s);
      router.replace(`/diagnostico/outro/${s.nextStep.data.moduleSlug}`);
    } else if (s.nextStep.type === 'diagnostic_complete') {
      router.replace('/diagnostico/resultado');
    }
  }

  function navigateToOutro(next: DiagnosticState) {
    if (next.nextStep.type !== 'module_outro') return;
    stashOutroBootstrap(next);
    if (reduced) {
      router.replace(`/diagnostico/outro/${next.nextStep.data.moduleSlug}`);
      return;
    }
    setBlackout(true);
    const slug = next.nextStep.data.moduleSlug;
    window.setTimeout(() => {
      router.replace(`/diagnostico/outro/${slug}`);
    }, 380);
  }

  function handleGoBack() {
    const prev = historyRef.current.at(-1);
    if (!prev) return;
    historyRef.current = historyRef.current.slice(0, -1);
    setState(prev.state);
    setSelection(prev.selection);
    setPlayerStatus('question');
    shownAtRef.current = Date.now();
  }

  async function handleSubmit() {
    if (!state || !selection || isSubmitting) return;
    if (state.nextStep.type !== 'question') return;
    if (!isSelectionValid(state.nextStep.data, selection)) return;

    const token = getAccessToken();
    if (!token) return;

    const submittedId = state.nextStep.data.id;
    setIsSubmitting(true);
    setError(null);

    try {
      const next = await apiDiagnosticSubmitResponse(token, {
        questionId: submittedId,
        ...selectionToPayload(selection),
        expectedRevision: state.nextStep.data.answerRevision ?? 0,
        latencyMs: Date.now() - shownAtRef.current,
      });

      const current = stateRef.current;
      const stillHere = current?.nextStep.type === 'question' && current.nextStep.data.id === submittedId;
      if (!stillHere) return;

      if (next.nextStep.type === 'module_outro') {
        navigateToOutro(next);
        return;
      }

      applyState(next, false, true);
    } catch (err) {
      const status = (err as { status?: number }).status;
      const current = stateRef.current;
      const stillHere = current?.nextStep.type === 'question' && current.nextStep.data.id === submittedId;
      if (!stillHere) {
        // A late failure belongs to the earlier question. It must not replace the one on screen.
        setError('No se pudo guardar la respuesta anterior. Vuelve a ella para reintentar.');
        return;
      }
      setError(status === 409
        ? 'Otra sesión escribió después. Recarga el cuestionario antes de guardar.'
        : 'No se pudo guardar. El texto sigue aquí. Puedes reintentar.');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleSaveAndExit() {
    if (isSubmitting) return;
    const question = state?.nextStep.type === 'question' ? state.nextStep.data : null;
    const hasPendingAnswer =
      playerStatus === 'question' &&
      question !== null &&
      selection !== null &&
      isSelectionValid(question, selection);

    if (!hasPendingAnswer) {
      router.push('/panel');
      return;
    }

    setIsSubmitting(true);
    setIsExiting(true);
    setError(null);
    try {
      const token = getAccessToken();
      if (!token) throw new Error('missing_token');
      await apiDiagnosticSubmitResponse(token, {
        questionId: question.id,
        ...selectionToPayload(selection),
        expectedRevision: question.answerRevision ?? 0,
        latencyMs: Date.now() - shownAtRef.current,
      });
      router.push('/panel');
    } catch {
      setError('No pudimos guardar tu respuesta. Revisa tu conexión e intenta de nuevo.');
      setIsExiting(false);
      setIsSubmitting(false);
    }
  }

  function handleStartModule() {
    if (!state || state.nextStep.type !== 'question') return;
    setSelection(buildInitialSelection(state.nextStep.data));
    setPlayerStatus('question');
    shownAtRef.current = Date.now();
  }

  const currentQuestion =
    state?.nextStep.type === 'question' ? state.nextStep.data : null;
  const isValid =
    currentQuestion && selection ? isSelectionValid(currentQuestion, selection) : false;
  const ss = state?.sessionState;
  const canGoBack = historyRef.current.length > 0;
  const introKey = ss?.currentModuleSlug ?? 'intro';

  useEffect(() => {
    if (playerStatus !== 'question' || !currentQuestion) return;
    const scroller = scrollRef.current;
    if (scroller && typeof scroller.scrollTo === 'function') scroller.scrollTo({ top: 0 });
    document.getElementById('dk-question-title')?.focus();
  }, [playerStatus, currentQuestion?.id]);

  if (playerStatus === 'loading') {
    return (
      <main className="dk-player-shell">
        <div className="dk-player-center">
          <div className="auth-loading"><span className="auth-spinner" aria-hidden /></div>
        </div>
      </main>
    );
  }

  if (playerStatus === 'error' || !state || !ss) {
    return (
      <PlayerStage
        header={null}
        primary={{ label: 'Volver al inicio', onClick: () => router.push('/diagnostico') }}
      >
        <p className="dk-player-error" role="alert">{error ?? 'Ocurrió un error inesperado.'}</p>
      </PlayerStage>
    );
  }

  const onIntro = playerStatus === 'module_intro';
  const introStep =
    onIntro && ss.currentModuleOrder != null && ss.totalModules > 0
      ? `Módulo ${ss.currentModuleOrder} de ${ss.totalModules}`
      : null;
  const introMinutes =
    onIntro && ss.currentModuleEstimatedMinutes != null && ss.currentModuleEstimatedMinutes > 0
      ? ss.currentModuleEstimatedMinutes === 1
        ? '1 minuto'
        : `${ss.currentModuleEstimatedMinutes} minutos`
      : null;
  const introIcon = onIntro ? moduleIntroIcon(ss.currentModuleSlug, ss.currentModuleIcon) : null;

  const asking = playerStatus === 'question' && currentQuestion != null && selection != null;
  const primaryLabel = onIntro
    ? 'Comenzar'
    : isSubmitting && !isExiting
      ? 'Guardando…'
      : 'Continuar';

  return (
    <>
      <DiagnosticBlackout visible={blackout} />
      <PlayerStage
        bodyRef={scrollRef}
        hint={asking && !isValid ? continueHint(currentQuestion) : null}
        back={asking && canGoBack ? { label: 'Anterior', onClick: handleGoBack, disabled: isExiting } : null}
        primary={{
          label: primaryLabel,
          onClick: onIntro ? handleStartModule : handleSubmit,
          disabled: onIntro ? false : !isValid || isSubmitting,
        }}
        header={(
          <ProgressRail
            pct={ss.completionPct}
            questionIndex={playerStatus === 'question' ? ss.currentQuestionIndex : undefined}
            questionTotal={playerStatus === 'question' ? ss.moduleQuestionCount : undefined}
            moduleTitle={introStep ?? ss.currentModuleTitle}
            contextLabel="Auditoría inicial"
            aside={introMinutes}
            exitLabel={playerStatus === 'question' ? (isExiting ? 'Guardando…' : 'Guardar y salir') : null}
            exitDisabled={isSubmitting}
            onExit={playerStatus === 'question' ? handleSaveAndExit : undefined}
          />
        )}
      >
        <AnimatePresence mode="wait">
          {playerStatus === 'module_intro' && (
            <motion.div
              key={`intro-${introKey}`}
              className="dk-intro-body"
              variants={reduced ? undefined : moduleIntroVariants}
              initial={reduced ? false : 'initial'}
              animate={reduced ? undefined : 'animate'}
              exit={reduced ? undefined : 'exit'}
            >
              <motion.div
                variants={reduced ? undefined : introStaggerContainer}
                initial={reduced ? false : 'hidden'}
                animate={reduced ? undefined : 'show'}
              >
                {!introStep && ss.currentModuleOrder != null && ss.totalModules > 0 && (
                  <motion.p className="dk-intro-meta" variants={reduced ? undefined : introStaggerItem}>
                    Módulo {ss.currentModuleOrder} de {ss.totalModules}
                  </motion.p>
                )}
                {introIcon ? (
                  <motion.div
                    className="dk-module-icon-wrap"
                    variants={reduced ? undefined : introIconItem}
                  >
                    <AppIcon name={introIcon} size={28} />
                  </motion.div>
                ) : null}
                <motion.h1 className="dk-intro-title" variants={reduced ? undefined : introStaggerItem}>
                  {ss.currentModuleTitle}
                </motion.h1>
                {ss.currentModuleIntro ? (
                  <motion.p className="dk-intro-text" variants={reduced ? undefined : introStaggerItem}>
                    {ss.currentModuleIntro}
                  </motion.p>
                ) : null}
                {!introMinutes && ss.currentModuleEstimatedMinutes != null && ss.currentModuleEstimatedMinutes > 0 && (
                  <motion.p className="dk-intro-duration" variants={reduced ? undefined : introStaggerItem}>
                    {ss.currentModuleEstimatedMinutes === 1
                      ? '1 minuto'
                      : `${ss.currentModuleEstimatedMinutes} minutos`}
                  </motion.p>
                )}
                <ReviewVersionNote />
              </motion.div>
            </motion.div>
          )}

          {asking && (
            <motion.div
              key={currentQuestion.id}
              variants={reduced ? undefined : questionScreenVariants}
              initial={reduced ? false : 'initial'}
              animate={reduced ? undefined : 'animate'}
              exit={reduced ? undefined : 'exit'}
            >
              <QuestionCard
                question={currentQuestion}
                selection={selection}
                onChange={setSelection}
              />
            </motion.div>
          )}
        </AnimatePresence>
        {error ? <p className="dk-player-error" role="alert">{error}</p> : null}
      </PlayerStage>
    </>
  );
}
```

### `apps/web/components/diagnostico/DiagnosticWelcome.tsx`
```tsx
'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { useAuthSession } from '@/components/auth-session-provider';
import { ReviewVersionNote } from '@/components/app-shell/ReviewVersionNote';
import {
  apiDiagnosticStart,
  apiDiagnosticState,
  apiDiagnosticWelcomeSeen,
  type DiagnosticState,
} from '@/lib/api';
import { getAccessToken } from '@/lib/auth-storage';
import { ProgressRail } from './ProgressRail';
import { PlayerStage } from './PlayerStage';
import { introStaggerContainer, introStaggerItem } from './diagnostic-motion';

function routeFromState(state: DiagnosticState, router: ReturnType<typeof useRouter>) {
  const { nextStep, sessionState } = state;

  if (nextStep.type === 'question' && sessionState.currentModuleSlug) {
    router.push(`/diagnostico/modulo/${sessionState.currentModuleSlug}/pregunta`);
    return;
  }
  if (nextStep.type === 'module_outro') {
    router.push(`/diagnostico/outro/${nextStep.data.moduleSlug}`);
    return;
  }
  if (nextStep.type === 'diagnostic_complete') {
    router.push('/diagnostico/resultado');
  }
}

export function DiagnosticWelcome() {
  const router = useRouter();
  const { status, refresh } = useAuthSession();
  const reduced = useReducedMotion();
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status !== 'authenticated') return;
    const token = getAccessToken();
    if (!token) {
      setReady(true);
      return;
    }

    apiDiagnosticState(token)
      .then((state) => {
        if (!state.sessionState.showWelcomeScreen) {
          routeFromState(state, router);
          return;
        }
        setReady(true);
      })
      .catch(() => setReady(true));
  }, [status, router]);

  async function handleStart() {
    const token = getAccessToken();
    if (!token || status === 'guest') {
      router.push('/login');
      return;
    }
    if (loading) return;

    setLoading(true);
    setError(null);
    try {
      await apiDiagnosticWelcomeSeen(token);
      await refresh({ force: true });
      const state = await apiDiagnosticStart(token);
      routeFromState(state, router);
    } catch (err) {
      setError(
        err instanceof Error && err.message
          ? err.message
          : 'No se pudo iniciar el diagnóstico. Intenta de nuevo en unos segundos.',
      );
      setLoading(false);
    }
  }

  return (
    <PlayerStage
      header={<ProgressRail pct={0} questionIndex={null} questionTotal={null} contextLabel="Auditoría inicial" />}
      primary={{
        label: loading ? 'Preparando…' : 'Comenzar auditoría',
        onClick: handleStart,
        disabled: !ready || loading,
      }}
    >
      {!ready ? (
        <div className="dk-welcome--loading">
          <div className="auth-loading">
            <span className="auth-spinner" aria-hidden />
          </div>
        </div>
      ) : (
        <motion.div
          className="dk-welcome"
          variants={reduced ? undefined : introStaggerContainer}
          initial={reduced ? false : 'hidden'}
          animate={reduced ? undefined : 'show'}
        >
          <motion.h1 className="dk-welcome__title" variants={reduced ? undefined : introStaggerItem}>
            El punto de partida
          </motion.h1>
          <motion.div className="dk-welcome__objective" variants={reduced ? undefined : introStaggerItem}>
            <p>Empieza por mirar cómo estás hoy. Estas preguntas te ayudarán a revisar tus decisiones, tus hábitos y tu entorno para reconocer qué está funcionando y qué necesita atención.</p>
            <p>Responde según tu situación actual, aunque sea distinta de la que te gustaría tener.</p>
            <p>Puedes guardar y salir. Al volver, continúas desde la última respuesta guardada.</p>
          </motion.div>
          <ReviewVersionNote />
          {error ? <p className="dk-player-error" role="alert">{error}</p> : null}
        </motion.div>
      )}
    </PlayerStage>
  );
}
```

### `apps/web/components/diagnostico/ModuleOutro.tsx`
```tsx
'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { useAuthSession } from '@/components/auth-session-provider';
import {
  apiDiagnosticOutroSeen,
  apiDiagnosticState,
  type DiagnosticState,
} from '@/lib/api';
import { getAccessToken } from '@/lib/auth-storage';
import {
  clearOutroBootstrap,
  readOutroBootstrap,
} from '@/lib/diagnostic-outro-bootstrap';
import { ProgressRail } from './ProgressRail';
import { PlayerStage } from './PlayerStage';
import {
  outroBodyVariants,
  outroStaggerContainer,
  outroStaggerItem,
} from './diagnostic-motion';

function hasOutroContent(state: DiagnosticState | null): boolean {
  return state?.nextStep.type === 'module_outro';
}

export function ModuleOutro() {
  const router = useRouter();
  const params = useParams<{ moduleSlug: string }>();
  const { status, refresh } = useAuthSession();
  const reduced = useReducedMotion();
  const [state, setState] = useState<DiagnosticState | null>(() => readOutroBootstrap());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status !== 'authenticated') return;
    const token = getAccessToken();
    if (!token) return;

    apiDiagnosticState(token)
      .then((s) => {
        setState(s);
        clearOutroBootstrap();
      })
      .catch(() => {});
  }, [status]);

  async function handleContinue() {
    const token = getAccessToken();
    if (!token || !params.moduleSlug) return;
    setLoading(true);
    setError(null);
    try {
      await apiDiagnosticOutroSeen(token, params.moduleSlug);
      const next = await apiDiagnosticState(token);
      if (next.nextStep.type === 'question' && next.sessionState.currentModuleSlug) {
        router.push(`/diagnostico/modulo/${next.sessionState.currentModuleSlug}/pregunta`);
      } else if (next.nextStep.type === 'diagnostic_complete') {
        await refresh({ force: true });
        router.push('/diagnostico/resultado');
      } else {
        throw new Error('unexpected_step');
      }
    } catch {
      setError('No pudimos continuar. Revisa tu conexión e intenta de nuevo.');
      setLoading(false);
    }
  }

  const outro =
    state?.nextStep.type === 'module_outro' ? state.nextStep.data : null;
  const ss = state?.sessionState;
  const showContent = hasOutroContent(state);

  return (
    <PlayerStage
      header={(
        <ProgressRail
          pct={ss?.completionPct ?? 0}
          moduleTitle={ss?.currentModuleTitle ?? outro?.titleEs}
          contextLabel="Auditoría inicial"
          variant="outro"
        />
      )}
      primary={{
        label: loading ? 'Cargando…' : 'Continuar',
        onClick: handleContinue,
        disabled: !showContent || loading,
      }}
    >
      {showContent ? (
        <motion.div
          className="dk-outro-body"
          variants={reduced ? undefined : outroBodyVariants}
          initial={reduced ? false : 'initial'}
          animate={reduced ? undefined : 'animate'}
        >
          <motion.div
            variants={reduced ? undefined : outroStaggerContainer}
            initial={reduced ? false : 'hidden'}
            animate={reduced ? undefined : 'show'}
          >
            <motion.p className="dk-outro-eyebrow" variants={reduced ? undefined : outroStaggerItem}>
              Módulo completo
            </motion.p>

            {outro ? (
              <>
                <motion.h2 className="dk-outro-title" variants={reduced ? undefined : outroStaggerItem}>
                  {outro.titleEs}
                </motion.h2>
                <motion.p className="dk-outro-text" variants={reduced ? undefined : outroStaggerItem}>
                  {outro.outroText}
                </motion.p>
                {outro.readings && outro.readings.length > 0 && (
                  <motion.dl className="dk-outro-readings" variants={reduced ? undefined : outroStaggerItem}>
                    {outro.readings.map((line) => (
                      <div key={line.label} className="dk-outro-reading">
                        <dt>{line.label}</dt>
                        <dd>{line.detail}</dd>
                      </div>
                    ))}
                  </motion.dl>
                )}
              </>
            ) : (
              <motion.h2 className="dk-outro-title" variants={reduced ? undefined : outroStaggerItem}>
                Módulo completado.
              </motion.h2>
            )}
            {error ? <p className="dk-player-error" role="alert">{error}</p> : null}
          </motion.div>
        </motion.div>
      ) : (
        <div className="dk-outro-body dk-outro-body--loading" aria-hidden>
          <div className="dk-outro-skeleton dk-outro-skeleton--title" />
          <div className="dk-outro-skeleton dk-outro-skeleton--text" />
          <div className="dk-outro-skeleton dk-outro-skeleton--metric" />
        </div>
      )}
    </PlayerStage>
  );
}
```

### `apps/web/components/diagnostico/options/ScaleOptions.tsx`
```tsx
'use client';

import { useRef, type KeyboardEvent } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import type { AnswerOptionDto } from '@/lib/api';
import { isBareScaleLabel, resolveScaleLabel } from '@/lib/scale-labels';
import type { ScalePrompt } from '@/lib/scale-prompts';
import { optionListContainer, optionListItem } from '../diagnostic-motion';

type Props = {
  options: AnswerOptionDto[];
  selected: string | null;
  onSelect: (id: string) => void;
  scaleType?: 'BEHAVIORAL' | 'FREQUENCY' | null;
  prompt?: ScalePrompt | null;
};

/** The printed label of the point, else its catalog label, else the printed anchor for 1 and 5. Points 2 to 4 without a label get none. */
function captionFor(opt: AnswerOptionDto, prompt: ScalePrompt | null | undefined, ends: { low: string; high: string }): string | null {
  const printed = prompt?.points?.[opt.order];
  if (printed) return printed;
  if (!isBareScaleLabel(opt.textEs, opt.order)) return resolveScaleLabel(opt, null, ends);
  if (opt.order === 1 && prompt?.low) return prompt.low;
  if (opt.order === 5 && prompt?.high) return prompt.high;
  return null;
}

function radioName(order: number, caption: string | null): string {
  return caption ? `${order}. ${caption}` : String(order);
}

export function ScaleOptions({ options, selected, onSelect, prompt }: Props) {
  const reduced = useReducedMotion();
  const refs = useRef<Array<HTMLButtonElement | null>>([]);
  const sorted = [...options].sort((a, b) => a.order - b.order);
  const last = sorted.length - 1;
  const ends = { low: sorted[0]?.textEs ?? '', high: sorted[last]?.textEs ?? '' };
  const captions = sorted.map((opt) => captionFor(opt, prompt, ends));
  const tabStop = Math.max(0, sorted.findIndex((opt) => opt.id === selected));
  // A label on 2, 3 or 4 means each point needs its own row. Otherwise the five points
  // sit on one row, in the thumb zone, and only the printed ends carry a sentence.
  const labeled = captions.some((caption, index) => caption !== null && index > 0 && index < last);

  function choose(index: number) {
    const opt = sorted[index];
    if (!opt) return;
    onSelect(opt.id);
    refs.current[index]?.focus();
  }

  // Radio group keyboard model: arrows and Home/End move and select, one tab stop for the group.
  function onKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    if (event.key === 'ArrowDown' || event.key === 'ArrowRight') {
      event.preventDefault();
      choose((index + 1) % sorted.length);
    } else if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') {
      event.preventDefault();
      choose((index - 1 + sorted.length) % sorted.length);
    } else if (event.key === 'Home') {
      event.preventDefault();
      choose(0);
    } else if (event.key === 'End') {
      event.preventDefault();
      choose(last);
    }
  }

  if (!labeled) {
    return (
      <div className="dk-scale-thumb">
        <div className="dk-scale-anchors">
          {captions[0] ? (
            <p className="dk-scale-anchor">
              <span className="dk-scale-anchor__n">{sorted[0]?.order}</span>
              <span>{captions[0]}</span>
            </p>
          ) : null}
          {captions[last] ? (
            <p className="dk-scale-anchor">
              <span className="dk-scale-anchor__n">{sorted[last]?.order}</span>
              <span>{captions[last]}</span>
            </p>
          ) : null}
        </div>
        <div className="dk-scale-thumb__row" role="radiogroup" aria-label="Escala de respuesta">
          {sorted.map((opt, index) => {
            const isSelected = selected === opt.id;
            return (
              <button
                key={opt.id}
                ref={(el) => {
                  refs.current[index] = el;
                }}
                type="button"
                role="radio"
                aria-checked={isSelected}
                aria-label={radioName(opt.order, captions[index])}
                tabIndex={index === tabStop ? 0 : -1}
                onKeyDown={(event) => onKeyDown(event, index)}
                onClick={() => onSelect(opt.id)}
                className={`dk-scale-key${isSelected ? ' is-selected' : ''}`}
              >
                {opt.order}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <motion.div
      className="dk-scale-options"
      role="radiogroup"
      aria-label="Escala de respuesta"
      variants={reduced ? undefined : optionListContainer}
      initial={reduced ? false : 'hidden'}
      animate={reduced ? undefined : 'show'}
    >
      {sorted.map((opt, index) => {
        const isSelected = selected === opt.id;
        const caption = captions[index];
        return (
          <motion.button
            key={opt.id}
            ref={(el: HTMLButtonElement | null) => {
              refs.current[index] = el;
            }}
            type="button"
            role="radio"
            aria-checked={isSelected}
            aria-label={radioName(opt.order, caption)}
            tabIndex={index === tabStop ? 0 : -1}
            onKeyDown={(event: KeyboardEvent<HTMLButtonElement>) => onKeyDown(event, index)}
            onClick={() => onSelect(opt.id)}
            variants={reduced ? undefined : optionListItem}
            className={`dk-scale-row${isSelected ? ' is-selected' : ''}${caption ? '' : ' dk-scale-row--bare'}`}
          >
            <span className="dk-scale-number">{opt.order}</span>
            <span className="dk-scale-label">{caption}</span>
            <span className="dk-scale-radio" aria-hidden />
          </motion.button>
        );
      })}
    </motion.div>
  );
}
```

### `apps/web/components/diagnostico/module-intro-icon.ts`
```tsx
import type { AppIconName } from '@/components/icons/registry';
import { resolveIconName } from '@/components/icons/registry';

/** Presentation mark for each section intro. The stored icon is the same for every module. */
const MODULE_INTRO_ICONS: Record<string, AppIconName> = {
  'e-aud-s1': 'brain',
  'e-aud-s2': 'activity',
  'e-aud-s3': 'compass',
  'e-aud-s4': 'wallet',
  'e-aud-s5': 'handshake',
  'e-aud-s6': 'flame',
  'f-rad-001-s1': 'muscles',
  'f-rad-001-s2': 'stethoscope',
  'f-rad-001-s3': 'heart-pulse',
  'f-rad-001-s4': 'dumbbell',
  'f-rad-001-s5': 'moon',
  'f-rad-001-s6': 'scan-eye',
  'f-rad-001-s7': 'activity',
  'f-rad-002-s1': 'heart',
  'f-rad-002-s2': 'users',
  'f-rad-002-s3': 'handshake',
  'f-rad-002-s4': 'briefcase',
  'f-rad-003-s1': 'wallet',
  'f-rad-003-s2': 'coins',
  'f-rad-003-s3': 'target',
  'f-rad-003-s4': 'lock',
  'f-rad-003-proy': 'building-2',
  'e-per-origen': 'anchor',
  'e-per-vision': 'eye',
  'e-per-valores': 'shield',
  'e-per-estandares': 'target',
  'e-per-identidad': 'fingerprint',
  'e-per-dificultades': 'sword',
  'e-per-personalidad': 'brain',
  'e-per-ikigai': 'ikigai',
  'e-per-huella': 'laurel-wreath',
};

export function moduleIntroIcon(slug: string | null | undefined, stored: string | null | undefined): AppIconName | null {
  if (slug && MODULE_INTRO_ICONS[slug]) return MODULE_INTRO_ICONS[slug];
  if (stored) return resolveIconName(stored) ?? null;
  return null;
}
```

### `apps/web/components/diagnostico/DiagnosticAccessGate.tsx`
```tsx
'use client';

import { useRouter } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';
import { useAuthSession } from '@/components/auth-session-provider';
import { canUseMemberProduct } from '@/lib/member-access';

/**
 * Navigation only. The API guard is what enforces access, so typing a
 * /diagnostico URL cannot bypass it.
 */
export function DiagnosticAccessGate({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { status, user } = useAuthSession();
  const allowed = status === 'authenticated' && canUseMemberProduct(user);

  useEffect(() => {
    if (status === 'guest') {
      router.replace('/login');
    } else if (status === 'authenticated' && user && !canUseMemberProduct(user)) {
      router.replace('/panel');
    }
  }, [status, user, router]);

  if (!allowed) {
    return (
      <main style={{ display: 'flex', flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <div className="auth-loading">
          <span className="auth-spinner" aria-hidden />
        </div>
      </main>
    );
  }

  return <>{children}</>;
}
```

### `apps/web/components/app-icon.tsx`
```tsx
import type { SVGProps } from 'react';

import { cn } from '@/lib/cn';
import { ICON_REGISTRY, resolveIconName, type AppIconName } from '@/components/icons/registry';

export interface AppIconProps extends Omit<SVGProps<SVGSVGElement>, 'width' | 'height'> {
  /** Icons0 icon id, e.g. `arrow-right` or `lucide:arrow-right`. */
  name: AppIconName | `lucide:${AppIconName}` | 'lucide:check-circle' | 'lucide:x-circle' | string;
  size?: number;
}

export function AppIcon({
  name,
  size = 20,
  className,
  style,
  'aria-hidden': ariaHidden = true,
  ...rest
}: AppIconProps) {
  const key = resolveIconName(name);
  if (!key) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn(`[AppIcon] Unknown icon: ${name}`);
    }
    return null;
  }

  const IconComponent = ICON_REGISTRY[key];

  return (
    <IconComponent
      className={cn('shrink-0', className)}
      style={{ width: size, height: size, ...style }}
      aria-hidden={ariaHidden}
      {...rest}
    />
  );
}
```

### `apps/web/components/diagnostico/QuestionCard.tsx` líneas 1-260 y 420-455 de 628

Parcial. Falta el resto de campos libres (medidas, horas, ikigai, actividad). La escala, las excepciones, la validez y el texto de «no se puede continuar» están aquí.

### `apps/web/components/diagnostico/QuestionCard.tsx líneas 1-260 de 628`
```tsx
'use client';

import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import type { LineField, MeasureField, QuestionDto } from '@/lib/api';
import { ArchetypeChoices, isArchetypeChoice } from './options/ArchetypeChoices';
import { optionListItem, reasonBoxVariants } from './diagnostic-motion';
import { FreeTextOption } from './options/FreeTextOption';
import { MultiChoiceOptions } from './options/MultiChoiceOptions';
import { ScaleOptions } from './options/ScaleOptions';
import { scalePromptFor } from '@/lib/scale-prompts';
import { SingleChoiceOptions } from './options/SingleChoiceOptions';

type SelectionState =
  | { type: 'single'; selected: string | null }
  | { type: 'multi'; selected: string[] }
  | { type: 'scale'; selected: string | null; selectedOrder: number | null; reason: string }
  | { type: 'text'; value: string }
  | { type: 'ranking'; order: string[] }
  | { type: 'exception'; kind: 'UNKNOWN' | 'NOT_APPLICABLE' | 'DECLINED' };

type Props = {
  question: QuestionDto;
  selection: SelectionState;
  onChange: (next: SelectionState) => void;
};

export function QuestionCard({ question, selection, onChange }: Props) {
  const reduced = useReducedMotion();
  const scalePrompt = question.type === 'SCALE_1_5' ? scalePromptFor(question.sourceRef) : null;
  const questionTitle = scalePrompt?.stem ?? question.textEs;

  const showReasonBox =
    question.type === 'SCALE_1_5' &&
    question.reasonThreshold != null &&
    question.reasonPromptEs != null &&
    selection.type === 'scale' &&
    selection.selectedOrder != null &&
    selection.selectedOrder <= question.reasonThreshold;

  return (
    <div className="dk-question">
      <div className="dk-question__lead">
        {question.heading ? <p className="dk-question-context">{question.heading}</p> : null}
        <h2 id="dk-question-title" tabIndex={-1} className="dk-question-text">{questionTitle}</h2>
        {question.type === 'MULTI_CHOICE' &&
          question.maxSelections != null &&
          selection.type === 'multi' && (
            <p
              className="dk-multi-counter"
              aria-label={`${selection.selected.length} de ${question.maxSelections} seleccionadas`}
            >
              {selection.selected.length} de {question.maxSelections}
            </p>
          )}
      </div>

      <div className="dk-question__answers">
        {question.type === 'SINGLE_CHOICE' && selection.type === 'single' && isArchetypeChoice(question.options) && (
          <ArchetypeChoices
            options={question.options}
            selected={selection.selected}
            onSelect={(id) => onChange({ type: 'single', selected: id })}
          />
        )}

        {question.type === 'SINGLE_CHOICE' && selection.type === 'single' && !isArchetypeChoice(question.options) && (
          <SingleChoiceOptions
            options={question.options}
            selected={selection.selected}
            onSelect={(id) => onChange({ type: 'single', selected: id })}
          />
        )}

        {question.type === 'MULTI_CHOICE' && selection.type === 'multi' && (
          <MultiChoiceOptions
            options={question.options}
            selected={selection.selected}
            maxSelections={question.maxSelections}
            onToggle={(id) => {
              const current = selection.selected;
              const next = current.includes(id)
                ? current.filter((s) => s !== id)
                : [...current, id];
              onChange({ type: 'multi', selected: next });
            }}
          />
        )}

        {question.type === 'SCALE_1_5' && selection.type === 'scale' && (
          <>
            <ScaleOptions
              options={question.options}
              selected={selection.selected}
              scaleType={question.scaleType}
              prompt={scalePrompt}
              onSelect={(id) => {
                const opt = question.options.find((o) => o.id === id);
                onChange({
                  type: 'scale',
                  selected: id,
                  selectedOrder: opt?.order ?? null,
                  reason: selection.reason,
                });
              }}
            />
            <AnimatePresence initial={false}>
              {showReasonBox && (
                <motion.div
                  key="reason"
                  className="dk-reason-box"
                  variants={reduced ? undefined : reasonBoxVariants}
                  initial={reduced ? false : 'hidden'}
                  animate={reduced ? undefined : 'visible'}
                  exit={reduced ? undefined : 'hidden'}
                  style={{ overflow: 'hidden' }}
                >
                  <label className="dk-reason-label" htmlFor="dk-reason-input">
                    {question.reasonPromptEs}
                  </label>
                  <textarea
                    id="dk-reason-input"
                    className="dk-reason-textarea"
                    value={selection.reason}
                    onChange={(e) =>
                      onChange({
                        ...selection,
                        reason: e.target.value,
                      })
                    }
                    maxLength={500}
                    rows={3}
                    placeholder="Escribe tu respuesta, si quieres."
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}

        {question.type === 'FREE_TEXT' && selection.type === 'text' && question.capture?.kind === 'measures' && (
          <MeasuresFields
            fields={question.capture.fields}
            value={selection.value}
            onChange={(value) => onChange({ type: 'text', value })}
          />
        )}

        {question.type === 'FREE_TEXT' && selection.type === 'text' && question.capture?.kind === 'lines' && (
          <LinesFields
            fields={question.capture.fields}
            value={selection.value}
            onChange={(value) => onChange({ type: 'text', value })}
          />
        )}

        {question.type === 'FREE_TEXT' && selection.type === 'text' && question.capture?.kind === 'hours' && (
          <HoursField
            min={question.capture.min}
            max={question.capture.max}
            value={selection.value}
            onChange={(value) => onChange({ type: 'text', value })}
          />
        )}

        {question.type === 'FREE_TEXT' && selection.type === 'text' && question.capture?.kind === 'number' && (
          <NumberField
            unit={question.capture.unit}
            min={question.capture.min}
            max={question.capture.max}
            value={selection.value}
            onChange={(value) => onChange({ type: 'text', value })}
          />
        )}

        {question.type === 'FREE_TEXT' && selection.type === 'text' && question.capture?.kind === 'activity' && (
          <ActivityField
            ambits={question.capture.ambits ?? []}
            value={selection.value}
            onChange={(value) => onChange({ type: 'text', value })}
          />
        )}

        {question.type === 'FREE_TEXT' && selection.type === 'text' && question.capture?.kind === 'ikigai' && (
          <IkigaiField
            others={question.capture.others}
            value={selection.value}
            onChange={(value) => onChange({ type: 'text', value })}
          />
        )}

        {question.type === 'FREE_TEXT' && selection.type === 'text' && !question.capture && (
          <motion.div
            variants={reduced ? undefined : optionListItem}
            initial={reduced ? false : 'hidden'}
            animate={reduced ? undefined : 'show'}
          >
            <FreeTextOption
              value={selection.value}
              onChange={(v) => onChange({ type: 'text', value: v })}
            />
          </motion.div>
        )}

        {selection.type !== 'exception' && (question.allowedExceptions?.length ?? 0) > 0 && (
          <details className="dk-exceptions">
            <summary>Si no puedes responderla ahora</summary>
            <div className="dk-exceptions__row">
              {question.allowedExceptions?.filter((kind) => kind !== 'PENDING').map((kind) => (
                <button
                  key={kind}
                  type="button"
                  className="dk-exception"
                  onClick={() => onChange({ type: 'exception', kind: kind as 'UNKNOWN' | 'NOT_APPLICABLE' | 'DECLINED' })}
                >
                  {EXCEPTION_LABELS[kind] ?? kind}
                </button>
              ))}
            </div>
          </details>
        )}
        {selection.type === 'exception' && (
          <div className="dk-exception-chosen" role="status">
            <p>Excepción elegida: {EXCEPTION_LABELS[selection.kind]}.</p>
            <button type="button" className="dk-exception" onClick={() => onChange(buildInitialSelection(question))}>
              Responder con un dato
            </button>
          </div>
        )}

        {question.type === 'RANKING' && (
          <motion.p
            className="font-body-sm"
            style={{ color: 'var(--color-text-muted)' }}
            variants={reduced ? undefined : optionListItem}
            initial={reduced ? false : 'hidden'}
            animate={reduced ? undefined : 'show'}
          >
            (Ranking: disponible en M1)
          </motion.p>
        )}
      </div>
    </div>
  );
}

/** Build initial selection state from question type */
export function buildInitialSelection(question: QuestionDto): SelectionState {
  switch (question.type) {
    case 'SINGLE_CHOICE':
      return { type: 'single', selected: null };
    case 'MULTI_CHOICE':
      return { type: 'multi', selected: [] };
    case 'SCALE_1_5':
      return { type: 'scale', selected: null, selectedOrder: null, reason: '' };
    case 'FREE_TEXT':
      return { type: 'text', value: '' };
    case 'RANKING':
      return { type: 'ranking', order: question.options.map((o) => o.id) };
  }
}
```

### `apps/web/components/diagnostico/QuestionCard.tsx líneas 420-455 de 628`
```tsx
/** Check if selection is valid to submit */
const EXCEPTION_LABELS: Record<string, string> = {
  UNKNOWN: 'No lo sé',
  NOT_APPLICABLE: 'No aplica',
  DECLINED: 'Prefiero no responder',
};

export function isSelectionValid(q: QuestionDto, sel: SelectionState): boolean {
  if (sel.type === 'exception') return true;
  if (sel.type === 'single') return sel.selected !== null;
  if (sel.type === 'scale') return sel.selected !== null;
  if (sel.type === 'multi') return sel.selected.length > 0;
  if (sel.type === 'text') return textAnswerReady(q, sel.value);
  if (sel.type === 'ranking') return sel.order.length > 0;
  return false;
}

/** Text shown next to a disabled Continuar: what is still missing. */
export function continueHint(q: QuestionDto): string {
  switch (q.type) {
    case 'MULTI_CHOICE':
      return 'Elige al menos una opción para continuar.';
    case 'FREE_TEXT':
      if (q.capture?.kind === 'measures') return 'Completa edad, altura y peso para continuar.';
      if (q.capture?.kind === 'lines') return 'Completa cada casilla para continuar.';
      if (q.capture?.kind === 'hours') return 'Indica las horas para continuar.';
      if (q.capture?.kind === 'number') return `Indica el número en ${q.capture.unit}, o elige una excepción.`;
      if (q.capture?.kind === 'activity') return 'Elige ámbito, desarrollo de idea y escribe tu respuesta. Si no tienes esta actividad, marca una excepción.';
      if (q.capture?.kind === 'ikigai') return 'Escribe la actividad. El cruce con otros campos es opcional.';
      return 'Escribe tu respuesta para continuar.';
    case 'RANKING':
      return 'Ordena las opciones para continuar.';
    default:
      return 'Elige una opción para continuar.';
  }
}
```

### `apps/web/app/layout.tsx` líneas 14-75 de 92

Parcial. Carga de fuentes y viewport. El resto es metadata y JSON-LD.

### `apps/web/app/layout.tsx líneas 14-75 de 92`
```tsx
const geist = localFont({
  src: './fonts/geist-latin.woff2',
  variable: '--font-sans',
  weight: '100 900',
  display: 'swap',
});

/** Barlow Condensed — secondary fallback if self-hosted Bitte BC fails to load */
const bitteFallback = localFont({
  src: [
    { path: './fonts/barlow-condensed-600.woff2', weight: '600', style: 'normal' },
    { path: './fonts/barlow-condensed-700.woff2', weight: '700', style: 'normal' },
    { path: './fonts/barlow-condensed-800.woff2', weight: '800', style: 'normal' },
  ],
  variable: '--font-bitte-fallback',
  display: 'swap',
});

/** Body, UI, labels — pairs with condensed industrial display */
const hanken = localFont({
  src: [
    { path: './fonts/hanken-grotesk-latin.woff2', weight: '100 900', style: 'normal' },
    { path: './fonts/hanken-grotesk-latin-italic.woff2', weight: '100 900', style: 'italic' },
  ],
  variable: '--font-hanken',
  display: 'swap',
});

/** Classical Greek — concept cards (Bitte BC has no Greek glyphs) */
const notoSerif = localFont({
  src: [
    { path: './fonts/noto-serif-latin-400.woff2', weight: '400', style: 'normal' },
    { path: './fonts/noto-serif-latin-600.woff2', weight: '600', style: 'normal' },
    { path: './fonts/noto-serif-greek-400.woff2', weight: '400', style: 'normal' },
    { path: './fonts/noto-serif-greek-600.woff2', weight: '600', style: 'normal' },
  ],
  variable: '--font-noto-serif',
  display: 'swap',
});

export const viewport = {
  themeColor: '#0a0a0a',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export const metadata: Metadata = buildRootMetadata();

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="es"
      className={cn('dark', bitteFallback.variable, hanken.variable, notoSerif.variable, 'font-sans', geist.variable)}
      // The mk-intro-flag beforeInteractive script sets data-mk-intro pre-hydration.
      suppressHydrationWarning
    >
      <body>
```

### `apps/api/src/diagnostic/answer-rules.ts` líneas 12-21 de 121

Parcial. Define qué respuesta cuenta como cerrada.

### `apps/api/src/diagnostic/answer-rules.ts líneas 12-21 de 120`
```tsx
/** A settled item can leave the block. A user pending item cannot. */
export function isSettled(response: AnswerView | null): boolean {
  if (!response) return false;
  if (response.exceptionKind === 'PENDING' && response.exceptionOrigin !== 'CONDITION') return false;
  if (response.skipped) return true;
  if (response.exceptionKind === 'PENDING') return true;
  if (response.exceptionKind) return true;
  if ((response.freeText ?? '').trim().length > 0) return true;
  return response.selectedOptionIds.length > 0;
}
```

### `apps/api/src/diagnostic/diagnostic.service.ts` líneas 529-531, 665-686 y 922-928

Parcial. Índice dentro del módulo y porcentaje global.

### `apps/api/src/diagnostic/diagnostic.service.ts líneas 529-531 de 1195`
```tsx
    const settledIds = new Set(
      session.responses.filter((response) => isSettled(response)).map((response) => response.questionId),
    );
```

### `apps/api/src/diagnostic/diagnostic.service.ts líneas 665-686 de 1195`
```tsx
    const skippedIds = new Set(
      session.responses.filter((response) => response.skipped).map((response) => response.questionId),
    );
    const visibleQuestions = currentModule.questions.filter((question) => !skippedIds.has(question.id));
    const answeredVisible = visibleQuestions.filter((question) => settledIds.has(question.id)).length;
    const currentQuestionIndex = answeredVisible + 1;
    const visibleCount = visibleQuestions.length;

    return {
      sessionState: {
        phase: session.currentPhase,
        completionPct: Math.round(pct * 100) / 100,
        currentModuleSlug: currentModule.slug,
        currentModuleTitle: currentModule.titleEs,
        currentModuleIntro: currentModule.introEs,
        currentModuleIcon: currentModule.iconKey,
        moduleProgress: moduleProgressRatio,
        selfKnowledgePct: this.calcSelfKnowledgePct(pct / 100),
        isModuleStart,
        currentQuestionIndex,
          moduleQuestionCount: visibleCount,
        showWelcomeScreen,
```

### `apps/api/src/diagnostic/diagnostic.service.ts líneas 922-928 de 1195`
```tsx
    // Calculate total questions vs answered
    const totalQuestions = session.version.modules.reduce(
      (acc, m) => acc + m.questions.length,
      0,
    );
    const answeredQuestions = session.responses.length;
    const completionPct = totalQuestions > 0 ? (answeredQuestions / totalQuestions) * 100 : 0;
```

## 3. Estilos efectivos según el código

Orden de carga conocido, deducido del fuente:

1. `app/layout.tsx` importa `./globals.css` una vez.
2. `next/font/local` declara las variables `--font-hanken` y `--font-noto-serif` en `<html>`.
3. `globals.css` abre con `@theme` (Tailwind 4). PostCSS: `apps/web/postcss.config.mjs` solo activa `@tailwindcss/postcss`. No hay `tailwind.config`.
4. El layout de diagnóstico añade estilos inline en `.dk-shell`: alto `100dvh`, flex column, overflow hidden.
5. No hay un CSS aparte del player. `ikigai.css` no entra en estas rutas.
6. El player no lee `visualViewport`. Ese manejo está en `apps/web/components/ikigai/shell.tsx` y no se usa aquí.

Tipografía de la pregunta: `.dk-shell .dk-question-text` usa `var(--font-body)`, 1.5rem, peso 600, interlineado 1.3. `--font-body` es Hanken. Desde 768 px sube a 1.75rem. Los títulos de introducción y cierre siguen en `--font-editorial` (Noto Serif).

Padding y gap, deducidos:

- Cuerpo: `1.25rem 1rem 1.5rem`. Desde 768 px, `2rem 1.5rem 1.5rem`.
- Pregunta a respuestas: `.dk-question { gap: 1.375rem }` (22 px si el raíz es 16 px). Desde 768 px el gap pasa a 1.5rem.
- Anclajes a teclas: `.dk-scale-thumb { gap: 1rem }`.
- Barra: `0.75rem 1rem` más `env(safe-area-inset-bottom)`.
- El aviso de continuar reserva `min-height: 2.6rem` aunque el texto esté vacío.

Alturas y overflow:

- `.dk-stage` no tiene alto propio. Crece con `flex: 1` dentro del shell de `100dvh`.
- `.dk-stage__body` es la única zona con `overflow-y: auto` y `min-height: 0`.
- `.dk-question` es `flex: 0 0 auto`. No tiene `min-height: 100%` ni `margin-top: auto`.
- Las teclas: `flex: 1 1 0`, `min-width: 0`, `min-height: 3.5rem`, `box-sizing: border-box`.

Posicionamiento: la barra no es `position: fixed`. Es la tercera fila del grid. No hay un botón fixed por pantalla en estos componentes.

Reset que sí afecta: `* { box-sizing: border-box; margin: 0; padding: 0 }`. `html, body` usan Hanken, 16 px, fondo `#0a0a0a`, y `overflow-x: hidden`. `prefers-reduced-motion` acorta animaciones y transiciones a 0.01 ms. Los componentes además consultan `useReducedMotion` y omiten variantes de Motion.

Viewport: `viewportFit: 'cover'` permite que `env(safe-area-inset-*)` tenga valor. No hay listener de teclado en el player. El único margen para el foco es `scroll-margin` en `.dk-stage__body :focus`. No está comprobado con el teclado abierto.

Quedan en `globals.css` reglas de `.dk-sheet`, `.dk-player-content` y `.dk-player-cta`. El TSX actual del player no las usa. No forman el layout que se ve si el árbol cargado es este. Siguen en el archivo y el media query de 768 px todavía las nombra.

El CSS siguiente es parcial: tokens, reset, botón del shell, player, escala, excepciones y el media query de 768 px del stage.

### `apps/web/app/globals.css líneas 1-80 de 20980`
Parcial. Tokens de color, fuente y radio. Parcial del @theme.
```css
/* ─── TAILWIND v4 ─────────────────────────────────────────────────────────── */
@import "tailwindcss";
@import "tw-animate-css";
@import "shadcn/tailwind.css";
@import "./brand-fonts.css";

@custom-variant dark (&:is(.dark *));

/* ─── DESIGN TOKENS — DESIGN.md (repo root) ──────────────────────────────── */
/* Brand: Bitte BC (not a serif). Editorial: Noto Serif. UI: Hanken Grotesk. */

@theme {
  /* ── L0–L1 surfaces (matte black → deep charcoal) ── */
  --color-obsidian:       #0a0a0a;
  --color-surface-0:      #0a0a0a;
  --color-surface-1:      #1a1a1a;
  --color-surface-2:      #2a2a2a;
  --color-surface-3:      #353534;
  --color-border:         #2d2d2d;
  --color-border-hi:      #3a3939;

  /* ── Brand reds (action + blood) ── */
  --color-crimson:        #ff0000;
  --color-crimson-dark:   #8b0000;
  --color-crimson-soft:   rgba(255, 0, 0, 0.12);
  --color-crimson-glow:   rgba(255, 0, 0, 0.28);
  /* Warm accent — YAML surface-tint, secondary highlight */
  --color-gold:           #ffb4a8;
  --color-gold-dark:      #8b0000;
  --color-gold-soft:      rgba(255, 180, 168, 0.12);

  /* ── Typography colors ── */
  --color-text:           #f5f5f5;
  --color-text-muted:     var(--color-text-secondary);
  --color-text-muted-hi:  #e5e2e1;
  --color-placeholder:    #555555;

  /* ── Semantic ── */
  --color-error:          #ffb4ab;
  --color-error-bg:       rgba(255, 0, 0, 0.08);
  --color-success:        #6dd58c;
  --color-success-bg:     rgba(109, 213, 140, 0.08);

  /* Semantic roles. --color-crimson stays for marketing CTAs that still use #ff0000. */
  --color-bg:                 #0a0a0a;
  --color-surface:            #141414;
  --color-surface-raised:     #1c1c1c;
  --color-text-secondary:     #b5b5b5;
  --color-border-decorative:  #2d2d2d;
  --color-border-functional:  #6b6b6b;
  --color-action:             #c00100;
  --color-action-hover:       #a50000;
  --color-focus:              #f5f5f5;

  /* ── Fonts — brand, editorial, interface ── */
  --font-brand-name:      'Bitte BC', var(--font-bitte-fallback), 'Arial Narrow', sans-serif;
  --font-brand-tagline:   'Bauhaus BC', var(--font-hanken), sans-serif;
  --font-display:         var(--font-brand-name);
  --font-body:            var(--font-hanken, 'Segoe UI', system-ui, sans-serif);
  --font-editorial:       var(--font-noto-serif), 'Noto Serif', Georgia, 'Times New Roman', serif;
  --font-greek:           var(--font-editorial);

  /* ── Radius — sharp structural UI; touch + pills are the only exceptions ── */
  --radius-xs:    0px;
  --radius-sm:    0px;
  --radius-md:    0px;
  --radius-lg:    0px;
  --radius-xl:    0px;
  --radius-2xl:   0px;
  --radius-touch: 4px;   /* questionnaire option tiles only */
  --radius-full:  9999px; /* badges, avatars, status pips */

  /* ── Elevation — tonal + glass, not heavy drop shadows ── */
  --shadow-e1: inset 0 0.5px 0 rgba(255, 255, 255, 0.08);
  --shadow-e2: 0 8px 32px rgba(0, 0, 0, 0.45);
  --shadow-e3: 0 16px 48px rgba(0, 0, 0, 0.55);
  --shadow-e4: 0 24px 64px rgba(0, 0, 0, 0.65);
  --shadow-glow-crimson: 0 0 32px rgba(255, 0, 0, 0.22);
  --shadow-glow-gold:    0 0 28px rgba(255, 180, 168, 0.18);
  --glass-blur: 20px;
```

### `apps/web/app/globals.css líneas 196-244 de 20980`
Parcial. Reset, body y movimiento reducido.
```css
html {
  scroll-padding-top: var(--nav-height);
}

/* ─── RESET ────────────────────────────────────────────────────────────────── */
*,
*::before,
*::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

html,
body {
  min-height: 100%;
  font-family: var(--font-body);
  font-size: 16px;
  background: var(--color-obsidian);
  color: var(--color-text);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  scroll-behavior: smooth;
  /* Safety net: no page content should ever need document-level horizontal
     scroll. Descendant containers keep their own overflow-x: auto (admin
     tables, tab bars) unaffected. */
  overflow-x: hidden;
}

script[type='application/ld+json'] {
  display: none !important;
}

@media (prefers-reduced-motion: reduce) {
  html { scroll-behavior: auto; }
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }

  .mk-intro-gate,
  .mobile-drawer.is-open .mobile-drawer__group-label,
  .mobile-drawer.is-open .mobile-drawer__link,
  .mk-ruta-card--unlock,
  .auth-success-mark__line {
    animation: none !important;
  }
}
```

### `apps/web/app/globals.css líneas 13501-13640 de 20980`
Parcial. Botón del shell, bienvenida y título editorial de la intro. Parcial.
```css
.dk-shell {
  background: #0a0a0a;
}

/* CTA button inside diagnostic */
.dk-shell .ag-btn-cta,
.dk-shell button.ag-btn-cta {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 52px;
  padding: 0.875rem 2rem;
  font-family: var(--font-body);
  font-size: 1rem;
  font-weight: 600;
  letter-spacing: 0;
  text-transform: none;
  color: #fff;
  background-color: var(--color-action);
  border: 1px solid var(--color-action);
  border-radius: 0;
  box-shadow: none;
  cursor: pointer;
  transition: background-color 0.2s ease;
  width: 100%;
}

.dk-shell .ag-btn-cta:hover:not(:disabled) {
  background-color: var(--color-action-hover);
  border-color: var(--color-action-hover);
  box-shadow: none;
}

.dk-shell .ag-btn-cta:disabled {
  opacity: 1;
  color: var(--color-text-secondary);
  background: var(--color-surface);
  border-color: var(--color-border-decorative);
  cursor: not-allowed;
}

/* Welcome copy. The frame (scroll + bottom action) is .dk-sheet. */
.dk-welcome {
  align-items: stretch;
  text-align: left;
}

.dk-welcome__kicker {
  margin: 0;
  color: var(--color-text);
  font-family: var(--font-body);
  font-size: 0.9375rem;
  font-weight: 600;
  letter-spacing: 0;
  text-transform: none;
}

.dk-welcome__kicker::before {
  content: '';
  display: inline-block;
  width: 0.45rem;
  height: 0.45rem;
  margin-right: 0.45rem;
  background: var(--color-action);
  vertical-align: 0.05em;
}

.dk-welcome__title {
  margin: 0.35rem 0 0;
  font-family: var(--font-editorial);
  font-size: 2.25rem;
  font-weight: 600;
  line-height: 1.12;
  letter-spacing: 0;
  color: var(--color-text);
}

.dk-welcome__objective {
  margin: 1.15rem 0 0;
  max-width: 36rem;
  font-family: var(--font-body);
  font-size: 1.0625rem;
  line-height: 1.55;
  color: var(--color-text-secondary);
}

.dk-welcome__objective p {
  margin: 0;
}

.dk-welcome__objective p + p {
  margin-top: 0.85rem;
}

.dk-welcome--loading {
  align-items: center;
  justify-content: center;
}

.dk-welcome__phase {
  font-family: var(--font-display, 'Barlow Condensed', sans-serif);
  font-size: 0.625rem;
  font-weight: 700;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: rgba(255,255,255,0.35);
  margin: 0.75rem 0 0;
}

.dk-welcome__list {
  list-style: none;
  padding: 0;
  margin: 2rem 0;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.dk-welcome__list-item {
  color: var(--color-text-muted-hi);
  display: flex;
  gap: 0.5rem;
  margin: 0;
}

@media (min-width: 768px) {
  .dk-welcome__title {
    font-size: 2.75rem;
    line-height: 1.08;
  }
}

/* ── Progress rail ─────────────────────────────────────────────────────────── */
.dk-progress-rail {
  position: sticky;
  top: 0;
  z-index: 50;
  flex-shrink: 0;
  padding: 0.75rem 1rem 0.65rem;
  background: #0a0a0a;
```

### `apps/web/app/globals.css líneas 13633-13740 de 20980`
Parcial. Barra de progreso.
```css
/* ── Progress rail ─────────────────────────────────────────────────────────── */
.dk-progress-rail {
  position: sticky;
  top: 0;
  z-index: 50;
  flex-shrink: 0;
  padding: 0.75rem 1rem 0.65rem;
  background: #0a0a0a;
  border-bottom: 1px solid var(--color-border-decorative);
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.dk-rail-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  min-height: 2.75rem;
}

.dk-rail-context {
  margin: 0;
  font-family: var(--font-body);
  font-size: 0.9375rem;
  font-weight: 600;
  color: var(--color-text);
}

.dk-rail-info {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 1rem;
}

.dk-rail-module-name {
  font-family: var(--font-body);
  font-size: 0.9375rem;
  font-weight: 600;
  letter-spacing: 0;
  text-transform: none;
  color: var(--color-text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.dk-rail-counter {
  font-family: var(--font-body);
  font-size: 0.9375rem;
  font-weight: 500;
  letter-spacing: 0;
  color: var(--color-text-secondary);
  white-space: nowrap;
  flex-shrink: 0;
}

/* Track: overall + lookahead segment */
.dk-rail-track {
  height: 3px;
  background: rgba(255,255,255,0.07);
  position: relative;
  overflow: hidden;
  border-radius: 0;
}

.dk-rail-fill {
  position: absolute;
  left: 0;
  top: 0;
  height: 100%;
  background: var(--color-action);
  transition: width var(--duration-slow) var(--ease-emphasized);
}

/* Lookahead segment: shows module progress ahead of overall */
.dk-rail-segment {
  position: absolute;
  top: 0;
  height: 100%;
  background: rgba(255,255,255,0.12);
  transition: left 0.5s ease, width 0.5s ease;
}

/* Overall pct: tiny right-aligned number below the bar */
.dk-rail-pct {
  align-self: flex-end;
  font-family: var(--font-body);
  font-size: 0.8125rem;
  font-weight: 500;
  letter-spacing: 0;
  color: var(--color-text-secondary);
  line-height: 1;
}

/* Completion states */
.dk-progress-rail--complete .dk-rail-module-name {
  color: rgba(255,255,255,0.5);
}

.dk-rail-counter--done {
  color: var(--color-text);
  letter-spacing: 0;
}

.dk-rail-fill--pulse {
```

### `apps/web/app/globals.css líneas 14106-14320 de 20980`
Parcial. Stage, scroll anterior que ya no monta el TSX, y botón Anterior.
```css
/* ── Player shell — wraps progress + content ──────────────────────────────── */
.dk-player-shell {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

/* Shared player: header, scrolling body, stable nav. Fits the shell, not a second viewport. */
.dk-stage {
  flex: 1;
  min-height: 0;
  width: 100%;
  display: grid;
  grid-template-rows: auto minmax(0, 1fr) auto;
  overflow: hidden;
}

.dk-stage__body {
  min-height: 0;
  overflow-y: auto;
  overscroll-behavior: contain;
  -webkit-overflow-scrolling: touch;
  padding: 1.25rem 1rem 1.5rem;
}

.dk-stage__body :focus {
  scroll-margin-top: 0.75rem;
  scroll-margin-bottom: 1.25rem;
}

.dk-stage__nav {
  padding: 0.75rem 1rem calc(0.75rem + env(safe-area-inset-bottom, 0px));
  background: #0a0a0a;
  border-top: 1px solid var(--color-border-decorative);
}

.dk-stage__hint {
  min-height: 2.6rem;
  margin: 0 0 0.5rem;
  font-family: var(--font-body);
  font-size: 0.875rem;
  line-height: 1.3;
  color: var(--color-text-secondary);
}

.dk-stage__nav-row {
  display: flex;
  gap: 0.75rem;
  align-items: stretch;
}

.dk-stage__nav-row .ag-btn-cta {
  flex: 1;
  min-width: 0;
  min-height: 52px;
}

.dk-stage__nav-row .dk-back-btn {
  min-height: 52px;
}

.dk-player-center {
  display: flex;
  flex: 1;
  align-items: center;
  justify-content: center;
  padding: 2rem;
}

/* ── Player content area ──────────────────────────────────────────────────── */
.dk-player-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  max-width: 42rem;
  width: 100%;
  margin: 0 auto;
  padding: 0;
  gap: 0;
  min-height: 0;
  overflow-y: auto;
  overscroll-behavior: contain;
  -webkit-overflow-scrolling: touch;
}

.dk-player-scroll {
  flex: 0 0 auto;
  display: flex;
  flex-direction: column;
  padding: 1.25rem 1rem 0;
}

/* Question text + context. The question is the protagonist: a legible sentence in the interface face. */
.dk-shell .dk-question-text {
  font-family: var(--font-body);
  font-size: 1.5rem;
  font-weight: 600;
  line-height: 1.3;
  letter-spacing: 0;
  margin: 0;
  color: var(--color-text);
  text-wrap: pretty;
}

.dk-shell .dk-question-text:focus {
  outline: none;
}

.dk-shell .dk-question-text:focus-visible {
  outline: 2px solid var(--color-focus);
  outline-offset: 4px;
}

@media (min-width: 768px) {
  .dk-shell .dk-question-text {
    font-size: 1.75rem;
    line-height: 1.3;
  }
}

.dk-shell .dk-question-context {
  font-family: var(--font-body);
  font-size: 1rem;
  line-height: 1.55;
  color: var(--color-text-secondary);
  margin: 0;
  padding-left: 0;
  border-left: 0;
}

.dk-shell .dk-multi-counter {
  font-family: var(--font-body);
  font-size: 0.9375rem;
  letter-spacing: 0;
  text-transform: none;
  color: var(--color-text-secondary);
  margin: 0;
}

/* Follows the question. Safe area keeps it clear of the home indicator. It does not cover the body. */
.dk-player-cta {
  flex: 0 0 auto;
  display: flex;
  flex-direction: column;
  margin: 1.5rem 0 0;
  padding: 0 1rem calc(1rem + env(safe-area-inset-bottom, 0px));
  background: transparent;
}

.dk-player-cta-row {
  display: flex;
  gap: 0.75rem;
  align-items: stretch;
}

.dk-player-cta-primary {
  flex: 1;
  min-width: 0;
}

.dk-back-btn {
  background: transparent;
  border: 1px solid var(--color-border-functional);
  cursor: pointer;
  color: var(--color-text);
  font-family: var(--font-body);
  font-size: 1rem;
  padding: 0 1rem;
  min-height: 52px;
  white-space: nowrap;
  flex: 0 0 auto;
}

.dk-back-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.dk-exit-link {
  background: none;
  border: 0;
  cursor: pointer;
  color: var(--color-text-secondary);
  font-family: var(--font-body);
  font-size: 0.875rem;
  font-weight: 500;
  letter-spacing: 0;
  text-transform: none;
  margin: 0;
  padding: 0.35rem 0;
  min-height: 44px;
  text-decoration: none;
}

.dk-exit-link:disabled {
  cursor: progress;
  opacity: 0.7;
}

.dk-player-error {
  color: var(--color-error);
  margin-top: 0.5rem;
}

.dk-continue-hint {
  margin: 0 0 0.5rem;
  font-family: var(--font-body);
  font-size: 0.875rem;
  line-height: 1.4;
  color: var(--color-text-secondary);
}

.dk-shell .ag-btn-cta:focus-visible,
```

### `apps/web/app/globals.css líneas 14459-14820 de 20980`
Parcial. Pregunta, escala, filas, excepciones y opciones de elección.
```css
/* ── Question and scale ─────────────────────────────────────────────────────
   Question, anchors, options and exceptions stay in one flow. Nothing stretches
   the block to the viewport. Points 2 to 4 stay unlabeled when the source has no text. */
.dk-question {
  flex: 0 0 auto;
  display: flex;
  flex-direction: column;
  gap: 1.375rem;
  width: 100%;
}

.dk-question__lead {
  flex: 0 0 auto;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.dk-question__answers {
  flex: 0 0 auto;
  display: flex;
  flex-direction: column;
}

/* Endpoint scales: the two sentences, then five keys. Labeled scales stay a short list. */
.dk-scale-thumb {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.dk-scale-anchors {
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
}

.dk-scale-anchor {
  display: grid;
  grid-template-columns: 1.25rem minmax(0, 1fr);
  gap: 0.5rem;
  margin: 0;
  font-family: var(--font-body);
  font-size: 0.9375rem;
  line-height: 1.4;
  color: var(--color-text-secondary);
}

.dk-scale-anchor__n {
  font-weight: 600;
  color: var(--color-text);
  font-variant-numeric: tabular-nums;
}

.dk-scale-thumb__row {
  display: flex;
  gap: 0.375rem;
}

.dk-scale-key {
  flex: 1 1 0;
  box-sizing: border-box;
  min-width: 0;
  min-height: 3.5rem;
  padding: 0;
  border: 1px solid var(--color-border-functional);
  border-radius: 0;
  background: transparent;
  color: var(--color-text);
  font-family: var(--font-body);
  font-size: 1.25rem;
  font-weight: 600;
  line-height: 1;
  font-variant-numeric: tabular-nums;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}

.dk-scale-key.is-selected {
  background: var(--color-text);
  border-color: var(--color-text);
  color: var(--color-bg);
}

.dk-scale-key:focus-visible {
  outline: 2px solid var(--color-focus);
  outline-offset: 3px;
}

.dk-scale-options {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.dk-scale-row {
  display: grid;
  grid-template-columns: 1.75rem minmax(0, 1fr) 1.125rem;
  align-items: center;
  gap: 0.875rem;
  width: 100%;
  flex: 0 0 auto;
  min-height: 3.25rem;
  padding: 0.75rem 1rem;
  box-sizing: border-box;
  text-align: left;
  background: transparent;
  border: 1px solid var(--color-border-decorative);
  border-left: 2px solid transparent;
  border-radius: 0;
  color: var(--color-text);
  font-family: var(--font-body);
  font-size: 1rem;
  line-height: 1.4;
  cursor: pointer;
  transition: background 0.15s ease, border-color 0.15s ease;
  -webkit-tap-highlight-color: transparent;
}

.dk-scale-row:hover {
  background: var(--color-surface);
  border-color: var(--color-border-functional);
}

.dk-scale-row.is-selected {
  background: var(--color-surface-raised);
  border-color: var(--color-border-functional);
  border-left-color: var(--color-action);
}

.dk-scale-row:focus-visible {
  outline: 2px solid var(--color-focus);
  outline-offset: 3px;
}

.dk-scale-number {
  font-family: var(--font-body);
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--color-text);
  text-align: center;
  font-variant-numeric: tabular-nums;
}

.dk-scale-label {
  color: var(--color-text-secondary);
}

.dk-scale-row.is-selected .dk-scale-number,
.dk-scale-row.is-selected .dk-scale-label {
  color: var(--color-text);
}

.dk-scale-radio {
  width: 1.125rem;
  height: 1.125rem;
  box-sizing: border-box;
  border: 1.5px solid var(--color-border-functional);
  border-radius: 50%;
  background: transparent;
}

.dk-scale-row.is-selected .dk-scale-radio {
  border-color: var(--color-action);
  background: radial-gradient(circle, var(--color-action) 0 4px, transparent 4.5px);
}

/* Exceptions: a secondary zone the person opens on purpose */
.dk-exceptions {
  margin-top: 0.75rem;
  border-top: 1px solid var(--color-border-decorative);
}

.dk-exception-chosen {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.75rem;
  margin-top: 0.75rem;
}

.dk-exception-chosen p {
  margin: 0;
  font-family: var(--font-body);
  font-size: 1rem;
  line-height: 1.4;
  color: var(--color-text);
}

.dk-exceptions > summary {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  min-height: 52px;
  padding: 0.75rem 0;
  list-style: none;
  cursor: pointer;
  font-family: var(--font-body);
  font-size: 0.9375rem;
  line-height: 1.4;
  color: var(--color-text-secondary);
  -webkit-tap-highlight-color: transparent;
}

.dk-exceptions > summary::-webkit-details-marker {
  display: none;
}

.dk-exceptions > summary::after {
  content: '';
  flex-shrink: 0;
  width: 0.5rem;
  height: 0.5rem;
  border-right: 1.5px solid currentColor;
  border-bottom: 1.5px solid currentColor;
  transform: rotate(45deg);
  transition: transform 0.15s ease;
}

.dk-exceptions[open] > summary::after {
  transform: rotate(-135deg);
}

.dk-exceptions > summary:hover {
  color: var(--color-text);
}

.dk-exceptions > summary:focus-visible {
  outline: 2px solid var(--color-focus);
  outline-offset: 3px;
}

.dk-exceptions__row {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding-bottom: 0.5rem;
}

.dk-exception {
  display: flex;
  align-items: center;
  width: 100%;
  min-height: 52px;
  padding: 0 1rem;
  box-sizing: border-box;
  background: transparent;
  border: 1px solid var(--color-border-decorative);
  border-radius: 0;
  color: var(--color-text);
  font-family: var(--font-body);
  font-size: 1rem;
  text-align: left;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}

.dk-exception:hover {
  background: var(--color-surface);
  border-color: var(--color-border-functional);
}

.dk-exception:focus-visible {
  outline: 2px solid var(--color-focus);
  outline-offset: 3px;
}

/* ── Reason box (scale items with a reason threshold) ───────────────────── */
.dk-reason-box {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.dk-reason-label {
  font-family: var(--font-body);
  font-size: 0.875rem;
  color: rgba(255,255,255,0.65);
}

.dk-reason-textarea {
  background: var(--color-surface);
  border: 1px solid var(--color-border-decorative);
  border-radius: 0;
  color: var(--color-text);
  font-family: var(--font-body);
  font-size: 1rem;
  line-height: 1.5;
  padding: 0.75rem 1rem;
  resize: none;
  width: 100%;
  outline: none;
  box-shadow: none;
  transition: border-color 0.15s ease;
}

.dk-reason-textarea:focus {
  border-color: var(--color-focus);
  box-shadow: none;
}

.dk-reason-textarea::placeholder {
  color: rgba(255,255,255,0.2);
}

/* ── Single / multi choice options (questionnaire touch targets) ─────────── */
.dk-choice-option {
  width: 100%;
  text-align: left;
  background: transparent;
  border: 1px solid var(--color-border-decorative);
  border-left: 2px solid transparent;
  border-radius: 0;
  padding: 0.7rem 1rem;
  color: var(--color-text-secondary);
  font-family: var(--font-body);
  font-size: 1rem;
  line-height: 1.35;
  cursor: pointer;
  transition:
    background 0.15s ease,
    border-color 0.15s ease,
    color 0.15s ease;
  display: flex;
  align-items: center;
  gap: 0.85rem;
  box-shadow: none;
  min-height: 56px;
  -webkit-tap-highlight-color: transparent;
}

.dk-choice-list--dim-unselected .dk-choice-option:not(.dk-choice-option--selected):not(:disabled) {
  opacity: 1;
}

.dk-choice-option:hover:not(:disabled) {
  background: var(--color-surface);
  border-color: var(--color-border-functional);
}

.dk-choice-option--selected {
  background: var(--color-surface-raised);
  border-color: var(--color-border-functional);
  border-left-color: var(--color-action);
  color: var(--color-text);
}

.dk-choice-option:disabled {
  cursor: not-allowed;
  opacity: 0.5;
  color: var(--color-placeholder);
}

.dk-choice-radio {
  width: 0.7rem;
  height: 0.7rem;
  border: 1px solid var(--color-border-functional);
  border-radius: 0;
  flex-shrink: 0;
  background: transparent;
}
```

### `apps/web/app/globals.css líneas 14908-14951 de 20980`
Parcial. Media query 768 px del stage.
```css
@media (min-width: 768px) {
  .dk-stage {
    max-width: 40rem;
    margin-left: auto;
    margin-right: auto;
  }

  .dk-stage__body {
    padding: 2rem 1.5rem 1.5rem;
  }

  .dk-stage__nav {
    padding-left: 1.5rem;
    padding-right: 1.5rem;
  }

  .dk-player-scroll,
  .dk-sheet__body {
    padding: 2rem 1.5rem 0;
  }

  .dk-player-cta,
  .dk-sheet__bar {
    padding-left: 1.5rem;
    padding-right: 1.5rem;
  }

  .dk-sheet,
  .dk-player-content {
    max-width: 40rem;
    margin-left: auto;
    margin-right: auto;
  }

  .dk-intro-title,
  .dk-outro-title {
    font-size: 2.75rem;
    line-height: 1.08;
  }

  .dk-question {
    gap: 1.5rem;
  }
}
```

## 4. Datos y estados

Ejemplo anonimizado con la forma que arma `toQuestionDto` y el `sessionState` que pinta el encabezado. Los ids no son reales. El texto es el de la primera escala de «Mentalidad e identidad», que es copy de producto, no un dato de una persona.

```json
{
  "sessionState": {
    "completionPct": 0,
    "currentModuleSlug": "e-aud-s1",
    "currentModuleTitle": "Mentalidad e identidad",
    "currentModuleOrder": 1,
    "totalModules": 31,
    "currentModuleEstimatedMinutes": 8,
    "currentQuestionIndex": 1,
    "moduleQuestionCount": 5,
    "isModuleStart": true
  },
  "question": {
    "id": "q-ejemplo",
    "type": "SCALE_1_5",
    "sourceRef": "formulario-v1:E-AUD-001!R6",
    "textEs": "¿Mis decisiones diarias reflejan al hombre que digo que quiero llegar a ser?  1: Casi nunca; la mayoría de mis decisiones contradicen lo que digo querer.  5: Casi siempre; mis decisiones reflejan claramente al hombre que quiero ser.",
    "heading": null,
    "scaleType": "BEHAVIORAL",
    "reasonPromptEs": null,
    "reasonThreshold": null,
    "allowedExceptions": ["UNKNOWN", "NOT_APPLICABLE", "DECLINED"],
    "answerRevision": 0,
    "options": [
      { "id": "o1", "order": 1, "textEs": "1", "value": "1" },
      { "id": "o2", "order": 2, "textEs": "2", "value": "2" },
      { "id": "o3", "order": 3, "textEs": "3", "value": "3" },
      { "id": "o4", "order": 4, "textEs": "4", "value": "4" },
      { "id": "o5", "order": 5, "textEs": "5", "value": "5" }
    ]
  }
}
```

El enunciado que se ve no es `textEs` entero. Si `sourceRef` está en `apps/web/lib/scale-prompts.ts`, la pregunta usa `stem` y los extremos usan `low` y `high`. Los puntos 2, 3 y 4 no reciben etiqueta. El catálogo de esta pregunta trae opciones cuyo texto es solo el número.

«Pregunta 2 de 5» no es el puesto en todo el cuestionario. `currentQuestionIndex` es las respuestas ya cerradas y visibles del módulo, más uno. `moduleQuestionCount` es cuántas preguntas visibles tiene ese módulo. En `e-aud-s1` hay 5. «Pregunta 2 de 5» es la segunda pregunta visible de ese módulo, cuando ya hay una respuesta cerrada en él. Las preguntas con `skipped` salen del denominador.

El «0 %» de la captura es `Math.round(sessionState.completionPct)`. Ese porcentaje es `respuestas de la sesión / preguntas de la versión * 100`, calculado en `recalculateScores`. El catálogo `formulario-completo@6` tiene 239 preguntas. Una respuesta es 0,418 %, que redondea a 0. Dos respuestas son 0,837 % y ya redondean a 1. En la introducción del primer módulo, antes de guardar nada, el valor es 0. No es el avance «1 de 5».

Cuenta como pregunta completada, en el servidor, lo que `isSettled` acepta: excepción (salvo un pendiente que no venga de una condición), texto con algo escrito, u opción seleccionada. Un pendiente de origen usuario no deja el bloque.

Estados en pantalla, según el código:

- Sin selección: ninguna tecla tiene `is-selected`. «Continuar» está `disabled`. El aviso «Elige una opción para continuar.» está en la barra.
- Selección numérica: la tecla lleva `is-selected` (fondo del color de texto, texto del color de fondo). El aviso queda vacío, pero el hueco de 2,6 rem sigue. «Continuar» se habilita.
- Excepción: el `<details>` se reemplaza por «Excepción elegida: …» y «Responder con un dato». `isSelectionValid` devuelve true. «Continuar» se habilita.
- Guardando: el rótulo pasa a «Guardando…» y el botón queda deshabilitado. La selección no se borra en el cliente hasta que llega el estado nuevo.
- Guardado: no hay una etiqueta «Guardado» en la pregunta siguiente.
- Error: un `role="alert"` dentro del área central, no dentro de la barra.

«Continuar» se habilita en una pregunta cuando `isSelectionValid` es true y no hay un envío en curso. En la introducción, «Comenzar» no usa esa regla: no está deshabilitado. En la bienvenida, el botón espera a que la pantalla esté lista y no esté cargando.

## 5. Contexto

Inspección hecha con Node v21.7.3. `.nvmrc` pide 22. Versiones instaladas en `node_modules`: Next 15.5.18, React 19.2.6, Motion 12.40.0, Tailwind CSS 4.3.0, `@tailwindcss/postcss` 4.3.0, NestJS 11.1.24. El `package.json` de la web declara Next `^15.3.2` y React `^19.1.0`.

Archivos de esta pantalla con cambios locales, sin commit:

Modificados: `apps/web/app/diagnostico/layout.tsx`, `apps/web/app/globals.css`, `DiagnosticPlayer.tsx`, `DiagnosticWelcome.tsx`, `ModuleOutro.tsx`, `ProgressRail.tsx`, `QuestionCard.tsx`, `diagnostic-motion.ts`, `options/ScaleOptions.tsx`, y otros del diagnóstico que no son esta barra.

Nuevos: `PlayerStage.tsx`, `module-intro-icon.ts`, `DiagnosticAccessGate.tsx`, `apps/web/lib/scale-prompts.ts`.

El ZIP `MK_player_revision_ui.zip` repite esos fuentes y los recortes no sustituyen al archivo cuando el bloque de arriba dice que es completo.

## Dudas

- El 0 % puede seguir después de la primera respuesta, porque 1/239 redondea a 0. `diagnostic.service.ts` alrededor de la línea 928 y `ProgressRail.tsx` con `Math.round`.
- El hueco fijo de `.dk-stage__hint` (2,6 rem) separa el contenido del botón aunque no haya aviso. Puede leerse como otro vacío.
- «Anterior» cambia el ancho de «Continuar» cuando aparece. La fila es la misma. La altura del botón no.
- `globals.css` conserva `.dk-sheet` y `.dk-player-content`. El TSX del player ya no los monta. Un revisor puede atribuirles el layout actual por error.
- El icono de la introducción sale de `module-intro-icon.ts`, no del `iconKey` guardado. En la base el formulario completo escribe `columns` para todos los módulos (`packages/database/src/formulario-completo.ts`).
- No hay manejo de `visualViewport` en el diagnóstico. Con el teclado abierto, `100dvh` puede no coincidir con el alto visible. No está comprobado.
- `.font-body-sm` se usa en marcado y no aparece definido en `globals.css`. En la barra manda `.dk-stage__hint`.
- Esta revisión no abrió el navegador. Tipografía renderizada, solape con el teclado, zoom y safe area en un teléfono siguen sin comprobarse en ejecución.
