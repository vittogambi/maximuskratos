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
import {
  buildInitialSelection,
  isSelectionValid,
  QuestionCard,
  selectionToPayload,
} from './QuestionCard';
import { ProgressRail } from './ProgressRail';
import { DiagnosticBlackout } from './DiagnosticBlackout';
import { stashOutroBootstrap } from '@/lib/diagnostic-outro-bootstrap';
import {
  introIconItem,
  introStaggerContainer,
  introStaggerItem,
  moduleIntroVariants,
  questionScreenVariants,
  ctaRevealVariants,
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
  const shownAtRef = useRef<number>(Date.now());
  const historyRef = useRef<HistoryEntry[]>([]);

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
        setError('No se pudo cargar el diagnóstico.');
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

    setIsSubmitting(true);
    setError(null);

    try {
      const next = await apiDiagnosticSubmitResponse(token, {
        questionId: state.nextStep.data.id,
        ...selectionToPayload(selection),
        latencyMs: Date.now() - shownAtRef.current,
      });

      if (next.nextStep.type === 'module_outro') {
        navigateToOutro(next);
        return;
      }

      applyState(next, false, true);
    } catch {
      setError('Error al guardar. Intenta de nuevo.');
    } finally {
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
      <main className="dk-player-shell">
        <div className="dk-player-center" style={{ textAlign: 'center', padding: '2rem' }}>
          <p style={{ color: 'var(--color-error)', marginBottom: '1.5rem' }}>
            {error ?? 'Ocurrió un error inesperado.'}
          </p>
          <button className="ag-btn-cta" onClick={() => router.push('/diagnostico')}>
            Volver al inicio
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="dk-player-shell">
      <DiagnosticBlackout visible={blackout} />
      <ProgressRail
        pct={ss.completionPct}
        questionIndex={playerStatus === 'question' ? ss.currentQuestionIndex : undefined}
        questionTotal={playerStatus === 'question' ? ss.moduleQuestionCount : undefined}
        moduleTitle={ss.currentModuleTitle}
      />

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
              style={{ display: 'flex', flexDirection: 'column', gap: 'inherit' }}
            >
              {ss.currentModuleOrder != null && ss.totalModules > 0 && (
                <motion.p className="dk-intro-meta" variants={reduced ? undefined : introStaggerItem}>
                  AUDITORÍA INICIAL · MÓDULO {ss.currentModuleOrder} DE {ss.totalModules}
                </motion.p>
              )}
              {ss.currentModuleIcon && (
                <motion.div
                  className="dk-module-icon-wrap"
                  variants={reduced ? undefined : introIconItem}
                >
                  <AppIcon name={ss.currentModuleIcon} size={32} />
                </motion.div>
              )}
              <motion.p className="dk-intro-eyebrow" variants={reduced ? undefined : introStaggerItem}>
                MÓDULO
              </motion.p>
              <motion.h2 className="dk-intro-title" variants={reduced ? undefined : introStaggerItem}>
                {ss.currentModuleTitle}
              </motion.h2>
              <motion.p className="dk-intro-text" variants={reduced ? undefined : introStaggerItem}>
                {ss.currentModuleIntro}
              </motion.p>
              {ss.currentModuleEstimatedMinutes != null && ss.currentModuleEstimatedMinutes > 0 && (
                <motion.p className="dk-intro-duration" variants={reduced ? undefined : introStaggerItem}>
                  ~{ss.currentModuleEstimatedMinutes} min
                </motion.p>
              )}
              <motion.div variants={reduced ? undefined : introStaggerItem}>
                <button className="ag-btn-cta dk-intro-cta" onClick={handleStartModule}>
                  Comenzar
                </button>
              </motion.div>
            </motion.div>
          </motion.div>
        )}

        {playerStatus === 'question' && currentQuestion && selection && (
          <motion.div
            key={currentQuestion.id}
            className="dk-player-content"
            variants={reduced ? undefined : questionScreenVariants}
            initial={reduced ? false : 'initial'}
            animate={reduced ? undefined : 'animate'}
            exit={reduced ? undefined : 'exit'}
          >
            {ss.currentModuleTitle && (
              <div className="dk-module-badge">
                {ss.currentModuleIcon && (
                  <AppIcon name={ss.currentModuleIcon} size={14} />
                )}
                <span>{ss.currentModuleTitle}</span>
              </div>
            )}

            <QuestionCard
              question={currentQuestion}
              selection={selection}
              onChange={setSelection}
            />

            <div className="dk-player-cta">
              <div className="dk-player-cta-row">
                {canGoBack && (
                  <button
                    type="button"
                    className="font-label-md dk-back-btn"
                    onClick={handleGoBack}
                    disabled={isSubmitting}
                  >
                    ← Anterior
                  </button>
                )}
                <AnimatePresence mode="wait">
                  {isValid ? (
                    <motion.div
                      key="cta-ready"
                      className="dk-player-cta-primary"
                      variants={reduced ? undefined : ctaRevealVariants}
                      initial={reduced ? false : 'hidden'}
                      animate={reduced ? undefined : 'visible'}
                      exit={reduced ? undefined : 'hidden'}
                    >
                      <button
                        type="button"
                        className="ag-btn-cta"
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? 'Guardando…' : 'Continuar →'}
                      </button>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="cta-wait"
                      className="dk-player-cta-primary"
                      initial={false}
                      animate={{ opacity: 0.4 }}
                    >
                      <button type="button" className="ag-btn-cta" disabled>
                        Continuar →
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              {error && (
                <p className="font-body-sm dk-player-error">{error}</p>
              )}
              <button
                type="button"
                className="font-label-sm dk-exit-link"
                onClick={() => router.push('/panel')}
              >
                Guardar y salir
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
