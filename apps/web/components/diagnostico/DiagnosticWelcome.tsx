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
import { routeDiagnosticFromState, settleModuleOutro } from '@/lib/diagnostic-continue';
import { questionnaireStageLabel, ProgressRail } from './ProgressRail';
import { PlayerStage } from './PlayerStage';
import { introStaggerContainer, introStaggerItem } from './diagnostic-motion';

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
      .then(async (state) => {
        if (!state.sessionState.showWelcomeScreen) {
          let settled = state;
          try {
            settled = await settleModuleOutro(token, state);
          } catch {
            settled = state;
          }
          routeDiagnosticFromState(settled, router, 'push');
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
      let state = await apiDiagnosticStart(token);
      try {
        state = await settleModuleOutro(token, state);
      } catch {
        // The outro route retries the same step.
      }
      routeDiagnosticFromState(state, router, 'push');
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
      header={(
        <ProgressRail
          pct={0}
          questionIndex={null}
          questionTotal={null}
          contextLabel={questionnaireStageLabel(null)}
          exitLabel="Salir"
          exitDisabled={loading}
          onExit={() => router.push('/panel')}
        />
      )}
      primary={{
        label: loading ? 'Preparando…' : 'Comenzar cuestionario',
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
          className="dk-stage__frame dk-read dk-welcome"
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
