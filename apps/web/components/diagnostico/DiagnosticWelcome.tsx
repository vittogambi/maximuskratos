'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { useAuthSession } from '@/components/auth-session-provider';
import {
  apiDiagnosticStart,
  apiDiagnosticState,
  apiDiagnosticWelcomeSeen,
  type DiagnosticState,
} from '@/lib/api';
import { getAccessToken } from '@/lib/auth-storage';
import { ProgressRail } from './ProgressRail';
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
    try {
      await apiDiagnosticWelcomeSeen(token);
      await refresh({ force: true });
      const state = await apiDiagnosticStart(token);
      routeFromState(state, router);
    } catch {
      setLoading(false);
    }
  }

  return (
    <main style={{ display: 'flex', flex: 1, flexDirection: 'column' }}>
      <ProgressRail pct={0} questionIndex={null} questionTotal={null} />
      {!ready ? (
        <div className="dk-welcome dk-welcome--loading">
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
          <motion.p
            className="hud-text text-action-red"
            style={{ letterSpacing: '0.15em' }}
            variants={reduced ? undefined : introStaggerItem}
          >
            DIAGNÓSTICO MAESTRO
          </motion.p>
          <motion.p className="dk-welcome__phase" variants={reduced ? undefined : introStaggerItem}>
            AUDITORÍA INICIAL · E-AUD-001
          </motion.p>
          <motion.h1
            className="font-display-xl"
            style={{ marginTop: '1rem', lineHeight: 1.1 }}
            variants={reduced ? undefined : introStaggerItem}
          >
            Esto no es un cuestionario.
          </motion.h1>
          <motion.p
            className="font-body-lg"
            style={{ marginTop: '1.5rem', color: 'var(--color-text-muted)', maxWidth: '520px' }}
            variants={reduced ? undefined : introStaggerItem}
          >
            Es una auditoría de tu realidad actual. Cinco módulos miden las dimensiones clave
            de tu vida. Al completarla, desbloqueas tu Perfil Maestro MK.
          </motion.p>
          <motion.ul className="dk-welcome__list" variants={reduced ? undefined : introStaggerItem}>
            {[
              '~25 minutos en la primera sesión (5 módulos)',
              'Tu progreso se guarda en tiempo real',
              'Nadie más ve tus respuestas',
            ].map((item) => (
              <li key={item} className="font-label-md dk-welcome__list-item">
                <span style={{ color: 'var(--color-crimson)' }}>—</span>
                {item}
              </li>
            ))}
          </motion.ul>
          <motion.div variants={reduced ? undefined : introStaggerItem}>
            <button
              type="button"
              className="ag-btn-cta font-label-lg"
              onClick={handleStart}
              disabled={loading}
              style={{ alignSelf: 'flex-start' }}
            >
              {loading ? 'Preparando…' : 'Comenzar diagnóstico'}
            </button>
          </motion.div>
        </motion.div>
      )}
    </main>
  );
}
